-- Rollback Migration: Calculation Overrides Table
-- Description: Drop re_calculation_overrides table
-- Phase: Sprint 2 - Portfolio & Creative Finance
-- WARNING: This will delete ALL user calculation overrides

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_calc_overrides_updated_at ON re_calculation_overrides;
DROP FUNCTION IF EXISTS update_calc_overrides_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all calculation overrides" ON re_calculation_overrides;
DROP POLICY IF EXISTS "Users can delete their own calculation overrides" ON re_calculation_overrides;
DROP POLICY IF EXISTS "Users can update their own calculation overrides" ON re_calculation_overrides;
DROP POLICY IF EXISTS "Users can insert their own calculation overrides" ON re_calculation_overrides;
DROP POLICY IF EXISTS "Users can view their own calculation overrides" ON re_calculation_overrides;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS re_calculation_overrides CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back calculation overrides table - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260117_calculation_overrides',
    'action', 'rollback',
    'table_dropped', 're_calculation_overrides',
    'warning', 'All user calculation overrides have been deleted',
    'recovery', 'Restore from backup if this rollback was unintended'
  )
);
