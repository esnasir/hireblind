CREATE TABLE incoming_messages (
    id UUID PRIMARY KEY,
    source_message_id VARCHAR(255) UNIQUE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sender_email VARCHAR(255),
    raw_body TEXT,
    extracted_text TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE processing_attempts (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES submissions(id),
    attempt_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE scoring_results
ADD COLUMN confidence_score NUMERIC(5,2);

-- Update check constraint on submissions.processing_status
ALTER TABLE submissions DROP CONSTRAINT submissions_processing_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_processing_status_check 
CHECK (processing_status IN ('RECEIVED','PARSED','REDACTED','SCORED','REVIEWED','REVEALED','REJECTED','PROCESSING','COMPLETED','FAILED'));
