-- Migration: Notifications Infrastructure
-- Description: Add push token to profiles and create notifications table for in-app notifications
-- Phase: Sprint 3 - AI & Automation
-- Zone: D (Integrations)

-- ============================================================================
-- ADD PUSH TOKEN TO PROFILES
-- ============================================================================

-- Add expo_push_token column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"push": true, "email": true, "sms": false}'::jsonb;

-- Index for finding users with push tokens
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON profiles(expo_push_token)
  WHERE expo_push_token IS NOT NULL;

COMMENT ON COLUMN profiles.expo_push_token IS 'Expo push notification token for sending mobile notifications';
COMMENT ON COLUMN profiles.notification_preferences IS 'User preferences for notification channels: push, email, sms';

-- ============================================================================
-- CREATE NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('deal_reminder', 'lead_update', 'system', 'team', 'document')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional payload (deal_id, lead_id, etc.)
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  push_sent BOOLEAN NOT NULL DEFAULT FALSE,
  push_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for user's unread notifications (most common query)
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read = FALSE;

-- Index for user's all notifications
CREATE INDEX idx_notifications_user_all
  ON notifications(user_id, created_at DESC);

-- Index for notification type
CREATE INDEX idx_notifications_type
  ON notifications(type, created_at DESC);

-- Index for pending push notifications
CREATE INDEX idx_notifications_pending_push
  ON notifications(created_at)
  WHERE push_sent = FALSE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only system (service role) can insert notifications
-- This is enforced by not having an INSERT policy for authenticated users
-- Edge functions use service role key which bypasses RLS

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Auto-set read_at when marking as read
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = TRUE AND OLD.read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  WHEN (NEW.read = TRUE AND OLD.read = FALSE)
  EXECUTE FUNCTION set_notification_read_at();

-- ============================================================================
-- HELPER FUNCTION: Get unread notification count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id AND read = FALSE;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notifications IS 'In-app notifications for users (deal reminders, lead updates, system messages)';
COMMENT ON COLUMN notifications.type IS 'Notification type: deal_reminder, lead_update, system, team, document';
COMMENT ON COLUMN notifications.data IS 'Additional data payload (e.g., deal_id, lead_id, property_id)';
COMMENT ON COLUMN notifications.push_sent IS 'Whether push notification was sent via Expo';
COMMENT ON COLUMN notifications.email_sent IS 'Whether email notification was sent via Resend';

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created notifications infrastructure for push, email, and in-app notifications',
  jsonb_build_object(
    'migration', '20260119_notifications_infrastructure',
    'tables_created', ARRAY['notifications'],
    'columns_added', ARRAY['profiles.expo_push_token', 'profiles.notification_preferences'],
    'zone', 'D (Integrations)',
    'purpose', 'Support push notifications via Expo and in-app notification center'
  )
);
