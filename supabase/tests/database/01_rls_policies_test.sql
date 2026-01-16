-- Test Suite: RLS Policies
-- Description: Verify Row Level Security policies work correctly
-- Phase: 5 - Testing & Documentation

BEGIN;
SELECT plan(30);

-- ============================================================================
-- TEST 1: RLS IS ENABLED ON CRITICAL TABLES
-- ============================================================================

SELECT has_table('public', 'api_keys', 'api_keys table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'api_keys'),
  'RLS is enabled on api_keys'
);

SELECT has_table('public', 'profiles', 'profiles table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'),
  'RLS is enabled on profiles'
);

SELECT has_table('public', 'user_plans', 'user_plans table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_plans'),
  'RLS is enabled on user_plans'
);

SELECT has_table('public', 'deals', 'deals table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'deals'),
  'RLS is enabled on deals'
);

SELECT has_table('public', 'leads', 'leads table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'leads'),
  'RLS is enabled on leads'
);

SELECT has_table('public', 're_properties', 're_properties table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 're_properties'),
  'RLS is enabled on re_properties'
);

-- ============================================================================
-- TEST 2: POLICIES EXIST
-- ============================================================================

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'api_keys') >= 4,
  'api_keys has at least 4 RLS policies'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') >= 3,
  'profiles has at least 3 RLS policies'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'deals') >= 4,
  'deals has at least 4 RLS policies'
);

-- ============================================================================
-- TEST 3: USER CAN ONLY SEE OWN DATA
-- ============================================================================

-- Create test users
DO $$
DECLARE
  user1_id UUID := tests.create_test_user('test_user1@example.com', 'user');
  user2_id UUID := tests.create_test_user('test_user2@example.com', 'user');
BEGIN
  -- Create test data for user1
  INSERT INTO leads (user_id, name, status) VALUES (user1_id, 'Test Lead 1', 'active');
  INSERT INTO deals (user_id, title, status) VALUES (user1_id, 'Test Deal 1', 'active');

  -- Create test data for user2
  INSERT INTO leads (user_id, name, status) VALUES (user2_id, 'Test Lead 2', 'active');
  INSERT INTO deals (user_id, title, status) VALUES (user2_id, 'Test Deal 2', 'active');

  -- Set context to user1
  PERFORM tests.set_auth_context(user1_id);
END $$;

-- User1 should only see their own leads
SELECT results_eq(
  $$SELECT COUNT(*)::int FROM leads WHERE name = 'Test Lead 1'$$,
  ARRAY[1],
  'User can see their own lead'
);

SELECT results_eq(
  $$SELECT COUNT(*)::int FROM leads WHERE name = 'Test Lead 2'$$,
  ARRAY[0],
  'User cannot see other users leads'
);

-- User1 should only see their own deals
SELECT results_eq(
  $$SELECT COUNT(*)::int FROM deals WHERE title = 'Test Deal 1'$$,
  ARRAY[1],
  'User can see their own deal'
);

SELECT results_eq(
  $$SELECT COUNT(*)::int FROM deals WHERE title = 'Test Deal 2'$$,
  ARRAY[0],
  'User cannot see other users deals'
);

-- ============================================================================
-- TEST 4: ADMIN CAN SEE ALL DATA
-- ============================================================================

-- Create admin user
DO $$
DECLARE
  admin_id UUID := tests.create_test_user('test_admin@example.com', 'admin');
BEGIN
  PERFORM tests.set_auth_context(admin_id);
END $$;

-- Admin should see all leads
SELECT ok(
  (SELECT COUNT(*) FROM leads WHERE name LIKE 'Test Lead %') >= 2,
  'Admin can see all leads'
);

-- Admin should see all deals
SELECT ok(
  (SELECT COUNT(*) FROM deals WHERE title LIKE 'Test Deal %') >= 2,
  'Admin can see all deals'
);

-- ============================================================================
-- TEST 5: USERS CANNOT ESCALATE ROLES
-- ============================================================================

-- Reset to regular user
DO $$
DECLARE
  user_id UUID := (SELECT id FROM profiles WHERE email = 'test_user1@example.com');
BEGIN
  PERFORM tests.set_auth_context(user_id);
END $$;

-- Try to escalate own role to admin (should fail)
PREPARE escalate_role AS
  UPDATE profiles SET role = 'admin' WHERE email = 'test_user1@example.com';

SELECT throws_ok(
  'escalate_role',
  NULL,
  NULL,
  'User cannot escalate their own role to admin'
);

-- ============================================================================
-- TEST 6: API KEYS ARE USER-SCOPED
-- ============================================================================

-- Create API keys for different users
DO $$
DECLARE
  user1_id UUID := (SELECT id FROM profiles WHERE email = 'test_user1@example.com');
  user2_id UUID := (SELECT id FROM profiles WHERE email = 'test_user2@example.com');
BEGIN
  INSERT INTO api_keys (user_id, service, key_ciphertext, status)
  VALUES (user1_id, 'openai', 'encrypted_key_1', 'active');

  INSERT INTO api_keys (user_id, service, key_ciphertext, status)
  VALUES (user2_id, 'stripe', 'encrypted_key_2', 'active');

  -- Set context to user1
  PERFORM tests.set_auth_context(user1_id);
END $$;

-- User1 should only see their own API keys
SELECT results_eq(
  $$SELECT COUNT(*)::int FROM api_keys WHERE service = 'openai'$$,
  ARRAY[1],
  'User can see their own API key'
);

SELECT results_eq(
  $$SELECT COUNT(*)::int FROM api_keys WHERE service = 'stripe'$$,
  ARRAY[0],
  'User cannot see other users API keys'
);

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Reset auth context
SELECT tests.reset_auth_context();

-- Cleanup test data
SELECT tests.cleanup_test_data();

SELECT finish();
ROLLBACK;
