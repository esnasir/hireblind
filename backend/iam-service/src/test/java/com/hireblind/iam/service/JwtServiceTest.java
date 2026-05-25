package com.hireblind.iam.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import io.jsonwebtoken.Claims;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        // Use the same shared secret as application.yml
        String secret = "hireblind-phase1-shared-hmac-secret-key-that-is-at-least-256-bits-long";
        jwtService = new JwtService(secret, 3600000, 86400000);
        testUserId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Generate access token returns valid JWT")
    void generateAccessToken() {
        String token = jwtService.generateAccessToken(testUserId, "test@hireblind.com", "ADMIN", UUID.randomUUID());
        assertNotNull(token);

        Claims claims = jwtService.validateToken(token);
        assertEquals(testUserId.toString(), claims.getSubject());
        assertEquals("test@hireblind.com", claims.get("email"));
        assertEquals("ADMIN", claims.get("role"));
        assertEquals("access", claims.get("type"));
    }

    @Test
    @DisplayName("Generate refresh token returns valid long-lived JWT")
    void generateRefreshToken() {
        String token = jwtService.generateRefreshToken(testUserId, "test@hireblind.com", "ADMIN", UUID.randomUUID());
        assertNotNull(token);

        Claims claims = jwtService.validateToken(token);
        assertEquals("refresh", claims.get("type"));
    }

    @Test
    @DisplayName("Invalid token throws exception")
    void invalidTokenThrows() {
        assertThrows(Exception.class, () ->
                jwtService.validateToken("invalid.token.here")
        );
    }
}
