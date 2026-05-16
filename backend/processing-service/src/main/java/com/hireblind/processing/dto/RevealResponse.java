package com.hireblind.processing.dto;

/**
 * Response for the reveal identity action.
 * Only returned to authorized ADMIN users after explicit reveal.
 */
public record RevealResponse(
        String candidateName,
        String candidateEmail
) {}
