package com.hireblind.iam.controller;

import com.hireblind.iam.dto.UpdateProfileRequest;
import com.hireblind.iam.dto.UserResponse;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request
    ) {
        String userId = (String) authentication.getPrincipal();
        log.info("PUT /users/me for user: {}", userId);
        User updated = authService.updateProfile(userId, request.fullName());
        
        UserResponse response = new UserResponse(
                updated.getId(),
                updated.getEmail(),
                updated.getFullName(),
                updated.getRole().name(),
                updated.getTenant() != null ? updated.getTenant().getId() : null,
                updated.getTenant() != null ? updated.getTenant().getCompanyName() : null
        );
        return ResponseEntity.ok(response);
    }
}
