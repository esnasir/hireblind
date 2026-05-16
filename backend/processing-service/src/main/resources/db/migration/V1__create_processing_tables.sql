-- V1: Create processing tables
CREATE TABLE submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id         UUID NOT NULL,
    candidate_label     VARCHAR(100) NOT NULL,
    source_email_hash   VARCHAR(255),
    source_message_id   VARCHAR(255) UNIQUE,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    processing_status   VARCHAR(50) NOT NULL DEFAULT 'RECEIVED'
                        CHECK (processing_status IN
                        ('RECEIVED','PARSED','REDACTED','SCORED','REVIEWED','REVEALED','REJECTED')),
    attachment_count    INT NOT NULL DEFAULT 0,
    current_profile_id  UUID,
    current_score_id    UUID,
    raw_candidate_name  VARCHAR(255),
    raw_candidate_email VARCHAR(255)
);

CREATE INDEX idx_submissions_campaign ON submissions(campaign_id);
CREATE INDEX idx_submissions_status   ON submissions(processing_status);
CREATE INDEX idx_submissions_msgid    ON submissions(source_message_id);

CREATE TABLE anonymized_profiles (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id              UUID NOT NULL REFERENCES submissions(id),
    normalized_resume_text     TEXT,
    extracted_skills_json      JSONB NOT NULL DEFAULT '[]',
    experience_summary         TEXT,
    education_summary_redacted TEXT,
    pii_redaction_summary_json JSONB NOT NULL DEFAULT '{}',
    confidence_score           NUMERIC(5,2),
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_submission ON anonymized_profiles(submission_id);

CREATE TABLE scoring_results (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id             UUID NOT NULL REFERENCES submissions(id),
    campaign_id               UUID NOT NULL,
    score_value               NUMERIC(5,2) NOT NULL,
    rank_position             INT,
    explainability_tags_json  JSONB NOT NULL DEFAULT '[]',
    matched_skills_json       JSONB NOT NULL DEFAULT '[]',
    missing_skills_json       JSONB NOT NULL DEFAULT '[]',
    experience_years_match    INT,
    summary_reason            TEXT,
    llm_model_name            VARCHAR(100),
    llm_response_version      VARCHAR(50),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scores_submission ON scoring_results(submission_id);
CREATE INDEX idx_scores_campaign   ON scoring_results(campaign_id);
