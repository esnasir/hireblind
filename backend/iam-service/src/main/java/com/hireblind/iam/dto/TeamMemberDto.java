package com.hireblind.iam.dto;

import java.util.UUID;
import java.time.Instant;

public record TeamMemberDto(
        UUID id,
        String email,
        String fullName,
        String role,
        String status,
        Instant createdAt
) {}
