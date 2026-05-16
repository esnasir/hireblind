package com.hireblind.processing.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "processing_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingAttempt {

    @Id
    private UUID id;

    private UUID submissionId;
    private Integer attemptNumber;
    private String status; // RUNNING, FAILED, SUCCESS
    private String errorMessage;
    private OffsetDateTime createdAt;

}
