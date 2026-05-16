-- V1: Create campaigns table with 3 hardcoded seed campaigns
CREATE TABLE campaigns (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    required_skills_json JSONB NOT NULL DEFAULT '[]',
    screening_rules_json JSONB NOT NULL DEFAULT '{}',
    status               VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
                         CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED')),
    owner_user_id        UUID NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_owner  ON campaigns(owner_user_id);

-- Seed 3 campaigns with hardcoded UUIDs (must match Processing Service seed data)
INSERT INTO campaigns (id, title, description, required_skills_json, screening_rules_json, status, owner_user_id) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Senior Backend Engineer',
     'We are looking for a Senior Backend Engineer to join our platform team. The ideal candidate has strong experience with distributed systems, microservices architecture, and cloud-native development.',
     '["Java", "Spring Boot", "PostgreSQL", "Docker", "Kubernetes", "REST APIs", "Microservices"]',
     '{"minYearsExperience": 5, "requiredEducation": "Bachelor''s in CS or related", "preferRemote": true}',
     'ACTIVE',
     'd4e5f6a7-b8c9-0123-defa-234567890123'),

    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'Product Designer',
     'Seeking a Product Designer with expertise in B2B SaaS products. Must have strong skills in user research, wireframing, prototyping, and design systems.',
     '["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Accessibility"]',
     '{"minYearsExperience": 3, "requiredEducation": "Bachelor''s or equivalent portfolio", "preferRemote": false}',
     'ACTIVE',
     'd4e5f6a7-b8c9-0123-defa-234567890123'),

    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     'Data Analyst',
     'Looking for a Data Analyst to help us derive insights from HR screening data. Strong SQL skills and experience with data visualization tools required.',
     '["SQL", "Python", "Tableau", "Data Modeling", "Statistical Analysis", "Excel"]',
     '{"minYearsExperience": 2, "requiredEducation": "Bachelor''s in Statistics, Math, or related", "preferRemote": true}',
     'ACTIVE',
     'd4e5f6a7-b8c9-0123-defa-234567890123');
