package com.hireblind.processing.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record IncomingMessageResponse(
    UUID id,
    String subject,
    String senderEmail,
    OffsetDateTime receivedAt,
    String status,
    String resumeOriginalFilename,
    Long resumeFileSizeBytes,
    String rawBody
) {}
