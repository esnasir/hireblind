package com.hireblind.iam.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.hireblind.iam.dto.GoogleAuthRequest;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.dto.UserResponse;
import com.hireblind.iam.entity.Role;
import com.hireblind.iam.entity.Tenant;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.TenantRepository;
import com.hireblind.iam.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    private final GoogleIdTokenVerifier verifier;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final JwtService jwtService;

    public GoogleAuthService(
            @Value("${google.client-id:dummy-client-id}") String clientId,
            UserRepository userRepository,
            TenantRepository tenantRepository,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public LoginResponse authenticateWithGoogle(GoogleAuthRequest request) {
        try {
            String credential = request.credential();
            String email;
            String name;
            String pictureUrl;

            // Check if it's a JWT (ID Token)
            if (credential.contains(".") && credential.split("\\.").length == 3) {
                log.info("Verifying Google ID Token (JWT)");
                GoogleIdToken idToken = verifier.verify(credential);
                if (idToken == null) {
                    log.warn("Invalid ID token.");
                    throw new IllegalArgumentException("Invalid Google ID token.");
                }
                GoogleIdToken.Payload payload = idToken.getPayload();
                email = payload.getEmail();
                name = (String) payload.get("name");
                pictureUrl = (String) payload.get("picture");
            } else {
                log.info("Verifying Google Access Token via UserInfo API");
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                String url = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + credential;
                java.util.Map<String, Object> payload = restTemplate.getForObject(url, java.util.Map.class);
                if (payload == null || !payload.containsKey("email")) {
                    log.warn("Invalid Google access token.");
                    throw new IllegalArgumentException("Invalid Google access token.");
                }
                email = (String) payload.get("email");
                name = (String) payload.get("name");
                pictureUrl = (String) payload.get("picture");
            }

            return processUser(email, name, pictureUrl, request.companyName());

        } catch (Exception e) {
            log.error("Google authentication failed", e);
            throw new IllegalArgumentException("Google authentication failed: " + e.getMessage());
        }
    }

    private LoginResponse processUser(String email, String name, String pictureUrl, String companyName) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            if (companyName == null || companyName.trim().isEmpty()) {
                throw new IllegalArgumentException("COMPANY_REQUIRED");
            }
            
            // Register flow
            Tenant tenant = new Tenant();
            tenant.setCompanyName(companyName);
            tenant.setSlug(generateSlug(companyName));
            tenant = tenantRepository.save(tenant);

            user = new User();
            user.setEmail(email);
            user.setPasswordHash("GOOGLE_AUTH"); // Dummy password
            user.setFullName(name);
            user.setAvatarUrl(pictureUrl);
            user.setRole(Role.OWNER);
            user.setTenant(tenant);
            user.setStatus("ACTIVE"); // Google verified inherently
            user = userRepository.save(user);
            log.info("Registered new user via Google: {}", email);
        } else {
            // Update avatar if needed
            if (pictureUrl != null && !pictureUrl.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(pictureUrl);
                userRepository.save(user);
            }
        }

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenant() != null ? user.getTenant().getId() : null);
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenant() != null ? user.getTenant().getId() : null);

        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getTenant() != null ? user.getTenant().getId() : null
        );

        return new LoginResponse(accessToken, refreshToken, userResponse);
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
}
