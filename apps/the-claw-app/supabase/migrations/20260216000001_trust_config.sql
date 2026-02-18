-- Trust Configuration Table
-- Stores per-user trust level settings, countdown config, and action overrides.

CREATE SCHEMA IF NOT EXISTS claw;

CREATE TABLE claw.trust_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  global_level TEXT NOT NULL DEFAULT 'manual',
  countdown_seconds INTEGER NOT NULL DEFAULT 30,
  action_overrides JSONB NOT NULL DEFAULT '[]',
  daily_spend_limit_cents INTEGER DEFAULT 500,
  daily_call_limit INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE claw.trust_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_trust" ON claw.trust_config
  FOR ALL USING (auth.uid() = user_id);
