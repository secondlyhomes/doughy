-- Rollback Migration: Lead Documents Table
-- Description: Drop re_lead_documents table
-- Phase: 2 - Sprint 1 Completion
-- WARNING: This will delete ALL lead documents

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete their own lead documents" ON re_lead_documents;
DROP POLICY IF EXISTS "Users can update their own lead documents" ON re_lead_documents;
DROP POLICY IF EXISTS "Users can insert lead documents for their leads" ON re_lead_documents;
DROP POLICY IF EXISTS "Users can view lead documents they have access to" ON re_lead_documents;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS re_lead_documents CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back lead documents table - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260117_lead_documents',
    'action', 'rollback',
    'table_dropped', 're_lead_documents',
    'warning', 'All lead documents (tax returns, IDs, W9s, etc.) have been deleted',
    'recovery', 'Restore from backup if this rollback was unintended'
  )
);
