package com.hireblind.iam.dto;

import java.util.UUID;

/**
 * User profile response (no sensitive data).
 */
public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String role
) {}
