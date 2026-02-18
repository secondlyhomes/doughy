-- Transcript Extractions Table
-- Stores extracted data from call transcripts for the CallPilot -> Claw -> Doughy flow.
-- Server processes transcripts, extracts field updates, user reviews in Claw App.

CREATE TABLE IF NOT EXISTS claw.transcript_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  call_id UUID,              -- callpilot.calls(id) — cross-schema, no FK
  lead_id UUID,
  property_id UUID,
  deal_id UUID,
  extractions JSONB NOT NULL, -- array of { field, value, confidence, source_quote, target_table, target_column, target_path, current_value, action }
  status TEXT NOT NULL DEFAULT 'pending_review', -- 'pending_review', 'partially_approved', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE claw.transcript_extractions ENABLE ROW LEVEL SECURITY;

-- Users can read their own extractions
CREATE POLICY "users_read_own_extractions" ON claw.transcript_extractions
  FOR SELECT USING (auth.uid() = user_id);

-- Server inserts extractions after processing transcripts (service role bypasses RLS)

-- Users can update their own extractions (approve/reject status changes)
CREATE POLICY "users_update_own_extractions" ON claw.transcript_extractions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for recency queries (user's extraction list)
CREATE INDEX idx_transcript_extractions_user_date
  ON claw.transcript_extractions (user_id, created_at DESC);

-- Index for call lookups (linking back to call record)
CREATE INDEX idx_transcript_extractions_call
  ON claw.transcript_extractions (call_id);
