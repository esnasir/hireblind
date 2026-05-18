package com.hireblind.processing.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Submission response — NEVER includes raw PII.
 */
public record SubmissionResponse(
        UUID id,
        UUID campaignId,
        String candidateLabel,
        Instant receivedAt,
        String processingStatus,
        int attachmentCount,
        UUID currentProfileId,
        UUID currentScoreId,
        java.math.BigDecimal matchScore,
        String candidateName,
        String candidateEmail,
        String pipelineStage,
        String shortlistTier,
        Integer shortlistPosition,
        String phone,
        String linkedinUrl,
        Integer yearsOfExperience,
        String currentJobRole,
        String currentCompany
) {}
