package com.hireblind.processing.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import jakarta.mail.Part;
import com.hireblind.processing.dto.DocumentParseResult;

@Service
@Slf4j
public class DocumentParsingService {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    /**
     * Parses text from an attachment and stores it to disk.
     */
    public DocumentParseResult parseAndStore(Part attachment, UUID incomingMessageId) {
        try {
            String filename = attachment.getFileName();
            String ext = "";
            if (filename != null && filename.contains(".")) {
                ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
            }

            long size = attachment.getSize();
            if (size > MAX_FILE_SIZE_BYTES) {
                log.warn("Attachment {} size {} exceeds 5MB limit. Skipping.", filename, size);
                return new DocumentParseResult("[Document skipped: File size exceeds 5MB limit]", null, filename, size, attachment.getContentType());
            }

            byte[] bytes = attachment.getInputStream().readAllBytes();
            if (bytes.length > MAX_FILE_SIZE_BYTES) {
                log.warn("Attachment {} bytes size {} exceeds 5MB limit. Skipping.", filename, bytes.length);
                return new DocumentParseResult("[Document skipped: File size exceeds 5MB limit]", null, filename, bytes.length, attachment.getContentType());
            }

            boolean isAllowedExt = ".pdf".equals(ext) || ".docx".equals(ext);
            if (!isAllowedExt) {
                log.warn("Attachment {} has unsupported extension: {}. Skipping.", filename, ext);
                return new DocumentParseResult("[Document skipped: Unsupported file format]", null, filename, bytes.length, attachment.getContentType());
            }

            // Sniff magic-bytes content signatures to prevent spoofing
            boolean isPdfSignature = bytes.length >= 4 &&
                    bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46; // %PDF
            
            boolean isDocxSignature = bytes.length >= 4 &&
                    bytes[0] == 0x50 && bytes[1] == 0x4B && bytes[2] == 0x03 && bytes[3] == 0x04; // PK.. (ZIP format used by DOCX)

            if (".pdf".equals(ext) && !isPdfSignature) {
                log.warn("Attachment {} content does not match PDF signature. Spoofing suspected. Skipping.", filename);
                return new DocumentParseResult("[Document skipped: Invalid or spoofed file format]", null, filename, bytes.length, attachment.getContentType());
            }

            if (".docx".equals(ext) && !isDocxSignature) {
                log.warn("Attachment {} content does not match DOCX signature. Spoofing suspected. Skipping.", filename);
                return new DocumentParseResult("[Document skipped: Invalid or spoofed file format]", null, filename, bytes.length, attachment.getContentType());
            }
            
            Path storageDir = Paths.get("/app/resumes");
            if (!Files.exists(storageDir)) {
                Files.createDirectories(storageDir);
            }
            
            Path storagePath = storageDir.resolve(incomingMessageId + ext);
            Files.write(storagePath, bytes);
            
            String extractedText = ".pdf".equals(ext) 
                ? parsePdf(bytes) 
                : parseDocx(new ByteArrayInputStream(bytes));
            
            return new DocumentParseResult(extractedText, storagePath.toString(), filename, bytes.length, attachment.getContentType());
        } catch (Exception e) {
            log.error("Error parsing and storing document: {}", e.getMessage());
            return new DocumentParseResult("[Document parsing failed: " + e.getMessage() + "]", null, null, 0, null);
        }
    }

    /**
     * Parses text from a PDF or DOCX file represented as a byte array.
     * Skips parsing and logs a warning if the file size exceeds MAX_FILE_SIZE_BYTES.
     *
     * @param fileBytes byte array of the file
     * @param fileName the name of the file to determine extension
     * @return Extracted text or a fallback message if skipped/failed
     */
    public String parseDocument(byte[] fileBytes, String fileName) {
        if (fileBytes == null || fileBytes.length == 0) {
            log.warn("Empty file bytes provided for parsing: {}", fileName);
            return "";
        }

        if (fileBytes.length > MAX_FILE_SIZE_BYTES) {
            log.warn("File {} exceeds maximum size of 5MB. Size: {} bytes. Skipping parsing.", fileName, fileBytes.length);
            return "[Document skipped: File size exceeds 5MB limit]";
        }

        String extension = getFileExtension(fileName);

        try (InputStream is = new ByteArrayInputStream(fileBytes)) {
            if ("pdf".equalsIgnoreCase(extension)) {
                return parsePdf(fileBytes);
            } else if ("docx".equalsIgnoreCase(extension)) {
                return parseDocx(is);
            } else {
                log.warn("Unsupported file format for file: {}", fileName);
                return "[Document skipped: Unsupported file format]";
            }
        } catch (Exception e) {
            log.error("Error parsing document {}: {}", fileName, e.getMessage());
            return "[Document parsing failed: " + e.getMessage() + "]";
        }
    }

    private String parsePdf(byte[] fileBytes) throws Exception {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(fileBytes)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    private String parseDocx(InputStream is) throws Exception {
        try (XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1);
    }
}
