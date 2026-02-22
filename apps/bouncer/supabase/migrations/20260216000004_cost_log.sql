-- Cost Log Table
-- Tracks per-action costs for billing, budgets, and the "This Month" summary.

CREATE TABLE IF NOT EXISTS claw.cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  service TEXT NOT NULL,         -- 'bland', 'twilio', 'deepgram', 'anthropic'
  action TEXT NOT NULL,          -- 'outbound_call', 'sms', 'whatsapp', 'transcription', 'briefing'
  cost_cents NUMERIC NOT NULL DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE claw.cost_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_costs" ON claw.cost_log
  FOR SELECT USING (auth.uid() = user_id);

-- Index for monthly aggregation queries
CREATE INDEX idx_cost_log_user_month
  ON claw.cost_log (user_id, created_at DESC);
