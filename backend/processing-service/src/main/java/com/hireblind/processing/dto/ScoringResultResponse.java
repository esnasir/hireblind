package com.hireblind.processing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ScoringResultResponse(
        UUID id,
        UUID submissionId,
        UUID campaignId,
        BigDecimal scoreValue,
        Integer rankPosition,
        List<String> explainabilityTags,
        List<String> matchedSkills,
        List<String> missingSkills,
        Integer experienceYearsMatch,
        String summaryReason,
        String llmModelName,
        Instant createdAt
) {}
