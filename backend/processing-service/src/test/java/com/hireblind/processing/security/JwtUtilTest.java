package com.hireblind.processing.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtUtilTest {

    @Test
    void serviceTokenStoresUnprefixedRoleClaim() {
        JwtUtil jwtUtil = new JwtUtil("hireblind-phase1-shared-hmac-secret-key-that-is-at-least-256-bits-long");

        String token = jwtUtil.generateToken("processing-service", "ADMIN");

        assertEquals("ADMIN", jwtUtil.validateToken(token).get("role", String.class));
    }

    @Test
    void serviceTokenNormalizesAlreadyPrefixedRoleClaim() {
        JwtUtil jwtUtil = new JwtUtil("hireblind-phase1-shared-hmac-secret-key-that-is-at-least-256-bits-long");

        String token = jwtUtil.generateToken("processing-service", "ROLE_ADMIN");

        assertEquals("ADMIN", jwtUtil.validateToken(token).get("role", String.class));
    }
}
