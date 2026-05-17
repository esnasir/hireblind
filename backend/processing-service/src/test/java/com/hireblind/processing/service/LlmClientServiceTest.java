package com.hireblind.processing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireblind.processing.dto.LlmResponse;
import com.hireblind.processing.exception.MalformedLlmResponseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LlmClientServiceTest {

    private LlmClientService llmClientService;
    private ObjectMapper objectMapper;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        objectMapper = new ObjectMapper();
        
        // Mock WebClient Builder
        WebClient.Builder builderMock = mock(WebClient.Builder.class);
        when(builderMock.clientConnector(any())).thenReturn(builderMock);
        when(builderMock.baseUrl(anyString())).thenReturn(builderMock);
        when(builderMock.defaultHeader(anyString(), anyString())).thenReturn(builderMock);
        when(builderMock.build()).thenReturn(mock(WebClient.class));

        llmClientService = new LlmClientService(builderMock, objectMapper, "dummy-key", "gemini-2.0-flash");
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
        String mockGeminiResponse = "{" +
                "\"candidates\": [{" +
                "  \"content\": {" +
                "    \"parts\": [" +
                "      { \"text\": \"{\\\"scoreValue\\\":85, \\\"confidenceScore\\\":90, \\\"experienceSummary\\\":\\\"Great\\\"}\" }" +
                "    ]" +
                "  }," +
                "  \"finishReason\": \"STOP\"" +
                "}]" +
                "}";

        LlmResponse response = llmClientService.parseAndValidateResponse(mockGeminiResponse);
        assertNotNull(response);
        assertEquals(85, response.getScoreValue());
        assertEquals(90, response.getConfidenceScore());
        assertEquals("Great", response.getExperienceSummary());
    }

    @Test
    void testParseAndValidateResponse_SafetyBlock() {
        String mockGeminiResponse = "{" +
                "\"candidates\": [{" +
                "  \"finishReason\": \"SAFETY\"" +
                "}]" +
                "}";

        assertThrows(MalformedLlmResponseException.class, () -> {
            llmClientService.parseAndValidateResponse(mockGeminiResponse);
        });
    }

    @Test
    void testParseAndValidateResponse_MissingScore() {
        String mockGeminiResponse = "{" +
                "\"candidates\": [{" +
                "  \"content\": {" +
                "    \"parts\": [" +
                "      { \"text\": \"{\\\"experienceSummary\\\":\\\"Great\\\"}\" }" +
                "    ]" +
                "  }," +
                "  \"finishReason\": \"STOP\"" +
                "}]" +
                "}";

        assertThrows(MalformedLlmResponseException.class, () -> {
            llmClientService.parseAndValidateResponse(mockGeminiResponse);
        });
    }

    @Test
    void testParseAndValidateResponse_InvalidJson() {
        String mockGeminiResponse = "{" +
                "\"candidates\": [{" +
                "  \"content\": {" +
                "    \"parts\": [" +
                "      { \"text\": \"Not JSON at all\" }" +
                "    ]" +
                "  }," +
                "  \"finishReason\": \"STOP\"" +
                "}]" +
                "}";

        assertThrows(MalformedLlmResponseException.class, () -> {
            llmClientService.parseAndValidateResponse(mockGeminiResponse);
        });
    }
}
