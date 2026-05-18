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
