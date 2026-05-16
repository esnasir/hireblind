package com.hireblind.processing.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scoring_results")
public class ScoringResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "score_value", nullable = false)
    private BigDecimal scoreValue;

    @Column(name = "rank_position")
    private Integer rankPosition;

    @Column(name = "explainability_tags_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String explainabilityTagsJson;

    @Column(name = "matched_skills_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String matchedSkillsJson;

    @Column(name = "missing_skills_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String missingSkillsJson;

    @Column(name = "experience_years_match")
    private Integer experienceYearsMatch;

    @Column(name = "summary_reason", columnDefinition = "TEXT")
    private String summaryReason;

    @Column(name = "llm_model_name")
    private String llmModelName;

    @Column(name = "llm_response_version")
    private String llmResponseVersion;

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

    public UUID getCampaignId() { return campaignId; }
    public void setCampaignId(UUID campaignId) { this.campaignId = campaignId; }

    public BigDecimal getScoreValue() { return scoreValue; }
    public void setScoreValue(BigDecimal scoreValue) { this.scoreValue = scoreValue; }

    public Integer getRankPosition() { return rankPosition; }
    public void setRankPosition(Integer rankPosition) { this.rankPosition = rankPosition; }

    public String getExplainabilityTagsJson() { return explainabilityTagsJson; }
    public void setExplainabilityTagsJson(String e) { this.explainabilityTagsJson = e; }

    public String getMatchedSkillsJson() { return matchedSkillsJson; }
    public void setMatchedSkillsJson(String m) { this.matchedSkillsJson = m; }

    public String getMissingSkillsJson() { return missingSkillsJson; }
    public void setMissingSkillsJson(String m) { this.missingSkillsJson = m; }

    public Integer getExperienceYearsMatch() { return experienceYearsMatch; }
    public void setExperienceYearsMatch(Integer e) { this.experienceYearsMatch = e; }

    public String getSummaryReason() { return summaryReason; }
    public void setSummaryReason(String summaryReason) { this.summaryReason = summaryReason; }

    public String getLlmModelName() { return llmModelName; }
    public void setLlmModelName(String llmModelName) { this.llmModelName = llmModelName; }

    public String getLlmResponseVersion() { return llmResponseVersion; }
    public void setLlmResponseVersion(String v) { this.llmResponseVersion = v; }

    public Instant getCreatedAt() { return createdAt; }
}
