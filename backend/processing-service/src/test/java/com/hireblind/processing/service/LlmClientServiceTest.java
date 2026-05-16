package com.hireblind.processing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.exception.MalformedLlmResponseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LlmClientServiceTest {

    private LlmClientService llmClientService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        
        // Mock WebClient Builder
        WebClient.Builder builderMock = mock(WebClient.Builder.class);
        when(builderMock.baseUrl("https://api.openai.com/v1")).thenReturn(builderMock);
        when(builderMock.defaultHeader(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString())).thenReturn(builderMock);
        when(builderMock.build()).thenReturn(mock(WebClient.class));

        llmClientService = new LlmClientService(builderMock, objectMapper, "dummy-key", "gpt-4o-mini");
    }

    @Test
    void testBuildPrompt() {
        String result = llmClientService.buildPrompt("Email here", "Resume here", "Desc", "Skills", "Rubric");
        assertTrue(result.contains("Email here"));
        assertTrue(result.contains("Resume here"));
        assertTrue(result.contains("Desc"));
    }

    @Test
    void testParseAndValidateResponse_Success() {
        String mockOpenAiResponse = "{" +
                "\"choices\": [{" +
                "  \"message\": {" +
                "    \"content\": \"{\\\"scoreValue\\\":85, \\\"confidenceScore\\\":90, \\\"experienceSummary\\\":\\\"Great\\\"}\"" +
                "  }" +
                "}]" +
                "}";

        LlmResponse response = llmClientService.parseAndValidateResponse(mockOpenAiResponse);
        assertNotNull(response);
        assertEquals(85, response.getScoreValue());
        assertEquals(90, response.getConfidenceScore());
        assertEquals("Great", response.getExperienceSummary());
    }

    @Test
    void testParseAndValidateResponse_StripsMarkdown() {
        String mockOpenAiResponse = "{" +
                "\"choices\": [{" +
                "  \"message\": {" +
                "    \"content\": \"```json\\n{\\\"scoreValue\\\":85, \\\"confidenceScore\\\":90}\\n```\"" +
                "  }" +
                "}]" +
                "}";

        LlmResponse response = llmClientService.parseAndValidateResponse(mockOpenAiResponse);
        assertNotNull(response);
        assertEquals(85, response.getScoreValue());
    }

    @Test
    void testParseAndValidateResponse_MissingScore() {
        String mockOpenAiResponse = "{" +
                "\"choices\": [{" +
                "  \"message\": {" +
                "    \"content\": \"{\\\"experienceSummary\\\":\\\"Great\\\"}\"" +
                "  }" +
                "}]" +
                "}";

        assertThrows(MalformedLlmResponseException.class, () -> {
            llmClientService.parseAndValidateResponse(mockOpenAiResponse);
        });
    }

    @Test
    void testParseAndValidateResponse_InvalidJson() {
        String mockOpenAiResponse = "{" +
                "\"choices\": [{" +
                "  \"message\": {" +
                "    \"content\": \"Not JSON at all\"" +
                "  }" +
                "}]" +
                "}";

        assertThrows(MalformedLlmResponseException.class, () -> {
            llmClientService.parseAndValidateResponse(mockOpenAiResponse);
        });
    }
}
