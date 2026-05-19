package com.hireblind.campaign.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtUtil.validateToken(authHeader.substring(7));
            String userId = claims.getSubject();
            String role = claims.get("role", String.class);
            String type = claims.get("type", String.class);

            if ("SERVICE".equalsIgnoreCase(type)) {
                String uri = request.getRequestURI();
                String method = request.getMethod();
                boolean isAllowed = "GET".equalsIgnoreCase(method) && 
                        (uri.matches("/campaigns/[a-fA-F0-9\\-]+") || uri.matches("/api/campaigns/[a-fA-F0-9\\-]+"));
                if (!isAllowed) {
                    log.warn("SERVICE token rejected on user-facing endpoint: {} {}", method, uri);
                    filterChain.doFilter(request, response);
                    return;
                }
            }

            String authority = role != null && role.startsWith("ROLE_") ? role : "ROLE_" + role;

            var authToken = new UsernamePasswordAuthenticationToken(
                    userId, null,
                    List.of(new SimpleGrantedAuthority(authority))
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
