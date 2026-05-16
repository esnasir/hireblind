package com.hireblind.campaign.dto;

import java.util.List;
import java.util.Map;

/**
 * Request body for updating an existing campaign.
 */
public record CampaignUpdateRequest(
        String title,
        String description,
        List<String> requiredSkills,
        Map<String, Object> screeningRules
) {}
