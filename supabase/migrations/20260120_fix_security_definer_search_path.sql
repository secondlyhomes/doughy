-- Migration: Fix SECURITY DEFINER Functions - Add search_path
-- Description: Add explicit search_path to all SECURITY DEFINER functions to prevent search path attacks
-- Created: 2026-01-20
-- Security Fix: Important

-- ============================================================================
-- FIX get_unread_notification_count FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id AND read = FALSE;
$$ LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public, pg_temp;

-- Add comment explaining the security measure
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user. SECURITY DEFINER with explicit search_path to prevent search path attacks.';

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Fixed SECURITY DEFINER functions by adding explicit search_path',
  jsonb_build_object(
    'migration', '20260120_fix_security_definer_search_path',
    'security_level', 'IMPORTANT',
    'changes', ARRAY[
      'Added SET search_path = public, pg_temp to get_unread_notification_count function',
      'Prevents search path hijacking attacks on SECURITY DEFINER functions'
    ],
    'functions_fixed', ARRAY['get_unread_notification_count'],
    'security_note', 'search_path prevents attackers from creating malicious schemas/functions with higher precedence'
  )
);
