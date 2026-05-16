package com.hireblind.iam.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Refresh token request payload.
 */
public record RefreshRequest(
        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {}
