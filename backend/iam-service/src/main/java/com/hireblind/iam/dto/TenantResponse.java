package com.hireblind.iam.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Tenant response DTO representing B2B SaaS tenants.
 */
public record TenantResponse(
        UUID id,
        String companyName,
        String slug,
        String companySize,
        String industry,
        String website,
        String logoUrl,
        Instant createdAt
) {}
