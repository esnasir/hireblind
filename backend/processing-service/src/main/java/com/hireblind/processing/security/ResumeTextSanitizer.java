package com.hireblind.processing.security;

import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class ResumeTextSanitizer {

    public record SanitizationResult(
        String sanitizedText,
        String originalHash,
        String sanitizedHash,
        boolean contentRemoved,
        List<String> triggeredRules
    ) {}

    public SanitizationResult sanitize(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new SanitizationResult("", "", "", false, List.of());
        }

        try {
            String originalHash = sha256(rawText);
            List<String> triggeredRules = new ArrayList<>();
            String currentText = rawText;

            // 1. Instruction keywords (case-insensitive)
            Pattern instructionPattern = Pattern.compile("(?i)system\\s+directive|system\\s+prompt|ignore\\s+all\\s+previous|ignore\\s+previous|override\\s+instruction|security\\s+directive");
            if (instructionPattern.matcher(currentText).find()) {
                currentText = instructionPattern.matcher(currentText).replaceAll("");
                triggeredRules.add("INSTRUCTION_OVERRIDE");
            }

            // 2. Hidden Unicode / Zero-width characters & directional marks
            Pattern hiddenPattern = Pattern.compile("[\\u200B\\u200C\\u200D\\uFEFF\\u200E\\u200F\\u202A-\\u202E]");
            if (hiddenPattern.matcher(currentText).find()) {
                currentText = hiddenPattern.matcher(currentText).replaceAll("");
                triggeredRules.add("HIDDEN_UNICODE");
            }

            // 3. System XML tags (case-insensitive)
            Pattern xmlPattern = Pattern.compile("(?i)</?system>|</?resume>|</?campaign>");
            if (xmlPattern.matcher(currentText).find()) {
                currentText = xmlPattern.matcher(currentText).replaceAll("");
                triggeredRules.add("XML_TAG_INJECTION");
            }

            boolean contentRemoved = !triggeredRules.isEmpty();
            String sanitizedHash = sha256(currentText);

            return new SanitizationResult(
                currentText,
                originalHash,
                sanitizedHash,
                contentRemoved,
                triggeredRules
            );

        } catch (Exception e) {
            // Never throw exception, gracefully return original text with warning
            String fallbackHash = sha256(rawText);
            return new SanitizationResult(
                rawText,
                fallbackHash,
                fallbackHash,
                false,
                List.of()
            );
        }
    }

    private String sha256(String text) {
        if (text == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
