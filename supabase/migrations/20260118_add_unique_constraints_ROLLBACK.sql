-- Rollback Migration: Unique Constraints and Validation Rules
-- Description: Remove unique, NOT NULL, and CHECK constraints
-- Phase: 4 - Performance & Quality
-- WARNING: This removes data integrity protections

-- ============================================================================
-- DROP UNIQUE CONSTRAINTS
-- ============================================================================

-- Profiles email uniqueness
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS unique_profiles_email;

-- API Keys user+service uniqueness
DROP INDEX IF EXISTS idx_api_keys_user_service_unique;

-- Re_comps uniqueness
DROP INDEX IF EXISTS idx_re_comps_unique;

-- User plans uniqueness
DROP INDEX IF EXISTS idx_user_plans_user_unique;

-- Feature flags uniqueness
ALTER TABLE feature_flags DROP CONSTRAINT IF EXISTS unique_feature_flags_code;

-- Deals active property uniqueness
DROP INDEX IF EXISTS idx_deals_property_active_unique;

-- Leads email uniqueness
DROP INDEX IF EXISTS idx_leads_email_unique;

-- Leads phone uniqueness
DROP INDEX IF EXISTS idx_leads_phone_unique;

-- Messages Twilio ID uniqueness
DROP INDEX IF EXISTS idx_messages_twilio_id_unique;

-- ============================================================================
-- REMOVE NOT NULL CONSTRAINTS
-- ============================================================================

-- Deals
ALTER TABLE deals
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN status DROP NOT NULL,
  ALTER COLUMN stage DROP NOT NULL,
  ALTER COLUMN title DROP NOT NULL;

-- Leads
ALTER TABLE leads
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN status DROP NOT NULL;

-- Re_properties
ALTER TABLE re_properties
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN address_line_1 DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN zip DROP NOT NULL;

-- Re_documents
ALTER TABLE re_documents
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN type DROP NOT NULL,
  ALTER COLUMN file_url DROP NOT NULL;

-- Re_lead_documents
ALTER TABLE re_lead_documents
  ALTER COLUMN lead_id DROP NOT NULL,
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN type DROP NOT NULL,
  ALTER COLUMN file_url DROP NOT NULL;

-- Profiles
ALTER TABLE profiles
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN role DROP NOT NULL;

-- API Keys
ALTER TABLE api_keys
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN service DROP NOT NULL,
  ALTER COLUMN key_ciphertext DROP NOT NULL;

-- ============================================================================
-- DROP CHECK CONSTRAINTS
-- ============================================================================

-- Deals probability constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS check_deals_probability;

-- Leads score constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS check_leads_score;

-- Re_properties year built constraint
ALTER TABLE re_properties DROP CONSTRAINT IF EXISTS check_re_properties_year_built;

-- Re_properties positive numeric values
ALTER TABLE re_properties
  DROP CONSTRAINT IF EXISTS check_re_properties_bedrooms,
  DROP CONSTRAINT IF EXISTS check_re_properties_bathrooms,
  DROP CONSTRAINT IF EXISTS check_re_properties_square_feet,
  DROP CONSTRAINT IF EXISTS check_re_properties_lot_size;

-- Re_documents file size constraint
ALTER TABLE re_documents DROP CONSTRAINT IF EXISTS check_re_documents_file_size;

-- Re_lead_documents file size constraint
ALTER TABLE re_lead_documents DROP CONSTRAINT IF EXISTS check_re_lead_documents_file_size;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'critical',
  'migration-rollback',
  'Rolled back unique constraints and validation rules - DATA INTEGRITY REDUCED',
  jsonb_build_object(
    'migration', '20260118_add_unique_constraints',
    'action', 'rollback',
    'unique_constraints_dropped', 8,
    'not_null_constraints_dropped', 23,
    'check_constraints_dropped', 10,
    'warning', 'Database can now accept duplicate and invalid data',
    'recommendation', 'Re-apply constraints as soon as possible'
  )
);
