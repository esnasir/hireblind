package com.hireblind.processing.controller;

import com.hireblind.processing.dto.*;
import com.hireblind.processing.service.SubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/submissions")
public class SubmissionController {

    private static final Logger log = LoggerFactory.getLogger(SubmissionController.class);
    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping
    public ResponseEntity<List<SubmissionResponse>> list(
            @RequestParam(required = false) UUID campaignId) {
        log.info("GET /submissions (campaignId: {})", campaignId);
        return ResponseEntity.ok(submissionService.listByCampaign(campaignId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getById(@PathVariable UUID id) {
        log.info("GET /submissions/{}", id);
        return ResponseEntity.ok(submissionService.getById(id));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<AnonymizedProfileResponse> getProfile(@PathVariable UUID id) {
        log.info("GET /submissions/{}/profile", id);
        return ResponseEntity.ok(submissionService.getProfile(id));
    }

    @GetMapping("/{id}/score")
    public ResponseEntity<ScoringResultResponse> getScore(@PathVariable UUID id) {
        log.info("GET /submissions/{}/score", id);
        return ResponseEntity.ok(submissionService.getScore(id));
    }

    @PostMapping("/{id}/reveal")
    public ResponseEntity<RevealResponse> reveal(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest request) {
        String userId = (String) auth.getPrincipal();
        String token = request.getHeader("Authorization").substring(7);
        log.info("POST /submissions/{}/reveal by user: {}", id, userId);
        return ResponseEntity.ok(submissionService.reveal(id, userId, token));
    }

    @GetMapping("/unassigned")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SubmissionResponse>> getUnassigned() {
        log.info("GET /submissions/unassigned by ADMIN");
        return ResponseEntity.ok(submissionService.getUnassignedSubmissions());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        log.info("GET /submissions/stats");
        return ResponseEntity.ok(submissionService.getStats());
    }
}
