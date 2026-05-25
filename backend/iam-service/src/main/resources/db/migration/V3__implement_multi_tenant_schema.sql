-- V3: Multi-tenant schema additions

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    company_size VARCHAR(50),
    industry VARCHAR(100),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop the V2 placeholder column
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;

-- Add new columns as requested
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

-- Update the existing role constraint to support OWNER and INTERVIEWER
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('OWNER', 'ADMIN', 'RECRUITER', 'INTERVIEWER'));
