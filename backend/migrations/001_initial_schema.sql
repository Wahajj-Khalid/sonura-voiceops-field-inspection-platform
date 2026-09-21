-- 1. Enable Vector Extension for Vector Embeddings (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Organizations Table (Tenancy Root with Quota Enforcement)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    is_active BOOLEAN NOT NULL DEFAULT true,
    suspension_reason TEXT,
    max_users INT NOT NULL DEFAULT 25,
    max_sites INT NOT NULL DEFAULT 15,
    max_audits INT NOT NULL DEFAULT 500,
    storage_limit_mb INT NOT NULL DEFAULT 1024,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Root Organization (Titan HVAC Services Inc.)
INSERT INTO public.organizations (
    id, name, plan, is_active, max_users, max_sites, max_audits, storage_limit_mb
)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Titan HVAC Services Inc.', 
    'enterprise', 
    true,
    100,
    50,
    5000,
    10240
)
ON CONFLICT (id) DO UPDATE SET 
    is_active = true,
    max_users = 100,
    max_sites = 50,
    max_audits = 5000,
    storage_limit_mb = 10240;

-- 3. Checklist Templates Table
CREATE TABLE IF NOT EXISTS public.checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'HVAC',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Checklist Template
INSERT INTO public.checklist_templates (id, org_id, title, category, items)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Standard HVAC Protocol',
    'HVAC',
    '[
        {"item_id": "1", "question": "Main Pressure Valve PSI reading within 45 to 60 range?", "response": null, "status": "pending", "flagged": false, "notes": ""},
        {"item_id": "2", "question": "Compressor intake filters free of debris and obstruction?", "response": null, "status": "pending", "flagged": false, "notes": ""},
        {"item_id": "3", "question": "Secondary coolant loop seal integrity intact with zero fluid seepage?", "response": null, "status": "pending", "flagged": false, "notes": ""},
        {"item_id": "4", "question": "Emergency shutoff valve manual override mechanical operation verified?", "response": null, "status": "pending", "flagged": false, "notes": ""}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Sites and Facilities Table (Tenant-Scoped)
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    assigned_inspector VARCHAR(100) NOT NULL DEFAULT 'Operator 01',
    bound_template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sites_org_unit_unique UNIQUE (org_id, unit_id)
);

-- Seed Default Sites
INSERT INTO public.sites (id, org_id, unit_id, title, status, assigned_inspector, bound_template_id)
VALUES 
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'BUILDING-4B', 'Building 4B - Main Plant', 'in_progress', 'Operator 01', '22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'PLANT-12', 'Plant 12 - Electrical Grid', 'pending', 'Operator 01', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (org_id, unit_id) DO NOTHING;

-- 5. Team Members Table (RBAC and Tenancy)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Inspector',
    audits_count INT NOT NULL DEFAULT 0,
    password_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Team Accounts
INSERT INTO public.team_members (id, name, email, role, audits_count, org_id, is_active)
VALUES 
    ('55555555-5555-5555-5555-555555555551', 'John Smith', 'john@titanhvac.com', 'Org Admin', 128, '11111111-1111-1111-1111-111111111111', true),
    ('55555555-5555-5555-5555-555555555552', 'Sarah Connor', 'sarah@titanhvac.com', 'Supervisor', 42, '11111111-1111-1111-1111-111111111111', true),
    ('55555555-5555-5555-5555-555555555553', 'Operator 01', 'op1@titanhvac.com', 'Inspector', 18, '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (email) DO NOTHING;

-- 6. Field Inspections Table (Tenant-Scoped)
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    inspector_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    transcript_summary TEXT,
    audio_url TEXT,
    photo_attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Inspection Record for BUILDING-4B
INSERT INTO public.inspections (
    id, org_id, unit_id, title, inspector_id, status, priority, items, transcript_summary
)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'BUILDING-4B',
    'Walkthrough Audit - BUILDING-4B',
    'Operator 01',
    'in_progress',
    'high',
    '[
        {"item_id": "1", "question": "Main Pressure Valve PSI reading within 45 to 60 range?", "response": null, "status": "pending", "flagged": false, "notes": ""},
        {"item_id": "2", "question": "Compressor intake filters free of debris and obstruction?", "response": null, "status": "pending", "flagged": false, "notes": ""},
        {"item_id": "3", "question": "Secondary coolant loop seal integrity intact with zero fluid seepage?", "response": null, "status": "pending", "flagged": false, "notes": ""},
        {"item_id": "4", "question": "Emergency shutoff valve manual override mechanical operation verified?", "response": null, "status": "pending", "flagged": false, "notes": ""}
    ]'::jsonb,
    'Live audit initialized. Awaiting technician voice telemetry inputs.'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Manual Sections Table (Tenant-Isolated 384-dimensional Vector Embeddings)
CREATE TABLE IF NOT EXISTS public.manual_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    manual_title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'HVAC',
    page_number INT,
    content TEXT NOT NULL,
    embedding vector(384) NOT NULL
);

-- 8. Targeted Notifications Table (User and Role Targeted)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
    role_target VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('inspection-photos', 'inspection-photos', false),
    ('inspection-audio', 'inspection-audio', false),
    ('rag-documents', 'rag-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_sites_org_id ON public.sites(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON public.team_members(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_org_id ON public.checklist_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_inspections_org_id ON public.inspections(org_id);
CREATE INDEX IF NOT EXISTS idx_inspections_unit_id ON public.inspections(unit_id);
CREATE INDEX IF NOT EXISTS idx_manual_sections_org_id ON public.manual_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(role_target);

-- 11. Enable Row-Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. Grant Privileges
GRANT ALL PRIVILEGES ON TABLE public.organizations TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.checklist_templates TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.sites TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.team_members TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.inspections TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.manual_sections TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.notifications TO anon, authenticated, service_role;

-- 13. Storage Policies
DROP POLICY IF EXISTS "Allow service role full access on photos" ON storage.objects;
CREATE POLICY "Allow service role full access on photos" ON storage.objects
    FOR ALL USING (bucket_id = 'inspection-photos');

DROP POLICY IF EXISTS "Allow service role full access on audio" ON storage.objects;
CREATE POLICY "Allow service role full access on audio" ON storage.objects
    FOR ALL USING (bucket_id = 'inspection-audio');

DROP POLICY IF EXISTS "Allow service role full access on rag documents" ON storage.objects;
CREATE POLICY "Allow service role full access on rag documents" ON storage.objects
    FOR ALL USING (bucket_id = 'rag-documents');

-- 14. Tenant-Scoped RPC Vector Search
CREATE OR REPLACE FUNCTION match_manual_sections(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    manual_title VARCHAR,
    page_number INT,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ms.id,
        ms.org_id,
        ms.manual_title,
        ms.page_number,
        ms.content,
        1 - (ms.embedding <=> query_embedding) AS similarity
    FROM public.manual_sections ms
    WHERE 
        (filter_org_id IS NULL OR ms.org_id IS NULL OR ms.org_id = filter_org_id)
        AND (1 - (ms.embedding <=> query_embedding) > match_threshold)
    ORDER BY ms.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 15. Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';