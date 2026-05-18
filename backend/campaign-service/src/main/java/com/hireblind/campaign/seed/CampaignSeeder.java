package com.hireblind.campaign.seed;

import com.hireblind.campaign.entity.Campaign;
import com.hireblind.campaign.entity.CampaignStatus;
import com.hireblind.campaign.repository.CampaignRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CampaignSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CampaignSeeder.class);
    private final CampaignRepository campaignRepository;

    public CampaignSeeder(CampaignRepository campaignRepository) {
        this.campaignRepository = campaignRepository;
    }

    @Override
    public void run(String... args) {
        if (campaignRepository.count() > 0) {
            log.info("Campaign records already exist in database — skipping seeder.");
            return;
        }

        log.info("Seeding default campaigns conditionally (since campaign database is empty)...");

        // 1. Senior Backend Engineer
        Campaign be = new Campaign();
        be.setId(UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890"));
        be.setTitle("Senior Backend Engineer");
        be.setDescription("We are looking for a Senior Backend Engineer to join our platform team. The ideal candidate has strong experience with distributed systems, microservices architecture, and cloud-native development.");
        be.setRequiredSkillsJson("[\"Java\", \"Spring Boot\", \"PostgreSQL\", \"Docker\", \"Kubernetes\", \"REST APIs\", \"Microservices\"]");
        be.setScreeningRulesJson("{\"minYearsExperience\": 5, \"requiredEducation\": \"Bachelor's in CS or related\", \"preferRemote\": true}");
        be.setStatus(CampaignStatus.ACTIVE);
        be.setOwnerUserId(UUID.fromString("d4e5f6a7-b8c9-0123-defa-234567890123"));
        be.setTotalVacancies(1);
        be.setBufferMultiplier(2);
        campaignRepository.save(be);

        // 2. Product Designer
        Campaign designer = new Campaign();
        designer.setId(UUID.fromString("b2c3d4e5-f6a7-8901-bcde-f12345678901"));
        designer.setTitle("Product Designer");
        designer.setDescription("Seeking a Product Designer with expertise in B2B SaaS products. Must have strong skills in user research, wireframing, prototyping, and design systems.");
        designer.setRequiredSkillsJson("[\"Figma\", \"User Research\", \"Wireframing\", \"Prototyping\", \"Design Systems\", \"Accessibility\"]");
        designer.setScreeningRulesJson("{\"minYearsExperience\": 3, \"requiredEducation\": \"Bachelor's or equivalent portfolio\", \"preferRemote\": false}");
        designer.setStatus(CampaignStatus.ACTIVE);
        designer.setOwnerUserId(UUID.fromString("d4e5f6a7-b8c9-0123-defa-234567890123"));
        designer.setTotalVacancies(2);
        designer.setBufferMultiplier(2);
        campaignRepository.save(designer);

        // 3. Data Analyst
        Campaign analyst = new Campaign();
        analyst.setId(UUID.fromString("c3d4e5f6-a7b8-9012-cdef-123456789012"));
        analyst.setTitle("Data Analyst");
        analyst.setDescription("Looking for a Data Analyst to help us derive insights from HR screening data. Strong SQL skills and experience with data visualization tools required.");
        analyst.setRequiredSkillsJson("[\"SQL\", \"Python\", \"Tableau\", \"Data Modeling\", \"Statistical Analysis\", \"Excel\"]");
        analyst.setScreeningRulesJson("{\"minYearsExperience\": 2, \"requiredEducation\": \"Bachelor's in Statistics, Math, or related\", \"preferRemote\": true}");
        analyst.setStatus(CampaignStatus.ACTIVE);
        analyst.setOwnerUserId(UUID.fromString("d4e5f6a7-b8c9-0123-defa-234567890123"));
        analyst.setTotalVacancies(3);
        analyst.setBufferMultiplier(2);
        campaignRepository.save(analyst);

        log.info("Campaign seeding complete! Seeded 3 default campaigns.");
    }
}
