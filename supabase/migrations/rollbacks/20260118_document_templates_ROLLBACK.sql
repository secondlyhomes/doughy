-- Rollback Migration: Document Templates Table
-- Description: Drop re_document_templates table
-- Phase: Sprint 3 - AI & Automation
-- WARNING: This will delete ALL document templates including system templates

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_doc_templates_updated_at ON re_document_templates;
DROP FUNCTION IF EXISTS update_doc_templates_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all templates" ON re_document_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON re_document_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON re_document_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON re_document_templates;
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON re_document_templates;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS re_document_templates CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back document templates table - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260118_document_templates',
    'action', 'rollback',
    'table_dropped', 're_document_templates',
    'warning', 'All document templates (including system templates) have been deleted',
    'recovery', 'Restore from backup if this rollback was unintended',
    'impact', 'Document generation features will not work until templates are recreated'
  )
);
