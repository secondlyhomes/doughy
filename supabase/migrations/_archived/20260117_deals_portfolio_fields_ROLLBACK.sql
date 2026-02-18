-- Rollback Migration: Deals Portfolio Fields
-- Description: Remove portfolio tracking fields from deals table
-- Phase: Sprint 2 - Portfolio & Creative Finance

-- ============================================================================
-- DROP CONSTRAINTS
-- ============================================================================

ALTER TABLE deals DROP CONSTRAINT IF EXISTS check_deals_portfolio_added_at;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_deals_added_to_portfolio;
DROP INDEX IF EXISTS idx_deals_portfolio;

-- ============================================================================
-- DROP COLUMNS
-- ============================================================================

ALTER TABLE deals
DROP COLUMN IF EXISTS portfolio_added_at,
DROP COLUMN IF EXISTS added_to_portfolio;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration-rollback',
  'Rolled back portfolio fields from deals table',
  jsonb_build_object(
    'migration', '20260117_deals_portfolio_fields',
    'action', 'rollback',
    'table', 'deals',
    'columns_dropped', ARRAY['added_to_portfolio', 'portfolio_added_at'],
    'impact', 'Portfolio tracking data removed from deals'
  )
);
