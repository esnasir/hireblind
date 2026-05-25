package com.hireblind.campaign.service;

import com.hireblind.campaign.dto.CampaignCreateRequest;
import com.hireblind.campaign.dto.CampaignResponse;
import com.hireblind.campaign.entity.Campaign;
import com.hireblind.campaign.entity.CampaignStatus;
import com.hireblind.campaign.repository.CampaignRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    private CampaignService campaignService;

    @BeforeEach
    void setUp() {
        campaignService = new CampaignService(campaignRepository, new ObjectMapper());
    }

    @Test
    @DisplayName("Create campaign persists correctly")
    void createCampaign() {
        UUID ownerId = UUID.randomUUID();
        CampaignCreateRequest request = new CampaignCreateRequest(
                "Test Campaign", "Description", List.of("Java"), null, 10, 2, "Engineering", "Full-time", "Remote", List.of(), List.of()
        );

        when(campaignRepository.save(any(Campaign.class))).thenAnswer(inv -> {
            Campaign c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CampaignResponse response = campaignService.create(request, ownerId);

        assertNotNull(response.id());
        assertEquals("Test Campaign", response.title());
        assertEquals("DRAFT", response.status());
        assertEquals(ownerId, response.ownerUserId());
    }

    @Test
    @DisplayName("Transition DRAFT → ACTIVE succeeds")
    void transitionDraftToActive() {
        Campaign campaign = new Campaign();
        campaign.setId(UUID.randomUUID());
        campaign.setTitle("Test");
        campaign.setStatus(CampaignStatus.DRAFT);
        campaign.setOwnerUserId(UUID.randomUUID());

        when(campaignRepository.findById(campaign.getId())).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CampaignResponse response = campaignService.transition(campaign.getId(), CampaignStatus.ACTIVE);
        assertEquals("ACTIVE", response.status());
    }

    @Test
    @DisplayName("Invalid transition DRAFT → CLOSED fails")
    void invalidTransitionFails() {
        Campaign campaign = new Campaign();
        campaign.setId(UUID.randomUUID());
        campaign.setTitle("Test");
        campaign.setStatus(CampaignStatus.DRAFT);
        campaign.setOwnerUserId(UUID.randomUUID());

        when(campaignRepository.findById(campaign.getId())).thenReturn(Optional.of(campaign));

        assertThrows(IllegalArgumentException.class, () ->
                campaignService.transition(campaign.getId(), CampaignStatus.CLOSED)
        );
    }

    @Test
    @DisplayName("Get by ID throws for nonexistent campaign")
    void getByIdNotFound() {
        UUID id = UUID.randomUUID();
        when(campaignRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> campaignService.getById(id));
    }
}
