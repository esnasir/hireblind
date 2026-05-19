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
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;

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
            @RequestParam(required = false) UUID campaignId,
            Authentication auth) {
        log.info("GET /submissions (campaignId: {})", campaignId);
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResponseEntity.ok(submissionService.listByCampaign(campaignId, isAdmin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getById(
            @PathVariable UUID id,
            Authentication auth) {
        log.info("GET /submissions/{}", id);
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResponseEntity.ok(submissionService.getById(id, isAdmin));
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
    public ResponseEntity<List<SubmissionResponse>> getUnassigned(Authentication auth) {
        log.info("GET /submissions/unassigned by ADMIN");
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResponseEntity.ok(submissionService.getUnassignedSubmissions(isAdmin));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        log.info("GET /submissions/stats");
        return ResponseEntity.ok(submissionService.getStats());
    }

    @GetMapping("/campaign/{campaignId}/stats")
    public ResponseEntity<Map<String, Object>> campaignStats(@PathVariable UUID campaignId) {
        log.info("GET /submissions/campaign/{}/stats", campaignId);
        return ResponseEntity.ok(submissionService.getCampaignStats(campaignId));
    }

    @GetMapping("/{id}/resume")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadResume(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest request) {
        String userId = (String) auth.getPrincipal();
        String token = request.getHeader("Authorization").substring(7);
        return submissionService.downloadResume(id, userId, token)
                .map(download -> ResponseEntity.ok()
                        .headers(download.headers())
                        .contentType(download.mediaType())
                        .body(download.resource()))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<List<CandidateNoteDto>> getNotes(@PathVariable UUID id) {
        log.info("GET /submissions/{}/notes", id);
        return ResponseEntity.ok(submissionService.getNotes(id));
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<CandidateNoteDto> addNote(
            @PathVariable UUID id,
            @RequestBody @jakarta.validation.Valid CreateNoteRequest request,
            Authentication auth) {
        // We'll use the user's ID/email from the principal
        String author = auth.getName() != null ? auth.getName() : auth.getPrincipal().toString();
        log.info("POST /submissions/{}/notes by {}", id, author);
        return ResponseEntity.ok(submissionService.addNote(id, author, request.content()));
    }
}
