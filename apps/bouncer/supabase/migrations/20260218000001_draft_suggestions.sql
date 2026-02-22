-- Draft Suggestions Table
-- AI-generated message drafts for leads. Written by Server, read by CallPilot + Claw App.
-- CallPilot subscribes to Realtime INSERT events filtered by lead_id.

CREATE TABLE IF NOT EXISTS claw.draft_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lead_id UUID,               -- crm.leads(id) — cross-schema, no FK
  contact_id UUID,            -- crm.contacts(id) — cross-schema, no FK
  draft_text TEXT NOT NULL,
  context TEXT,               -- why this draft was generated (e.g. "follow-up after missed call")
  action_type TEXT DEFAULT 'sms',  -- 'sms', 'whatsapp', 'email'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE claw.draft_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can read their own suggestions
CREATE POLICY "users_read_own_drafts" ON claw.draft_suggestions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own suggestions (approve/reject)
CREATE POLICY "users_update_own_drafts" ON claw.draft_suggestions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Server inserts via service role (bypasses RLS)

-- Index for lead lookups (CallPilot's primary query pattern)
CREATE INDEX idx_draft_suggestions_lead
  ON claw.draft_suggestions (lead_id, created_at DESC);

-- Index for user's pending drafts (Claw App display)
CREATE INDEX idx_draft_suggestions_user_status
  ON claw.draft_suggestions (user_id, status, created_at DESC);

-- Enable Realtime for this table (CallPilot subscribes to INSERTs)
ALTER PUBLICATION supabase_realtime ADD TABLE claw.draft_suggestions;
