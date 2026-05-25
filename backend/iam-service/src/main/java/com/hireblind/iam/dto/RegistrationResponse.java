package com.hireblind.iam.dto;

import java.util.UUID;

public record RegistrationResponse(
    String message,
    UUID userId,
    UUID tenantId
) {}
