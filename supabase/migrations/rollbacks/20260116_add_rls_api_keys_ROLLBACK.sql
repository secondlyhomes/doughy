-- Rollback Migration: RLS Policies for API Keys
-- Description: Remove RLS policies from api_keys table
-- Phase: 1 - Critical Security

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;

-- ============================================================================
-- DISABLE RLS
-- ============================================================================

ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back RLS policies for api_keys table',
  jsonb_build_object(
    'migration', '20260116_add_rls_api_keys',
    'action', 'rollback',
    'security_impact', 'CRITICAL - API keys are now accessible without RLS protection'
  )
);
