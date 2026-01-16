-- Test Suite: Constraints & Validation
-- Description: Verify CHECK constraints, NOT NULL, and UNIQUE constraints work correctly
-- Phase: 5 - Testing & Documentation

BEGIN;
SELECT plan(35);

-- ============================================================================
-- TEST 1: CHECK CONSTRAINTS EXIST AND WORK
-- ============================================================================

-- Deals table CHECK constraints
SELECT col_has_check(
  'public', 'deals', 'probability',
  'deals.probability has check constraint'
);

-- Test probability constraint (0-100)
PREPARE invalid_probability AS
  INSERT INTO deals (user_id, title, status, stage, probability)
  VALUES (
    (SELECT id FROM profiles LIMIT 1),
    'Invalid Probability Deal',
    'active',
    'initial_contact',
    150  -- Invalid: > 100
  );

SELECT throws_ok(
  'invalid_probability',
  NULL,
  NULL,
  'Cannot insert deal with probability > 100'
);

-- Leads table CHECK constraints
SELECT col_has_check(
  'public', 'leads', 'score',
  'leads.score has check constraint'
);

-- Test score constraint (0-100)
PREPARE invalid_score AS
  INSERT INTO leads (user_id, name, status, score)
  VALUES (
    (SELECT id FROM profiles LIMIT 1),
    'Invalid Score Lead',
    'new',
    -10  -- Invalid: < 0
  );

SELECT throws_ok(
  'invalid_score',
  NULL,
  NULL,
  'Cannot insert lead with negative score'
);

-- Re_properties CHECK constraints for year_built
SELECT col_has_check(
  'public', 're_properties', 'year_built',
  're_properties.year_built has check constraint'
);

-- Test year_built constraint (reasonable range)
PREPARE invalid_year AS
  INSERT INTO re_properties (user_id, address_line_1, city, state, zip, year_built)
  VALUES (
    (SELECT id FROM profiles LIMIT 1),
    '456 Invalid Year St',
    'Test City',
    'CA',
    '12345',
    1500  -- Invalid: too old
  );

SELECT throws_ok(
  'invalid_year',
  NULL,
  NULL,
  'Cannot insert property with year_built before 1800'
);

-- Re_properties positive numeric values
SELECT col_has_check(
  'public', 're_properties', 'bedrooms',
  're_properties.bedrooms has check constraint'
);

SELECT col_has_check(
  'public', 're_properties', 'bathrooms',
  're_properties.bathrooms has check constraint'
);

SELECT col_has_check(
  'public', 're_properties', 'square_feet',
  're_properties.square_feet has check constraint'
);

-- Test negative bedrooms constraint
PREPARE negative_bedrooms AS
  INSERT INTO re_properties (user_id, address_line_1, city, state, zip, bedrooms)
  VALUES (
    (SELECT id FROM profiles LIMIT 1),
    '789 Negative Bedrooms St',
    'Test City',
    'CA',
    '12345',
    -1  -- Invalid: negative
  );

SELECT throws_ok(
  'negative_bedrooms',
  NULL,
  NULL,
  'Cannot insert property with negative bedrooms'
);

-- ============================================================================
-- TEST 2: NOT NULL CONSTRAINTS
-- ============================================================================

-- Deals required fields
SELECT col_not_null('public', 'deals', 'user_id', 'deals.user_id is NOT NULL');
SELECT col_not_null('public', 'deals', 'title', 'deals.title is NOT NULL');
SELECT col_not_null('public', 'deals', 'status', 'deals.status is NOT NULL');
SELECT col_not_null('public', 'deals', 'stage', 'deals.stage is NOT NULL');

-- Test deals.user_id NOT NULL
PREPARE null_user_id AS
  INSERT INTO deals (user_id, title, status, stage)
  VALUES (NULL, 'Null User Deal', 'active', 'initial_contact');

