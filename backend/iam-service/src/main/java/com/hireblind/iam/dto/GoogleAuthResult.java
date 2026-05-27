package com.hireblind.iam.dto;

/**
 * Sealed interface representing the outcome of Google Authentication.
 */
public sealed interface GoogleAuthResult permits LoginResponse, GoogleRegistrationPrompt {}
