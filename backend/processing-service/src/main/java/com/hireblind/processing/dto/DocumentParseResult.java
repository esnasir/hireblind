package com.hireblind.processing.dto;

public record DocumentParseResult(
    String extractedText,
    String filePath,
    String originalFilename,
    long fileSizeBytes,
    String contentType
) {}
