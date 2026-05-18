ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS resume_file_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resume_original_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS resume_file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS resume_content_type VARCHAR(100);

ALTER TABLE incoming_messages
  ADD COLUMN IF NOT EXISTS resume_file_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resume_original_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS resume_file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS resume_content_type VARCHAR(100);
