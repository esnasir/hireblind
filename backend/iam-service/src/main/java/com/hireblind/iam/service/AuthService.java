package com.hireblind.iam.service;

import com.hireblind.iam.dto.LoginRequest;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.dto.UserResponse;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Handles authentication operations: login, refresh, and user profile retrieval.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Authenticate user with email/password and return JWT tokens.
     */
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found for email: {}", request.email());
                    return new IllegalArgumentException("Invalid email or password");
                });

        if (!user.isEnabled()) {
            log.warn("Login failed: account disabled for email: {}", request.email());
            throw new IllegalArgumentException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Login failed: incorrect password for email: {}", request.email());
            throw new IllegalArgumentException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());

        log.info("Login successful for user: {} (role: {})", user.getEmail(), user.getRole());

        return new LoginResponse(
                accessToken,
                refreshToken,
                toUserResponse(user)
        );
    }

    /**
     * Refresh the access token using a valid refresh token.
     */
    public LoginResponse refresh(String refreshToken) {
        log.debug("Token refresh attempt");

        Claims claims = jwtService.validateToken(refreshToken);
        String tokenType = claims.get("type", String.class);
        if (!"refresh".equals(tokenType)) {
            throw new IllegalArgumentException("Invalid token type for refresh");
        }

        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());

        log.info("Token refreshed for user: {}", user.getEmail());

        return new LoginResponse(
                newAccessToken,
                newRefreshToken,
                toUserResponse(user)
        );
    }

    /**
     * Get user profile from a validated access token.
     */
    public UserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
    }
}
