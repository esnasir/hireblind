package com.hireblind.processing.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "incoming_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomingMessage {

    @Id
    private UUID id;

    private String sourceMessageId;
    private String subject;
    private OffsetDateTime receivedAt;
    
    // We will clear this post-processing
    private String senderEmail;
    
    // We will clear this post-processing
    private String rawBody;
    
    private String extractedText;
    private String status; // PENDING, PROCESSED, FAILED
    private OffsetDateTime createdAt;

    private String resumeFilePath;
    private String resumeOriginalFilename;
    private Long resumeFileSizeBytes;
    private String resumeContentType;

    @Column(name = "raw_extracted_text_hash")
    private String rawExtractedTextHash;

    @Column(name = "sanitized_text_hash")
    private String sanitizedTextHash;

}
