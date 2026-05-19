package com.hireblind.processing.controller;

import com.hireblind.processing.entity.IncomingMessage;
import com.hireblind.processing.repository.IncomingMessageRepository;
import com.hireblind.processing.service.EmailIngestionService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class IncomingMessageControllerTest {

    @Test
    void recruiterInboxResponseMasksSenderAndOmitsRawBody() {
        IncomingMessageRepository repository = mock(IncomingMessageRepository.class);
        EmailIngestionService emailIngestionService = mock(EmailIngestionService.class);
        IncomingMessageController controller = new IncomingMessageController(repository, emailIngestionService);

        IncomingMessage message = IncomingMessage.builder()
                .id(UUID.randomUUID())
                .sourceMessageId("<message-id>")
                .subject("Application for Backend Role")
                .senderEmail("candidate@example.com")
                .rawBody("Hi, I am Alex Candidate. My phone is 555-0101.")
                .receivedAt(OffsetDateTime.now())
                .status("PENDING")
                .createdAt(OffsetDateTime.now())
                .build();

        when(repository.findAll()).thenReturn(List.of(message));

        var auth = new UsernamePasswordAuthenticationToken(
                "recruiter-user",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_RECRUITER"))
        );

        var responses = controller.listIncomingMessages(auth).getBody();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("c***@example.com", responses.get(0).senderEmail());
        assertNull(responses.get(0).rawBodyVisibleToAdmin());
    }

    @Test
    void adminInboxResponseCanIncludeSensitiveRawBody() {
        IncomingMessageRepository repository = mock(IncomingMessageRepository.class);
        EmailIngestionService emailIngestionService = mock(EmailIngestionService.class);
        IncomingMessageController controller = new IncomingMessageController(repository, emailIngestionService);

        IncomingMessage message = IncomingMessage.builder()
                .id(UUID.randomUUID())
                .sourceMessageId("<message-id>")
                .subject("Application")
                .senderEmail("candidate@example.com")
                .rawBody("Sensitive email body")
                .receivedAt(OffsetDateTime.now())
                .status("PENDING")
                .createdAt(OffsetDateTime.now())
                .build();

        when(repository.findAll()).thenReturn(List.of(message));

        var auth = new UsernamePasswordAuthenticationToken(
                "admin-user",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        var responses = controller.listIncomingMessages(auth).getBody();

        assertNotNull(responses);
        assertEquals("candidate@example.com", responses.get(0).senderEmail());
        assertEquals("Sensitive email body", responses.get(0).rawBodyVisibleToAdmin());
    }
}
