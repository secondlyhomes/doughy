-- Rollback Migration: Composite and Partial Indexes
-- Description: Drop all performance indexes added in Phase 4
-- Phase: 4 - Performance & Quality
-- WARNING: This may impact query performance

-- ============================================================================
-- DROP COMPOSITE INDEXES
-- ============================================================================

-- Deals composite indexes
DROP INDEX IF EXISTS idx_deals_user_status;
DROP INDEX IF EXISTS idx_deals_user_stage;
DROP INDEX IF EXISTS idx_deals_user_created;

-- Leads composite indexes
DROP INDEX IF EXISTS idx_leads_user_status;
DROP INDEX IF EXISTS idx_leads_user_created;

-- Re_properties composite indexes
DROP INDEX IF EXISTS idx_re_properties_location;
DROP INDEX IF EXISTS idx_re_properties_user_status;

-- Re_documents composite indexes
DROP INDEX IF EXISTS idx_re_documents_user_type;
DROP INDEX IF EXISTS idx_re_documents_property_created;

-- Messages composite index
DROP INDEX IF EXISTS idx_messages_lead_created;

-- API keys composite index
DROP INDEX IF EXISTS idx_api_keys_user_service;

-- ============================================================================
-- DROP PARTIAL INDEXES
-- ============================================================================

-- Active deals with upcoming actions
DROP INDEX IF EXISTS idx_deals_active_next_action;

-- Active leads (not deleted)
DROP INDEX IF EXISTS idx_leads_active;

-- Active properties
DROP INDEX IF EXISTS idx_re_properties_active;

-- Pending/failed AI jobs
DROP INDEX IF EXISTS idx_ai_jobs_pending;

-- Recent system logs
DROP INDEX IF EXISTS idx_system_logs_recent;

-- ============================================================================
-- DROP COVERING INDEXES
-- ============================================================================

-- Deals covering index
DROP INDEX IF EXISTS idx_deals_user_status_covering;

-- Leads covering index
DROP INDEX IF EXISTS idx_leads_user_status_covering;

-- ============================================================================
-- DROP GIN INDEXES
-- ============================================================================

-- Leads tags GIN index
DROP INDEX IF EXISTS idx_leads_tags_gin;

-- Re_documents metadata GIN index
DROP INDEX IF EXISTS idx_re_documents_metadata_gin;

-- Deal events metadata GIN index
DROP INDEX IF EXISTS idx_deal_events_metadata_gin;

-- ============================================================================
-- DROP EXPRESSION INDEXES
-- ============================================================================

-- Case-insensitive email search
DROP INDEX IF EXISTS idx_leads_email_lower;

-- Case-insensitive name search
DROP INDEX IF EXISTS idx_leads_name_lower;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back composite and partial indexes',
  jsonb_build_object(
    'migration', '20260118_add_composite_indexes',
    'action', 'rollback',
    'indexes_dropped', 24,
    'performance_impact', 'Queries may be slower without these indexes',
    'note', 'Basic single-column indexes from core table creation still exist'
  )
);
