-- Rollback Migration: RLS Policies for Profiles
-- Description: Remove RLS policies from profiles table
-- Phase: 1 - Critical Security

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- ============================================================================
-- DISABLE RLS
-- ============================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back RLS policies for profiles table',
  jsonb_build_object(
    'migration', '20260116_add_rls_profiles',
    'action', 'rollback',
    'security_impact', 'CRITICAL - User profiles are now accessible without RLS protection'
  )
);
