package com.hireblind.processing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.exception.MalformedLlmResponseException;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class LlmClientService {

    private static final String SYSTEM_PROMPT = 
        "You are an expert HR screening assistant. Your job is to analyze a candidate's email and resume " +
        "against a specific job description and rubric. " +
        "You MUST return the result EXACTLY as a raw JSON object. " +
        "The JSON must exactly match this schema: \n" +
        "{ \"extractedSkills\": [\"string\"], \"experienceSummary\": \"string\", \"educationSummary\": \"string\", " +
        "\"piiRedactionSummary\": \"string\", \"scoreValue\": integer (0-100), \"explainabilityTags\": [\"string\"], " +
        "\"matchedSkills\": [\"string\"], \"missingSkills\": [\"string\"], \"summaryReason\": \"string\", " +
        "\"confidenceScore\": integer (0-100) }";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String modelName;
    private final String apiKey;

    public LlmClientService(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${llm.api.key:}") String apiKey,
            @Value("${llm.model.name:gemini-2.0-flash}") String modelName) {
        this.objectMapper = objectMapper;
        this.modelName = modelName;
        this.apiKey = apiKey;

        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
                .responseTimeout(Duration.ofSeconds(30))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(30, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS)));

        this.webClient = webClientBuilder
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .defaultHeader(org.springframework.http.HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String getModelName() {
        return this.modelName;
    }

    public LlmResponse processCandidate(String emailBody, String resumeText, String jobDescription, String requiredSkills, String scoringRubric) {
        String fullPrompt = SYSTEM_PROMPT + "\n\n" + buildPrompt(emailBody, resumeText, jobDescription, requiredSkills, scoringRubric);
        
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", fullPrompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json"
                )
        );

        String responseBody = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/models/{model}:generateContent")
                        .queryParam("key", apiKey)
                        .build(modelName))
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(HttpStatus.BAD_REQUEST::equals, response -> 
                        response.bodyToMono(String.class).flatMap(body -> {
                            log.error("Gemini 400 Bad Request: {}", body);
                            return Mono.error(new MalformedLlmResponseException("Invalid request or prompt blocked by Gemini: " + body));
                        }))
                .onStatus(HttpStatus.TOO_MANY_REQUESTS::equals, response -> 
                        response.bodyToMono(String.class).flatMap(body -> {
                            log.error("Gemini 429 Quota Exceeded: {}", body);
                            return Mono.error(new RuntimeException("Gemini quota exceeded: " + body));
                        }))
                .onStatus(HttpStatus.SERVICE_UNAVAILABLE::equals, response -> 
                        response.bodyToMono(String.class).flatMap(body -> {
                            log.error("Gemini 503 Model Overloaded: {}", body);
                            return Mono.error(new RuntimeException("Gemini model overloaded: " + body));
                        }))
                .bodyToMono(String.class)
                .doOnError(e -> log.error("Error calling Gemini API: {}", e.getMessage()))
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

    public LlmResponse parseAndValidateResponse(String geminiResponse) {
        try {
            // Gemini response format: { "candidates": [ { "content": { "parts": [ { "text": "{...}" } ] }, "finishReason": "..." } ] }
            var rootNode = objectMapper.readTree(geminiResponse);
            var candidates = rootNode.path("candidates");
            if (candidates.isEmpty()) {
                throw new MalformedLlmResponseException("Gemini response contains no candidates.");
            }
            
            var firstCandidate = candidates.get(0);
            String finishReason = firstCandidate.path("finishReason").asText();
            if ("SAFETY".equals(finishReason)) {
                log.error("Gemini response blocked by safety filter: {}", geminiResponse);
                throw new MalformedLlmResponseException("Gemini response blocked by safety filter.");
            }

            String content = firstCandidate.path("content").path("parts").get(0).path("text").asText();
            if (content == null || content.isBlank()) {
                throw new MalformedLlmResponseException("Gemini response content is empty.");
            }
            
            LlmResponse parsed = objectMapper.readValue(content.trim(), LlmResponse.class);
            
            // Basic validation
            if (parsed.getScoreValue() == null || parsed.getConfidenceScore() == null) {
                throw new MalformedLlmResponseException("Gemini response missing required score fields.");
            }
            
            return parsed;
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Gemini JSON: {}", geminiResponse, e);
            throw new MalformedLlmResponseException("Failed to parse Gemini JSON", e);
        } catch (Exception e) {
            log.error("Unexpected error parsing Gemini response: {}", geminiResponse, e);
            throw new MalformedLlmResponseException("Unexpected error parsing Gemini response", e);
        }
    }
}
