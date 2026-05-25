package com.hireblind.processing.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submission_stage_history")
public class SubmissionStageHistory {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @Column(name = "from_stage_id")
    private UUID fromStageId;

    @Column(name = "to_stage_id", nullable = false)
    private UUID toStageId;

    @Column(name = "changed_by_user_id")
    private UUID changedByUserId;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt = Instant.now();

    @Column(name = "notes")
    private String notes;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Submission getSubmission() { return submission; }
    public void setSubmission(Submission submission) { this.submission = submission; }
    public UUID getFromStageId() { return fromStageId; }
    public void setFromStageId(UUID fromStageId) { this.fromStageId = fromStageId; }
    public UUID getToStageId() { return toStageId; }
    public void setToStageId(UUID toStageId) { this.toStageId = toStageId; }
    public UUID getChangedByUserId() { return changedByUserId; }
    public void setChangedByUserId(UUID changedByUserId) { this.changedByUserId = changedByUserId; }
    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
