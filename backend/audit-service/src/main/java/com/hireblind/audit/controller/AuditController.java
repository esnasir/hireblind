package com.hireblind.audit.controller;

import com.hireblind.audit.dto.AuditEventRequest;
import com.hireblind.audit.dto.AuditEventResponse;
import com.hireblind.audit.service.AuditService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/audit")
public class AuditController {

    private static final Logger log = LoggerFactory.getLogger(AuditController.class);
    private final AuditService auditService;

    public AuditController(AuditService auditService) { this.auditService = auditService; }

    /**
     * Internal endpoint for services to write audit events.
     */
    @PostMapping("/events")
    public ResponseEntity<AuditEventResponse> create(@Valid @RequestBody AuditEventRequest request) {
        log.info("POST /audit/events: {} on {}/{}", request.actionType(), request.entityType(), request.entityId());
        AuditEventResponse response = auditService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * ADMIN-only: list audit events with optional filters.
     */
    @GetMapping("/events")
    public ResponseEntity<List<AuditEventResponse>> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actorId) {
        log.info("GET /audit/events");
        return ResponseEntity.ok(auditService.list(entityType, entityId, actionType, actorId));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<AuditEventResponse> getById(@PathVariable UUID id) {
        log.info("GET /audit/events/{}", id);
        return ResponseEntity.ok(auditService.getById(id));
    }
}
