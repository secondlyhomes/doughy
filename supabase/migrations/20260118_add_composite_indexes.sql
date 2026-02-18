-- Migration: Add composite indexes for common query patterns
-- Description: Improve query performance with multi-column indexes
-- Phase: 4 - Performance & Quality

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Deals: user + status filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_deals_user_status
  ON deals(user_id, status);

-- Deals: user + stage filtering
CREATE INDEX IF NOT EXISTS idx_deals_user_stage
  ON deals(user_id, stage);

-- Deals: user + created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_deals_user_created
  ON deals(user_id, created_at DESC);

-- Leads: user + status filtering
CREATE INDEX IF NOT EXISTS idx_leads_user_status
  ON leads(user_id, status);

-- Leads: user + created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_leads_user_created
  ON leads(user_id, created_at DESC);

-- Re_properties: location-based searches
CREATE INDEX IF NOT EXISTS idx_re_properties_location
  ON re_properties(city, state, zip);

-- Re_properties: user + status filtering
CREATE INDEX IF NOT EXISTS idx_re_properties_user_status
  ON re_properties(user_id, status);

-- Re_documents: user + type filtering
CREATE INDEX IF NOT EXISTS idx_re_documents_user_type
  ON re_documents(user_id, type);

-- Re_documents: property + created_at for document timeline
CREATE INDEX IF NOT EXISTS idx_re_documents_property_created
  ON re_documents(property_id, created_at DESC)
  WHERE property_id IS NOT NULL;

-- Messages: lead + created_at for conversation history
CREATE INDEX IF NOT EXISTS idx_messages_lead_created
  ON messages(lead_id, created_at DESC)
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages');

-- API keys: user + service for quick lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_user_service
  ON api_keys(user_id, service);

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Active deals with upcoming actions (dashboard "Next Actions" widget)
CREATE INDEX IF NOT EXISTS idx_deals_active_next_action
  ON deals(user_id, next_action_due)
  WHERE status = 'active' AND next_action_due IS NOT NULL;

-- Active leads that aren't deleted (lead list view)
CREATE INDEX IF NOT EXISTS idx_leads_active
  ON leads(user_id, created_at DESC)
  WHERE status IN ('active', 'qualified') AND is_deleted = FALSE;

-- Active properties (property list view)
CREATE INDEX IF NOT EXISTS idx_re_properties_active
  ON re_properties(user_id, created_at DESC)
  WHERE status = 'active';

-- Pending/failed AI jobs for retry logic
CREATE INDEX IF NOT EXISTS idx_ai_jobs_pending
  ON ai_jobs(created_at DESC)
  WHERE status IN ('queued', 'failed');

-- Recent system logs (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_system_logs_recent
  ON system_logs(created_at DESC, level)
  WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- COVERING INDEXES (Include commonly selected columns)
-- ============================================================================

-- Deals: Cover common SELECT columns to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_deals_user_status_covering
  ON deals(user_id, status)
  INCLUDE (title, estimated_value, next_action_due, created_at);

-- Leads: Cover common SELECT columns
CREATE INDEX IF NOT EXISTS idx_leads_user_status_covering
  ON leads(user_id, status)
  INCLUDE (name, email, phone, score, created_at);

-- ============================================================================
-- GIN INDEXES FOR ARRAY/JSONB COLUMNS
-- ============================================================================

-- Leads tags for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_leads_tags_gin
  ON leads USING GIN(tags);

-- Document metadata JSONB search
CREATE INDEX IF NOT EXISTS idx_re_documents_metadata_gin
  ON re_documents USING GIN(metadata)
  WHERE EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 're_documents' AND column_name = 'metadata');

-- Deal events metadata JSONB search
CREATE INDEX IF NOT EXISTS idx_deal_events_metadata_gin
  ON deal_events USING GIN(metadata);

-- ============================================================================
-- EXPRESSION INDEXES
-- ============================================================================

-- Case-insensitive email search for leads
CREATE INDEX IF NOT EXISTS idx_leads_email_lower
  ON leads(LOWER(email))
  WHERE email IS NOT NULL;

-- Case-insensitive name search for leads
CREATE INDEX IF NOT EXISTS idx_leads_name_lower
  ON leads(LOWER(name));

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added composite and partial indexes for query performance',
  jsonb_build_object(
    'migration', '20260118_add_composite_indexes',
    'composite_indexes', 12,
    'partial_indexes', 5,
    'covering_indexes', 2,
    'gin_indexes', 3,
    'expression_indexes', 2,
    'total_indexes_added', 24,
    'expected_improvement', 'Faster queries on common access patterns'
  )
);
