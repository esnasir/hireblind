package com.hireblind.processing.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class CampaignResponse {
    private UUID id;
    private String title;
    private String description;
    private List<String> requiredSkills;
    private Map<String, Object> screeningRules;
    private int totalVacancies = 1;
    private int bufferMultiplier = 2;
}
