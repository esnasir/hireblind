package com.hireblind.processing.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = true)
    private UUID campaignId;

    @Column(name = "candidate_label", nullable = false)
    private String candidateLabel;

    @Column(name = "source_email_hash")
    private String sourceEmailHash;

    @Column(name = "source_message_id", unique = true)
    private String sourceMessageId;

    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;

    @Column(name = "resume_file_path")
    private String resumeFilePath;

    @Column(name = "resume_original_filename")
    private String resumeOriginalFilename;

    @Column(name = "resume_file_size_bytes")
    private Long resumeFileSizeBytes;

    @Column(name = "resume_content_type")
    private String resumeContentType;



    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false)
    private ProcessingStatus processingStatus = ProcessingStatus.RECEIVED;

    @Column(name = "attachment_count")
    private int attachmentCount;

    @Column(name = "current_profile_id")
    private UUID currentProfileId;

    @Column(name = "current_score_id")
    private UUID currentScoreId;

    @Column(name = "current_stage_id")
    private UUID currentStageId;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<SubmissionAnswer> answers = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<SubmissionStageHistory> stageHistory = new java.util.ArrayList<>();

    @Column(name = "pipeline_stage", nullable = false)
    private String pipelineStage = "SCREENED";

    @Column(name = "shortlist_tier")
    private String shortlistTier;

    @Column(name = "shortlist_position")
    private Integer shortlistPosition;

    @Column(name = "shortlisted_at")
    private Instant shortlistedAt;

    @Column(name = "shortlisted_by_actor_email")
    private String shortlistedByActorEmail;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    // Raw PII — never exposed in recruiter-facing responses
    @Column(name = "raw_candidate_name")
    private String rawCandidateName;

    @Column(name = "raw_candidate_email")
    private String rawCandidateEmail;

    @Column(name = "phone")
    private String phone;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "current_job_role")
    private String currentJobRole;

    @Column(name = "current_company")
    private String currentCompany;

    @Column(name = "state")
    private String state;

    @Column(name = "extracted_urls_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String extractedUrlsJson;

    @Column(name = "is_flagged_suspicious", nullable = false)
    private boolean flaggedSuspicious = false;

    @Column(name = "flag_reason")
    private String flagReason;

    @Column(name = "flagged_at")
    private Instant flaggedAt;

    @Column(name = "sanitized_content_removed", nullable = false)
    private boolean sanitizedContentRemoved = false;

    @Column(name = "sanitization_log")
    private String sanitizationLog;

    @Column(name = "experience_gaps_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String experienceGapsJson;

    @PrePersist
    protected void onCreate() {
        if (receivedAt == null) receivedAt = Instant.now();
    }

    // ── Getters and Setters ──
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCampaignId() { return campaignId; }
    public void setCampaignId(UUID campaignId) { this.campaignId = campaignId; }

    public String getCandidateLabel() { return candidateLabel; }
    public void setCandidateLabel(String candidateLabel) { this.candidateLabel = candidateLabel; }

    public String getSourceEmailHash() { return sourceEmailHash; }
    public void setSourceEmailHash(String sourceEmailHash) { this.sourceEmailHash = sourceEmailHash; }

    public String getSourceMessageId() { return sourceMessageId; }
    public void setSourceMessageId(String sourceMessageId) { this.sourceMessageId = sourceMessageId; }

    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }

    public ProcessingStatus getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(ProcessingStatus processingStatus) { this.processingStatus = processingStatus; }

    public int getAttachmentCount() { return attachmentCount; }
    public void setAttachmentCount(int attachmentCount) { this.attachmentCount = attachmentCount; }

    public UUID getCurrentProfileId() { return currentProfileId; }
    public void setCurrentProfileId(UUID currentProfileId) { this.currentProfileId = currentProfileId; }

    public UUID getCurrentScoreId() { return currentScoreId; }
    public void setCurrentScoreId(UUID currentScoreId) { this.currentScoreId = currentScoreId; }

    public UUID getCurrentStageId() { return currentStageId; }
    public void setCurrentStageId(UUID currentStageId) { this.currentStageId = currentStageId; }

    public java.util.List<SubmissionAnswer> getAnswers() { return answers; }
    public void setAnswers(java.util.List<SubmissionAnswer> answers) { this.answers = answers; }

    public java.util.List<SubmissionStageHistory> getStageHistory() { return stageHistory; }
    public void setStageHistory(java.util.List<SubmissionStageHistory> stageHistory) { this.stageHistory = stageHistory; }

    public String getPipelineStage() { return pipelineStage; }
    public void setPipelineStage(String pipelineStage) { this.pipelineStage = pipelineStage; }

    public String getShortlistTier() { return shortlistTier; }
    public void setShortlistTier(String shortlistTier) { this.shortlistTier = shortlistTier; }

    public Integer getShortlistPosition() { return shortlistPosition; }
    public void setShortlistPosition(Integer shortlistPosition) { this.shortlistPosition = shortlistPosition; }

    public Instant getShortlistedAt() { return shortlistedAt; }
    public void setShortlistedAt(Instant shortlistedAt) { this.shortlistedAt = shortlistedAt; }

    public String getShortlistedByActorEmail() { return shortlistedByActorEmail; }
    public void setShortlistedByActorEmail(String shortlistedByActorEmail) { this.shortlistedByActorEmail = shortlistedByActorEmail; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRawCandidateName() { return rawCandidateName; }
    public void setRawCandidateName(String rawCandidateName) { this.rawCandidateName = rawCandidateName; }

    public String getRawCandidateEmail() { return rawCandidateEmail; }
    public void setRawCandidateEmail(String rawCandidateEmail) { this.rawCandidateEmail = rawCandidateEmail; }

    public String getResumeFilePath() { return resumeFilePath; }
    public void setResumeFilePath(String resumeFilePath) { this.resumeFilePath = resumeFilePath; }

    public String getResumeOriginalFilename() { return resumeOriginalFilename; }
    public void setResumeOriginalFilename(String resumeOriginalFilename) { this.resumeOriginalFilename = resumeOriginalFilename; }

    public Long getResumeFileSizeBytes() { return resumeFileSizeBytes; }
    public void setResumeFileSizeBytes(Long resumeFileSizeBytes) { this.resumeFileSizeBytes = resumeFileSizeBytes; }

    public String getResumeContentType() { return resumeContentType; }
    public void setResumeContentType(String resumeContentType) { this.resumeContentType = resumeContentType; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public String getCurrentJobRole() { return currentJobRole; }
    public void setCurrentJobRole(String currentJobRole) { this.currentJobRole = currentJobRole; }

    public String getCurrentCompany() { return currentCompany; }
    public void setCurrentCompany(String currentCompany) { this.currentCompany = currentCompany; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getExtractedUrlsJson() { return extractedUrlsJson; }
    public void setExtractedUrlsJson(String extractedUrlsJson) { this.extractedUrlsJson = extractedUrlsJson; }

    public boolean isFlaggedSuspicious() { return flaggedSuspicious; }
    public void setFlaggedSuspicious(boolean flaggedSuspicious) { this.flaggedSuspicious = flaggedSuspicious; }

    public String getFlagReason() { return flagReason; }
    public void setFlagReason(String flagReason) { this.flagReason = flagReason; }

    public Instant getFlaggedAt() { return flaggedAt; }
    public void setFlaggedAt(Instant flaggedAt) { this.flaggedAt = flaggedAt; }

    public boolean isSanitizedContentRemoved() { return sanitizedContentRemoved; }
    public void setSanitizedContentRemoved(boolean sanitizedContentRemoved) { this.sanitizedContentRemoved = sanitizedContentRemoved; }

    public String getSanitizationLog() { return sanitizationLog; }
    public void setSanitizationLog(String sanitizationLog) { this.sanitizationLog = sanitizationLog; }

    public String getExperienceGapsJson() { return experienceGapsJson; }
    public void setExperienceGapsJson(String experienceGapsJson) { this.experienceGapsJson = experienceGapsJson; }
}
