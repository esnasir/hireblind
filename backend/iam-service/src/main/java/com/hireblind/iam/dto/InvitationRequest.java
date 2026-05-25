package com.hireblind.iam.dto;

public record InvitationRequest(
    String email,
    String fullName,
    String role
) {}
