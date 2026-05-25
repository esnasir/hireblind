package com.hireblind.iam.dto;

/**
 * Sent by the frontend for Google OAuth login and Google OAuth registration.
 *
 * credential   — always present; the opaque OAuth2 access token from useGoogleLogin
 * companyName  — only provided when a new Google user is completing registration
 */
public record GoogleAuthRequest(String credential, String companyName) {}
