package com.hireblind.processing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.SubmissionResponse;
import com.hireblind.processing.entity.ProcessingStatus;
import com.hireblind.processing.entity.Submission;
import com.hireblind.processing.repository.AnonymizedProfileRepository;
import com.hireblind.processing.repository.CandidateNoteRepository;
import com.hireblind.processing.repository.ScoringResultRepository;
import com.hireblind.processing.repository.SubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class SubmissionServicePrivacyTest {

    private SubmissionRepository submissionRepository;
    private ScoringResultRepository scoringRepository;
    private RestTemplate restTemplate;
    private SubmissionService submissionService;

    @BeforeEach
    void setUp() {
        submissionRepository = mock(SubmissionRepository.class);
        scoringRepository = mock(ScoringResultRepository.class);
        restTemplate = mock(RestTemplate.class);
        submissionService = new SubmissionService(
                submissionRepository,
                mock(AnonymizedProfileRepository.class),
                scoringRepository,
                mock(CandidateNoteRepository.class),
                new ObjectMapper(),
                "http://audit-service",
                restTemplate
        );
    }

    @Test
    void unrevealedSubmissionResponseMasksDirectPiiAndUrls() {
        UUID submissionId = UUID.randomUUID();
        Submission submission = baseSubmission(submissionId, ProcessingStatus.COMPLETED);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        SubmissionResponse response = submissionService.getById(submissionId, false);

        assertNull(response.candidateName());
        assertNull(response.candidateEmail());
        assertNull(response.phone());
        assertNull(response.linkedinUrl());
        assertTrue(response.extractedUrlsJson().contains("[REDACTED]"));
        assertFalse(response.extractedUrlsJson().contains("alex-candidate"));
        assertNull(response.flagReason());
    }

    @Test
    void revealedSubmissionResponseCanIncludeDirectPii() {
        UUID submissionId = UUID.randomUUID();
        Submission submission = baseSubmission(submissionId, ProcessingStatus.REVEALED);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        SubmissionResponse response = submissionService.getById(submissionId, true);

        assertEquals("Alex Candidate", response.candidateName());
        assertEquals("alex@example.com", response.candidateEmail());
        assertEquals("555-0101", response.phone());
        assertEquals("https://linkedin.com/in/alex-candidate", response.linkedinUrl());
        assertTrue(response.extractedUrlsJson().contains("alex-candidate"));
        assertEquals("INSTRUCTION_OVERRIDE", response.flagReason());
    }

    @Test
    void resumeDownloadRequiresReveal() {
        UUID submissionId = UUID.randomUUID();
        Submission submission = baseSubmission(submissionId, ProcessingStatus.COMPLETED);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        assertThrows(AccessDeniedException.class,
                () -> submissionService.downloadResume(submissionId, "admin-user", "token"));
    }

    @Test
    void revealedResumeDownloadAuditsAndSanitizesFilename() throws Exception {
        UUID submissionId = UUID.randomUUID();
        Submission submission = baseSubmission(submissionId, ProcessingStatus.REVEALED);
        var tempFile = Files.createTempFile("hireblind-resume", ".pdf");
        Files.writeString(tempFile, "resume");
        submission.setResumeFilePath(tempFile.toString());
        submission.setResumeOriginalFilename("Alex Candidate Resume.pdf");
        submission.setResumeContentType("application/pdf");

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        var download = submissionService.downloadResume(submissionId, "admin-user", "token");

        assertTrue(download.isPresent());
        assertTrue(download.get().headers().getFirst("Content-Disposition").contains("Alex_Candidate_Resume.pdf"));
        verify(restTemplate).postForEntity(eq("http://audit-service/audit/events"), any(), eq(String.class));
    }

    private Submission baseSubmission(UUID submissionId, ProcessingStatus status) {
        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setCampaignId(UUID.randomUUID());
        submission.setCandidateLabel("Candidate Azure Falcon");
        submission.setReceivedAt(Instant.now());
        submission.setProcessingStatus(status);
        submission.setRawCandidateName("Alex Candidate");
        submission.setRawCandidateEmail("alex@example.com");
        submission.setPhone("555-0101");
        submission.setLinkedinUrl("https://linkedin.com/in/alex-candidate");
        submission.setCurrentCompany("Identifying Corp");
        submission.setCurrentJobRole("Senior Engineer");
        submission.setYearsOfExperience(7);
        submission.setExtractedUrlsJson("[{\"platform\":\"LinkedIn\",\"url\":\"https://linkedin.com/in/alex-candidate\"}]");
        submission.setFlagReason("INSTRUCTION_OVERRIDE");
        submission.setFlaggedSuspicious(true);
        return submission;
    }
}
