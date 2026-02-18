-- Migration: Fix Constraint Syntax Issues
-- Description: Fix invalid "ADD CONSTRAINT IF NOT EXISTS" syntax (not supported in PostgreSQL)
-- Created: 2026-01-20
-- Bug Fix: SQL Syntax

-- ============================================================================
-- FIX UNIQUE CONSTRAINTS (from 20260118_add_unique_constraints.sql)
-- ============================================================================

-- Profiles: Ensure email uniqueness
DO $$
BEGIN
  ALTER TABLE profiles ADD CONSTRAINT unique_profiles_email UNIQUE (email);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- Feature flags: Ensure unique feature codes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    ALTER TABLE feature_flags ADD CONSTRAINT unique_feature_flags_code UNIQUE (code);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- ============================================================================
-- FIX CHECK CONSTRAINTS (from 20260118_add_unique_constraints.sql)
-- ============================================================================

-- Deals: Probability must be 0-100
DO $$
BEGIN
  ALTER TABLE deals ADD CONSTRAINT check_deals_probability
    CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Leads: Score must be 0-100
DO $$
BEGIN
  ALTER TABLE leads ADD CONSTRAINT check_leads_score
    CHECK (score IS NULL OR (score >= 0 AND score <= 100));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Re_properties: Year built must be reasonable
DO $$
BEGIN
  ALTER TABLE re_properties ADD CONSTRAINT check_re_properties_year_built
    CHECK (year_built IS NULL OR (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM NOW()) + 5));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Re_properties: Positive numeric values
DO $$
BEGIN
  ALTER TABLE re_properties ADD CONSTRAINT check_re_properties_bedrooms
    CHECK (bedrooms IS NULL OR bedrooms >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_properties ADD CONSTRAINT check_re_properties_bathrooms
    CHECK (bathrooms IS NULL OR bathrooms >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_properties ADD CONSTRAINT check_re_properties_square_feet
    CHECK (square_feet IS NULL OR square_feet > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_properties ADD CONSTRAINT check_re_properties_lot_size
    CHECK (lot_size IS NULL OR lot_size > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Re_documents: File size must be positive
DO $$
BEGIN
  ALTER TABLE re_documents ADD CONSTRAINT check_re_documents_file_size
    CHECK (file_size IS NULL OR file_size > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Re_lead_documents: File size must be positive
DO $$
BEGIN
  ALTER TABLE re_lead_documents ADD CONSTRAINT check_re_lead_documents_file_size
    CHECK (file_size IS NULL OR file_size > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- FIX ADDITIONAL CONSTRAINTS (from 20260119_additional_constraints.sql)
-- ============================================================================

-- Portfolio valuations constraints
DO $$
BEGIN
  ALTER TABLE re_portfolio_valuations ADD CONSTRAINT check_valuation_value_positive
    CHECK (estimated_value > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_portfolio_valuations ADD CONSTRAINT check_valuation_value_reasonable
    CHECK (estimated_value <= 100000000);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_portfolio_valuations ADD CONSTRAINT check_valuation_date_not_future
    CHECK (valuation_date <= CURRENT_DATE);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Calculation overrides constraints
DO $$
BEGIN
  ALTER TABLE re_calculation_overrides ADD CONSTRAINT check_override_different
    CHECK (override_value != original_value);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_calculation_overrides ADD CONSTRAINT check_override_percentage_metrics
    CHECK (
      metric_name NOT IN ('mao_percentage', 'closing_cost_percentage', 'down_payment_percentage', 'profit_margin', 'rehab_contingency') OR
      (override_value >= 0 AND override_value <= 1)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_calculation_overrides ADD CONSTRAINT check_override_interest_rate
    CHECK (
      metric_name != 'seller_finance_rate' OR
      (override_value >= 0 AND override_value <= 0.20)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- SMS inbox constraints
DO $$
BEGIN
  ALTER TABLE sms_inbox ADD CONSTRAINT check_sms_message_not_empty
    CHECK (LENGTH(TRIM(message_body)) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE sms_inbox ADD CONSTRAINT check_sms_phone_format
    CHECK (phone_number ~* '^\+?[0-9]{10,15}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE sms_inbox ADD CONSTRAINT check_sms_lead_processed
    CHECK (
      lead_id IS NULL OR
      status = 'processed'
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Document templates constraints
DO $$
BEGIN
  ALTER TABLE re_document_templates ADD CONSTRAINT check_template_content_not_empty
    CHECK (LENGTH(TRIM(template_content)) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_document_templates ADD CONSTRAINT check_template_name_not_empty
    CHECK (LENGTH(TRIM(template_name)) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_document_templates ADD CONSTRAINT check_template_variables_array
    CHECK (jsonb_typeof(variables) = 'array');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE re_document_templates ADD CONSTRAINT check_system_template_creator
    CHECK (
      (is_system = FALSE) OR
      (is_system = TRUE AND created_by IS NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Fixed constraint syntax issues by using DO blocks with exception handling',
  jsonb_build_object(
    'migration', '20260120_fix_constraint_syntax',
    'bug_fixed', 'PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS syntax',
    'solution', 'Used DO blocks with BEGIN/EXCEPTION/END to handle duplicate constraints',
    'constraints_fixed', 25,
    'tables_affected', ARRAY[
      'profiles', 'feature_flags', 'deals', 'leads', 're_properties',
      're_documents', 're_lead_documents', 're_portfolio_valuations',
      're_calculation_overrides', 'sms_inbox', 're_document_templates'
    ]
  )
);
