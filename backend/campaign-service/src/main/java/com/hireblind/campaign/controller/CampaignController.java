package com.hireblind.campaign.controller;

import com.hireblind.campaign.dto.CampaignCreateRequest;
import com.hireblind.campaign.dto.CampaignResponse;
import com.hireblind.campaign.dto.CampaignUpdateRequest;
import com.hireblind.campaign.entity.CampaignStatus;
import com.hireblind.campaign.service.CampaignService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/campaigns")
public class CampaignController {

    private static final Logger log = LoggerFactory.getLogger(CampaignController.class);
    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @PostMapping
    public ResponseEntity<CampaignResponse> create(
            @Valid @RequestBody CampaignCreateRequest request,
            Authentication auth) {
        UUID ownerUserId = UUID.fromString((String) auth.getPrincipal());
        log.info("POST /campaigns by user: {}", ownerUserId);
        CampaignResponse response = campaignService.create(request, ownerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CampaignResponse>> list(
            @RequestParam(required = false) String status) {
        log.info("GET /campaigns (status filter: {})", status);
        return ResponseEntity.ok(campaignService.list(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getById(@PathVariable UUID id) {
        log.info("GET /campaigns/{}", id);
        return ResponseEntity.ok(campaignService.getById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CampaignResponse> update(
            @PathVariable UUID id,
            @RequestBody CampaignUpdateRequest request) {
        log.info("PATCH /campaigns/{}", id);
        return ResponseEntity.ok(campaignService.update(id, request));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<CampaignResponse> activate(@PathVariable UUID id) {
        log.info("POST /campaigns/{}/activate", id);
        return ResponseEntity.ok(campaignService.transition(id, CampaignStatus.ACTIVE));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<CampaignResponse> close(@PathVariable UUID id) {
        log.info("POST /campaigns/{}/close", id);
        return ResponseEntity.ok(campaignService.transition(id, CampaignStatus.CLOSED));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<CampaignResponse> archive(@PathVariable UUID id) {
        log.info("POST /campaigns/{}/archive", id);
        return ResponseEntity.ok(campaignService.transition(id, CampaignStatus.ARCHIVED));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        log.info("GET /campaigns/stats");
        return ResponseEntity.ok(campaignService.getStats());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaign(@PathVariable UUID id) {
        log.info("DELETE /campaigns/{} by ADMIN", id);
        campaignService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }
}
