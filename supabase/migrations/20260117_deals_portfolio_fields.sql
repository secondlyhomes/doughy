-- Migration: Add Portfolio Fields to Deals
-- Description: Track which closed deals have been added to portfolio
-- Phase: Sprint 2 - Portfolio & Creative Finance

-- ============================================================================
-- ADD PORTFOLIO COLUMNS TO DEALS TABLE
-- ============================================================================

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS added_to_portfolio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS portfolio_added_at TIMESTAMPTZ;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Partial index for deals that are in the portfolio
CREATE INDEX IF NOT EXISTS idx_deals_portfolio
  ON deals(user_id, added_to_portfolio, portfolio_added_at DESC)
  WHERE added_to_portfolio = TRUE;

-- Index for querying portfolio status
CREATE INDEX IF NOT EXISTS idx_deals_added_to_portfolio
  ON deals(added_to_portfolio)
  WHERE added_to_portfolio = TRUE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN deals.added_to_portfolio IS 'Whether this closed deal has been added to the portfolio (TRUE when deal status = won and property added to portfolio tracking)';
COMMENT ON COLUMN deals.portfolio_added_at IS 'Timestamp when deal was added to portfolio (should match when added_to_portfolio was set to TRUE)';

-- ============================================================================
-- VALIDATION CONSTRAINT
-- ============================================================================

-- If added_to_portfolio is TRUE, portfolio_added_at must be set
ALTER TABLE deals
ADD CONSTRAINT check_deals_portfolio_added_at
  CHECK (
    (added_to_portfolio = FALSE AND portfolio_added_at IS NULL) OR
    (added_to_portfolio = TRUE AND portfolio_added_at IS NOT NULL)
  );

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added portfolio tracking fields to deals table',
  jsonb_build_object(
    'migration', '20260117_deals_portfolio_fields',
    'table', 'deals',
    'columns_added', ARRAY['added_to_portfolio', 'portfolio_added_at'],
    'indexes_added', 2,
    'purpose', 'Track which closed deals have been added to portfolio management'
  )
);
