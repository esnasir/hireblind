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
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubmissionProcessingService {

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

    @Transactional
    public void processSingleMessage(IncomingMessage message) {
        log.info("Starting processing for message: {}", message.getId());

        // 1. Create Submission
        Submission submission = new Submission();
        submission.setCampaignId(DEFAULT_CAMPAIGN_ID); // Defaulting for Phase 2
        submission.setCandidateLabel("Candidate-" + message.getId().toString().substring(0, 8));
        submission.setSourceMessageId(message.getSourceMessageId());
        submission.setReceivedAt(message.getReceivedAt().toInstant());
        submission.setProcessingStatus(ProcessingStatus.PROCESSING);
        submission.setRawCandidateEmail(message.getSenderEmail());
        submission.setRawCandidateName("Unknown Candidate"); // Name extraction could be an LLM task too
        
        submission = submissionRepository.save(submission);

        // 2. Manage Attempt
        ProcessingAttempt attempt = ProcessingAttempt.builder()
                .id(UUID.randomUUID())
                .submissionId(submission.getId())
                .attemptNumber(1)
                .status("RUNNING")
                .createdAt(OffsetDateTime.now())
                .build();
        processingAttemptRepository.save(attempt);

        try {
            // 3. Fetch Campaign Details
            CampaignResponse campaign = fetchCampaignDetails(DEFAULT_CAMPAIGN_ID);

            // 4. Call LLM
            LlmResponse llmResult = llmClientService.processCandidate(
                    message.getRawBody(),
                    message.getExtractedText(),
                    campaign.getDescription(),
                    String.join(", ", campaign.getRequiredSkills()),
                    toJson(campaign.getScreeningRules())
            );

            // 5. Create Anonymized Profile
            AnonymizedProfile profile = new AnonymizedProfile();
            profile.setSubmissionId(submission.getId());
            profile.setNormalizedResumeText(llmResult.getExperienceSummary()); // Using summary as normalized text for now
            profile.setExtractedSkillsJson(toJson(llmResult.getExtractedSkills()));
            profile.setExperienceSummary(llmResult.getExperienceSummary());
            profile.setEducationSummaryRedacted(llmResult.getEducationSummary());
            profile.setPiiRedactionSummaryJson(llmResult.getPiiRedactionSummary());
            profile.setConfidenceScore(java.math.BigDecimal.valueOf(llmResult.getConfidenceScore()));
            profile = profileRepository.save(profile);

            // 6. Create Scoring Result
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

            // 7. Update Submission
            submission.setCurrentProfileId(profile.getId());
            submission.setCurrentScoreId(score.getId());
            submission.setProcessingStatus(ProcessingStatus.COMPLETED);
            submissionRepository.save(submission);

            // 8. Update Attempt
            attempt.setStatus("SUCCESS");
            processingAttemptRepository.save(attempt);

            // 9. Scrub PII from IncomingMessage
            message.setSenderEmail("[SCRUBBED]");
            message.setRawBody("[SCRUBBED]");
            message.setExtractedText("[SCRUBBED]");
            message.setStatus("PROCESSED");
            incomingMessageRepository.save(message);

            log.info("Successfully processed submission: {}", submission.getId());

        } catch (Exception e) {
            log.error("Error during LLM processing for submission {}: {}", submission.getId(), e.getMessage());
            attempt.setStatus("FAILED");
            attempt.setErrorMessage(e.getMessage());
            processingAttemptRepository.save(attempt);
            
            submission.setProcessingStatus(ProcessingStatus.FAILED);
            submissionRepository.save(submission);
            
            message.setStatus("FAILED");
            incomingMessageRepository.save(message);
            
            throw e;
        }
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

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
