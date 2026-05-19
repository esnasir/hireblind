package com.hireblind.processing.controller;

import com.hireblind.processing.dto.IncomingMessageResponse;
import com.hireblind.processing.entity.IncomingMessage;
import com.hireblind.processing.repository.IncomingMessageRepository;
import com.hireblind.processing.service.EmailIngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/submissions/incoming-messages")
public class IncomingMessageController {

    private static final Logger log = LoggerFactory.getLogger(IncomingMessageController.class);
    private final IncomingMessageRepository incomingMessageRepository;
    private final EmailIngestionService emailIngestionService;

    public IncomingMessageController(IncomingMessageRepository incomingMessageRepository, EmailIngestionService emailIngestionService) {
        this.incomingMessageRepository = incomingMessageRepository;
        this.emailIngestionService = emailIngestionService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<List<IncomingMessageResponse>> listIncomingMessages(Authentication auth) {
        log.info("GET /submissions/incoming-messages by user: {}", auth.getName());

        // Check if user is Recruiter (requires PII masking)
        boolean isRecruiter = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_RECRUITER"));

        List<IncomingMessage> messages = incomingMessageRepository.findAll();

        List<IncomingMessageResponse> responses = messages.stream()
                .sorted((a, b) -> b.getReceivedAt().compareTo(a.getReceivedAt()))
                .map(msg -> {
                    String senderEmail = isRecruiter ? maskEmail(msg.getSenderEmail()) : msg.getSenderEmail();
                    String rawBody = isRecruiter ? null : msg.getRawBody();
                    return new IncomingMessageResponse(
                            msg.getId(),
                            msg.getSubject() != null ? msg.getSubject() : "No Subject",
                            senderEmail,
                            msg.getReceivedAt(),
                            msg.getStatus(),
                            msg.getResumeOriginalFilename(),
                            msg.getResumeFileSizeBytes(),
                            rawBody
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    public ResponseEntity<Map<String, String>> syncInbox(Authentication auth) {
        log.info("POST /submissions/incoming-messages/sync by user: {}", auth.getName());
        
        try {
            emailIngestionService.pollEmails();
            return ResponseEntity.ok(Map.of("message", "Inbox synchronization initiated successfully. New emails loaded."));
        } catch (Exception e) {
            log.error("Inbox synchronization failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Inbox sync failed: " + e.getMessage()));
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank() || "[SCRUBBED]".equals(email)) return email;
        if (!email.contains("@")) return "[REDACTED]";
        int atIndex = email.indexOf("@");
        String local = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (local.length() <= 1) {
            return local + "***" + domain;
        }
        return local.charAt(0) + "***" + domain;
    }
}
