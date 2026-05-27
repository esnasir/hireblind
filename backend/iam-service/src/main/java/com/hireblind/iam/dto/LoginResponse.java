package com.hireblind.iam.dto;

/**
 * Login response with tokens and user info.
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) implements GoogleAuthResult {}
