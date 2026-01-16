-- Migration: Add unique constraints to prevent duplicate data
-- Description: Enforce data integrity at database level
-- Phase: 4 - Performance & Quality

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- Profiles: Ensure email uniqueness
ALTER TABLE profiles
  ADD CONSTRAINT IF NOT EXISTS unique_profiles_email UNIQUE (email);

-- API Keys: One key per service per user (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_user_service_unique
  ON api_keys(user_id, service);

-- Re_comps: Prevent duplicate comp entries for same property
CREATE UNIQUE INDEX IF NOT EXISTS idx_re_comps_unique
  ON re_comps(property_id, address, sale_date)
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 're_comps');

-- User_plans: One active plan per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plans_user_unique
  ON user_plans(user_id);

-- Re_property_documents: Prevent duplicate links
-- (Already has PRIMARY KEY on (property_id, document_id), so this is covered)

-- Feature_flags: Ensure unique feature codes
ALTER TABLE feature_flags
  ADD CONSTRAINT IF NOT EXISTS unique_feature_flags_code UNIQUE (code)
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags');

-- System_logs: Allow duplicates (logs should never be unique)
-- No constraint needed

-- ============================================================================
-- CONDITIONAL UNIQUE CONSTRAINTS (partial uniqueness)
-- ============================================================================

-- Deals: Prevent duplicate active deals for same property
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_property_active_unique
  ON deals(property_id)
  WHERE status = 'active' AND property_id IS NOT NULL;

-- Leads: Prevent duplicate emails (case-insensitive, excluding deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique
  ON leads(LOWER(email))
  WHERE email IS NOT NULL AND is_deleted = FALSE;

-- Leads: Prevent duplicate phone numbers (excluding deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_unique
  ON leads(phone)
  WHERE phone IS NOT NULL AND is_deleted = FALSE;

-- Messages: Prevent duplicate Twilio message IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_twilio_id_unique
  ON messages(twilio_message_id)
  WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'twilio_message_id'
  );

-- ============================================================================
-- NOT NULL CONSTRAINTS
-- ============================================================================
-- Ensure critical fields are never null

-- Deals
ALTER TABLE deals
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN stage SET NOT NULL,
  ALTER COLUMN title SET NOT NULL;

-- Leads
ALTER TABLE leads
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- Re_properties
ALTER TABLE re_properties
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN address_line_1 SET NOT NULL,
  ALTER COLUMN city SET NOT NULL,
  ALTER COLUMN state SET NOT NULL,
  ALTER COLUMN zip SET NOT NULL;

-- Re_documents
ALTER TABLE re_documents
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN file_url SET NOT NULL;

-- Re_lead_documents
ALTER TABLE re_lead_documents
  ALTER COLUMN lead_id SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN file_url SET NOT NULL;

-- Profiles
ALTER TABLE profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN role SET NOT NULL;

-- API Keys
ALTER TABLE api_keys
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN service SET NOT NULL,
  ALTER COLUMN key_ciphertext SET NOT NULL;

-- ============================================================================
-- CHECK CONSTRAINTS (validation rules)
-- ============================================================================

-- Deals: Probability must be 0-100
ALTER TABLE deals
  ADD CONSTRAINT IF NOT EXISTS check_deals_probability
  CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100));

-- Leads: Score must be 0-100
ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS check_leads_score
  CHECK (score IS NULL OR (score >= 0 AND score <= 100));

-- Re_properties: Year built must be reasonable
ALTER TABLE re_properties
  ADD CONSTRAINT IF NOT EXISTS check_re_properties_year_built
  CHECK (year_built IS NULL OR (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM NOW()) + 5));

-- Re_properties: Positive numeric values
ALTER TABLE re_properties
  ADD CONSTRAINT IF NOT EXISTS check_re_properties_bedrooms
  CHECK (bedrooms IS NULL OR bedrooms >= 0),
  ADD CONSTRAINT IF NOT EXISTS check_re_properties_bathrooms
  CHECK (bathrooms IS NULL OR bathrooms >= 0),
  ADD CONSTRAINT IF NOT EXISTS check_re_properties_square_feet
  CHECK (square_feet IS NULL OR square_feet > 0),
  ADD CONSTRAINT IF NOT EXISTS check_re_properties_lot_size
  CHECK (lot_size IS NULL OR lot_size > 0);

-- Re_documents: File size must be positive
ALTER TABLE re_documents
  ADD CONSTRAINT IF NOT EXISTS check_re_documents_file_size
  CHECK (file_size IS NULL OR file_size > 0);

-- Re_lead_documents: File size must be positive
ALTER TABLE re_lead_documents
  ADD CONSTRAINT IF NOT EXISTS check_re_lead_documents_file_size
  CHECK (file_size IS NULL OR file_size > 0);

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added unique constraints and validation rules',
  jsonb_build_object(
    'migration', '20260118_add_unique_constraints',
    'unique_constraints', 8,
    'not_null_constraints', 23,
    'check_constraints', 10,
    'benefit', 'Prevents duplicate data and enforces validation at database level'
  )
);
