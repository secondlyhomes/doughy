-- Push Tokens Table
-- Stores Expo push notification tokens for each user/device.
-- App upserts on registration, deactivates on sign-out.

CREATE TABLE IF NOT EXISTS claw.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios',  -- 'ios', 'android', 'web'
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE claw.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "users_own_push_tokens" ON claw.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Index for active tokens lookup (server uses this to send notifications)
CREATE INDEX idx_push_tokens_user_active
  ON claw.push_tokens (user_id, is_active) WHERE is_active = true;
