-- V12: Add structured pipelining and custom screening answers

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS current_stage_id UUID;

CREATE TABLE submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL, -- References campaign-service screening_questions
    answer_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_answers_sub_id ON submission_answers(submission_id);

CREATE TABLE submission_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    from_stage_id UUID, -- Null if initial
    to_stage_id UUID NOT NULL,
    changed_by_user_id UUID, -- Null if system
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

CREATE INDEX idx_sub_stage_hist_sub_id ON submission_stage_history(submission_id);
