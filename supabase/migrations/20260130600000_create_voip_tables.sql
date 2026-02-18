-- Migration: Create VoIP tables for call tracking and AI summaries
-- Part of the VoIP calling feature for Doughy AI

-- ============================================
-- Call Records Table
-- ============================================

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Twilio integration
  twilio_call_sid TEXT UNIQUE,

  -- Call details
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'initiating' CHECK (status IN (
    'initiating', 'ringing', 'connecting', 'connected',
    'on_hold', 'ended', 'failed', 'busy', 'no_answer'
  )),
  phone_number TEXT NOT NULL,

  -- Call metrics
  duration_seconds INTEGER,
  recording_url TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_twilio_sid ON calls(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status) WHERE status NOT IN ('ended', 'failed');

-- RLS policies
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls"
  ON calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calls"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls"
  ON calls FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Call Summaries Table
-- ============================================

CREATE TABLE IF NOT EXISTS call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Transcript and summary
  full_transcript TEXT,
  summary TEXT,

  -- Structured data (AI-extracted)
  key_points JSONB DEFAULT '[]'::JSONB,
  action_items JSONB DEFAULT '[]'::JSONB,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Metadata
  ai_model TEXT,
  processing_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_summaries_call_id ON call_summaries(call_id);

-- RLS policies
ALTER TABLE call_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view summaries for their calls"
  ON call_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_summaries.call_id
      AND calls.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create summaries"
  ON call_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_summaries.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- ============================================
-- Updated_at Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_updated_at();

-- ============================================
-- Call Transcript Segments Table (for real-time transcription)
-- ============================================

CREATE TABLE IF NOT EXISTS call_transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'contact')),
  text TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_transcript_segments_call_id ON call_transcript_segments(call_id);
CREATE INDEX IF NOT EXISTS idx_call_transcript_segments_timestamp ON call_transcript_segments(call_id, timestamp_ms);

-- RLS policies
ALTER TABLE call_transcript_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transcript segments for their calls"
  ON call_transcript_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_transcript_segments.call_id
      AND calls.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert transcript segments"
  ON call_transcript_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_transcript_segments.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- ============================================
-- Call AI Suggestions Table (for real-time coaching)
-- ============================================

CREATE TABLE IF NOT EXISTS call_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('response', 'question', 'action', 'info')),
  text TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  context TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_ai_suggestions_call_id ON call_ai_suggestions(call_id);

-- RLS policies
ALTER TABLE call_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI suggestions for their calls"
  ON call_ai_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_ai_suggestions.call_id
      AND calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update AI suggestion feedback"
  ON call_ai_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_ai_suggestions.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE calls IS 'VoIP call records with Twilio integration';
COMMENT ON TABLE call_summaries IS 'AI-generated summaries and transcripts for calls';
COMMENT ON TABLE call_transcript_segments IS 'Real-time transcription segments during calls';
COMMENT ON TABLE call_ai_suggestions IS 'AI coaching suggestions provided during calls';
COMMENT ON COLUMN calls.twilio_call_sid IS 'Unique Twilio call identifier for webhook correlation';
COMMENT ON COLUMN calls.direction IS 'Whether the call was made (outbound) or received (inbound)';
COMMENT ON COLUMN call_summaries.key_points IS 'JSON array of key discussion points extracted by AI';
COMMENT ON COLUMN call_summaries.action_items IS 'JSON array of action items with completion status';
COMMENT ON COLUMN call_transcript_segments.confidence IS 'Transcription confidence score (0.0 to 1.0)';
COMMENT ON COLUMN call_ai_suggestions.was_helpful IS 'User feedback for ML improvement';
