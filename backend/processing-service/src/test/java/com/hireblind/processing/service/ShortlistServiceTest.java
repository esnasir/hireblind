package com.hireblind.processing.service;

import com.hireblind.processing.dto.CampaignResponse;
import com.hireblind.processing.entity.ProcessingStatus;
import com.hireblind.processing.entity.Submission;
import com.hireblind.processing.repository.SubmissionRepository;
import com.hireblind.processing.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShortlistServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private JavaMailSender mailSender;

    private ShortlistService shortlistService;

    @BeforeEach
    void setUp() {
        shortlistService = spy(new ShortlistService(
                submissionRepository, 
                jwtUtil, 
                org.springframework.web.reactive.function.client.WebClient.builder(), 
                new org.springframework.web.client.RestTemplate(), 
                "http://dummy-campaign", 
                "http://dummy-audit", 
                mailSender
        ));
    }

    @Test
    void testShortlistSingleCandidate_PromoteToPrimary() {
        UUID submissionId = UUID.randomUUID();
        UUID campaignId = UUID.randomUUID();
        String actorEmail = "recruiter@hireblind.local";

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setCampaignId(campaignId);
        submission.setPipelineStage("SCREENED");
        submission.setProcessingStatus(ProcessingStatus.SCORED);

        CampaignResponse campaign = new CampaignResponse();
        campaign.setId(campaignId);
        campaign.setTitle("Test Campaign");
        campaign.setTotalVacancies(2);
        campaign.setBufferMultiplier(2);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        doReturn(campaign).when(shortlistService).fetchCampaignDetails(campaignId);
        when(submissionRepository.countByCampaignIdAndShortlistTier(campaignId, "PRIMARY")).thenReturn(1L);

        shortlistService.shortlistSingleCandidate(submissionId, campaignId, actorEmail);

        assertEquals("SHORTLISTED", submission.getPipelineStage());
        assertEquals("PRIMARY", submission.getShortlistTier());
        assertEquals(2, submission.getShortlistPosition());
        assertEquals(actorEmail, submission.getShortlistedByActorEmail());

        verify(submissionRepository, times(1)).save(submission);
    }

    @Test
    void testShortlistSingleCandidate_PromoteToBuffer() {
        UUID submissionId = UUID.randomUUID();
        UUID campaignId = UUID.randomUUID();
        String actorEmail = "recruiter@hireblind.local";

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setCampaignId(campaignId);
        submission.setPipelineStage("SCREENED");
        submission.setProcessingStatus(ProcessingStatus.SCORED);

        CampaignResponse campaign = new CampaignResponse();
        campaign.setId(campaignId);
        campaign.setTitle("Test Campaign");
        campaign.setTotalVacancies(1);
        campaign.setBufferMultiplier(2);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        doReturn(campaign).when(shortlistService).fetchCampaignDetails(campaignId);
        when(submissionRepository.countByCampaignIdAndShortlistTier(campaignId, "PRIMARY")).thenReturn(1L);
        when(submissionRepository.countByCampaignIdAndShortlistTier(campaignId, "BUFFER")).thenReturn(1L);

        shortlistService.shortlistSingleCandidate(submissionId, campaignId, actorEmail);

        assertEquals("SHORTLISTED", submission.getPipelineStage());
        assertEquals("BUFFER", submission.getShortlistTier());
        assertEquals(2, submission.getShortlistPosition());

        verify(submissionRepository, times(1)).save(submission);
    }

    @Test
    void testPromoteToPrimary_Success() {
        UUID submissionId = UUID.randomUUID();
        UUID campaignId = UUID.randomUUID();
        String actorEmail = "admin@hireblind.local";

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setCampaignId(campaignId);
        submission.setShortlistTier("BUFFER");
        submission.setShortlistPosition(1);
        submission.setPipelineStage("SHORTLISTED");

        CampaignResponse campaign = new CampaignResponse();
        campaign.setId(campaignId);
        campaign.setTitle("Test Campaign");
        campaign.setTotalVacancies(3);
        campaign.setBufferMultiplier(2);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        doReturn(campaign).when(shortlistService).fetchCampaignDetails(campaignId);
        when(submissionRepository.countByCampaignIdAndShortlistTier(campaignId, "PRIMARY")).thenReturn(2L);

        shortlistService.promoteToPrimary(submissionId, actorEmail);

        assertEquals("PRIMARY", submission.getShortlistTier());
        assertEquals(3, submission.getShortlistPosition());
        verify(submissionRepository, times(1)).save(submission);
    }
}
