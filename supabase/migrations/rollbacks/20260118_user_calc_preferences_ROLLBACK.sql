-- Rollback Migration: User Calculation Preferences Table
-- Description: Drop re_user_calculation_preferences table
-- Phase: Sprint 3 - AI & Automation
-- WARNING: This will delete ALL user calculation preferences

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS auto_create_calc_preferences ON profiles;
DROP TRIGGER IF EXISTS set_user_calc_prefs_updated_at ON re_user_calculation_preferences;
DROP FUNCTION IF EXISTS create_default_calc_preferences();
DROP FUNCTION IF EXISTS update_user_calc_prefs_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all calc preferences" ON re_user_calculation_preferences;
DROP POLICY IF EXISTS "Users can delete their own calc preferences" ON re_user_calculation_preferences;
DROP POLICY IF EXISTS "Users can update their own calc preferences" ON re_user_calculation_preferences;
DROP POLICY IF EXISTS "Users can insert their own calc preferences" ON re_user_calculation_preferences;
DROP POLICY IF EXISTS "Users can view their own calc preferences" ON re_user_calculation_preferences;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS re_user_calculation_preferences CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back user calculation preferences table - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260118_user_calc_preferences',
    'action', 'rollback',
    'table_dropped', 're_user_calculation_preferences',
    'warning', 'All user-specific calculation preferences have been deleted',
    'recovery', 'Restore from backup if this rollback was unintended',
    'impact', 'Users will revert to system default calculation values'
  )
);
