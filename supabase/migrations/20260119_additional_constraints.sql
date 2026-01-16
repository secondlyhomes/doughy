-- Migration: Additional Data Validation Constraints
-- Description: Add CHECK constraints and validation rules for Sprint 2-3 tables
-- Phase: Sprint 4 - Final Optimization

-- ============================================================================
-- PORTFOLIO VALUATIONS CONSTRAINTS
-- ============================================================================

-- Estimated value should be positive and reasonable
ALTER TABLE re_portfolio_valuations
ADD CONSTRAINT IF NOT EXISTS check_valuation_value_positive
  CHECK (estimated_value > 0),
ADD CONSTRAINT IF NOT EXISTS check_valuation_value_reasonable
  CHECK (estimated_value <= 100000000); -- Max $100M

-- Valuation date should not be in the future
ALTER TABLE re_portfolio_valuations
ADD CONSTRAINT IF NOT EXISTS check_valuation_date_not_future
  CHECK (valuation_date <= CURRENT_DATE);

-- ============================================================================
-- DEALS PORTFOLIO FIELDS CONSTRAINTS
-- ============================================================================

-- If portfolio_added_at is set, deal must be in won status
-- (Already enforced by check_deals_portfolio_added_at constraint)

-- ============================================================================
-- LEADS CREATIVE FINANCE CONSTRAINTS
-- ============================================================================

-- Monthly payment should not exceed mortgage balance (sanity check)
ALTER TABLE leads
ADD CONSTRAINT IF NOT EXISTS check_leads_payment_vs_balance
  CHECK (
    monthly_payment IS NULL OR
    existing_mortgage_balance IS NULL OR
    monthly_payment <= existing_mortgage_balance
  );

-- If mortgage exists, mortgage status should be set
ALTER TABLE leads
ADD CONSTRAINT IF NOT EXISTS check_leads_mortgage_consistency
  CHECK (
    (existing_mortgage_balance IS NULL AND current_mortgage_status IN ('paid_off', 'no_mortgage', NULL)) OR
    (existing_mortgage_balance IS NOT NULL AND current_mortgage_status NOT IN ('paid_off', 'no_mortgage', NULL)) OR
    (existing_mortgage_balance IS NULL AND current_mortgage_status IS NULL)
  );

-- ============================================================================
-- CALCULATION OVERRIDES CONSTRAINTS
-- ============================================================================

-- Override value should be different from original value
ALTER TABLE re_calculation_overrides
ADD CONSTRAINT IF NOT EXISTS check_override_different
  CHECK (override_value != original_value);

-- Percentage-based metrics should be between 0 and 1
ALTER TABLE re_calculation_overrides
ADD CONSTRAINT IF NOT EXISTS check_override_percentage_metrics
  CHECK (
    metric_name NOT IN ('mao_percentage', 'closing_cost_percentage', 'down_payment_percentage', 'profit_margin', 'rehab_contingency') OR
    (override_value >= 0 AND override_value <= 1)
  );

-- Interest rate metrics should be reasonable (0% to 20%)
ALTER TABLE re_calculation_overrides
ADD CONSTRAINT IF NOT EXISTS check_override_interest_rate
  CHECK (
    metric_name != 'seller_finance_rate' OR
    (override_value >= 0 AND override_value <= 0.20)
  );

-- ============================================================================
-- SMS INBOX CONSTRAINTS
-- ============================================================================

-- Message body should not be empty
ALTER TABLE sms_inbox
ADD CONSTRAINT IF NOT EXISTS check_sms_message_not_empty
  CHECK (LENGTH(TRIM(message_body)) > 0);

-- Phone number should be in reasonable format
ALTER TABLE sms_inbox
ADD CONSTRAINT IF NOT EXISTS check_sms_phone_format
  CHECK (phone_number ~* '^\+?[0-9]{10,15}$');

-- If converted to lead, status should be processed
ALTER TABLE sms_inbox
ADD CONSTRAINT IF NOT EXISTS check_sms_lead_processed
  CHECK (
    lead_id IS NULL OR
    status = 'processed'
  );

-- ============================================================================
-- DOCUMENT TEMPLATES CONSTRAINTS
-- ============================================================================

-- Template content should not be empty
ALTER TABLE re_document_templates
ADD CONSTRAINT IF NOT EXISTS check_template_content_not_empty
  CHECK (LENGTH(TRIM(template_content)) > 0);

-- Template name should not be empty
ALTER TABLE re_document_templates
ADD CONSTRAINT IF NOT EXISTS check_template_name_not_empty
  CHECK (LENGTH(TRIM(template_name)) > 0);

-- Variables array should be valid JSON array
ALTER TABLE re_document_templates
ADD CONSTRAINT IF NOT EXISTS check_template_variables_array
  CHECK (jsonb_typeof(variables) = 'array');

-- System templates must have NULL created_by
ALTER TABLE re_document_templates
ADD CONSTRAINT IF NOT EXISTS check_system_template_creator
  CHECK (
    (is_system = FALSE) OR
    (is_system = TRUE AND created_by IS NULL)
  );

-- ============================================================================
-- USER CALCULATION PREFERENCES CONSTRAINTS
-- ============================================================================

-- (Already has comprehensive constraints from original migration)
-- No additional constraints needed

-- ============================================================================
-- CROSS-TABLE REFERENTIAL INTEGRITY
-- ============================================================================

-- Ensure calculation overrides reference valid properties/deals
-- (Already enforced by foreign key constraints)

-- Ensure SMS inbox lead_id references valid leads
-- (Already enforced by foreign key constraint)

-- ============================================================================
-- ADDITIONAL NOT NULL CONSTRAINTS
-- ============================================================================

-- Portfolio valuations required fields
ALTER TABLE re_portfolio_valuations
ALTER COLUMN property_id SET NOT NULL,
ALTER COLUMN valuation_date SET NOT NULL,
ALTER COLUMN estimated_value SET NOT NULL,
ALTER COLUMN source SET NOT NULL;

-- SMS inbox required fields
ALTER TABLE sms_inbox
ALTER COLUMN phone_number SET NOT NULL,
ALTER COLUMN message_body SET NOT NULL,
ALTER COLUMN status SET NOT NULL;

-- Document templates required fields
ALTER TABLE re_document_templates
ALTER COLUMN template_name SET NOT NULL,
ALTER COLUMN template_type SET NOT NULL,
ALTER COLUMN template_content SET NOT NULL,
ALTER COLUMN variables SET NOT NULL;

-- Calculation overrides required fields
ALTER TABLE re_calculation_overrides
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN metric_name SET NOT NULL,
ALTER COLUMN original_value SET NOT NULL,
ALTER COLUMN override_value SET NOT NULL;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added additional validation constraints for data integrity',
  jsonb_build_object(
    'migration', '20260119_additional_constraints',
    'check_constraints_added', 14,
    'not_null_constraints_added', 16,
    'tables_affected', ARRAY[
      're_portfolio_valuations',
      'deals',
      'leads',
      're_calculation_overrides',
      'sms_inbox',
      're_document_templates'
    ],
    'purpose', 'Enforce data quality and prevent invalid states at database level'
  )
);
