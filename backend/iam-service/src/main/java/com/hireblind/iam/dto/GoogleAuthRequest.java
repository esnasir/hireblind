package com.hireblind.iam.dto;

public record GoogleAuthRequest(
    String credential,
    String companyName // Optional, required only for first-time registration
) {}
