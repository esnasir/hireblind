package com.hireblind.campaign.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a job opening / hiring campaign.
 */
@Entity
@Table(name = "campaigns")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "required_skills_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String requiredSkillsJson;

    @Column(name = "screening_rules_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String screeningRulesJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CampaignStatus status = CampaignStatus.DRAFT;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "total_vacancies", nullable = false)
    private Integer totalVacancies = 1;

    @Column(name = "buffer_multiplier", nullable = false)
    private Integer bufferMultiplier = 2;

    @Column(name = "public_slug", unique = true)
    private String publicSlug;

    @Column
    private String department;

    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "location_type")
    private String locationType;

    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private java.util.List<PipelineStage> pipelineStages = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private java.util.List<ScreeningQuestion> screeningQuestions = new java.util.ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // ── Getters and Setters ──

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequiredSkillsJson() { return requiredSkillsJson; }
    public void setRequiredSkillsJson(String requiredSkillsJson) { this.requiredSkillsJson = requiredSkillsJson; }

    public String getScreeningRulesJson() { return screeningRulesJson; }
    public void setScreeningRulesJson(String screeningRulesJson) { this.screeningRulesJson = screeningRulesJson; }

    public CampaignStatus getStatus() { return status; }
    public void setStatus(CampaignStatus status) { this.status = status; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public Integer getTotalVacancies() { return totalVacancies; }
    public void setTotalVacancies(Integer totalVacancies) { this.totalVacancies = totalVacancies; }

    public Integer getBufferMultiplier() { return bufferMultiplier; }
    public void setBufferMultiplier(Integer bufferMultiplier) { this.bufferMultiplier = bufferMultiplier; }

    public String getPublicSlug() { return publicSlug; }
    public void setPublicSlug(String publicSlug) { this.publicSlug = publicSlug; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getLocationType() { return locationType; }
    public void setLocationType(String locationType) { this.locationType = locationType; }

    public java.util.List<PipelineStage> getPipelineStages() { return pipelineStages; }
    public void setPipelineStages(java.util.List<PipelineStage> pipelineStages) { this.pipelineStages = pipelineStages; }

    public java.util.List<ScreeningQuestion> getScreeningQuestions() { return screeningQuestions; }
    public void setScreeningQuestions(java.util.List<ScreeningQuestion> screeningQuestions) { this.screeningQuestions = screeningQuestions; }
}
