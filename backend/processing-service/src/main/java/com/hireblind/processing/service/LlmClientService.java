package com.hireblind.processing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.exception.MalformedLlmResponseException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class LlmClientService {

    private static final String SYSTEM_PROMPT = 
        "You are an expert HR screening assistant. Your job is to analyze a candidate's email and resume " +
        "against a specific job description and rubric. " +
        "You MUST return the result EXACTLY as a raw JSON object with NO markdown formatting, NO backticks, " +
        "and NO conversational text. The JSON must exactly match this schema: \n" +
        "{ \"extractedSkills\": [\"string\"], \"experienceSummary\": \"string\", \"educationSummary\": \"string\", " +
        "\"piiRedactionSummary\": \"string\", \"scoreValue\": integer (0-100), \"explainabilityTags\": [\"string\"], " +
        "\"matchedSkills\": [\"string\"], \"missingSkills\": [\"string\"], \"summaryReason\": \"string\", " +
        "\"confidenceScore\": integer (0-100) }";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String modelName;

    public LlmClientService(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${llm.api.key:}") String apiKey,
            @Value("${llm.model.name:gpt-4o-mini}") String modelName) {
        this.objectMapper = objectMapper;
        this.modelName = modelName;
        this.webClient = webClientBuilder
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String getModelName() {
        return this.modelName;
    }

    public LlmResponse processCandidate(String emailBody, String resumeText, String jobDescription, String requiredSkills, String scoringRubric) {
        String prompt = buildPrompt(emailBody, resumeText, jobDescription, requiredSkills, scoringRubric);
        
        Map<String, Object> requestBody = Map.of(
                "model", this.modelName,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.1 // Low temperature for consistent JSON output
        );

        String responseBody = webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseAndValidateResponse(responseBody);
    }

    public String buildPrompt(String emailBody, String resumeText, String jobDescription, String requiredSkills, String scoringRubric) {
        return "Please evaluate the following candidate.\n\n" +
               "=== CAMPAIGN PARAMETERS ===\n" +
               "Job Description:\n" + jobDescription + "\n\n" +
               "Required Skills:\n" + requiredSkills + "\n\n" +
               "Scoring Rubric:\n" + scoringRubric + "\n\n" +
               "=== CANDIDATE DATA ===\n" +
               "Email Body:\n" + (emailBody != null ? emailBody : "N/A") + "\n\n" +
               "Resume Text:\n" + (resumeText != null ? resumeText : "N/A");
    }

    public LlmResponse parseAndValidateResponse(String openaiResponse) {
        try {
            // OpenAI response format: { "choices": [ { "message": { "content": "{...}" } } ] }
            var rootNode = objectMapper.readTree(openaiResponse);
            var choices = rootNode.path("choices");
            if (choices.isEmpty()) {
                throw new MalformedLlmResponseException("LLM response contains no choices.");
            }
            
            String content = choices.get(0).path("message").path("content").asText();
            if (content == null || content.isBlank()) {
                throw new MalformedLlmResponseException("LLM response content is empty.");
            }
            
            // Clean markdown blocks if the LLM ignored instructions
            content = content.trim();
            if (content.startsWith("```json")) {
                content = content.substring(7);
            } else if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }

            LlmResponse parsed = objectMapper.readValue(content.trim(), LlmResponse.class);
            
            // Basic validation
            if (parsed.getScoreValue() == null || parsed.getConfidenceScore() == null) {
                throw new MalformedLlmResponseException("LLM response missing required score fields.");
            }
            
            return parsed;
        } catch (JsonProcessingException e) {
            log.error("Failed to parse LLM JSON: {}", openaiResponse, e);
            throw new MalformedLlmResponseException("Failed to parse LLM JSON", e);
        }
    }
}
