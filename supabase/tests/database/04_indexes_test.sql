-- Test Suite: Index Coverage
-- Description: Verify all critical indexes exist for performance
-- Phase: 5 - Testing & Documentation

BEGIN;
SELECT plan(40);

-- ============================================================================
-- TEST 1: BASIC INDEXES ON CRITICAL COLUMNS
-- ============================================================================

-- Deals table indexes
SELECT has_index(
  'public', 'deals', 'idx_deals_user_id',
  'deals has index on user_id'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_status',
  'deals has index on status'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_stage',
  'deals has index on stage'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_next_action_due',
  'deals has index on next_action_due'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_lead_id',
  'deals has index on lead_id'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_property_id',
  'deals has index on property_id'
);

-- Leads table indexes
SELECT has_index(
  'public', 'leads', 'idx_leads_user_id',
  'leads has index on user_id'
);

SELECT has_index(
  'public', 'leads', 'idx_leads_status',
  'leads has index on status'
);

SELECT has_index(
  'public', 'leads', 'idx_leads_email',
  'leads has index on email'
);

SELECT has_index(
  'public', 'leads', 'idx_leads_phone',
  'leads has index on phone'
);

-- Re_properties table indexes
SELECT has_index(
  'public', 're_properties', 'idx_re_properties_user_id',
  're_properties has index on user_id'
);

SELECT has_index(
  'public', 're_properties', 'idx_re_properties_status',
  're_properties has index on status'
);

SELECT has_index(
  'public', 're_properties', 'idx_re_properties_city_state',
  're_properties has index on city, state'
);

SELECT has_index(
  'public', 're_properties', 'idx_re_properties_zip',
  're_properties has index on zip'
);

-- Re_documents table indexes
SELECT has_index(
  'public', 're_documents', 'idx_re_documents_user_id',
  're_documents has index on user_id'
);

SELECT has_index(
  'public', 're_documents', 'idx_re_documents_property_id',
  're_documents has index on property_id'
);

SELECT has_index(
  'public', 're_documents', 'idx_re_documents_deal_id',
  're_documents has index on deal_id'
);

SELECT has_index(
  'public', 're_documents', 'idx_re_documents_type',
  're_documents has index on type'
);

SELECT has_index(
  'public', 're_documents', 'idx_re_documents_created_at',
  're_documents has index on created_at'
);

-- ============================================================================
-- TEST 2: COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Deals composite indexes
SELECT has_index(
  'public', 'deals', 'idx_deals_user_status',
  'deals has composite index on (user_id, status)'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_user_stage',
  'deals has composite index on (user_id, stage)'
);

SELECT has_index(
  'public', 'deals', 'idx_deals_user_created',
  'deals has composite index on (user_id, created_at)'
);

-- Leads composite indexes
SELECT has_index(
  'public', 'leads', 'idx_leads_user_status',
  'leads has composite index on (user_id, status)'
);

SELECT has_index(
  'public', 'leads', 'idx_leads_user_created',
  'leads has composite index on (user_id, created_at)'
);

-- Re_properties composite indexes
SELECT has_index(
  'public', 're_properties', 'idx_re_properties_user_status',
  're_properties has composite index on (user_id, status)'
);

-- Re_documents composite indexes
SELECT has_index(
  'public', 're_documents', 'idx_re_documents_user_type',
  're_documents has composite index on (user_id, type)'
);

SELECT has_index(
  'public', 're_documents', 'idx_re_documents_property_created',
  're_documents has composite index on (property_id, created_at)'
);

-- API keys composite index
SELECT has_index(
  'public', 'api_keys', 'idx_api_keys_user_service',
  'api_keys has composite index on (user_id, service)'
);

-- ============================================================================
-- TEST 3: PARTIAL INDEXES FOR FILTERED QUERIES
-- ============================================================================

-- Active deals with upcoming actions
SELECT has_index(
  'public', 'deals', 'idx_deals_active_next_action',
  'deals has partial index for active deals with next_action_due'
);

-- Active leads (not deleted)
SELECT has_index(
  'public', 'leads', 'idx_leads_active',
  'leads has partial index for active non-deleted leads'
);

-- Active properties
SELECT has_index(
  'public', 're_properties', 'idx_re_properties_active',
  're_properties has partial index for active properties'
);

-- Pending/failed AI jobs
SELECT has_index(
  'public', 'ai_jobs', 'idx_ai_jobs_pending',
  'ai_jobs has partial index for pending/failed jobs'
);

-- Recent system logs
SELECT has_index(
  'public', 'system_logs', 'idx_system_logs_recent',
  'system_logs has partial index for recent logs'
);

-- ============================================================================
-- TEST 4: COVERING INDEXES (INCLUDE columns)
-- ============================================================================

-- Deals covering index
SELECT has_index(
  'public', 'deals', 'idx_deals_user_status_covering',
  'deals has covering index on (user_id, status) INCLUDE additional columns'
);

-- Leads covering index
SELECT has_index(
  'public', 'leads', 'idx_leads_user_status_covering',
  'leads has covering index on (user_id, status) INCLUDE additional columns'
);

-- ============================================================================
-- TEST 5: GIN INDEXES FOR ARRAY/JSONB COLUMNS
-- ============================================================================

-- Leads tags GIN index
SELECT has_index(
  'public', 'leads', 'idx_leads_tags_gin',
  'leads has GIN index on tags array'
);

-- Deal events metadata GIN index
SELECT has_index(
  'public', 'deal_events', 'idx_deal_events_metadata_gin',
  'deal_events has GIN index on metadata JSONB'
);

-- ============================================================================
-- TEST 6: EXPRESSION INDEXES
-- ============================================================================

-- Case-insensitive email search
SELECT has_index(
  'public', 'leads', 'idx_leads_email_lower',
  'leads has expression index on LOWER(email)'
);

-- Case-insensitive name search
SELECT has_index(
  'public', 'leads', 'idx_leads_name_lower',
  'leads has expression index on LOWER(name)'
);

-- ============================================================================
-- TEST 7: UNIQUE INDEXES
-- ============================================================================

-- API keys unique index (one key per service per user)
SELECT has_index(
  'public', 'api_keys', 'idx_api_keys_user_service_unique',
  'api_keys has unique index on (user_id, service)'
);

-- User plans unique index (one plan per user)
SELECT has_index(
  'public', 'user_plans', 'idx_user_plans_user_unique',
  'user_plans has unique index on user_id'
);

SELECT finish();
ROLLBACK;
