-- Rollback: Notifications Infrastructure
-- Description: Remove notifications table and push token column from profiles

-- Drop the helper function
DROP FUNCTION IF EXISTS get_unread_notification_count(UUID);

-- Drop triggers
DROP TRIGGER IF EXISTS auto_set_notification_read_at ON notifications;
DROP TRIGGER IF EXISTS set_notifications_updated_at ON notifications;

-- Drop trigger functions
DROP FUNCTION IF EXISTS set_notification_read_at();
DROP FUNCTION IF EXISTS update_notifications_updated_at();

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Drop notifications table
DROP TABLE IF EXISTS notifications;

-- Drop push token column from profiles
ALTER TABLE profiles
DROP COLUMN IF EXISTS expo_push_token,
DROP COLUMN IF EXISTS notification_preferences;

-- Drop index (will be dropped with column, but explicit for clarity)
DROP INDEX IF EXISTS idx_profiles_push_token;

-- Log rollback
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration_rollback',
  'Rolled back notifications infrastructure',
  jsonb_build_object(
    'migration', '20260119_notifications_infrastructure',
    'action', 'rollback'
  )
);
