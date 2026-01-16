-- Rollback Migration: RLS Policies for User Plans
-- Description: Remove RLS policies from user_plans table
-- Phase: 1 - Critical Security

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update plans" ON user_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON user_plans;
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;

-- ============================================================================
-- DISABLE RLS
-- ============================================================================

ALTER TABLE user_plans DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back RLS policies for user_plans table',
  jsonb_build_object(
    'migration', '20260116_add_rls_user_plans',
    'action', 'rollback',
    'security_impact', 'CRITICAL - User billing plans are now accessible without RLS protection'
  )
);
