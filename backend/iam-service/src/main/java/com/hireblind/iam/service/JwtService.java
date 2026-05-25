package com.hireblind.iam.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Handles JWT token creation and validation using shared HMAC secret.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Generate an access token for the given user.
     */
    public String generateAccessToken(UUID userId, String email, String role, UUID tenantId) {
        log.debug("Generating access token for user: {}", email);
        return buildToken(userId, email, role, tenantId, accessTokenExpirationMs, "access");
    }

    /**
     * Generate a refresh token for the given user.
     */
    public String generateRefreshToken(UUID userId, String email, String role, UUID tenantId) {
        log.debug("Generating refresh token for user: {}", email);
        return buildToken(userId, email, role, tenantId, refreshTokenExpirationMs, "refresh");
    }

    /**
     * Generate an invitation token for a new user.
     */
    public String generateInvitationToken(UUID userId, String email, String role, UUID tenantId) {
        log.debug("Generating invitation token for user: {}", email);
        // Set expiry to e.g., 7 days (604800000 ms)
        return buildToken(userId, email, role, tenantId, 604800000L, "invitation");
    }

    /**
     * Validate and parse a token, returning its claims.
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Extract user ID from token claims.
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = validateToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Extract email from token claims.
     */
    public String getEmailFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("email", String.class);
    }

    /**
     * Extract role from token claims.
     */
    public String getRoleFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Extract tenantId from token claims.
     */
    public UUID getTenantIdFromToken(String token) {
        Claims claims = validateToken(token);
        String tenantIdStr = claims.get("tenant_id", String.class);
        return tenantIdStr != null ? UUID.fromString(tenantIdStr) : null;
    }

    private String buildToken(UUID userId, String email, String role, UUID tenantId, long expirationMs, String tokenType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(
                        "email", email,
                        "role", role,
                        "tenant_id", tenantId != null ? tenantId.toString() : "",
                        "type", tokenType
                ))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }
}
