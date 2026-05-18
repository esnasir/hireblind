package com.hireblind.processing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LlmResponse {
    private String candidateName;
    private List<String> extractedSkills;
    private String experienceSummary;
    private String educationSummary;
    private String piiRedactionSummary;
    private Integer scoreValue;
    private List<String> explainabilityTags;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String summaryReason;
    private Integer confidenceScore;

    // New profile fields
    private String phone;
    private String linkedinUrl;
    private Integer yearsOfExperience;
    private String currentJobRole;
    private String currentCompany;
    private List<ExtractedUrl> extractedUrls;

    // Security & evaluation layer fields
    private List<String> experienceGaps;
    private List<String> tags;
    private Integer matchScore;
    private String aiAssessment;
    private String summary;

    // Custom alias getters and setters for compatibility
    public Integer getScoreValue() {
        return scoreValue != null ? scoreValue : matchScore;
    }
    
    public void setScoreValue(Integer scoreValue) {
        this.scoreValue = scoreValue;
        if (this.matchScore == null) {
            this.matchScore = scoreValue;
        }
    }
    
    public Integer getMatchScore() {
        return matchScore != null ? matchScore : scoreValue;
    }
    
    public void setMatchScore(Integer matchScore) {
        this.matchScore = matchScore;
        if (this.scoreValue == null) {
            this.scoreValue = matchScore;
        }
    }

    public String getSummaryReason() {
        return summaryReason != null ? summaryReason : aiAssessment;
    }
    
    public void setSummaryReason(String summaryReason) {
        this.summaryReason = summaryReason;
        if (this.aiAssessment == null) {
            this.aiAssessment = summaryReason;
        }
    }
    
    public String getAiAssessment() {
        return aiAssessment != null ? aiAssessment : summaryReason;
    }
    
    public void setAiAssessment(String aiAssessment) {
        this.aiAssessment = aiAssessment;
        if (this.summaryReason == null) {
            this.summaryReason = aiAssessment;
        }
    }

    public String getExperienceSummary() {
        return experienceSummary != null ? experienceSummary : summary;
    }

    public void setExperienceSummary(String experienceSummary) {
        this.experienceSummary = experienceSummary;
        if (this.summary == null) {
            this.summary = experienceSummary;
        }
    }

    public String getSummary() {
        return summary != null ? summary : experienceSummary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
        if (this.experienceSummary == null) {
            this.experienceSummary = summary;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractedUrl {
        private String platform;
        private String url;
    }
}
