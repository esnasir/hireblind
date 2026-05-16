package com.hireblind.audit.service;

import com.hireblind.audit.dto.AuditEventRequest;
import com.hireblind.audit.dto.AuditEventResponse;
import com.hireblind.audit.entity.AuditEvent;
import com.hireblind.audit.repository.AuditEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public AuditEventResponse create(AuditEventRequest request) {
        log.info("Recording audit event: {} on {}/{}", request.actionType(), request.entityType(), request.entityId());

        AuditEvent event = new AuditEvent();
        event.setActorType(request.actorType());
        event.setActorId(request.actorId());
        event.setActionType(request.actionType());
        event.setEntityType(request.entityType());
        event.setEntityId(request.entityId());
        event.setMetadataJson(request.metadataJson() != null ? request.metadataJson() : "{}");
        event.setCorrelationId(request.correlationId());

        event = repository.save(event);
        return toResponse(event);
    }

    @Transactional(readOnly = true)
    public List<AuditEventResponse> list(String entityType, String entityId, String actionType, String actorId) {
        List<AuditEvent> events;
        if (entityType != null && entityId != null) {
            events = repository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
        } else if (actionType != null) {
            events = repository.findByActionTypeOrderByTimestampDesc(actionType);
        } else if (actorId != null) {
            events = repository.findByActorIdOrderByTimestampDesc(actorId);
        } else {
            events = repository.findAllByOrderByTimestampDesc();
        }
        return events.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AuditEventResponse getById(UUID id) {
        AuditEvent event = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Audit event not found: " + id));
        return toResponse(event);
    }

    private AuditEventResponse toResponse(AuditEvent e) {
        Object metadata;
        try { metadata = objectMapper.readValue(e.getMetadataJson(), Map.class); }
        catch (JsonProcessingException ex) { metadata = Map.of(); }

        return new AuditEventResponse(
                e.getId(), e.getActorType(), e.getActorId(), e.getActionType(),
                e.getEntityType(), e.getEntityId(), e.getTimestamp(),
                metadata, e.getCorrelationId()
        );
    }
}
