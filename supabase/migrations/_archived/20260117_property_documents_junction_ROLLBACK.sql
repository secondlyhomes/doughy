-- Rollback Migration: Property Documents Junction Table
-- Description: Drop re_property_documents junction table
-- Phase: 2 - Sprint 1 Completion
-- WARNING: This will remove property-document relationships

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete links for their properties" ON re_property_documents;
DROP POLICY IF EXISTS "Users can create links for their properties" ON re_property_documents;
DROP POLICY IF EXISTS "Users can view property-document links for their properties" ON re_property_documents;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS re_property_documents CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back property-documents junction table',
  jsonb_build_object(
    'migration', '20260117_property_documents_junction',
    'action', 'rollback',
    'table_dropped', 're_property_documents',
    'impact', 'Property-document relationships have been removed',
    'note', 'Documents themselves still exist in re_documents table',
    'recovery', 'Restore from backup if this rollback was unintended'
  )
);
