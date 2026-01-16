-- Rollback Migration: SMS Inbox Table
-- Description: Drop sms_inbox table
-- Phase: Sprint 3 - AI & Automation
-- WARNING: This will delete ALL SMS message history

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS auto_set_sms_processed_at ON sms_inbox;
DROP TRIGGER IF EXISTS set_sms_inbox_updated_at ON sms_inbox;
DROP FUNCTION IF EXISTS set_sms_processed_at();
DROP FUNCTION IF EXISTS update_sms_inbox_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete SMS messages" ON sms_inbox;
DROP POLICY IF EXISTS "Admins can update SMS messages" ON sms_inbox;
DROP POLICY IF EXISTS "Admins can insert SMS messages" ON sms_inbox;
DROP POLICY IF EXISTS "Authenticated users can view SMS inbox" ON sms_inbox;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS sms_inbox CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back SMS inbox table - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260118_sms_inbox',
    'action', 'rollback',
    'table_dropped', 'sms_inbox',
    'warning', 'All SMS message history and AI processing data has been deleted',
    'recovery', 'Restore from backup if this rollback was unintended',
    'impact', 'SMS webhook will fail until table is recreated'
  )
);
