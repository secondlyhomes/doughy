-- Migration: Add Creative Finance Fields to Leads
-- Description: Track seller motivation, timeline, and financial situation for creative financing
-- Phase: Sprint 2 - Portfolio & Creative Finance

-- ============================================================================
-- ADD CREATIVE FINANCE COLUMNS TO LEADS TABLE
-- ============================================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS motivation TEXT
  CHECK(motivation IS NULL OR motivation IN (
    'foreclosure', 'divorce', 'inherited', 'relocating', 'tired_landlord',
    'medical', 'downsizing', 'financial', 'job_loss', 'other'
  )),
ADD COLUMN IF NOT EXISTS motivation_details TEXT,
ADD COLUMN IF NOT EXISTS timeline TEXT
  CHECK(timeline IS NULL OR timeline IN (
    'asap', '1_3_months', '3_6_months', 'flexible', 'no_rush'
  )),
ADD COLUMN IF NOT EXISTS monthly_obligations NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS current_mortgage_status TEXT
  CHECK(current_mortgage_status IS NULL OR current_mortgage_status IN (
    'current', '1_2_behind', '3_plus_behind', 'foreclosure', 'paid_off', 'no_mortgage'
  )),
ADD COLUMN IF NOT EXISTS existing_mortgage_balance NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,3);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying by motivation (e.g., find all foreclosure leads)
CREATE INDEX IF NOT EXISTS idx_leads_motivation
  ON leads(motivation)
  WHERE motivation IS NOT NULL;

-- Index for querying by timeline urgency
CREATE INDEX IF NOT EXISTS idx_leads_timeline
  ON leads(timeline)
  WHERE timeline IS NOT NULL;

-- Index for querying by mortgage status
CREATE INDEX IF NOT EXISTS idx_leads_mortgage_status
  ON leads(current_mortgage_status)
  WHERE current_mortgage_status IS NOT NULL;

-- Composite index for creative finance qualification queries
CREATE INDEX IF NOT EXISTS idx_leads_creative_finance
  ON leads(motivation, timeline, current_mortgage_status)
  WHERE motivation IS NOT NULL AND timeline IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN leads.motivation IS 'Primary reason seller wants to sell (foreclosure, divorce, inherited, etc.)';
COMMENT ON COLUMN leads.motivation_details IS 'Additional details about seller motivation';
COMMENT ON COLUMN leads.timeline IS 'How urgently seller needs to sell (asap, 1-3 months, etc.)';
COMMENT ON COLUMN leads.monthly_obligations IS 'Monthly amount seller needs from sale (for creative financing calculations)';
COMMENT ON COLUMN leads.current_mortgage_status IS 'Current status of existing mortgage (current, behind, foreclosure, etc.)';
COMMENT ON COLUMN leads.existing_mortgage_balance IS 'Remaining balance on existing mortgage';
COMMENT ON COLUMN leads.monthly_payment IS 'Current monthly mortgage payment amount';
COMMENT ON COLUMN leads.interest_rate IS 'Interest rate on existing mortgage (as decimal, e.g., 0.045 for 4.5%)';

-- ============================================================================
-- VALIDATION CONSTRAINTS
-- ============================================================================

-- Monthly obligations should be positive if set
ALTER TABLE leads
ADD CONSTRAINT check_leads_monthly_obligations
  CHECK (monthly_obligations IS NULL OR monthly_obligations >= 0);

-- Existing mortgage balance should be positive if set
ALTER TABLE leads
ADD CONSTRAINT check_leads_mortgage_balance
  CHECK (existing_mortgage_balance IS NULL OR existing_mortgage_balance >= 0);

-- Monthly payment should be positive if set
ALTER TABLE leads
ADD CONSTRAINT check_leads_monthly_payment
  CHECK (monthly_payment IS NULL OR monthly_payment >= 0);

-- Interest rate should be reasonable (0% to 20%)
ALTER TABLE leads
ADD CONSTRAINT check_leads_interest_rate
  CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 0.20));

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added creative finance fields to leads table',
  jsonb_build_object(
    'migration', '20260117_leads_creative_finance',
    'table', 'leads',
    'columns_added', ARRAY[
      'motivation', 'motivation_details', 'timeline',
      'monthly_obligations', 'current_mortgage_status',
      'existing_mortgage_balance', 'monthly_payment', 'interest_rate'
    ],
    'indexes_added', 4,
    'check_constraints_added', 4,
    'purpose', 'Enable creative financing deal qualification and tracking'
  )
);
