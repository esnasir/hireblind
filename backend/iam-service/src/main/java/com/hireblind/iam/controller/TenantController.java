package com.hireblind.iam.controller;

import com.hireblind.iam.dto.UpdateTenantRequest;
import com.hireblind.iam.entity.Tenant;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.service.AuthService;
import com.hireblind.iam.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/tenants")
public class TenantController {

    private static final Logger log = LoggerFactory.getLogger(TenantController.class);
    private final AuthService authService;
    private final UserRepository userRepository;

    public TenantController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateTenant(
            Authentication authentication,
            @RequestBody UpdateTenantRequest request
    ) {
        String userId = (String) authentication.getPrincipal();
        log.info("PUT /tenants/me for user: {}", userId);
        
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        if (user.getTenant() == null) {
            return ResponseEntity.badRequest().body("User does not belong to a tenant");
        }

        Tenant updated = authService.updateTenant(user.getTenant().getId().toString(), request);
        
        return ResponseEntity.ok().body(java.util.Map.of("companyName", updated.getCompanyName()));
    }
}
