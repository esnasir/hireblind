package com.hireblind.processing.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DocumentParsingServiceTest {

    private DocumentParsingService documentParsingService;

    @BeforeEach
    void setUp() {
        documentParsingService = new DocumentParsingService();
    }

    @Test
    void testEmptyFile() {
        String result = documentParsingService.parseDocument(new byte[0], "resume.pdf");
        assertEquals("", result);
        
        result = documentParsingService.parseDocument(null, "resume.pdf");
        assertEquals("", result);
    }

    @Test
    void testOversizedFile() {
        // Create a 6MB dummy array
        byte[] oversized = new byte[6 * 1024 * 1024];
        String result = documentParsingService.parseDocument(oversized, "huge.pdf");
        assertTrue(result.contains("exceeds 5MB limit"));
    }

    @Test
    void testUnsupportedFormat() {
        byte[] dummy = "dummy data".getBytes();
        String result = documentParsingService.parseDocument(dummy, "image.png");
        assertTrue(result.contains("Unsupported file format"));
    }

    @Test
    void testParsePdf() throws Exception {
        // Create a basic PDF in memory
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(100, 700);
                contentStream.showText("Hello PDF");
                contentStream.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            
            String result = documentParsingService.parseDocument(baos.toByteArray(), "test.pdf");
            assertTrue(result.contains("Hello PDF"));
        }
    }

    @Test
    void testParseDocx() throws Exception {
        // Create a basic DOCX in memory
        try (XWPFDocument document = new XWPFDocument()) {
            XWPFParagraph paragraph = document.createParagraph();
            XWPFRun run = paragraph.createRun();
            run.setText("Hello DOCX");
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.write(baos);
            
            String result = documentParsingService.parseDocument(baos.toByteArray(), "test.docx");
            assertTrue(result.contains("Hello DOCX"));
        }
    }
}
