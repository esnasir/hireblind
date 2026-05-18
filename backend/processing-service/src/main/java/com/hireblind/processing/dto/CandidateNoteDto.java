package com.hireblind.processing.dto;

import java.time.Instant;
import java.util.UUID;

public record CandidateNoteDto(
        UUID id,
        UUID submissionId,
        String authorEmail,
        String content,
        Instant createdAt
) {}
