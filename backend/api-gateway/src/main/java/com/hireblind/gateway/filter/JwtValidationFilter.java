package com.hireblind.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

/**
 * Validates JWT access tokens at the Gateway perimeter.
 */
@Component
public class JwtValidationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtValidationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    private final SecretKey signingKey;

    public JwtValidationFilter(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // 1. Bypass validation for public endpoints
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // 2. Validate Authorization header
        String authHeader = request.getHeaders().getFirst(AUTHORIZATION_HEADER);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Missing or invalid Authorization header for path: {}", path);
            return handleUnauthorized(exchange, "Missing or invalid authorization token");
        }

        String token = authHeader.substring(7);

        // 3. Decode & Verify JWT
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Verify it is an access token, not a refresh or invitation token
            String type = claims.get("type", String.class);
            if (type == null || (!type.equals("access") && !type.equals("SERVICE"))) {
                log.warn("Invalid token type for path: {}, type: {}", path, type);
                return handleUnauthorized(exchange, "Invalid token type");
            }

            log.debug("JWT successfully verified at gateway for subject: {}", claims.getSubject());
            return chain.filter(exchange);

        } catch (JwtException e) {
            log.warn("JWT validation failed at gateway for path: {}. Error: {}", path, e.getMessage());
            return handleUnauthorized(exchange, "Invalid or expired token");
        } catch (Exception e) {
            log.error("Unexpected error validating JWT at gateway", e);
            return handleUnauthorized(exchange, "An unexpected validation error occurred");
        }
    }

    private boolean isPublicPath(String path) {
        // Auth endpoints (excluding auth/me which requires token)
        if (path.startsWith("/api/auth/") && !path.equals("/api/auth/me")) {
            return true;
        }
        // Public campaign views
        if (path.startsWith("/api/campaigns/public/")) {
            return true;
        }
        // Public submissions apply
        if (path.equals("/api/submissions/apply")) {
            return true;
        }
        // Actuator endpoints
        if (path.startsWith("/actuator")) {
            return true;
        }
        return false;
    }

    private Mono<Void> handleUnauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_ID_HEADER);
        if (correlationId == null) {
            correlationId = "";
        }

        String body = String.format(
                "{\"timestamp\":\"%s\",\"status\":401,\"error\":\"Unauthorized\",\"message\":\"%s\",\"path\":\"%s\",\"correlationId\":\"%s\"}",
                Instant.now().toString(),
                message,
                exchange.getRequest().getURI().getPath(),
                correlationId
        );

        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        // Run immediately after GatewayLoggingFilter (which is Ordered.HIGHEST_PRECEDENCE)
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
