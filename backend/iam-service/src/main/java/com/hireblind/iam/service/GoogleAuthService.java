package com.hireblind.iam.service;

import com.hireblind.iam.dto.GoogleAuthRequest;
import com.hireblind.iam.dto.GoogleUserInfo;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.dto.UserResponse;
import com.hireblind.iam.entity.Role;
import com.hireblind.iam.entity.Tenant;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.TenantRepository;
import com.hireblind.iam.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

/**
 * Handles Google OAuth2 access tokens from the frontend (useGoogleLogin gives opaque access tokens,
 * NOT ID tokens — so we must call Google's UserInfo API with Bearer auth to get the user's identity).
 *
 * Three outcomes:
 *   1. Existing user + no companyName  → issue HireBlind JWT → return LoginResponse (200)
 *   2. New user    + no companyName    → return requiresRegistration map (428)
 *   3. New user    + companyName given → create tenant + user as ACTIVE → issue JWT → return LoginResponse (200)
 */
@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final JwtService jwtService;

    public GoogleAuthService(
            UserRepository userRepository,
            TenantRepository tenantRepository,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
    }

    public Object authenticateWithGoogle(GoogleAuthRequest request) {
        GoogleUserInfo googleUser = fetchGoogleUserInfo(request.credential());

        if (googleUser == null || googleUser.email() == null) {
            log.warn("Unable to retrieve user info from Google. Token may be expired or invalid.");
            throw new IllegalArgumentException("Unable to retrieve user information from Google. The token may be expired or invalid.");
        }

        log.info("Google UserInfo retrieved for: {}", googleUser.email());

        Optional<User> existing = userRepository.findByEmail(googleUser.email());

        if (existing.isPresent()) {
            // ── Case 1: Existing user ────────────────────────────────────────────
            User user = existing.get();

            if (!user.isEnabled()) {
                throw new IllegalArgumentException("Account is disabled.");
            }

            // Refresh avatar if Google gives us a newer URL
            if (googleUser.picture() != null && !googleUser.picture().equals(user.getAvatarUrl())) {
                user.setAvatarUrl(googleUser.picture());
                userRepository.save(user);
            }

            log.info("Existing user authenticated via Google: {}", user.getEmail());
            return buildLoginResponse(user);
        }

        // ── Case 2: New user, no company name yet ────────────────────────────────
        if (request.companyName() == null || request.companyName().isBlank()) {
            log.info("New Google user — company name required: {}", googleUser.email());
            return Map.of(
                "requiresRegistration", true,
                "email", googleUser.email(),
                "name",  googleUser.name() != null ? googleUser.name() : ""
            );
        }

        // ── Case 3: New user + company name → register and log in ────────────────
        log.info("Registering new Google user: {} for company: {}", googleUser.email(), request.companyName());

        Tenant tenant = new Tenant();
        tenant.setCompanyName(request.companyName().trim());
        tenant.setSlug(generateSlug(request.companyName().trim()));
        tenant = tenantRepository.save(tenant);

        User user = new User();
        user.setEmail(googleUser.email());
        user.setPasswordHash("GOOGLE_OAUTH_NO_PASSWORD"); // not used — Google is the auth provider
        user.setFullName(googleUser.name() != null ? googleUser.name() : googleUser.email());
        user.setAvatarUrl(googleUser.picture());
        user.setRole(Role.OWNER);
        user.setTenant(tenant);
        user.setStatus("ACTIVE"); // Google already verified this email
        user.setEnabled(true);
        user = userRepository.save(user);

        log.info("New user registered via Google: {}", user.getEmail());
        return buildLoginResponse(user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private GoogleUserInfo fetchGoogleUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<GoogleUserInfo> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                entity,
                GoogleUserInfo.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch Google UserInfo: {}", e.getMessage());
            return null;
        }
    }

    private LoginResponse buildLoginResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name(),
            user.getTenant() != null ? user.getTenant().getId() : null
        );
        String refreshToken = jwtService.generateRefreshToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name(),
            user.getTenant() != null ? user.getTenant().getId() : null
        );
        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole().name(),
            user.getTenant() != null ? user.getTenant().getId() : null,
            user.getTenant() != null ? user.getTenant().getCompanyName() : null
        );
        return new LoginResponse(accessToken, refreshToken, userResponse);
    }

    private String generateSlug(String companyName) {
        String base = companyName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        String slug = base;
        int counter = 1;
        while (tenantRepository.findBySlug(slug).isPresent()) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
