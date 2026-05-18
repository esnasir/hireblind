package com.hireblind.processing.service;

import com.hireblind.processing.dto.*;
import com.hireblind.processing.entity.*;
import com.hireblind.processing.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Handles submission queries and the reveal-identity action.
 * In Phase 1, data comes from the seeder — no real LLM processing.
 */
@Service
@Transactional
public class SubmissionService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionService.class);

    private final SubmissionRepository submissionRepository;
    private final AnonymizedProfileRepository profileRepository;
    private final ScoringResultRepository scoringRepository;
    private final CandidateNoteRepository noteRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String auditServiceUrl;

    public SubmissionService(SubmissionRepository submissionRepository,
                             AnonymizedProfileRepository profileRepository,
                             ScoringResultRepository scoringRepository,
                             CandidateNoteRepository noteRepository,
                             ObjectMapper objectMapper,
                             @Value("${audit.service.url}") String auditServiceUrl) {
        this.submissionRepository = submissionRepository;
        this.profileRepository = profileRepository;
        this.scoringRepository = scoringRepository;
        this.noteRepository = noteRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        this.auditServiceUrl = auditServiceUrl;
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> listByCampaign(UUID campaignId) {
        List<Submission> submissions = (campaignId != null)
                ? submissionRepository.findByCampaignIdOrderByMatchScoreDesc(campaignId)
                : submissionRepository.findAll();
        return submissions.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Submission getSubmissionEntity(UUID id) {
        return findOrThrow(id);
    }

    @Transactional(readOnly = true)
    public AnonymizedProfileResponse getProfile(UUID submissionId) {
        AnonymizedProfile profile = profileRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found for submission: " + submissionId));
        return toProfileResponse(profile);
    }

    @Transactional(readOnly = true)
    public ScoringResultResponse getScore(UUID submissionId) {
        ScoringResult score = scoringRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Score not found for submission: " + submissionId));
        return toScoreResponse(score);
    }

    /**
     * Reveal the identity of a candidate. ADMIN-only action.
     * Marks status as REVEALED and emits an audit event.
     */
    public RevealResponse reveal(UUID submissionId, String actorUserId, String authToken) {
        Submission sub = findOrThrow(submissionId);

        if (sub.getProcessingStatus() == ProcessingStatus.REVEALED) {
            log.info("Submission {} already revealed, returning existing data", submissionId);
        } else {
            sub.setProcessingStatus(ProcessingStatus.REVEALED);
            submissionRepository.save(sub);
            log.info("Identity revealed for submission: {} by user: {}", submissionId, actorUserId);
        }

        // Emit audit event
        emitAuditEvent(actorUserId, "IDENTITY_REVEALED", "SUBMISSION", submissionId.toString(), authToken);

        return new RevealResponse(sub.getRawCandidateName(), sub.getRawCandidateEmail());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("TOTAL", submissionRepository.count());
        for (ProcessingStatus status : ProcessingStatus.values()) {
            stats.put(status.name(), submissionRepository.countByProcessingStatus(status));
        }
        return stats;
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getUnassignedSubmissions() {
        return submissionRepository.findByCampaignIdIsNull().stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CandidateNoteDto> getNotes(UUID submissionId) {
        return noteRepository.findBySubmissionIdOrderByCreatedAtDesc(submissionId).stream()
                .map(n -> new CandidateNoteDto(n.getId(), n.getSubmissionId(), n.getAuthorEmail(), n.getContent(), n.getCreatedAt()))
                .toList();
    }

    public CandidateNoteDto addNote(UUID submissionId, String authorEmail, String content) {
        Submission sub = findOrThrow(submissionId);
        
        CandidateNote note = new CandidateNote();
        note.setSubmissionId(sub.getId());
        note.setAuthorEmail(authorEmail);
        note.setContent(content);
        
        CandidateNote saved = noteRepository.save(note);
        return new CandidateNoteDto(saved.getId(), saved.getSubmissionId(), saved.getAuthorEmail(), saved.getContent(), saved.getCreatedAt());
    }

    // ── Helpers ──

    private Submission findOrThrow(UUID id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Submission not found: " + id));
    }

    private SubmissionResponse toResponse(Submission s) {
        String name = null;
        String email = null;
        String phone = null;
        String linkedinUrl = null;
        if (s.getProcessingStatus() == com.hireblind.processing.entity.ProcessingStatus.REVEALED) {
            name = s.getRawCandidateName();
            email = s.getRawCandidateEmail();
            phone = s.getPhone();
            linkedinUrl = s.getLinkedinUrl();
        }
        java.math.BigDecimal matchScore = null;
        if (s.getCurrentScoreId() != null) {
            matchScore = scoringRepository.findById(s.getCurrentScoreId())
                    .map(com.hireblind.processing.entity.ScoringResult::getScoreValue)
                    .orElse(null);
        }
        return new SubmissionResponse(
                s.getId(), s.getCampaignId(), s.getCandidateLabel(),
                s.getReceivedAt(), s.getProcessingStatus().name(),
                s.getAttachmentCount(), s.getCurrentProfileId(), s.getCurrentScoreId(),
                matchScore,
                name, email,
                s.getPipelineStage(), s.getShortlistTier(), s.getShortlistPosition(),
                phone, linkedinUrl, s.getYearsOfExperience(),
                s.getCurrentJobRole(), s.getCurrentCompany()
        );
    }

    private AnonymizedProfileResponse toProfileResponse(AnonymizedProfile p) {
        return new AnonymizedProfileResponse(
                p.getId(), p.getSubmissionId(), p.getNormalizedResumeText(),
                fromJsonList(p.getExtractedSkillsJson()),
                p.getExperienceSummary(), p.getEducationSummaryRedacted(),
                fromJsonObject(p.getPiiRedactionSummaryJson()),
                p.getConfidenceScore(), p.getCreatedAt()
        );
    }

    private ScoringResultResponse toScoreResponse(ScoringResult s) {
        return new ScoringResultResponse(
                s.getId(), s.getSubmissionId(), s.getCampaignId(),
                s.getScoreValue(), s.getRankPosition(),
                fromJsonList(s.getExplainabilityTagsJson()),
                fromJsonList(s.getMatchedSkillsJson()),
                fromJsonList(s.getMissingSkillsJson()),
                s.getExperienceYearsMatch(), s.getSummaryReason(),
                s.getLlmModelName(), s.getCreatedAt()
        );
    }

    private void emitAuditEvent(String actorId, String actionType, String entityType,
                                String entityId, String authToken) {
        try {
            Map<String, Object> event = Map.of(
                    "actorType", "USER",
                    "actorId", actorId,
                    "actionType", actionType,
                    "entityType", entityType,
                    "entityId", entityId,
                    "metadataJson", "{}"
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + authToken);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            restTemplate.postForEntity(auditServiceUrl + "/audit/events", request, String.class);
            log.info("Audit event emitted: {} for entity: {}", actionType, entityId);
        } catch (Exception e) {
            // Log but don't fail the reveal — audit is important but shouldn't block the action
            log.error("Failed to emit audit event: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> fromJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, List.class); }
        catch (Exception e) { return List.of(); }
    }

    private Object fromJsonObject(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, Map.class); }
        catch (Exception e) { return Map.of(); }
    }
}
