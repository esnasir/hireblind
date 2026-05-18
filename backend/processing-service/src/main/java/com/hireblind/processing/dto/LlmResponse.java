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
}
