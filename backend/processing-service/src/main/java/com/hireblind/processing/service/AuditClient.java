package com.hireblind.processing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class AuditClient {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final String auditServiceUrl;

    public AuditClient(JwtUtil jwtUtil,
                       ObjectMapper objectMapper,
                       @Value("${audit.service.url}") String auditServiceUrl) {
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        this.auditServiceUrl = auditServiceUrl;
    }

    public void logEvent(String actionType, String actorId, UUID campaignId, UUID submissionId, Map<String, Object> metadata) {
        try {
            String correlationId = org.slf4j.MDC.get("correlationId");
            String metadataJson = objectMapper.writeValueAsString(metadata);
            java.util.Map<String, Object> event = new java.util.HashMap<>(java.util.Map.of(
                    "actorType", "SYSTEM",
                    "actorId", actorId,
                    "actionType", actionType,
                    "entityType", "SUBMISSION",
                    "entityId", submissionId.toString(),
                    "metadataJson", metadataJson
            ));
            if (correlationId != null) {
                event.put("correlationId", correlationId);
            }

            String token = jwtUtil.generateToken("processing-service", "INTERNAL", "SERVICE");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + token);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            restTemplate.postForEntity(auditServiceUrl + "/audit/events", request, String.class);
            log.info("Audit event emitted by system: {} for submission: {}", actionType, submissionId);
        } catch (Exception e) {
            log.error("Failed to emit system audit event: {}", e.getMessage());
        }
    }
}
