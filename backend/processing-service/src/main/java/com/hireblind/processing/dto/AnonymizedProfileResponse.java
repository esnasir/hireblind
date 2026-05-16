package com.hireblind.processing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AnonymizedProfileResponse(
        UUID id,
        UUID submissionId,
        String normalizedResumeText,
        List<String> extractedSkills,
        String experienceSummary,
        String educationSummaryRedacted,
        Object piiRedactionSummary,
        BigDecimal confidenceScore,
        Instant createdAt
) {}
