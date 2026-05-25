package com.hireblind.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

/**
 * Request body for creating a new campaign.
 */
public record CampaignCreateRequest(
        @NotBlank(message = "Title is required")
        String title,

        String description,

        List<String> requiredSkills,

        Map<String, Object> screeningRules,
        
        Integer totalVacancies,
        
        Integer bufferMultiplier,

        String department,
        
        String employmentType,
        
        String locationType,
        
        List<PipelineStageDto> pipelineStages,
        
        List<ScreeningQuestionDto> screeningQuestions
) {}