SELECT throws_ok(
  'null_user_id',
  NULL,
  NULL,
  'Cannot insert deal with NULL user_id'
);

-- Leads required fields
SELECT col_not_null('public', 'leads', 'user_id', 'leads.user_id is NOT NULL');
SELECT col_not_null('public', 'leads', 'name', 'leads.name is NOT NULL');
SELECT col_not_null('public', 'leads', 'status', 'leads.status is NOT NULL');

-- Test leads.name NOT NULL
PREPARE null_name AS
  INSERT INTO leads (user_id, name, status)
  VALUES (
    (SELECT id FROM profiles LIMIT 1),
    NULL,  -- Invalid: name is required
    'new'
  );

SELECT throws_ok(
  'null_name',
  NULL,
  NULL,
  'Cannot insert lead with NULL name'
);

-- Re_properties required fields
SELECT col_not_null('public', 're_properties', 'user_id', 're_properties.user_id is NOT NULL');
SELECT col_not_null('public', 're_properties', 'address_line_1', 're_properties.address_line_1 is NOT NULL');
SELECT col_not_null('public', 're_properties', 'city', 're_properties.city is NOT NULL');
SELECT col_not_null('public', 're_properties', 'state', 're_properties.state is NOT NULL');
SELECT col_not_null('public', 're_properties', 'zip', 're_properties.zip is NOT NULL');

-- Re_documents required fields
SELECT col_not_null('public', 're_documents', 'user_id', 're_documents.user_id is NOT NULL');
SELECT col_not_null('public', 're_documents', 'title', 're_documents.title is NOT NULL');
SELECT col_not_null('public', 're_documents', 'type', 're_documents.type is NOT NULL');
SELECT col_not_null('public', 're_documents', 'file_url', 're_documents.file_url is NOT NULL');

-- Re_lead_documents required fields
SELECT col_not_null('public', 're_lead_documents', 'lead_id', 're_lead_documents.lead_id is NOT NULL');
SELECT col_not_null('public', 're_lead_documents', 'title', 're_lead_documents.title is NOT NULL');
SELECT col_not_null('public', 're_lead_documents', 'type', 're_lead_documents.type is NOT NULL');
SELECT col_not_null('public', 're_lead_documents', 'file_url', 're_lead_documents.file_url is NOT NULL');

-- Profiles required fields
SELECT col_not_null('public', 'profiles', 'email', 'profiles.email is NOT NULL');
SELECT col_not_null('public', 'profiles', 'role', 'profiles.role is NOT NULL');

-- API keys required fields
SELECT col_not_null('public', 'api_keys', 'user_id', 'api_keys.user_id is NOT NULL');
SELECT col_not_null('public', 'api_keys', 'service', 'api_keys.service is NOT NULL');
SELECT col_not_null('public', 'api_keys', 'key_ciphertext', 'api_keys.key_ciphertext is NOT NULL');

-- ============================================================================
-- TEST 3: UNIQUE CONSTRAINTS
-- ============================================================================

-- Profiles email uniqueness
SELECT col_is_unique(
  'public', 'profiles', ARRAY['email'],
  'profiles.email is unique'
);

-- Test duplicate email constraint
DO $$
DECLARE
  test_email TEXT := 'unique_test_' || gen_random_uuid()::TEXT || '@example.com';
BEGIN
  -- Insert first profile
  INSERT INTO profiles (email, role)
  VALUES (test_email, 'user');
END $$;

-- Try to insert duplicate email
PREPARE duplicate_email AS
  INSERT INTO profiles (email, role)
  VALUES (
    (SELECT email FROM profiles WHERE email LIKE 'unique_test_%' LIMIT 1),
    'user'
  );

SELECT throws_ok(
  'duplicate_email',
  NULL,
  NULL,
  'Cannot insert duplicate profile email'
);

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Cleanup test data
DELETE FROM profiles WHERE email LIKE 'unique_test_%';

SELECT finish();
ROLLBACK;
