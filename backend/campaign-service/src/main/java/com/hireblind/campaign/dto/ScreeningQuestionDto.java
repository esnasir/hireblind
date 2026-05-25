package com.hireblind.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import java.util.Map;

public record ScreeningQuestionDto(
        UUID id,
        @NotBlank(message = "Question text is required")
        String questionText,
        @NotBlank(message = "Question type is required")
        String questionType,
        Boolean isRequired,
        Map<String, Object> options,
        @NotNull(message = "Order index is required")
        Integer orderIndex
) {}
