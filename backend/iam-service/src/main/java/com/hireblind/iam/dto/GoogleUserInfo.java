package com.hireblind.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleUserInfo(
    String email,
    String name,
    @JsonProperty("given_name") String givenName,
    @JsonProperty("family_name") String familyName,
    String picture,
    @JsonProperty("email_verified") Boolean emailVerified
) {}
