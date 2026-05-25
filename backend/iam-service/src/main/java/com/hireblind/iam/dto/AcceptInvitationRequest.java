package com.hireblind.iam.dto;

public record AcceptInvitationRequest(
    String token,
    String password
) {}
