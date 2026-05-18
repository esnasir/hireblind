package com.hireblind.processing.entity;

import jakarta.persistence.*;
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
}
