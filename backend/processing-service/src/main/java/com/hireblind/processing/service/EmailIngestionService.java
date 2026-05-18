package com.hireblind.processing.service;

import com.hireblind.processing.entity.IncomingMessage;
import com.hireblind.processing.repository.IncomingMessageRepository;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.search.FlagTerm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Properties;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailIngestionService {

    private final IncomingMessageRepository incomingMessageRepository;
    private final DocumentParsingService documentParsingService;

    @Value("${imap.host}")
    private String imapHost;

    @Value("${imap.port}")
    private String imapPort;

    @Value("${imap.username}")
    private String imapUsername;

    @Value("${imap.password}")
    private String imapPassword;

    @Scheduled(fixedDelayString = "${imap.polling.fixed-delay:300000}")
    public void pollEmails() {
        log.info("Starting IMAP polling for {}", imapUsername);

        Properties properties = new Properties();
        properties.put("mail.store.protocol", "imaps");
        properties.put("mail.imaps.host", imapHost);
        properties.put("mail.imaps.port", imapPort);
        properties.put("mail.imaps.ssl.enable", "true");

        Session session = Session.getInstance(properties);

        try (Store store = session.getStore("imaps")) {
            store.connect(imapHost, imapUsername, imapPassword);

            try (Folder inbox = store.getFolder("INBOX")) {
                inbox.open(Folder.READ_WRITE);

                Message[] messages = inbox.search(new FlagTerm(new Flags(Flags.Flag.SEEN), false));
                log.info("Found {} unread messages", messages.length);

                for (Message message : messages) {
                    try {
                        processMessage(message);
                        message.setFlag(Flags.Flag.SEEN, true);
                    } catch (Exception e) {
                        log.error("Failed to process message {}: {}", message.getMessageNumber(), e.getMessage(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error connecting to IMAP store: {}", e.getMessage());
        }
    }

    private void processMessage(Message message) throws MessagingException, IOException {
        MimeMessage mimeMessage = (MimeMessage) message;
        String messageId = mimeMessage.getMessageID();

        if (messageId != null && incomingMessageRepository.findBySourceMessageId(messageId).isPresent()) {
            log.info("Skipping already processed message: {}", messageId);
            return;
        }

        String from = "";
        Address[] fromAddresses = message.getFrom();
        if (fromAddresses != null && fromAddresses.length > 0) {
            from = ((InternetAddress) fromAddresses[0]).getAddress();
        }

        StringBuilder bodyBuilder = new StringBuilder();
        StringBuilder extractedTextBuilder = new StringBuilder();
        
        UUID incomingMessageId = UUID.randomUUID();
        com.hireblind.processing.dto.DocumentParseResult[] parseResult = new com.hireblind.processing.dto.DocumentParseResult[1];

        processMultipart(message, bodyBuilder, extractedTextBuilder, incomingMessageId, parseResult);

        String subject = "No Subject";
        try {
            String s = message.getSubject();
            if (s != null && !s.isBlank()) {
                subject = s;
            }
        } catch (Exception e) {
            log.warn("Failed to get subject of message: {}", e.getMessage());
        }

        IncomingMessage incomingMessage = IncomingMessage.builder()
                .id(incomingMessageId)
                .sourceMessageId(messageId != null ? messageId : UUID.randomUUID().toString())
                .subject(subject)
                .receivedAt(OffsetDateTime.ofInstant(message.getReceivedDate() != null ? message.getReceivedDate().toInstant() : java.time.Instant.now(), ZoneId.systemDefault()))
                .senderEmail(from)
                .rawBody(bodyBuilder.toString())
                .extractedText(extractedTextBuilder.toString())
                .status("PENDING")
                .createdAt(OffsetDateTime.now())
                .build();
                
        if (parseResult[0] != null) {
            incomingMessage.setResumeFilePath(parseResult[0].filePath());
            incomingMessage.setResumeOriginalFilename(parseResult[0].originalFilename());
            incomingMessage.setResumeFileSizeBytes(parseResult[0].fileSizeBytes());
            incomingMessage.setResumeContentType(parseResult[0].contentType());
        }

        incomingMessageRepository.save(incomingMessage);
        log.info("Saved incoming message from {} with ID {}", from, incomingMessage.getId());
    }

    private void processMultipart(Part part, StringBuilder bodyBuilder, StringBuilder extractedTextBuilder, UUID incomingMessageId, com.hireblind.processing.dto.DocumentParseResult[] parseResult) throws MessagingException, IOException {
        if (part.isMimeType("text/plain")) {
            bodyBuilder.append((String) part.getContent());
        } else if (part.isMimeType("text/html")) {
            // Optional: convert HTML to text or just ignore if plain text exists
            // For now, we'll append it if body is empty
            if (bodyBuilder.length() == 0) {
                bodyBuilder.append((String) part.getContent());
            }
        } else if (part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            for (int i = 0; i < multipart.getCount(); i++) {
                processMultipart(multipart.getBodyPart(i), bodyBuilder, extractedTextBuilder, incomingMessageId, parseResult);
            }
        } else if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition()) || Part.INLINE.equalsIgnoreCase(part.getDisposition())) {
            String fileName = part.getFileName();
            if (fileName != null && (fileName.toLowerCase().endsWith(".pdf") || fileName.toLowerCase().endsWith(".docx"))) {
                com.hireblind.processing.dto.DocumentParseResult res = documentParsingService.parseAndStore(part, incomingMessageId);
                if (parseResult[0] == null) {
                    parseResult[0] = res; // Store the first attachment's metadata
                }
                extractedTextBuilder.append("\n--- Attachment: ").append(fileName).append(" ---\n");
                extractedTextBuilder.append(res.extractedText()).append("\n");
            }
        }
    }
}
