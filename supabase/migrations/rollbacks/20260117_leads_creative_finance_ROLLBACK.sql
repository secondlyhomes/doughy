-- Rollback Migration: Leads Creative Finance Fields
-- Description: Remove creative finance tracking fields from leads table
-- Phase: Sprint 2 - Portfolio & Creative Finance
-- WARNING: This will delete creative finance data for all leads

-- ============================================================================
-- DROP CONSTRAINTS
-- ============================================================================

ALTER TABLE leads
DROP CONSTRAINT IF EXISTS check_leads_interest_rate,
DROP CONSTRAINT IF EXISTS check_leads_monthly_payment,
DROP CONSTRAINT IF EXISTS check_leads_mortgage_balance,
DROP CONSTRAINT IF EXISTS check_leads_monthly_obligations,
DROP CONSTRAINT IF EXISTS check_leads_payment_vs_balance,
DROP CONSTRAINT IF EXISTS check_leads_mortgage_consistency;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_leads_creative_finance;
DROP INDEX IF EXISTS idx_leads_mortgage_status;
DROP INDEX IF EXISTS idx_leads_timeline;
DROP INDEX IF EXISTS idx_leads_motivation;
DROP INDEX IF EXISTS idx_leads_financial_metrics;
DROP INDEX IF EXISTS idx_leads_seller_finance_ready;

-- ============================================================================
-- DROP COLUMNS
-- ============================================================================

ALTER TABLE leads
DROP COLUMN IF EXISTS interest_rate,
DROP COLUMN IF EXISTS monthly_payment,
DROP COLUMN IF EXISTS existing_mortgage_balance,
DROP COLUMN IF EXISTS current_mortgage_status,
DROP COLUMN IF EXISTS monthly_obligations,
DROP COLUMN IF EXISTS timeline,
DROP COLUMN IF EXISTS motivation_details,
DROP COLUMN IF EXISTS motivation;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back creative finance fields from leads table - DATA LOSS',
  jsonb_build_object(
    'migration', '20260117_leads_creative_finance',
    'action', 'rollback',
    'table', 'leads',
    'columns_dropped', ARRAY[
      'motivation', 'motivation_details', 'timeline',
      'monthly_obligations', 'current_mortgage_status',
      'existing_mortgage_balance', 'monthly_payment', 'interest_rate'
    ],
    'warning', 'All creative finance qualification data has been deleted',
    'recovery', 'Restore from backup if this rollback was unintended'
  )
);
