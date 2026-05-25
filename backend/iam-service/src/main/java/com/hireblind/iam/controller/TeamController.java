package com.hireblind.iam.controller;

import com.hireblind.iam.dto.InvitationRequest;
import com.hireblind.iam.service.TeamService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import java.util.List;
import com.hireblind.iam.dto.TeamMemberDto;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/iam")
public class TeamController {

    private static final Logger log = LoggerFactory.getLogger(TeamController.class);

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/invitations")
    @PreAuthorize("hasAnyAuthority('OWNER', 'ADMIN')")
    public ResponseEntity<Void> inviteMember(@Valid @RequestBody InvitationRequest request, Authentication authentication) {
        UUID inviterId = UUID.fromString((String) authentication.getPrincipal());
        log.info("POST /iam/invitations by user {}", inviterId);
        teamService.inviteMember(inviterId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/team")
    public ResponseEntity<List<TeamMemberDto>> getTeamMembers(Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        log.info("GET /iam/team by user {}", userId);
        return ResponseEntity.ok(teamService.getTeamMembers(userId));
    }
}
