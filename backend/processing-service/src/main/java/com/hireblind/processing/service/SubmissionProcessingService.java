package com.hireblind.processing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.CampaignResponse;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.entity.*;
import com.hireblind.processing.repository.*;
import com.hireblind.processing.security.JwtUtil;
import com.hireblind.processing.security.ResumeTextSanitizer;
import com.hireblind.processing.security.LlmResponseValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubmissionProcessingService {

    public record SubmissionAndAttempt(Submission submission, ProcessingAttempt attempt) {}

    private final IncomingMessageRepository incomingMessageRepository;
    private final ProcessingAttemptRepository processingAttemptRepository;
    private final SubmissionRepository submissionRepository;
    private final AnonymizedProfileRepository profileRepository;
    private final ScoringResultRepository scoringRepository;
    private final LlmClientService llmClientService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final ResumeTextSanitizer resumeTextSanitizer;
    private final LlmResponseValidator llmResponseValidator;
    private final AuditClient auditClient;

    @Value("${campaign.service.url}")
    private String campaignServiceUrl;

    // Hardcoded default campaign ID from seeder
    private static final UUID DEFAULT_CAMPAIGN_ID = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

    @Scheduled(fixedDelay = 60000) // Run every minute
    public void processPendingMessages() {
        List<IncomingMessage> pending = incomingMessageRepository.findAll().stream()
                .filter(m -> "PENDING".equals(m.getStatus()))
                .toList();

        if (pending.isEmpty()) return;

        log.info("Processing {} pending messages", pending.size());
        for (IncomingMessage message : pending) {
            try {
                processSingleMessage(message);
            } catch (Exception e) {
                log.error("Failed to process message {}: {}", message.getId(), e.getMessage());
            }
        }
    }

    public void processSingleMessage(IncomingMessage message) {
        log.info("Starting processing for message: {}", message.getId());

        // 1. Fetch Active Campaigns and Perform Matching
        UUID matchedCampaignId = null;
        try {
            List<CampaignResponse> activeCampaigns = fetchActiveCampaigns();
            if (activeCampaigns != null && !activeCampaigns.isEmpty()) {
                String matchResponse = llmClientService.matchCampaign(message.getExtractedText(), activeCampaigns);
                LlmClientService.CampaignMatchResult matchResult = llmClientService.parseCampaignMatchResponse(matchResponse);
                if (matchResult.matched_campaign_id() != null && 
                    ("HIGH".equals(matchResult.confidence()) || "MEDIUM".equals(matchResult.confidence()))) {
                    matchedCampaignId = UUID.fromString(matchResult.matched_campaign_id());
                    log.info("Message {} matched with campaign {} (confidence: {})", 
                            message.getId(), matchedCampaignId, matchResult.confidence());
                } else {
                    log.warn("No confident campaign match for message {} — saved as unassigned", message.getSourceMessageId());
                }
            } else {
                log.warn("No active campaigns found in campaign-service — message {} saved as unassigned", message.getSourceMessageId());
            }
        } catch (Exception e) {
            log.error("Failed to perform campaign matching for message: {}, defaulting to unassigned: {}", message.getId(), e.getMessage());
        }

        // 2. Pre-process text sanitization
        ResumeTextSanitizer.SanitizationResult sanitization = resumeTextSanitizer.sanitize(message.getExtractedText());

        // 3. Initialize Submission and Attempt in their own transaction
        SubmissionAndAttempt init = initiateSubmission(message, matchedCampaignId, sanitization);
        Submission submission = init.submission();
        ProcessingAttempt attempt = init.attempt();

        try {
            if (matchedCampaignId != null) {
                // 4. Fetch Campaign Details (Outside DB transaction)
                CampaignResponse campaign = fetchCampaignDetails(matchedCampaignId);

                // 5. Call LLM with Sanitized text
                LlmResponse llmResult = llmClientService.parseResume(
                        sanitization.sanitizedText(),
                        campaign
                );

                // 6. Validate LLM Response
                LlmResponseValidator.ValidationResult validation = llmResponseValidator.validate(llmResult, campaign.getRequiredSkills());

                // 7. Persist Successful Result in its own transaction
                persistSuccessfulResult(message, submission, attempt, llmResult, sanitization, validation);

                // 8. Secure Audit Flagging Event
                boolean isSuspicious = sanitization.contentRemoved() || validation.suspicious();
                if (isSuspicious) {
                    List<String> allTriggers = new ArrayList<>();
                    allTriggers.addAll(sanitization.triggeredRules());
                    allTriggers.addAll(validation.anomalies());

                    Map<String, Object> auditMetadata = Map.of(
                            "anomalies", allTriggers,
                            "sanitizerRemovedContent", sanitization.contentRemoved(),
                            "originalHash", sanitization.originalHash(),
                            "sanitizedHash", sanitization.sanitizedHash()
                    );
                    auditClient.logEvent(
                            "SUBMISSION_FLAGGED_SUSPICIOUS",
                            "processing-service",
                            matchedCampaignId,
                            submission.getId(),
                            auditMetadata
                    );
                }
            } else {
                // 3. Save as unassigned, mark processing completed with no profile/score
                persistUnassignedResult(message, submission, attempt, sanitization);
            }

        } catch (Exception e) {
            log.error("Error during processing for message: {}, submission {}: {}", 
                    message.getId(), submission.getId(), e.getMessage(), e);
            // 5. Persist Failed Result in its own transaction
            persistFailedResult(message, submission, attempt, e);
        }
    }

    private String generatePseudonym(UUID uuid) {
        String[] adjectives = {
            "Amber", "Azure", "Bronze", "Cobalt", "Copper", "Crimson", "Emerald", "Golden", 
            "Indigo", "Jade", "Onyx", "Ruby", "Sapphire", "Silver", "Teal", "Opal", "Coral"
        };
        String[] nouns = {
            "Badger", "Falcon", "Fox", "Gryphon", "Hawk", "Koala", "Lynx", "Otter", "Owl", 
            "Panther", "Phoenix", "Puma", "Raven", "Sparrow", "Swift", "Tiger", "Stag"
        };
        long mostSig = (uuid != null) ? uuid.getMostSignificantBits() : UUID.randomUUID().getMostSignificantBits();
        int adjIndex = Math.abs((int) (mostSig % adjectives.length));
        int nounIndex = Math.abs((int) ((mostSig >> 16) % nouns.length));
        return "Candidate " + adjectives[adjIndex] + " " + nouns[nounIndex];
    }

    @Transactional
    public SubmissionAndAttempt initiateSubmission(IncomingMessage message, UUID campaignId, ResumeTextSanitizer.SanitizationResult sanitization) {
        // Set hashes on Ingestion Message
        message.setRawExtractedTextHash(sanitization.originalHash());
        message.setSanitizedTextHash(sanitization.sanitizedHash());
        incomingMessageRepository.save(message);

        // 1. Create Submission
        Submission submission = new Submission();
        submission.setCampaignId(campaignId);
        submission.setCandidateLabel(generatePseudonym(message.getId()));
        
        String[] statesList = {"Karnataka", "Maharashtra", "Telangana", "Delhi", "Tamil Nadu", "Haryana", "Uttar Pradesh", "West Bengal", "Gujarat"};
        long mostSig = message.getId().getMostSignificantBits();
        int stateIndex = Math.abs((int) (mostSig % statesList.length));
        submission.setState(statesList[stateIndex]);

        submission.setSourceMessageId(message.getSourceMessageId());
        submission.setReceivedAt(message.getReceivedAt().toInstant());
        submission.setProcessingStatus(ProcessingStatus.PROCESSING);
        submission.setRawCandidateEmail(message.getSenderEmail());
        submission.setRawCandidateName("Unknown Candidate");

        // Copy resume metadata parsed during ingestion
        submission.setResumeFilePath(message.getResumeFilePath());
        submission.setResumeOriginalFilename(message.getResumeOriginalFilename());
        submission.setResumeFileSizeBytes(message.getResumeFileSizeBytes());
        submission.setResumeContentType(message.getResumeContentType());

        submission = submissionRepository.save(submission);

        // 2. Manage Attempt
        ProcessingAttempt attempt = ProcessingAttempt.builder()
                .id(UUID.randomUUID())
                .submissionId(submission.getId())
                .attemptNumber(1)
                .status("RUNNING")
                .createdAt(OffsetDateTime.now())
                .build();
        attempt = processingAttemptRepository.save(attempt);

        return new SubmissionAndAttempt(submission, attempt);
    }

    @Transactional
    public void persistSuccessfulResult(
            IncomingMessage message,
            Submission submission,
            ProcessingAttempt attempt,
            LlmResponse llmResult,
            ResumeTextSanitizer.SanitizationResult sanitization,
            LlmResponseValidator.ValidationResult validation
    ) {
        // 1. Create Anonymized Profile
        AnonymizedProfile profile = new AnonymizedProfile();
        profile.setSubmissionId(submission.getId());
        profile.setNormalizedResumeText(llmResult.getExperienceSummary());
        profile.setExtractedSkillsJson(toJson(llmResult.getExtractedSkills()));
        profile.setExperienceSummary(llmResult.getExperienceSummary());
        profile.setEducationSummaryRedacted(llmResult.getEducationSummary());
        
        // Wrap the raw string redact summary inside a structured JSON Object!
        profile.setPiiRedactionSummaryJson(toJson(Map.of("summary", llmResult.getPiiRedactionSummary())));
        
        profile.setConfidenceScore(java.math.BigDecimal.valueOf(llmResult.getConfidenceScore()));
        profile = profileRepository.save(profile);

        // 2. Create Scoring Result
        ScoringResult score = new ScoringResult();
        score.setSubmissionId(submission.getId());
        score.setCampaignId(submission.getCampaignId());
        score.setScoreValue(java.math.BigDecimal.valueOf(llmResult.getScoreValue()));
        score.setExplainabilityTagsJson(toJson(llmResult.getExplainabilityTags()));
        score.setMatchedSkillsJson(toJson(llmResult.getMatchedSkills()));
        score.setMissingSkillsJson(toJson(llmResult.getMissingSkills()));
        score.setSummaryReason(llmResult.getSummaryReason());
        score.setConfidenceScore(java.math.BigDecimal.valueOf(llmResult.getConfidenceScore()));
        score.setLlmModelName(llmClientService.getModelName());
        score.setLlmResponseVersion("v1");
        score = scoringRepository.save(score);

        // 3. Update Submission
        if (llmResult.getCandidateName() != null && !llmResult.getCandidateName().isBlank()) {
            submission.setRawCandidateName(llmResult.getCandidateName());
        }
        if (llmResult.getPhone() != null && !llmResult.getPhone().isBlank()) {
            submission.setPhone(llmResult.getPhone());
        }
        if (llmResult.getLinkedinUrl() != null && !llmResult.getLinkedinUrl().isBlank()) {
            submission.setLinkedinUrl(llmResult.getLinkedinUrl());
        }
        if (llmResult.getYearsOfExperience() != null) {
            submission.setYearsOfExperience(llmResult.getYearsOfExperience());
        }
        if (llmResult.getCurrentJobRole() != null && !llmResult.getCurrentJobRole().isBlank()) {
            submission.setCurrentJobRole(llmResult.getCurrentJobRole());
        }
        if (llmResult.getCurrentCompany() != null && !llmResult.getCurrentCompany().isBlank()) {
            submission.setCurrentCompany(llmResult.getCurrentCompany());
        }
        if (llmResult.getExtractedUrls() != null && !llmResult.getExtractedUrls().isEmpty()) {
            submission.setExtractedUrlsJson(toJson(llmResult.getExtractedUrls()));
        }

        // Persist Security Columns
        boolean isSuspicious = sanitization.contentRemoved() || validation.suspicious();
        submission.setFlaggedSuspicious(isSuspicious);
        if (isSuspicious) {
            List<String> allTriggers = new ArrayList<>();
            allTriggers.addAll(sanitization.triggeredRules());
            allTriggers.addAll(validation.anomalies());
            submission.setFlagReason(String.join(",", allTriggers));
            submission.setFlaggedAt(Instant.now());
        }
        submission.setSanitizedContentRemoved(sanitization.contentRemoved());
        submission.setSanitizationLog(String.join(",", sanitization.triggeredRules()));
        
        // Save experience gaps list as JSON array
        submission.setExperienceGapsJson(toJson(llmResult.getExperienceGaps()));

        submission.setCurrentProfileId(profile.getId());
        submission.setCurrentScoreId(score.getId());
        submission.setProcessingStatus(ProcessingStatus.COMPLETED);
        submissionRepository.save(submission);

        // 4. Update Attempt
        attempt.setStatus("SUCCESS");
        processingAttemptRepository.save(attempt);

        // 5. Update Ingestion Message Status
        message.setStatus("PROCESSED");
        incomingMessageRepository.save(message);

        log.info("Successfully processed and saved submission: {}", submission.getId());
    }

    @Transactional
    public void persistFailedResult(IncomingMessage message, Submission submission, ProcessingAttempt attempt, Exception exception) {
        attempt.setStatus("FAILED");
        attempt.setErrorMessage(exception.getMessage());
        processingAttemptRepository.save(attempt);

        submission.setProcessingStatus(ProcessingStatus.FAILED);
        submissionRepository.save(submission);

        message.setStatus("FAILED");
        incomingMessageRepository.save(message);

        log.info("Recorded processing failure in database for submission: {}", submission.getId());
    }

    private CampaignResponse fetchCampaignDetails(UUID campaignId) {
        String token = jwtUtil.generateToken("processing-service", "ADMIN");
        WebClient client = WebClient.builder().baseUrl(campaignServiceUrl).build();

        return client.get()
                .uri("/campaigns/{id}", campaignId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToMono(CampaignResponse.class)
                .block();
    }

    private List<CampaignResponse> fetchActiveCampaigns() {
        String token = jwtUtil.generateToken("processing-service", "ADMIN");
        WebClient client = WebClient.builder().baseUrl(campaignServiceUrl).build();

        return client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/campaigns")
                        .queryParam("status", "ACTIVE")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToFlux(CampaignResponse.class)
                .collectList()
                .block();
    }

    @Transactional
    public void persistUnassignedResult(
            IncomingMessage message,
            Submission submission,
            ProcessingAttempt attempt,
            ResumeTextSanitizer.SanitizationResult sanitization
    ) {
        // Set sanitization fields on unassigned submission
        submission.setSanitizedContentRemoved(sanitization.contentRemoved());
        submission.setSanitizationLog(String.join(",", sanitization.triggeredRules()));
        submission.setProcessingStatus(ProcessingStatus.COMPLETED);
        submissionRepository.save(submission);

        // Update Attempt
        attempt.setStatus("SUCCESS");
        processingAttemptRepository.save(attempt);

        // Update Ingestion Message Status
        message.setStatus("PROCESSED");
        incomingMessageRepository.save(message);

        log.info("Successfully saved unassigned submission: {}", submission.getId());
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
