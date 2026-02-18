-- ============================================================================
-- Push Notifications Database Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- push_tokens table
-- Stores user push notification tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_platform TEXT NOT NULL CHECK (device_platform IN ('ios', 'android')),
  device_name TEXT,
  app_version TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Ensure one token per device
  UNIQUE(token)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_status ON push_tokens(status);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_status ON push_tokens(user_id, status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- ============================================================================
-- notifications table
-- Logs all sent notifications for history/debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  subtitle TEXT,
  data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  expo_ticket_id TEXT,
  expo_receipt_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Optional: Index for querying by data fields
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING GIN (data);

-- ============================================================================
-- scheduled_notifications table (optional)
-- Track scheduled notifications for management
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL, -- Expo notification identifier
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- push_tokens policies

-- Users can view their own tokens
CREATE POLICY "Users can view own push tokens"
  ON push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all tokens (for cleanup/admin)
CREATE POLICY "Service role can manage all push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- notifications policies

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notification status (mark as read)
CREATE POLICY "Users can update own notification status"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service role can insert notifications (sent via Edge Function)
CREATE POLICY "Service role can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- scheduled_notifications policies

-- Users can view their own scheduled notifications
CREATE POLICY "Users can view own scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scheduled notifications
CREATE POLICY "Users can insert own scheduled notifications"
  ON scheduled_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/cancel their own scheduled notifications
CREATE POLICY "Users can update own scheduled notifications"
  ON scheduled_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scheduled notifications
CREATE POLICY "Users can delete own scheduled notifications"
  ON scheduled_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Mark tokens as expired if not used in 90 days
  UPDATE push_tokens
  SET status = 'expired'
  WHERE status = 'active'
    AND (last_used_at < NOW() - INTERVAL '90 days' OR last_used_at IS NULL)
    AND created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notification stats
CREATE OR REPLACE FUNCTION get_user_notification_stats(target_user_id UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_read BIGINT,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'read')) AS total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered') AS total_delivered,
    COUNT(*) FILTER (WHERE status = 'read') AS total_read,
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered') AND read_at IS NULL) AS unread_count
  FROM notifications
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Uncomment to insert sample data

/*
-- Insert test user (assumes auth.users exists)
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com')
ON CONFLICT DO NOTHING;

-- Insert test push token
INSERT INTO push_tokens (user_id, token, device_platform, device_name, app_version)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  'ios',
  'Test iPhone',
  '1.0.0'
);

-- Insert test notification
INSERT INTO notifications (user_id, title, body, status, sent_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Welcome!',
  'Thanks for enabling push notifications',
  'delivered',
  NOW()
);
*/

-- ============================================================================
-- Maintenance
-- ============================================================================

-- Create cron job to clean up expired tokens (requires pg_cron extension)
/*
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 0 * * *', -- Daily at midnight
  $$SELECT cleanup_expired_tokens();$$
);
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
