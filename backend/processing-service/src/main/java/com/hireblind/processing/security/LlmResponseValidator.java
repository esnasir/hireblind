package com.hireblind.processing.security;

import com.hireblind.processing.dto.LlmResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class LlmResponseValidator {

    public record ValidationResult(
        LlmResponse sanitizedResponse,
        boolean suspicious,
        List<String> anomalies
    ) {}

    public ValidationResult validate(LlmResponse response, List<String> requiredSkills) {
        if (response == null) {
            return new ValidationResult(new LlmResponse(), true, List.of("NULL_LLM_RESPONSE"));
        }

        List<String> anomalies = new ArrayList<>();

        try {
            // Rule 1: Score must be within valid range
            Integer score = response.getMatchScore();
            if (score == null || score < 0 || score > 100) {
                anomalies.add("SCORE_OUT_OF_RANGE: " + score);
                int clamped = score == null ? 0 : Math.max(0, Math.min(100, score));
                response.setMatchScore(clamped);
            }

            Pattern validTagPattern = Pattern.compile("^[a-zA-Z0-9_\\-\\s]+$");

            // Rule 2 & 3: Validate tags list (Gemini's profile tags)
            if (response.getTags() != null) {
                List<String> tags = new ArrayList<>(response.getTags());
                if (tags.size() > 10) {
                    anomalies.add("EXCESSIVE_TAGS_COUNT: " + tags.size());
                    tags = tags.subList(0, 5);
                }
                List<String> filteredTags = new ArrayList<>();
                boolean formatSuspicious = false;
                for (String tag : tags) {
                    if (tag != null && validTagPattern.matcher(tag).matches()) {
                        filteredTags.add(tag);
                    } else if (tag != null) {
                        formatSuspicious = true;
                    }
                }
                if (formatSuspicious) {
                    anomalies.add("SUSPICIOUS_TAGS_FORMAT");
                }
                response.setTags(filteredTags);
            }

            // Rule 2 & 3: Validate explainabilityTags list
            if (response.getExplainabilityTags() != null) {
                List<String> expTags = new ArrayList<>(response.getExplainabilityTags());
                if (expTags.size() > 10) {
                    anomalies.add("EXCESSIVE_TAGS_COUNT: " + expTags.size());
                    expTags = expTags.subList(0, 5);
                }
                List<String> filteredExpTags = new ArrayList<>();
                boolean expFormatSuspicious = false;
                for (String tag : expTags) {
                    if (tag != null && validTagPattern.matcher(tag).matches()) {
                        filteredExpTags.add(tag);
                    } else if (tag != null) {
                        expFormatSuspicious = true;
                    }
                }
                if (expFormatSuspicious) {
                    anomalies.add("SUSPICIOUS_TAGS_FORMAT");
                }
                response.setExplainabilityTags(filteredExpTags);
            }

            // Rule 4: System Instruction Leak detection and redaction
            Pattern injectionPattern = Pattern.compile("(?i)ignore\\s+all\\s+previous|ignore\\s+instructions|override\\s+system|system\\s+prompt|security\\s+directive");
            boolean leakDetected = false;

            if (response.getCandidateName() != null && injectionPattern.matcher(response.getCandidateName()).find()) {
                leakDetected = true;
                response.setCandidateName(injectionPattern.matcher(response.getCandidateName()).replaceAll(""));
            }
            if (response.getEducationSummary() != null && injectionPattern.matcher(response.getEducationSummary()).find()) {
                leakDetected = true;
                response.setEducationSummary(injectionPattern.matcher(response.getEducationSummary()).replaceAll(""));
            }
            if (response.getExperienceSummary() != null && injectionPattern.matcher(response.getExperienceSummary()).find()) {
                leakDetected = true;
                response.setExperienceSummary(injectionPattern.matcher(response.getExperienceSummary()).replaceAll(""));
            }

            if (leakDetected) {
                anomalies.add("SYSTEM_INSTRUCTION_LEAK");
            }

            // Rule 5: Score discrepancy matching
            if (response.getMatchScore() != null && response.getMatchScore() >= 90
                    && (response.getMatchedSkills() == null || response.getMatchedSkills().isEmpty())
                    && requiredSkills != null && !requiredSkills.isEmpty()) {
                anomalies.add("SCORE_SKILLS_DISCREPANCY");
            }

            // Rule 6: Truncate excessively long assessment to prevent payload injection leaks
            if (response.getAiAssessment() != null && response.getAiAssessment().length() > 1000) {
                anomalies.add("ASSESSMENT_TOO_LONG: " + response.getAiAssessment().length() + " chars");
                response.setAiAssessment(response.getAiAssessment().substring(0, 1000));
            }

            boolean suspicious = !anomalies.isEmpty();
            return new ValidationResult(response, suspicious, anomalies);

        } catch (Exception e) {
            // Never throw exception
            anomalies.add("VALIDATION_ERROR: " + e.getMessage());
            return new ValidationResult(response, true, anomalies);
        }
    }
}
