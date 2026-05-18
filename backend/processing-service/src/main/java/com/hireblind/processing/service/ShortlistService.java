package com.hireblind.processing.service;

import com.hireblind.processing.dto.CampaignResponse;
import com.hireblind.processing.entity.ProcessingStatus;
import com.hireblind.processing.entity.Submission;
import com.hireblind.processing.repository.SubmissionRepository;
import com.hireblind.processing.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class ShortlistService {

    private static final Logger log = LoggerFactory.getLogger(ShortlistService.class);
    
    private final SubmissionRepository submissionRepository;
    private final JwtUtil jwtUtil;
    private final WebClient webClient;
    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate;
    private final String auditServiceUrl;

    public ShortlistService(SubmissionRepository submissionRepository, JwtUtil jwtUtil, 
                            @Value("${campaign.service.url}") String campaignServiceUrl,
                            @Value("${audit.service.url}") String auditServiceUrl,
                            JavaMailSender mailSender) {
        this.submissionRepository = submissionRepository;
        this.jwtUtil = jwtUtil;
        this.webClient = WebClient.builder().baseUrl(campaignServiceUrl).build();
        this.auditServiceUrl = auditServiceUrl;
        this.mailSender = mailSender;
        this.restTemplate = new RestTemplate();
    }

    public void processCampaignShortlist(UUID campaignId, String actorEmail) {
        // 1. Fetch totalVacancies and bufferMultiplier
        CampaignResponse campaign = fetchCampaignDetails(campaignId);
        int totalVacancies = campaign.getTotalVacancies();
        int bufferMultiplier = campaign.getBufferMultiplier();
        int bufferSlotsTotal = totalVacancies * bufferMultiplier;

        // 2. Fetch all completed submissions
        List<Submission> submissions = submissionRepository.findByCampaignIdOrderByMatchScoreDesc(campaignId)
                .stream()
                .filter(s -> s.getProcessingStatus() == ProcessingStatus.COMPLETED || s.getProcessingStatus() == ProcessingStatus.REVEALED)
                .collect(Collectors.toList());

        // 3. Assign Top N to PRIMARY tier, Next M to BUFFER tier
        int p = 0;
        int b = 0;

        for (Submission s : submissions) {
            if ("REJECTED".equals(s.getPipelineStage())) continue;

            if (p < totalVacancies) {
                s.setPipelineStage("SHORTLISTED");
                s.setShortlistTier("PRIMARY");
                s.setShortlistPosition(p + 1);
                s.setShortlistedAt(Instant.now());
                s.setShortlistedByActorEmail(actorEmail);
                p++;
            } else if (b < bufferSlotsTotal) {
                s.setPipelineStage("SHORTLISTED");
                s.setShortlistTier("BUFFER");
                s.setShortlistPosition(b + 1);
                s.setShortlistedAt(Instant.now());
                s.setShortlistedByActorEmail(actorEmail);
                b++;
            } else {
                s.setPipelineStage("SCREENED");
                s.setShortlistTier(null);
                s.setShortlistPosition(null);
            }
            submissionRepository.save(s);
            
            if (p <= totalVacancies && "PRIMARY".equals(s.getShortlistTier()) && s.getProcessingStatus() == ProcessingStatus.REVEALED) {
                // If already revealed (unlikely for new shortlists, but good to handle)
                sendShortlistEmail(s.getRawCandidateEmail(), s.getRawCandidateName(), campaign.getTitle());
            }
        }
        
        emitAuditEvent(actorEmail, "SHORTLIST_GENERATED", "CAMPAIGN", campaignId.toString());
    }

    public void approveBufferCandidate(UUID submissionId, String actorEmail) {
        Submission submission = submissionRepository.findById(submissionId).orElseThrow();
        if (!"BUFFER".equals(submission.getShortlistTier())) {
            throw new IllegalStateException("Candidate is not in BUFFER tier");
        }
        
        submission.setShortlistTier("PRIMARY");
        submission.setShortlistedAt(Instant.now());
        submission.setShortlistedByActorEmail(actorEmail);
        submissionRepository.save(submission);
        
        emitAuditEvent(actorEmail, "CANDIDATE_APPROVED_TO_PRIMARY", "SUBMISSION", submissionId.toString());
        
        if (submission.getProcessingStatus() == ProcessingStatus.REVEALED && submission.getRawCandidateEmail() != null) {
            CampaignResponse campaign = fetchCampaignDetails(submission.getCampaignId());
            sendShortlistEmail(submission.getRawCandidateEmail(), submission.getRawCandidateName(), campaign.getTitle());
        }
    }

    public void rejectCandidate(UUID submissionId, String reason) {
        Submission submission = submissionRepository.findById(submissionId).orElseThrow();
        submission.setPipelineStage("REJECTED");
        submission.setRejectionReason(reason);
        submission.setRejectedAt(Instant.now());
        
        // Auto pull-up from buffer if PRIMARY
        if ("PRIMARY".equals(submission.getShortlistTier())) {
            List<Submission> buffer = submissionRepository.findByCampaignIdOrderByMatchScoreDesc(submission.getCampaignId())
                    .stream()
                    .filter(s -> "BUFFER".equals(s.getShortlistTier()) && !"REJECTED".equals(s.getPipelineStage()))
                    .collect(Collectors.toList());
                    
            if (!buffer.isEmpty()) {
                Submission nextBuffer = buffer.get(0);
                nextBuffer.setShortlistTier("PRIMARY");
                nextBuffer.setShortlistedAt(Instant.now());
                submissionRepository.save(nextBuffer);
                emitAuditEvent("SYSTEM", "BUFFER_PROMOTED_AUTO", "SUBMISSION", nextBuffer.getId().toString());
            }
        }
        
        submissionRepository.save(submission);
        
        // Use a generic system actor if reason implies manual reject but actor isn't passed here
        emitAuditEvent("SYSTEM_OR_USER", "CANDIDATE_REJECTED", "SUBMISSION", submissionId.toString());
    }

    private CampaignResponse fetchCampaignDetails(UUID campaignId) {
        String token = jwtUtil.generateToken("processing-service", "ADMIN");
        return webClient.get()
                .uri("/campaigns/{id}", campaignId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToMono(CampaignResponse.class)
                .block();
    }

    private void emitAuditEvent(String actorId, String actionType, String entityType, String entityId) {
        try {
            Map<String, Object> event = Map.of(
                    "actorType", "USER",
                    "actorId", actorId,
                    "actionType", actionType,
                    "entityType", entityType,
                    "entityId", entityId,
                    "metadataJson", "{}"
            );

            String token = jwtUtil.generateToken("processing-service", "ADMIN");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + token);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            restTemplate.postForEntity(auditServiceUrl + "/audit/events", request, String.class);
            log.info("Audit event emitted: {} for entity: {}", actionType, entityId);
        } catch (Exception e) {
            log.error("Failed to emit audit event: {}", e.getMessage());
        }
    }

    private void sendShortlistEmail(String toEmail, String candidateName, String campaignTitle) {
        if (toEmail == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("You have been shortlisted! - " + campaignTitle);
            message.setText("Dear " + candidateName + ",\n\n" +
                    "Congratulations! You have been shortlisted for the position: " + campaignTitle + ".\n" +
                    "Our recruitment team will be in touch with you shortly regarding the next steps.\n\n" +
                    "Best regards,\n" +
                    "The HireBlind Team");
            mailSender.send(message);
            log.info("Sent shortlist email to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send shortlist email to {}: {}", toEmail, e.getMessage());
        }
    }
}
