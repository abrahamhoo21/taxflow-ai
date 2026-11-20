-- ====================================================================
-- YYC taxPOD CRM & Tax RAG Database Schema
-- Compatible with Supabase & Standard PostgreSQL 15+ (with pgvector)
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Clean existing tables (for idempotent runs if needed)
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS opportunities CASCADE;
-- DROP TABLE IF EXISTS leads CASCADE;
-- DROP TABLE IF EXISTS tax_document_chunks CASCADE;

-- ====================================================================
-- 3. Core CRM Tables
-- ====================================================================

-- 3.1 Leads / Contacts Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Prospect', 'Customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Opportunities (Deals Pipeline) Table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    value_rm DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (stage IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 Activity Log Table (Calls, Emails, Meetings, Notes)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Call', 'Email', 'Meeting', 'Note')),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 4. Tax Knowledge Base & RAG Vector Table
-- ====================================================================

CREATE TABLE IF NOT EXISTS tax_document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_name VARCHAR(255) NOT NULL,        -- e.g. LHDN_eInvoice_Guidelines_v3.0.pdf
    page_number INTEGER NOT NULL,          -- e.g. 6
    section_title VARCHAR(255),            -- e.g. "1.4 Implementation Timeline"
    chunk_content TEXT NOT NULL,           -- Actual statutory text content
    embedding VECTOR(768),                 -- 768 dimensions for Google text-embedding-004
    metadata JSONB DEFAULT '{}'::jsonb,    -- Flexible tags (e.g. { category: "e-invoice", year: 2024 })
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.1 HNSW Vector Index for High-Performance Sub-millisecond Cosine Retrieval
CREATE INDEX IF NOT EXISTS idx_tax_chunks_embedding 
ON tax_document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4.2 Metadata & Document Name Indexes
CREATE INDEX IF NOT EXISTS idx_tax_chunks_doc_name ON tax_document_chunks(doc_name);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ====================================================================
-- 5. Stored Procedure: Top-K Vector Cosine Similarity Search
-- ====================================================================

CREATE OR REPLACE FUNCTION match_tax_chunks (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.50,
    match_count INT DEFAULT 4
)
RETURNS TABLE (
    id UUID,
    doc_name VARCHAR,
    page_number INT,
    section_title VARCHAR,
    chunk_content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.doc_name,
        t.page_number,
        t.section_title,
        t.chunk_content,
        1 - (t.embedding <=> query_embedding) AS similarity
    FROM tax_document_chunks t
    WHERE 1 - (t.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- ====================================================================
-- 6. Initial Seed Data (Realistic Malaysian SME Sales Context)
-- ====================================================================

-- 6.1 Insert Sample Leads
INSERT INTO leads (id, name, email, phone, company, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Dato Sri Jeffrey Lim', 'jeffrey.lim@megalogistics.com.my', '012-3889123', 'Mega Logistics Bhd', 'Prospect'),
('22222222-2222-2222-2222-222222222222', 'Cynthia Wong', 'cynthia.w@berjayafood.my', '017-9102233', 'Berjaya Food Sdn Bhd', 'Lead'),
('33333333-3333-3333-3333-333333333333', 'Marcus Tan', 'marcus.tan@sunwaytech.com.my', '019-4455667', 'Sunway Tech Group', 'Customer'),
('44444444-4444-4444-4444-444444444444', 'Kenneth Tan', 'kenneth@apexhardware.com.my', '016-7788990', 'Apex Hardware Trading', 'Lead'),
('55555555-5555-5555-5555-555555555555', 'Sarah Lee', 'sarah.lee@topglovecorp.com.my', '012-5566778', 'Top Glove Holdings', 'Prospect')
ON CONFLICT (id) DO NOTHING;

-- 6.2 Insert Sample Opportunities
INSERT INTO opportunities (id, lead_id, title, value_rm, stage) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Phase 2 e-Invoice Advisory & API ERP Integration', 55000.00, 'Contacted'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'SST 8% Compliance Review (15 Branches)', 35000.00, 'Qualified'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'taxPOD Annual Corporate Enterprise License', 160000.00, 'Won'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'SME e-Invoicing Kickstart Starter Pack', 15000.00, 'New'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'Transfer Pricing & Cross-Border Tax Masterclass', 75000.00, 'Proposal')
ON CONFLICT (id) DO NOTHING;

-- 6.3 Insert Sample Activities
INSERT INTO activities (lead_id, opportunity_id, type, description, date) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Call', 'Discovery phone call with Dato Sri Jeffrey regarding LHDN Phase 2 deployment dates.', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Meeting', 'Met Cynthia at Berjaya Times Square office. Confirmed budget around RM 35k for 15 outlets.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Note', 'Deal Closed! Corporate contract signed and invoiced for RM 160,000.', CURRENT_TIMESTAMP - INTERVAL '3 days');
