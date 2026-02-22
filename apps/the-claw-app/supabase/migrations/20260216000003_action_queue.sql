-- Action Queue Table
-- Live queue of actions pending approval or countdown.
-- Subscribed to Supabase Realtime for live updates.

CREATE TABLE claw.action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  risk_level TEXT NOT NULL DEFAULT 'low',
  delay_seconds INTEGER DEFAULT 30,
  countdown_ends_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE claw.action_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_queue" ON claw.action_queue
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE claw.action_queue;
