-- Rollback Migration: Additional Data Validation Constraints
-- Description: Remove additional CHECK constraints added in Sprint 4
-- Phase: Sprint 4 - Final Optimization
-- WARNING: This removes data validation protections

-- ============================================================================
-- REMOVE NOT NULL CONSTRAINTS
-- ============================================================================

-- Calculation overrides
ALTER TABLE re_calculation_overrides
ALTER COLUMN override_value DROP NOT NULL,
ALTER COLUMN original_value DROP NOT NULL,
ALTER COLUMN metric_name DROP NOT NULL,
ALTER COLUMN user_id DROP NOT NULL;

-- Document templates
ALTER TABLE re_document_templates
ALTER COLUMN variables DROP NOT NULL,
ALTER COLUMN template_content DROP NOT NULL,
ALTER COLUMN template_type DROP NOT NULL,
ALTER COLUMN template_name DROP NOT NULL;

-- SMS inbox
ALTER TABLE sms_inbox
ALTER COLUMN status DROP NOT NULL,
ALTER COLUMN message_body DROP NOT NULL,
ALTER COLUMN phone_number DROP NOT NULL;

-- Portfolio valuations
ALTER TABLE re_portfolio_valuations
ALTER COLUMN source DROP NOT NULL,
ALTER COLUMN estimated_value DROP NOT NULL,
ALTER COLUMN valuation_date DROP NOT NULL,
ALTER COLUMN property_id DROP NOT NULL;

-- ============================================================================
-- DROP CHECK CONSTRAINTS - DOCUMENT TEMPLATES
-- ============================================================================

ALTER TABLE re_document_templates
DROP CONSTRAINT IF EXISTS check_system_template_creator,
DROP CONSTRAINT IF EXISTS check_template_variables_array,
DROP CONSTRAINT IF EXISTS check_template_name_not_empty,
DROP CONSTRAINT IF EXISTS check_template_content_not_empty;

-- ============================================================================
-- DROP CHECK CONSTRAINTS - SMS INBOX
-- ============================================================================

ALTER TABLE sms_inbox
DROP CONSTRAINT IF EXISTS check_sms_lead_processed,
DROP CONSTRAINT IF EXISTS check_sms_phone_format,
DROP CONSTRAINT IF EXISTS check_sms_message_not_empty;

-- ============================================================================
-- DROP CHECK CONSTRAINTS - CALCULATION OVERRIDES
-- ============================================================================

ALTER TABLE re_calculation_overrides
DROP CONSTRAINT IF EXISTS check_override_interest_rate,
DROP CONSTRAINT IF EXISTS check_override_percentage_metrics,
DROP CONSTRAINT IF EXISTS check_override_different;

-- ============================================================================
-- DROP CHECK CONSTRAINTS - LEADS
-- ============================================================================

ALTER TABLE leads
DROP CONSTRAINT IF EXISTS check_leads_mortgage_consistency,
DROP CONSTRAINT IF EXISTS check_leads_payment_vs_balance;

-- ============================================================================
-- DROP CHECK CONSTRAINTS - PORTFOLIO VALUATIONS
-- ============================================================================

ALTER TABLE re_portfolio_valuations
DROP CONSTRAINT IF EXISTS check_valuation_date_not_future,
DROP CONSTRAINT IF EXISTS check_valuation_value_reasonable,
DROP CONSTRAINT IF EXISTS check_valuation_value_positive;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'critical',
  'migration-rollback',
  'Rolled back additional validation constraints - DATA INTEGRITY REDUCED',
  jsonb_build_object(
    'migration', '20260119_additional_constraints',
    'action', 'rollback',
    'check_constraints_dropped', 14,
    'not_null_constraints_dropped', 16,
    'warning', 'Database can now accept invalid data that was previously prevented',
    'recommendation', 'Re-apply constraints as soon as possible'
  )
);
