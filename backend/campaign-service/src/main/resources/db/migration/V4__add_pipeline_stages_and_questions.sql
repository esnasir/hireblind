-- V4: Add pipeline stages, screening questions, and extend campaigns table

ALTER TABLE campaigns
    ADD COLUMN public_slug VARCHAR(255) UNIQUE,
    ADD COLUMN department VARCHAR(255),
    ADD COLUMN employment_type VARCHAR(100),
    ADD COLUMN location_type VARCHAR(100);

CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    stage_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_stages_campaign ON pipeline_stages(campaign_id);

CREATE TABLE screening_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    options_json JSONB,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_screening_questions_campaign ON screening_questions(campaign_id);
