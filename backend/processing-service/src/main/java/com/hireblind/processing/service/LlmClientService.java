package com.hireblind.processing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.dto.CampaignResponse;
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
import reactor.util.retry.Retry;

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
            @Value("${llm.model.name:gemini-3.1-flash-lite-preview}") String modelName) {
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
                        "responseMimeType", "application/json",
                        "temperature", 0.3,
                        "maxOutputTokens", 1024
                ));

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
                .retryWhen(
                        Retry.backoff(3, Duration.ofSeconds(2))
                )
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
            if (!"STOP".equals(finishReason)) {
                log.error("Gemini generation failed. Finish reason: {}", finishReason);
                throw new MalformedLlmResponseException(
                        "Gemini generation stopped unexpectedly: " + finishReason);
            }

            String content = firstCandidate.path("content").path("parts").get(0).path("text").asText();
            if (content == null || content.isBlank()) {
                throw new MalformedLlmResponseException("Gemini response content is empty.");
            }
            
            LlmResponse parsed = objectMapper.readValue(content.trim(), LlmResponse.class);
            
            // Defensive default initializations to prevent downstream NPEs and DB failures
            if (parsed.getExtractedSkills() == null) parsed.setExtractedSkills(List.of());
            if (parsed.getExplainabilityTags() == null) parsed.setExplainabilityTags(List.of());
            if (parsed.getMatchedSkills() == null) parsed.setMatchedSkills(List.of());
            if (parsed.getMissingSkills() == null) parsed.setMissingSkills(List.of());
            
            if (parsed.getExperienceSummary() == null || parsed.getExperienceSummary().isBlank()) {
                parsed.setExperienceSummary("N/A");
            }
            if (parsed.getEducationSummary() == null || parsed.getEducationSummary().isBlank()) {
                parsed.setEducationSummary("N/A");
            }
            if (parsed.getPiiRedactionSummary() == null || parsed.getPiiRedactionSummary().isBlank()) {
                parsed.setPiiRedactionSummary("N/A");
            }
            if (parsed.getSummaryReason() == null || parsed.getSummaryReason().isBlank()) {
                parsed.setSummaryReason("N/A");
            }
            
            if (parsed.getScoreValue() == null || parsed.getConfidenceScore() == null) {
                throw new MalformedLlmResponseException("Gemini response missing required score fields.");
            }
            
            parsed.setScoreValue(Math.max(0, Math.min(100, parsed.getScoreValue())));
            parsed.setConfidenceScore(Math.max(0, Math.min(100, parsed.getConfidenceScore())));
            
            return parsed;
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Gemini JSON: {}", geminiResponse, e);
            throw new MalformedLlmResponseException("Failed to parse Gemini JSON", e);
        } catch (Exception e) {
            log.error("Unexpected error parsing Gemini response: {}", geminiResponse, e);
            throw new MalformedLlmResponseException("Unexpected error parsing Gemini response", e);
        }
    }

    public record CampaignMatchResult(String matched_campaign_id, String confidence) {}

    public String matchCampaign(String extractedText, List<CampaignResponse> activeCampaigns) {
        StringBuilder campaignsList = new StringBuilder();
        for (CampaignResponse c : activeCampaigns) {
            String desc = c.getDescription() != null ? c.getDescription() : "";
            if (desc.length() > 200) {
                desc = desc.substring(0, 200);
            }
            campaignsList.append(String.format("ID: %s | Title: %s | Description: %s\n", c.getId(), c.getTitle(), desc));
        }

        String fullPrompt = String.format(
            "You are an HR routing assistant. Given the following job application text and a list of open job campaigns, determine which campaign this application is most likely intended for.\n\n" +
            "Application text:\n" +
            "\"%s\"\n\n" +
            "Open campaigns:\n" +
            "%s\n\n" +
            "Respond with ONLY a JSON object in this format:\n" +
            "{\"matched_campaign_id\": \"<uuid>\", \"confidence\": \"HIGH|MEDIUM|LOW\"}\n\n" +
            "If no campaign is a reasonable match, return:\n" +
            "{\"matched_campaign_id\": null, \"confidence\": \"LOW\"}",
            extractedText != null ? extractedText : "N/A", campaignsList.toString()
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", fullPrompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.1,
                        "maxOutputTokens", 256
                ));

        String responseBody = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/models/{model}:generateContent")
                        .queryParam("key", apiKey)
                        .build(modelName))
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(HttpStatus.BAD_REQUEST::equals, response -> 
                        response.bodyToMono(String.class).flatMap(body -> {
                            log.error("Gemini 400 Bad Request during campaign matching: {}", body);
                            return Mono.error(new MalformedLlmResponseException("Invalid request or prompt blocked by Gemini: " + body));
                        }))
                .onStatus(HttpStatus.TOO_MANY_REQUESTS::equals, response -> 
                        response.bodyToMono(String.class).flatMap(body -> {
                            log.error("Gemini 429 Quota Exceeded during campaign matching: {}", body);
                            return Mono.error(new RuntimeException("Gemini quota exceeded: " + body));
                        }))
                .bodyToMono(String.class)
                .doOnError(e -> log.error("Error calling Gemini API for campaign matching: {}", e.getMessage()))
                .retryWhen(
                        Retry.backoff(3, Duration.ofSeconds(2))
                )
                .block();

        return responseBody;
    }

    public CampaignMatchResult parseCampaignMatchResponse(String geminiResponse) {
        try {
            var rootNode = objectMapper.readTree(geminiResponse);
            var candidates = rootNode.path("candidates");
            if (candidates.isEmpty()) {
                throw new MalformedLlmResponseException("Gemini response contains no candidates.");
            }
            var firstCandidate = candidates.get(0);
            String finishReason = firstCandidate.path("finishReason").asText();
            if (!"STOP".equals(finishReason)) {
                throw new MalformedLlmResponseException("Gemini generation stopped unexpectedly: " + finishReason);
            }
            String content = firstCandidate.path("content").path("parts").get(0).path("text").asText();
            if (content == null || content.isBlank()) {
                throw new MalformedLlmResponseException("Gemini response content is empty.");
            }
            
            return objectMapper.readValue(content.trim(), CampaignMatchResult.class);
        } catch (Exception e) {
            log.error("Failed to parse campaign match response: {}", geminiResponse, e);
            return new CampaignMatchResult(null, "LOW");
        }
    }
}
