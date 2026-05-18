-- V10__add_extracted_urls_to_submissions.sql
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS extracted_urls_json jsonb;
