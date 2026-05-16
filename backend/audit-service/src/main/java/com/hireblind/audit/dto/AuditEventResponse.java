package com.hireblind.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditEventResponse(
        UUID id,
        String actorType,
        String actorId,
        String actionType,
        String entityType,
        String entityId,
        Instant timestamp,
        Object metadata,
        String correlationId
) {}
