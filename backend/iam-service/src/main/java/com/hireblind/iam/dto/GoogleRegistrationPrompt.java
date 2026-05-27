package com.hireblind.iam.dto;

/**
 * Prompt DTO returned when a new Google user needs to register their company (HTTP 428).
 */
public record GoogleRegistrationPrompt(
        boolean requiresRegistration,
        String email,
        String name
) implements GoogleAuthResult {}
