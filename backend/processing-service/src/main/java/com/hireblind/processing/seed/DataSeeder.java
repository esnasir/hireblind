package com.hireblind.processing.seed;

import com.hireblind.processing.entity.*;
import com.hireblind.processing.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Seeds realistic fake candidate data for Phase 1 demo.
 * Uses hardcoded campaign UUIDs that match the Campaign Service migration.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    // Hardcoded campaign UUIDs — must match Campaign Service V1 migration
    private static final UUID CAMPAIGN_BACKEND = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    private static final UUID CAMPAIGN_DESIGNER = UUID.fromString("b2c3d4e5-f6a7-8901-bcde-f12345678901");
    private static final UUID CAMPAIGN_ANALYST = UUID.fromString("c3d4e5f6-a7b8-9012-cdef-123456789012");

    private final SubmissionRepository submissionRepo;
    private final AnonymizedProfileRepository profileRepo;
    private final ScoringResultRepository scoringRepo;
    private final ObjectMapper mapper;

    public DataSeeder(SubmissionRepository submissionRepo,
                      AnonymizedProfileRepository profileRepo,
                      ScoringResultRepository scoringRepo,
                      ObjectMapper mapper) {
        this.submissionRepo = submissionRepo;
        this.profileRepo = profileRepo;
        this.scoringRepo = scoringRepo;
        this.mapper = mapper;
    }

    @Override
    public void run(String... args) {
        if (submissionRepo.count() > 0) {
            log.info("Seed data already exists — skipping");
            return;
        }

        log.info("Seeding candidate data for 3 campaigns...");

        seedBackendCandidates();
        seedDesignerCandidates();
        seedAnalystCandidates();

        log.info("Seed complete: {} submissions, {} profiles, {} scores",
                submissionRepo.count(), profileRepo.count(), scoringRepo.count());
    }

    private void seedBackendCandidates() {
        seedCandidate(CAMPAIGN_BACKEND, "Candidate-BE-001", "Alex Johnson", "alex.j@email.com",
                List.of("Java", "Spring Boot", "PostgreSQL", "Docker", "Kubernetes", "REST APIs"),
                List.of("Terraform"),
                "7 years of backend development experience with distributed systems. Led migration of monolithic architecture to microservices at a fintech company. Strong focus on performance optimization and observability.",
                "Bachelor's in Computer Science from [REDACTED UNIVERSITY]",
                92.5, 1, 7,
                "Strong match across all core requirements. Extensive microservices experience with proven leadership in distributed systems.");

        seedCandidate(CAMPAIGN_BACKEND, "Candidate-BE-002", "Priya Sharma", "priya.s@email.com",
                List.of("Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"),
                List.of("Kubernetes", "REST APIs"),
                "5 years in backend engineering. Built payment processing services handling 10K TPS. Experience with event-driven architectures.",
                "Master's in Software Engineering from [REDACTED UNIVERSITY]",
                85.0, 2, 5,
                "Solid Java/Spring foundation with strong payment systems background. Kubernetes experience could be developed on the job.");

        seedCandidate(CAMPAIGN_BACKEND, "Candidate-BE-003", "Marcus Chen", "marcus.c@email.com",
                List.of("Java", "Spring Boot", "Docker", "REST APIs", "Microservices"),
                List.of("PostgreSQL", "Kubernetes"),
                "6 years of experience. Primarily worked with MySQL but familiar with PostgreSQL. Strong API design skills. Open source contributor.",
                "Bachelor's in Mathematics from [REDACTED UNIVERSITY]",
                78.5, 3, 6,
                "Good technical foundation but limited PostgreSQL experience. API design skills are excellent.");

        seedCandidate(CAMPAIGN_BACKEND, "Candidate-BE-004", "Sarah Williams", "sarah.w@email.com",
                List.of("Java", "PostgreSQL", "Docker"),
                List.of("Spring Boot", "Kubernetes", "REST APIs", "Microservices"),
                "3 years of Java development. Primarily monolithic applications. Eager to learn microservices patterns.",
                "Bachelor's in Information Technology from [REDACTED UNIVERSITY]",
                62.0, 4, 3,
                "Below minimum experience threshold. Limited microservices exposure but shows growth potential.");
    }

    private void seedDesignerCandidates() {
        seedCandidate(CAMPAIGN_DESIGNER, "Candidate-PD-001", "Jordan Lee", "jordan.l@email.com",
                List.of("Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Accessibility"),
                List.of(),
                "5 years of product design in B2B SaaS. Led the design system for a 50-person product team. Strong in user research and accessibility advocacy.",
                "Bachelor's in Interaction Design from [REDACTED UNIVERSITY]",
                96.0, 1, 5,
                "Exceptional match. Full skill coverage with specific B2B SaaS and design systems experience.");

        seedCandidate(CAMPAIGN_DESIGNER, "Candidate-PD-002", "Taylor Kim", "taylor.k@email.com",
                List.of("Figma", "Wireframing", "Prototyping", "Design Systems"),
                List.of("User Research", "Accessibility"),
                "4 years of UI/UX design. Strong visual design skills. Experience with component libraries and Storybook.",
                "Bootcamp certificate from [REDACTED INSTITUTION]",
                81.0, 2, 4,
                "Strong visual skills and prototyping. Would benefit from more user research methodology experience.");

        seedCandidate(CAMPAIGN_DESIGNER, "Candidate-PD-003", "Riley Park", "riley.p@email.com",
                List.of("Figma", "User Research", "Wireframing"),
                List.of("Prototyping", "Design Systems", "Accessibility"),
                "3 years of design experience, primarily in consumer mobile apps. Transitioning to B2B.",
                "Bachelor's in Graphic Design from [REDACTED UNIVERSITY]",
                70.5, 3, 3,
                "Meets minimum experience. Consumer-to-B2B transition may require ramp-up time.");

        seedCandidate(CAMPAIGN_DESIGNER, "Candidate-PD-004", "Morgan Davis", "morgan.d@email.com",
                List.of("Figma", "Prototyping", "Accessibility"),
                List.of("User Research", "Wireframing", "Design Systems"),
                "2 years of frontend development with design responsibilities. Self-taught UX practitioner.",
                "Bachelor's in Computer Science from [REDACTED UNIVERSITY]",
                58.0, 4, 2,
                "Hybrid developer-designer profile. Needs more structured design training.");
    }

    private void seedAnalystCandidates() {
        seedCandidate(CAMPAIGN_ANALYST, "Candidate-DA-001", "Casey Nguyen", "casey.n@email.com",
                List.of("SQL", "Python", "Tableau", "Data Modeling", "Statistical Analysis"),
                List.of("Excel"),
                "4 years of data analysis in HR tech. Built predictive attrition models. Strong storytelling with data.",
                "Master's in Statistics from [REDACTED UNIVERSITY]",
                94.0, 1, 4,
                "Outstanding match. HR tech domain expertise is highly relevant. Strong analytical and communication skills.");

        seedCandidate(CAMPAIGN_ANALYST, "Candidate-DA-002", "Avery Thompson", "avery.t@email.com",
                List.of("SQL", "Python", "Tableau", "Excel"),
                List.of("Data Modeling", "Statistical Analysis"),
                "3 years of business analytics. Experience creating executive dashboards and KPI tracking systems.",
                "Bachelor's in Economics from [REDACTED UNIVERSITY]",
                82.0, 2, 3,
                "Solid BI and reporting background. Statistical methodology could be strengthened.");

        seedCandidate(CAMPAIGN_ANALYST, "Candidate-DA-003", "Drew Martinez", "drew.m@email.com",
                List.of("SQL", "Python", "Statistical Analysis", "Excel"),
                List.of("Tableau", "Data Modeling"),
                "2 years of research analysis in academia. Transitioning to industry. Strong R and Python skills.",
                "PhD candidate (ABD) in [REDACTED FIELD] from [REDACTED UNIVERSITY]",
                73.0, 3, 2,
                "Strong academic research background. Industry data tooling experience is limited.");

        seedCandidate(CAMPAIGN_ANALYST, "Candidate-DA-004", "Jamie Wilson", "jamie.w@email.com",
                List.of("SQL", "Excel"),
                List.of("Python", "Tableau", "Data Modeling", "Statistical Analysis"),
                "1 year of data entry and reporting. Basic SQL queries. Looking to grow into analytics.",
                "Bachelor's in Business Administration from [REDACTED UNIVERSITY]",
                45.0, 4, 1,
                "Below minimum qualifications. Limited analytical tool experience.");
    }

    private void seedCandidate(UUID campaignId, String label, String rawName, String rawEmail,
                               List<String> matchedSkills, List<String> missingSkills,
                               String experienceSummary, String educationRedacted,
                               double score, int rank, int yearsExp, String reason) {
        Submission sub = new Submission();
        sub.setCampaignId(campaignId);
        sub.setCandidateLabel(label);
        sub.setSourceEmailHash(UUID.randomUUID().toString());
        sub.setSourceMessageId("msg-" + UUID.randomUUID());
        sub.setReceivedAt(Instant.now().minus(rank, ChronoUnit.DAYS));
        sub.setProcessingStatus(ProcessingStatus.SCORED);
        sub.setAttachmentCount(1);
        sub.setRawCandidateName(rawName);
        sub.setRawCandidateEmail(rawEmail);
        
        sub.setPhone("+1 (555) 01" + rank + "-9876");
        sub.setLinkedinUrl("linkedin.com/in/" + rawName.toLowerCase().replace(" ", ""));
        sub.setYearsOfExperience(yearsExp);
        if (campaignId.equals(CAMPAIGN_BACKEND)) {
            sub.setCurrentJobRole(rank % 2 == 0 ? "Senior Java Developer" : "Software Engineer");
            sub.setCurrentCompany(rank % 2 == 0 ? "Fintech Solutions" : "CloudScale Tech");
        } else if (campaignId.equals(CAMPAIGN_DESIGNER)) {
            sub.setCurrentJobRole(rank % 2 == 0 ? "Product Designer" : "UX Specialist");
            sub.setCurrentCompany(rank % 2 == 0 ? "DesignCraft Studio" : "SaaSify Inc");
        } else {
            sub.setCurrentJobRole(rank % 2 == 0 ? "Data Analyst" : "BI Consultant");
            sub.setCurrentCompany(rank % 2 == 0 ? "DataStream Corp" : "Insight Analytics");
        }

        sub = submissionRepo.save(sub);

        AnonymizedProfile profile = new AnonymizedProfile();
        profile.setSubmissionId(sub.getId());
        profile.setNormalizedResumeText(experienceSummary);
        profile.setExtractedSkillsJson(toJson(matchedSkills));
        profile.setExperienceSummary(experienceSummary);
        profile.setEducationSummaryRedacted(educationRedacted);
        profile.setPiiRedactionSummaryJson(toJson(Map.of(
                "fieldsRedacted", List.of("name", "email", "phone", "address", "university"),
                "redactionConfidence", 0.98
        )));
        profile.setConfidenceScore(BigDecimal.valueOf(0.95));
        profile = profileRepo.save(profile);

        List<String> tags = new ArrayList<>();
        if (score >= 90) tags.add("TOP_CANDIDATE");
        if (score >= 80) tags.add("STRONG_MATCH");
        if (yearsExp >= 5) tags.add("SENIOR_LEVEL");
        if (missingSkills.isEmpty()) tags.add("FULL_SKILL_COVERAGE");
        if (yearsExp < 3) tags.add("JUNIOR_LEVEL");

        ScoringResult scoring = new ScoringResult();
        scoring.setSubmissionId(sub.getId());
        scoring.setCampaignId(campaignId);
        scoring.setScoreValue(BigDecimal.valueOf(score));
        scoring.setRankPosition(rank);
        scoring.setExplainabilityTagsJson(toJson(tags));
        scoring.setMatchedSkillsJson(toJson(matchedSkills));
        scoring.setMissingSkillsJson(toJson(missingSkills));
        scoring.setExperienceYearsMatch(yearsExp);
        scoring.setSummaryReason(reason);
        scoring.setLlmModelName("seed-data-v1 (no LLM)");
        scoring.setLlmResponseVersion("phase1-seed");
        scoring = scoringRepo.save(scoring);

        // Update submission with profile and score references
        sub.setCurrentProfileId(profile.getId());
        sub.setCurrentScoreId(scoring.getId());
        submissionRepo.save(sub);
    }

    private String toJson(Object obj) {
        try { return mapper.writeValueAsString(obj); }
        catch (JsonProcessingException e) { return "[]"; }
    }
}
