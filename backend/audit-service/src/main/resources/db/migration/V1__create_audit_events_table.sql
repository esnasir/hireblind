-- V1: Create immutable audit events table
CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type      VARCHAR(50)  NOT NULL,
    actor_id        VARCHAR(255) NOT NULL,
    action_type     VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       VARCHAR(255) NOT NULL,
    timestamp       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    metadata_json   JSONB NOT NULL DEFAULT '{}',
    correlation_id  VARCHAR(255)
);

CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_actor  ON audit_events(actor_id);
CREATE INDEX idx_audit_action ON audit_events(action_type);
CREATE INDEX idx_audit_time   ON audit_events(timestamp);

-- Prevent updates and deletes on audit_events
CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit events are immutable — updates and deletes are not permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_audit BEFORE UPDATE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE TRIGGER no_delete_audit BEFORE DELETE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
