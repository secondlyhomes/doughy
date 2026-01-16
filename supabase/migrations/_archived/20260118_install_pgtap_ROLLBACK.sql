-- Rollback Migration: Install pgTAP Testing Framework
-- Description: Remove pgTAP extension and test helpers
-- Phase: 5 - Testing & Documentation
-- WARNING: This will remove all testing capabilities

-- ============================================================================
-- DROP TEST HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS tests.reset_auth_context();
DROP FUNCTION IF EXISTS tests.set_auth_context(UUID);
DROP FUNCTION IF EXISTS tests.cleanup_test_data();
DROP FUNCTION IF EXISTS tests.create_test_user(TEXT, user_role);

-- ============================================================================
-- REVOKE PERMISSIONS
-- ============================================================================

REVOKE ALL ON ALL SEQUENCES IN SCHEMA tests FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA tests FROM authenticated;
REVOKE USAGE ON SCHEMA tests FROM authenticated;

-- ============================================================================
-- DROP TEST SCHEMA
-- ============================================================================

DROP SCHEMA IF EXISTS tests CASCADE;

-- ============================================================================
-- DROP PGTAP EXTENSION
-- ============================================================================

DROP EXTENSION IF EXISTS pgtap CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back pgTAP testing framework installation',
  jsonb_build_object(
    'migration', '20260118_install_pgtap',
    'action', 'rollback',
    'extension_removed', 'pgtap',
    'schema_dropped', 'tests',
    'helper_functions_removed', ARRAY[
      'create_test_user',
      'cleanup_test_data',
      'set_auth_context',
      'reset_auth_context'
    ],
    'impact', 'Database testing is no longer available'
  )
);
