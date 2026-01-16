-- Migration: Create re_lead_documents table
-- Description: Seller-level documents (ID, tax returns, bank statements, etc.)
-- Phase: 2 - Sprint 1 Completion
-- Reference: ZONE_A_BACKEND.md lines 36-91

-- ============================================================================
-- RE_LEAD_DOCUMENTS TABLE
-- ============================================================================
-- Tier 1: Lead/Seller Documents (attached to leads, not properties)
CREATE TABLE IF NOT EXISTS re_lead_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Document metadata
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'id',              -- Government ID
    'tax_return',      -- Tax returns
    'bank_statement',  -- Bank statements
    'w9',              -- W-9 form
    'death_cert',      -- Death certificate (inherited property)
    'poa',             -- Power of Attorney
    'other'            -- Other seller documents
  )),

  -- File information
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_lead_documents_lead_id ON re_lead_documents(lead_id);
CREATE INDEX idx_lead_documents_type ON re_lead_documents(type);
CREATE INDEX idx_lead_documents_created_at ON re_lead_documents(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE re_lead_documents ENABLE ROW LEVEL SECURITY;

-- Users can view lead documents they have access to (via lead ownership)
CREATE POLICY "Users can view lead documents they have access to"
  ON re_lead_documents FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );

-- Users can insert lead documents for their leads
CREATE POLICY "Users can insert lead documents for their leads"
  ON re_lead_documents FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );

-- Users can update their own lead documents
CREATE POLICY "Users can update their own lead documents"
  ON re_lead_documents FOR UPDATE
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own lead documents
CREATE POLICY "Users can delete their own lead documents"
  ON re_lead_documents FOR DELETE
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );

-- Admins can view all lead documents
CREATE POLICY "Admins can view all lead documents"
  ON re_lead_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created re_lead_documents table - Sprint 1 deliverable',
  jsonb_build_object(
    'migration', '20260117_lead_documents',
    'tables_created', ARRAY['re_lead_documents'],
    'document_types', ARRAY['id', 'tax_return', 'bank_statement', 'w9', 'death_cert', 'poa', 'other'],
    'sprint', 1,
    'zone', 'A - Backend'
  )
);
