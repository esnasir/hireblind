-- V4: Seed default users for E2E tests and platform validations

INSERT INTO tenants (id, company_name, slug, created_at)
VALUES ('ed6a7e78-d9b2-4e0e-96e7-fb4f5b13a4f2', 'Acme Corporation', 'acme-corporation', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, enabled, tenant_id, status, created_at, updated_at)
VALUES 
('d4e5f6a7-b8c9-0123-defa-234567890123', 'nasirworkspace@gmail.com', '$2a$10$GcpIW0Vlyk12MWAofs3S/OUAs1f8BhLgpx2Txu3kAPsbbxWVpx0gq', 'Nasir Ahmed', 'ADMIN', true, 'ed6a7e78-d9b2-4e0e-96e7-fb4f5b13a4f2', 'ACTIVE', now(), now()),
('b7db5315-6429-45ee-80c4-c4b802198988', 'recruiter@hireblind.com', '$2a$10$X/KcfKZ4b9DTR6xgHWLzWeGr9ulQHAiva/BWLI1KZpAMyyFPUNFTu', 'Jane Recruiter', 'RECRUITER', true, 'ed6a7e78-d9b2-4e0e-96e7-fb4f5b13a4f2', 'ACTIVE', now(), now())
ON CONFLICT (id) DO NOTHING;
