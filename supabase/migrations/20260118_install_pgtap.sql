-- Migration: Install pgTAP testing framework
-- Description: Set up pgTAP extension for database testing
-- Phase: 5 - Testing & Documentation

-- ============================================================================
-- INSTALL PGTAP EXTENSION
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgtap;

-- ============================================================================
-- CREATE TEST SCHEMA
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS tests;

-- Grant permissions to run tests
GRANT USAGE ON SCHEMA tests TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA tests TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tests TO authenticated;

-- ============================================================================
-- CREATE TEST HELPER FUNCTIONS
-- ============================================================================

-- Helper: Create a test user
CREATE OR REPLACE FUNCTION tests.create_test_user(
  user_email TEXT DEFAULT 'test@example.com',
  user_role user_role DEFAULT 'user'
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate unique email if default
  IF user_email = 'test@example.com' THEN
    user_email := 'test_' || gen_random_uuid()::TEXT || '@example.com';
  END IF;

  -- Insert into auth.users (simulated)
  INSERT INTO profiles (id, email, role)
  VALUES (gen_random_uuid(), user_email, user_role)
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Helper: Cleanup test data
CREATE OR REPLACE FUNCTION tests.cleanup_test_data() RETURNS VOID AS $$
BEGIN
  -- Delete test users (cascade will handle related data)
  DELETE FROM profiles WHERE email LIKE 'test_%@example.com';
END;
$$ LANGUAGE plpgsql;

-- Helper: Set current user context for RLS testing
CREATE OR REPLACE FUNCTION tests.set_auth_context(test_user_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, false);
  SET ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

-- Helper: Reset auth context
CREATE OR REPLACE FUNCTION tests.reset_auth_context() RETURNS VOID AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Installed pgTAP testing framework',
  jsonb_build_object(
    'migration', '20260118_install_pgtap',
    'extension', 'pgtap',
    'test_schema', 'tests',
    'helper_functions', ARRAY[
      'create_test_user',
      'cleanup_test_data',
      'set_auth_context',
      'reset_auth_context'
    ]
  )
);
