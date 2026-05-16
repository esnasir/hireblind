package com.hireblind.processing.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Service
@Slf4j
public class DocumentParsingService {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
