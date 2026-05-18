ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS is_flagged_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sanitized_content_removed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sanitization_log TEXT,
  ADD COLUMN IF NOT EXISTS experience_gaps_json JSONB;

ALTER TABLE incoming_messages
  ADD COLUMN IF NOT EXISTS raw_extracted_text_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS sanitized_text_hash VARCHAR(64);
