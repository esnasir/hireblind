package com.hireblind.campaign.service;

import com.hireblind.campaign.dto.CampaignCreateRequest;
import com.hireblind.campaign.dto.CampaignResponse;
import com.hireblind.campaign.dto.CampaignUpdateRequest;
import com.hireblind.campaign.entity.Campaign;
import com.hireblind.campaign.entity.CampaignStatus;
import com.hireblind.campaign.repository.CampaignRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Business logic for campaign CRUD and lifecycle management.
 */
@Service
@Transactional
public class CampaignService {

    private static final Logger log = LoggerFactory.getLogger(CampaignService.class);
    private final CampaignRepository campaignRepository;
    private final ObjectMapper objectMapper;

    // Valid status transitions
    private static final Map<CampaignStatus, Set<CampaignStatus>> VALID_TRANSITIONS = Map.of(
            CampaignStatus.DRAFT, Set.of(CampaignStatus.ACTIVE),
            CampaignStatus.ACTIVE, Set.of(CampaignStatus.CLOSED),
            CampaignStatus.CLOSED, Set.of(CampaignStatus.ARCHIVED),
            CampaignStatus.ARCHIVED, Set.of()
    );

    public CampaignService(CampaignRepository campaignRepository, ObjectMapper objectMapper) {
        this.campaignRepository = campaignRepository;
        this.objectMapper = objectMapper;
    }

    public CampaignResponse create(CampaignCreateRequest request, UUID ownerUserId) {
        log.info("Creating campaign: '{}' by user: {}", request.title(), ownerUserId);

        Campaign campaign = new Campaign();
        campaign.setTitle(request.title());
        campaign.setDescription(request.description());
        campaign.setRequiredSkillsJson(toJson(request.requiredSkills()));
        campaign.setScreeningRulesJson(toJson(request.screeningRules()));
        campaign.setStatus(CampaignStatus.DRAFT);
        campaign.setOwnerUserId(ownerUserId);

        campaign = campaignRepository.save(campaign);
        log.info("Campaign created with id: {}", campaign.getId());

        return toResponse(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> list(String statusFilter) {
        List<Campaign> campaigns;
        if (statusFilter != null && !statusFilter.isBlank()) {
            CampaignStatus status = CampaignStatus.valueOf(statusFilter.toUpperCase());
            campaigns = campaignRepository.findByStatus(status);
        } else {
            campaigns = campaignRepository.findAll();
        }
        return campaigns.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse getById(UUID id) {
        Campaign campaign = findOrThrow(id);
        return toResponse(campaign);
    }

    public CampaignResponse update(UUID id, CampaignUpdateRequest request) {
        Campaign campaign = findOrThrow(id);
        log.info("Updating campaign: {}", id);

        if (request.title() != null) campaign.setTitle(request.title());
        if (request.description() != null) campaign.setDescription(request.description());
        if (request.requiredSkills() != null) campaign.setRequiredSkillsJson(toJson(request.requiredSkills()));
        if (request.screeningRules() != null) campaign.setScreeningRulesJson(toJson(request.screeningRules()));

        campaign = campaignRepository.save(campaign);
        return toResponse(campaign);
    }

    public CampaignResponse transition(UUID id, CampaignStatus targetStatus) {
        Campaign campaign = findOrThrow(id);
        CampaignStatus current = campaign.getStatus();

        Set<CampaignStatus> allowed = VALID_TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(targetStatus)) {
            throw new IllegalArgumentException(
                    "Invalid transition from " + current + " to " + targetStatus);
        }

        log.info("Campaign {} status: {} → {}", id, current, targetStatus);
        campaign.setStatus(targetStatus);
        campaign = campaignRepository.save(campaign);
        return toResponse(campaign);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        for (CampaignStatus status : CampaignStatus.values()) {
            stats.put(status.name(), campaignRepository.countByStatus(status));
        }
        stats.put("TOTAL", campaignRepository.count());
        return stats;
    }

    public void deleteCampaign(UUID id) {
        Campaign campaign = campaignRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Campaign not found: " + id));
        if (campaign.getStatus() != CampaignStatus.ARCHIVED) {
            throw new IllegalStateException("Campaign must be Archived before it can be permanently deleted.");
        }
        campaignRepository.deleteById(id);
    }

    // ── Helpers ──

    private Campaign findOrThrow(UUID id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Campaign not found: " + id));
    }

    private CampaignResponse toResponse(Campaign c) {
        return new CampaignResponse(
                c.getId(), c.getTitle(), c.getDescription(),
                fromJson(c.getRequiredSkillsJson(), List.class),
                fromJson(c.getScreeningRulesJson(), Map.class),
                c.getStatus().name(),
                c.getOwnerUserId(), c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    private String toJson(Object obj) {
        if (obj == null) return "{}";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize JSON", e);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) {
            if (clazz == List.class) return (T) List.of();
            if (clazz == Map.class) return (T) Map.of();
            return null;
        }
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize JSON", e);
        }
    }
}
