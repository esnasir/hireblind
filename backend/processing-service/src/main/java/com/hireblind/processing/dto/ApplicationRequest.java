package com.hireblind.processing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record ApplicationRequest(
    @NotNull(message = "Campaign ID is required")
    UUID campaignId,
    
    @NotBlank(message = "Candidate email is required")
    String candidateEmail,
    
    @NotBlank(message = "Candidate name is required")
    String candidateName,
    
    String candidatePhone,
    
    @NotBlank(message = "Resume URL is required")
    String resumeUrl,
    
    List<AnswerDto> answers
) {
    public record AnswerDto(
        @NotNull(message = "Question ID is required")
        UUID questionId,
        String answerText
    ) {}
}
