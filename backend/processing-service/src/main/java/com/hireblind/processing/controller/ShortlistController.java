package com.hireblind.processing.controller;

import com.hireblind.processing.service.ShortlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
public class ShortlistController {

    private final ShortlistService shortlistService;

    public ShortlistController(ShortlistService shortlistService) {
        this.shortlistService = shortlistService;
    }

    @PostMapping("/campaigns/{id}/shortlist/generate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<Void> generateShortlist(@PathVariable UUID id, Authentication auth) {
        String actorEmail = auth.getName();
        shortlistService.processCampaignShortlist(id, actorEmail);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/submissions/{id}/shortlist/approve-buffer")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<Void> approveBufferCandidate(@PathVariable UUID id, Authentication auth) {
        String actorEmail = auth.getName();
        shortlistService.approveBufferCandidate(id, actorEmail);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/submissions/{id}/shortlist/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<Void> rejectCandidate(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        shortlistService.rejectCandidate(id, reason);
        return ResponseEntity.ok().build();
    }
}
