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

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false)
    private ProcessingStatus processingStatus = ProcessingStatus.RECEIVED;

    @Column(name = "attachment_count")
    private int attachmentCount;

    @Column(name = "current_profile_id")
    private UUID currentProfileId;

    @Column(name = "current_score_id")
    private UUID currentScoreId;

    // Raw PII — never exposed in recruiter-facing responses
    @Column(name = "raw_candidate_name")
    private String rawCandidateName;

    @Column(name = "raw_candidate_email")
    private String rawCandidateEmail;

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

    public String getRawCandidateName() { return rawCandidateName; }
    public void setRawCandidateName(String rawCandidateName) { this.rawCandidateName = rawCandidateName; }

    public String getRawCandidateEmail() { return rawCandidateEmail; }
    public void setRawCandidateEmail(String rawCandidateEmail) { this.rawCandidateEmail = rawCandidateEmail; }
}
