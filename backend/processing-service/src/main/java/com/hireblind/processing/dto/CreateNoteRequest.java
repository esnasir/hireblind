package com.hireblind.processing.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateNoteRequest(
        @NotBlank(message = "Content cannot be blank")
        String content
) {}
