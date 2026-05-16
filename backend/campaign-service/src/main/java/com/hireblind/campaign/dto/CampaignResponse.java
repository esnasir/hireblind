package com.hireblind.campaign.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Campaign response DTO — safe to expose externally.
 */
public record CampaignResponse(
        UUID id,
        String title,
        String description,
        List<String> requiredSkills,
        Map<String, Object> screeningRules,
        String status,
        UUID ownerUserId,
        Instant createdAt,
        Instant updatedAt
) {}
