package com.hireblind.iam.controller;

import com.hireblind.iam.dto.LoginRequest;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.dto.RefreshRequest;
import com.hireblind.iam.dto.RegistrationRequest;
import com.hireblind.iam.dto.RegistrationResponse;
import com.hireblind.iam.dto.UserResponse;
import com.hireblind.iam.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller — login, refresh, and current-user endpoints.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final com.hireblind.iam.service.GoogleAuthService googleAuthService;
    private final com.hireblind.iam.service.TeamService teamService;

    public AuthController(AuthService authService, com.hireblind.iam.service.GoogleAuthService googleAuthService, com.hireblind.iam.service.TeamService teamService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.teamService = teamService;
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<Void> acceptInvite(@Valid @RequestBody com.hireblind.iam.dto.AcceptInvitationRequest request) {
        log.info("POST /auth/accept-invite");
        teamService.acceptInvitation(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleAuth(@Valid @RequestBody com.hireblind.iam.dto.GoogleAuthRequest request) {
        log.info("POST /auth/google");
        LoginResponse response = googleAuthService.authenticateWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /auth/login for email: {}", request.email());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        log.info("POST /auth/refresh");
        LoginResponse response = authService.refresh(request.refreshToken());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        log.info("GET /auth/me for user: {}", userId);
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegistrationRequest request) {
        log.info("POST /auth/register for company: {}", request.companyName());
        RegistrationResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<Void> verify(@RequestParam("token") String token) {
        log.info("POST /auth/verify");
        authService.verifyEmail(token);
        return ResponseEntity.ok().build();
    }
}
