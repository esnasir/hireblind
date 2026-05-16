package com.hireblind.audit.dto;

import jakarta.validation.constraints.NotBlank;

public record AuditEventRequest(
        @NotBlank String actorType,
        @NotBlank String actorId,
        @NotBlank String actionType,
        @NotBlank String entityType,
        @NotBlank String entityId,
        String metadataJson,
        String correlationId
) {}
