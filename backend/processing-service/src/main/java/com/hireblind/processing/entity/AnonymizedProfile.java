package com.hireblind.processing.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "anonymized_profiles")
public class AnonymizedProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    @Column(name = "normalized_resume_text", columnDefinition = "TEXT")
    private String normalizedResumeText;

    @Column(name = "extracted_skills_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String extractedSkillsJson;

    @Column(name = "experience_summary", columnDefinition = "TEXT")
    private String experienceSummary;

    @Column(name = "education_summary_redacted", columnDefinition = "TEXT")
    private String educationSummaryRedacted;

    @Column(name = "pii_redaction_summary_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String piiRedactionSummaryJson;

    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    // ── Getters and Setters ──
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSubmissionId() { return submissionId; }
    public void setSubmissionId(UUID submissionId) { this.submissionId = submissionId; }

    public String getNormalizedResumeText() { return normalizedResumeText; }
    public void setNormalizedResumeText(String normalizedResumeText) { this.normalizedResumeText = normalizedResumeText; }

    public String getExtractedSkillsJson() { return extractedSkillsJson; }
    public void setExtractedSkillsJson(String extractedSkillsJson) { this.extractedSkillsJson = extractedSkillsJson; }

    public String getExperienceSummary() { return experienceSummary; }
    public void setExperienceSummary(String experienceSummary) { this.experienceSummary = experienceSummary; }

    public String getEducationSummaryRedacted() { return educationSummaryRedacted; }
    public void setEducationSummaryRedacted(String educationSummaryRedacted) { this.educationSummaryRedacted = educationSummaryRedacted; }

    public String getPiiRedactionSummaryJson() { return piiRedactionSummaryJson; }
    public void setPiiRedactionSummaryJson(String piiRedactionSummaryJson) { this.piiRedactionSummaryJson = piiRedactionSummaryJson; }

    public BigDecimal getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(BigDecimal confidenceScore) { this.confidenceScore = confidenceScore; }

    public Instant getCreatedAt() { return createdAt; }
}
