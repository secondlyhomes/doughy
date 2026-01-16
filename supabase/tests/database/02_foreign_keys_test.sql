-- Test Suite: Foreign Key Integrity
-- Description: Verify all foreign key relationships are valid and cascades work correctly
-- Phase: 5 - Testing & Documentation

BEGIN;
SELECT plan(25);

-- ============================================================================
-- TEST 1: CRITICAL FOREIGN KEYS EXIST
-- ============================================================================

-- Deals table foreign keys
SELECT has_foreign_key(
  'public', 'deals', ARRAY['user_id'],
  'deals.user_id has foreign key to auth.users'
);

SELECT has_foreign_key(
  'public', 'deals', ARRAY['lead_id'],
  'deals.lead_id has foreign key to leads'
);

SELECT has_foreign_key(
  'public', 'deals', ARRAY['property_id'],
  'deals.property_id has foreign key to re_properties'
);

-- Leads table foreign keys
SELECT has_foreign_key(
  'public', 'leads', ARRAY['user_id'],
  'leads.user_id has foreign key to auth.users'
);

-- Re_properties table foreign keys
SELECT has_foreign_key(
  'public', 're_properties', ARRAY['user_id'],
  're_properties.user_id has foreign key to auth.users'
);

-- Re_documents table foreign keys
SELECT has_foreign_key(
  'public', 're_documents', ARRAY['user_id'],
  're_documents.user_id has foreign key to auth.users'
);

SELECT has_foreign_key(
  'public', 're_documents', ARRAY['property_id'],
  're_documents.property_id has foreign key to re_properties'
);

SELECT has_foreign_key(
  'public', 're_documents', ARRAY['deal_id'],
  're_documents.deal_id has foreign key to deals'
);

-- Re_lead_documents table foreign keys
SELECT has_foreign_key(
  'public', 're_lead_documents', ARRAY['lead_id'],
  're_lead_documents.lead_id has foreign key to leads'
);

-- Re_property_documents junction table foreign keys
SELECT has_foreign_key(
  'public', 're_property_documents', ARRAY['property_id'],
  're_property_documents.property_id has foreign key to re_properties'
);

SELECT has_foreign_key(
  'public', 're_property_documents', ARRAY['document_id'],
  're_property_documents.document_id has foreign key to re_documents'
);

-- API keys table foreign keys
SELECT has_foreign_key(
  'public', 'api_keys', ARRAY['user_id'],
  'api_keys.user_id has foreign key to auth.users'
);

-- User plans table foreign keys
SELECT has_foreign_key(
  'public', 'user_plans', ARRAY['user_id'],
  'user_plans.user_id has foreign key to auth.users'
);

-- Deal events table foreign keys
SELECT has_foreign_key(
  'public', 'deal_events', ARRAY['deal_id'],
  'deal_events.deal_id has foreign key to deals'
);

-- AI jobs table foreign keys
SELECT has_foreign_key(
  'public', 'ai_jobs', ARRAY['deal_id'],
  'ai_jobs.deal_id has foreign key to deals'
);

-- ============================================================================
-- TEST 2: FOREIGN KEY REFERENCES ARE VALID
-- ============================================================================

-- Verify deals.user_id references auth.users.id
SELECT fk_ok(
  'public', 'deals', 'user_id',
  'auth', 'users', 'id',
  'deals.user_id correctly references auth.users.id'
);

-- Verify leads.user_id references auth.users.id
SELECT fk_ok(
  'public', 'leads', 'user_id',
  'auth', 'users', 'id',
  'leads.user_id correctly references auth.users.id'
);

-- Verify re_properties.user_id references auth.users.id
SELECT fk_ok(
  'public', 're_properties', 'user_id',
  'auth', 'users', 'id',
  're_properties.user_id correctly references auth.users.id'
);

-- ============================================================================
-- TEST 3: CASCADE BEHAVIOR WORKS CORRECTLY
-- ============================================================================

-- Test CASCADE DELETE on user deletion
DO $$
DECLARE
  test_user_id UUID := tests.create_test_user('fk_cascade_test@example.com', 'user');
  test_lead_id UUID;
  test_deal_id UUID;
BEGIN
  -- Create test data
  INSERT INTO leads (user_id, name, status)
  VALUES (test_user_id, 'FK Test Lead', 'active')
  RETURNING id INTO test_lead_id;

  INSERT INTO deals (user_id, title, status, stage)
  VALUES (test_user_id, 'FK Test Deal', 'active', 'initial_contact')
  RETURNING id INTO test_deal_id;

  -- Verify data exists
  PERFORM tests.set_auth_context(test_user_id);
END $$;

-- Count records before deletion
SELECT ok(
  (SELECT COUNT(*) FROM leads WHERE name = 'FK Test Lead') = 1,
  'Test lead exists before user deletion'
);

SELECT ok(
  (SELECT COUNT(*) FROM deals WHERE title = 'FK Test Deal') = 1,
  'Test deal exists before user deletion'
);

-- Delete the user (should cascade)
DO $$
DECLARE
  test_user_id UUID := (SELECT id FROM profiles WHERE email = 'fk_cascade_test@example.com');
BEGIN
  DELETE FROM profiles WHERE id = test_user_id;
END $$;

-- Verify cascade deletion worked
SELECT ok(
  (SELECT COUNT(*) FROM leads WHERE name = 'FK Test Lead') = 0,
  'Lead was cascade deleted when user was deleted'
);

SELECT ok(
  (SELECT COUNT(*) FROM deals WHERE title = 'FK Test Deal') = 0,
  'Deal was cascade deleted when user was deleted'
);

-- ============================================================================
-- TEST 4: SET NULL BEHAVIOR WORKS CORRECTLY
-- ============================================================================

-- Test SET NULL on property deletion
DO $$
DECLARE
  test_user_id UUID := tests.create_test_user('fk_set_null_test@example.com', 'user');
  test_property_id UUID;
  test_deal_id UUID;
BEGIN
  PERFORM tests.set_auth_context(test_user_id);

  -- Create property
  INSERT INTO re_properties (user_id, address_line_1, city, state, zip)
  VALUES (test_user_id, '123 Test St', 'Test City', 'CA', '12345')
  RETURNING id INTO test_property_id;

  -- Create deal linked to property
  INSERT INTO deals (user_id, title, status, stage, property_id)
  VALUES (test_user_id, 'Property Link Test', 'active', 'initial_contact', test_property_id)
  RETURNING id INTO test_deal_id;
END $$;

-- Verify deal has property_id before deletion
SELECT ok(
  (SELECT property_id IS NOT NULL FROM deals WHERE title = 'Property Link Test'),
  'Deal has property_id before property deletion'
);

-- Delete the property
DO $$
DECLARE
  test_property_id UUID := (SELECT id FROM re_properties WHERE address_line_1 = '123 Test St');
BEGIN
  DELETE FROM re_properties WHERE id = test_property_id;
END $$;

-- Verify SET NULL worked (deal still exists, but property_id is NULL)
SELECT ok(
  (SELECT COUNT(*) FROM deals WHERE title = 'Property Link Test') = 1,
  'Deal still exists after property deletion (SET NULL, not CASCADE)'
);

SELECT ok(
  (SELECT property_id IS NULL FROM deals WHERE title = 'Property Link Test'),
  'Deal property_id was set to NULL after property deletion'
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
