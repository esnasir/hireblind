package com.hireblind.iam.dto;

public record RegistrationRequest(
    String companyName,
    String fullName,
    String email,
    String password
) {}
