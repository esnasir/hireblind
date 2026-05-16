package com.hireblind.iam.controller;

import com.hireblind.iam.dto.LoginRequest;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.dto.RefreshRequest;
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

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
