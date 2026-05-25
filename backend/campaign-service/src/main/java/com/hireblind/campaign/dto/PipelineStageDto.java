package com.hireblind.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PipelineStageDto(
        UUID id,
        @NotBlank(message = "Stage name is required")
        String name,
        @NotNull(message = "Order index is required")
        Integer orderIndex,
        @NotBlank(message = "Stage type is required")
        String stageType
) {}
