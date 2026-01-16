-- Rollback Migration: Portfolio Valuations Table
-- Description: Drop re_portfolio_valuations table
-- Phase: Sprint 2 - Portfolio & Creative Finance
-- WARNING: This will delete ALL portfolio valuation history

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_portfolio_valuations_updated_at ON re_portfolio_valuations;
DROP FUNCTION IF EXISTS update_portfolio_valuations_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all valuations" ON re_portfolio_valuations;
DROP POLICY IF EXISTS "Users can delete valuations for their properties" ON re_portfolio_valuations;
DROP POLICY IF EXISTS "Users can update valuations for their properties" ON re_portfolio_valuations;
DROP POLICY IF EXISTS "Users can insert valuations for their properties" ON re_portfolio_valuations;
DROP POLICY IF EXISTS "Users can view valuations for their properties" ON re_portfolio_valuations;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS re_portfolio_valuations CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back portfolio valuations table - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260117_portfolio_valuations',
    'action', 'rollback',
    'table_dropped', 're_portfolio_valuations',
    'warning', 'All historical property valuations have been deleted',
    'recovery', 'Restore from backup if this rollback was unintended'
  )
);
