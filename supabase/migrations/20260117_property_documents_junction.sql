-- Migration: Create re_property_documents junction table
-- Description: Many-to-many linking for package deals (one doc, multiple properties)
-- Phase: 2 - Sprint 1 Completion
-- Reference: ZONE_A_BACKEND.md lines 93-145

-- ============================================================================
-- RE_PROPERTY_DOCUMENTS JUNCTION TABLE
-- ============================================================================
-- Junction table for many-to-many property-document linking (package deals)
-- Allows one document (e.g., shared title search) to be linked to multiple properties
CREATE TABLE IF NOT EXISTS re_property_documents (
  property_id UUID NOT NULL REFERENCES re_properties(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES re_documents(id) ON DELETE CASCADE,

  -- Metadata
  is_primary BOOLEAN DEFAULT FALSE,  -- True for the "main" property this doc belongs to

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite primary key
  PRIMARY KEY (property_id, document_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_property_documents_property ON re_property_documents(property_id);
CREATE INDEX idx_property_documents_document ON re_property_documents(document_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE re_property_documents ENABLE ROW LEVEL SECURITY;

-- Users can view property-document links for their properties
CREATE POLICY "Users can view property-document links for their properties"
  ON re_property_documents FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Users can create links for their properties
CREATE POLICY "Users can create links for their properties"
  ON re_property_documents FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Users can delete links for their properties
CREATE POLICY "Users can delete links for their properties"
  ON re_property_documents FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Admins can view all property-document links
CREATE POLICY "Admins can view all property-document links"
  ON re_property_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- BACKFILL EXISTING DOCUMENTS
-- ============================================================================
-- Migrate existing documents that have property_id set into junction table
-- This ensures backward compatibility with documents created before this migration
INSERT INTO re_property_documents (property_id, document_id, is_primary)
SELECT property_id, id, TRUE
FROM re_documents
WHERE property_id IS NOT NULL
ON CONFLICT (property_id, document_id) DO NOTHING;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created re_property_documents junction table - Sprint 1 deliverable',
  jsonb_build_object(
    'migration', '20260117_property_documents_junction',
    'tables_created', ARRAY['re_property_documents'],
    'purpose', 'Support package deals with shared documents',
    'backfilled', (SELECT COUNT(*) FROM re_property_documents),
    'sprint', 1,
    'zone', 'A - Backend'
  )
);
