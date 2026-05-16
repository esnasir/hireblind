package com.hireblind.iam.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // Use the same shared secret as application.yml
        String secret = "hireblind-phase1-shared-hmac-secret-key-that-is-at-least-256-bits-long";
        jwtService = new JwtService(secret, 3600000, 86400000);
    }

    @Test
    @DisplayName("Generate and validate access token")
    void generateAndValidateAccessToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "test@hireblind.com", "ADMIN");

        assertNotNull(token);
        assertEquals(userId, jwtService.getUserIdFromToken(token));
        assertEquals("test@hireblind.com", jwtService.getEmailFromToken(token));
        assertEquals("ADMIN", jwtService.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Generate and validate refresh token")
    void generateAndValidateRefreshToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateRefreshToken(userId, "test@hireblind.com", "RECRUITER");

        assertNotNull(token);
        assertEquals(userId, jwtService.getUserIdFromToken(token));
        assertEquals("RECRUITER", jwtService.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Invalid token throws exception")
    void invalidTokenThrows() {
        assertThrows(Exception.class, () ->
                jwtService.validateToken("invalid.token.here")
        );
    }
}
