package com.hireblind.iam.service;

import com.hireblind.iam.dto.LoginRequest;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.dto.RegistrationRequest;
import com.hireblind.iam.dto.RegistrationResponse;
import com.hireblind.iam.dto.UserResponse;
import com.hireblind.iam.entity.Role;
import com.hireblind.iam.entity.Tenant;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.TenantRepository;
import com.hireblind.iam.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handles authentication operations: login, refresh, and user profile retrieval.
 */
@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, TenantRepository tenantRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
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

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenant() != null ? user.getTenant().getId() : null);
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenant() != null ? user.getTenant().getId() : null);

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

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenant() != null ? user.getTenant().getId() : null);
        String newRefreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenant() != null ? user.getTenant().getId() : null);

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
        return new UserResponse(
                user.getId(), 
                user.getEmail(), 
                user.getFullName(), 
                user.getRole().name(),
                user.getTenant() != null ? user.getTenant().getId() : null,
                user.getTenant() != null ? user.getTenant().getCompanyName() : null
        );
    }

    /**
     * Register a new company and its owner.
     */
    public RegistrationResponse register(RegistrationRequest request) {
        log.info("Registration attempt for company: {}", request.companyName());

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create Tenant
        Tenant tenant = new Tenant();
        tenant.setCompanyName(request.companyName());
        tenant.setSlug(generateSlug(request.companyName()));
        tenant = tenantRepository.save(tenant);

        // Create User
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole(Role.OWNER);
        user.setTenant(tenant);
        user.setStatus("UNVERIFIED");
        user = userRepository.save(user);

        // TODO: Email verification logic will be triggered here

        log.info("Registered new company: {} with owner: {}", tenant.getCompanyName(), user.getEmail());
        return new RegistrationResponse("Registration successful. Please verify your email.", user.getId(), tenant.getId());
    }

    /**
     * Verify email via token.
     */
    public void verifyEmail(String token) {
        Claims claims = jwtService.validateToken(token);
        if (!"verification".equals(claims.get("type"))) {
            throw new IllegalArgumentException("Invalid token type");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus("ACTIVE");
        userRepository.save(user);
        log.info("User {} verified their email", user.getEmail());
    }

    private String generateSlug(String companyName) {
        String baseSlug = companyName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        String slug = baseSlug;
        int counter = 1;
        while (tenantRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    public User updateProfile(String userId, String fullName) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFullName(fullName);
        return userRepository.save(user);
    }

    public Tenant updateTenant(String tenantId, com.hireblind.iam.dto.UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(UUID.fromString(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        if (request.companyName() != null && !request.companyName().isBlank()) {
            tenant.setCompanyName(request.companyName().trim());
        }
        return tenantRepository.save(tenant);
    }
}
