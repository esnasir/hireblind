package com.hireblind.processing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.CampaignResponse;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.entity.*;
import com.hireblind.processing.repository.*;
import com.hireblind.processing.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
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

        // 2. Initialize Submission and Attempt in their own transaction
        SubmissionAndAttempt init = initiateSubmission(message, matchedCampaignId);
        Submission submission = init.submission();
        ProcessingAttempt attempt = init.attempt();

        try {
            if (matchedCampaignId != null) {
                // 3. Fetch Campaign Details (Outside DB transaction)
                CampaignResponse campaign = fetchCampaignDetails(matchedCampaignId);

                // 4. Call LLM (Outside DB transaction)
                LlmResponse llmResult = llmClientService.processCandidate(
                        message.getRawBody(),
                        message.getExtractedText(),
                        campaign.getDescription(),
                        String.join(", ", campaign.getRequiredSkills()),
                        toJson(campaign.getScreeningRules())
                );

                // 5. Persist Successful Result in its own transaction
                persistSuccessfulResult(message, submission, attempt, llmResult);
            } else {
                // 3. Save as unassigned, mark processing completed with no profile/score (since there's no campaign to score against)
                persistUnassignedResult(message, submission, attempt);
            }

        } catch (Exception e) {
            log.error("Error during processing for message: {}, submission {}: {}", 
                    message.getId(), submission.getId(), e.getMessage(), e);
            // 5. Persist Failed Result in its own transaction
            persistFailedResult(message, submission, attempt, e);
        }
    }

    @Transactional
    public SubmissionAndAttempt initiateSubmission(IncomingMessage message, UUID campaignId) {
        // 1. Create Submission
        Submission submission = new Submission();
        submission.setCampaignId(campaignId);
        submission.setCandidateLabel("Candidate-" + message.getId().toString().substring(0, 8));
        submission.setSourceMessageId(message.getSourceMessageId());
        submission.setReceivedAt(message.getReceivedAt().toInstant());
        submission.setProcessingStatus(ProcessingStatus.PROCESSING);
        submission.setRawCandidateEmail(message.getSenderEmail());
        submission.setRawCandidateName("Unknown Candidate");
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
    public void persistSuccessfulResult(IncomingMessage message, Submission submission, ProcessingAttempt attempt, LlmResponse llmResult) {
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
        submission.setCurrentProfileId(profile.getId());
        submission.setCurrentScoreId(score.getId());
        submission.setProcessingStatus(ProcessingStatus.COMPLETED);
        submissionRepository.save(submission);

        // 4. Update Attempt
        attempt.setStatus("SUCCESS");
        processingAttemptRepository.save(attempt);

        // 5. Scrub PII from IncomingMessage
        message.setSenderEmail("[SCRUBBED]");
        message.setRawBody("[SCRUBBED]");
        message.setExtractedText("[SCRUBBED]");
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
    public void persistUnassignedResult(IncomingMessage message, Submission submission, ProcessingAttempt attempt) {
        // Update Submission
        submission.setProcessingStatus(ProcessingStatus.COMPLETED);
        submissionRepository.save(submission);

        // Update Attempt
        attempt.setStatus("SUCCESS");
        processingAttemptRepository.save(attempt);

        // Scrub PII from IncomingMessage
        message.setSenderEmail("[SCRUBBED]");
        message.setRawBody("[SCRUBBED]");
        message.setExtractedText("[SCRUBBED]");
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
