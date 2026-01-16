-- Migration: Create Conversation Tracking Tables
-- Zone G Week 8: Unified conversation tracking for SMS, calls, voice memos, email, notes
-- All communication with leads/deals in one timeline

-- ============================================================================
-- CREATE CONVERSATION_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization/ownership
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Note: user_id references auth.users directly (consistent with 14+ existing tables)
  -- Workspace isolation is enforced via workspace_id + RLS policies checking workspace_members
  -- Future: Consider refactoring all user_id references to use profiles table (separate project)
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Related entities (at least one should be set)
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES re_pipeline(id) ON DELETE SET NULL,

  -- Conversation type
  type TEXT NOT NULL CHECK (type IN ('sms', 'call', 'voice_memo', 'email', 'note')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),

  -- Content
  content TEXT,                    -- Main message content
  transcript TEXT,                 -- For voice memos and calls (AI transcription)
  subject TEXT,                    -- For email

  -- Call/voice memo specific
  duration_seconds INTEGER,

  -- Contact info
  phone_number TEXT,
  email_address TEXT,

  -- AI analysis results (populated by background job)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  key_phrases TEXT[],              -- Important phrases extracted by AI
  action_items TEXT[],             -- Action items extracted by AI
  ai_summary TEXT,                 -- Short AI-generated summary

  -- External references
  twilio_message_sid TEXT,         -- For SMS via Twilio
  sms_inbox_id UUID REFERENCES sms_inbox(id) ON DELETE SET NULL, -- Link to raw SMS inbox

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  occurred_at TIMESTAMPTZ DEFAULT NOW(), -- When the conversation actually happened (may differ from created_at)

  -- Soft delete
  is_archived BOOLEAN DEFAULT FALSE,

  -- Constraint: must have at least one parent (lead or deal)
  -- Both can be set for deals linked to leads (shows in both timelines)
  CONSTRAINT conversation_items_parent_check CHECK (lead_id IS NOT NULL OR pipeline_id IS NOT NULL)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying by lead
CREATE INDEX idx_conversation_items_lead
  ON conversation_items(lead_id, occurred_at DESC)
  WHERE NOT is_archived;

-- Index for querying by deal/pipeline
CREATE INDEX idx_conversation_items_pipeline
  ON conversation_items(pipeline_id, occurred_at DESC)
  WHERE NOT is_archived;

-- Index for querying by user
CREATE INDEX idx_conversation_items_user
  ON conversation_items(user_id, occurred_at DESC)
  WHERE NOT is_archived;

-- Index for type filtering
CREATE INDEX idx_conversation_items_type
  ON conversation_items(type, occurred_at DESC)
  WHERE NOT is_archived;

-- Index for recent items
CREATE INDEX idx_conversation_items_recent
  ON conversation_items(occurred_at DESC)
  WHERE NOT is_archived;

-- Index for items needing AI analysis (no sentiment yet)
CREATE INDEX idx_conversation_items_needs_analysis
  ON conversation_items(created_at)
  WHERE sentiment IS NULL AND content IS NOT NULL AND NOT is_archived;

-- Full text search on content and transcript
CREATE INDEX idx_conversation_items_content_gin
  ON conversation_items USING GIN(to_tsvector('english', COALESCE(content, '') || ' ' || COALESCE(transcript, '')));

-- Index for finding SMS by Twilio SID (deduplication)
CREATE UNIQUE INDEX idx_conversation_items_twilio_sid
  ON conversation_items(twilio_message_sid)
  WHERE twilio_message_sid IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversation_items ENABLE ROW LEVEL SECURITY;

-- Users can view conversation items in their workspace
CREATE POLICY "Users can view workspace conversation items"
  ON conversation_items FOR SELECT
  USING (
    auth.uid() = user_id OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert conversation items for their own user_id
CREATE POLICY "Users can insert own conversation items"
  ON conversation_items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own conversation items
CREATE POLICY "Users can update own conversation items"
  ON conversation_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete (archive) their own conversation items
CREATE POLICY "Users can delete own conversation items"
  ON conversation_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_conversation_items_updated_at
  BEFORE UPDATE ON conversation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get conversation timeline for a lead
CREATE OR REPLACE FUNCTION get_lead_conversation_timeline(
  p_lead_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  direction TEXT,
  content TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  sentiment TEXT,
  key_phrases TEXT[],
  action_items TEXT[],
  ai_summary TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.type,
    ci.direction,
    ci.content,
    ci.transcript,
    ci.duration_seconds,
    ci.sentiment,
    ci.key_phrases,
    ci.action_items,
    ci.ai_summary,
    ci.occurred_at,
    ci.created_at
  FROM conversation_items ci
  WHERE ci.lead_id = p_lead_id
    AND NOT ci.is_archived
  ORDER BY ci.occurred_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get conversation timeline for a deal/pipeline
CREATE OR REPLACE FUNCTION get_deal_conversation_timeline(
  p_pipeline_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  direction TEXT,
  content TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  sentiment TEXT,
  key_phrases TEXT[],
  action_items TEXT[],
  ai_summary TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.type,
    ci.direction,
    ci.content,
    ci.transcript,
    ci.duration_seconds,
    ci.sentiment,
    ci.key_phrases,
    ci.action_items,
    ci.ai_summary,
    ci.occurred_at,
    ci.created_at
  FROM conversation_items ci
  WHERE ci.pipeline_id = p_pipeline_id
    AND NOT ci.is_archived
  ORDER BY ci.occurred_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get recent action items across all conversations
CREATE OR REPLACE FUNCTION get_recent_action_items(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  conversation_id UUID,
  lead_id UUID,
  pipeline_id UUID,
  action_item TEXT,
  occurred_at TIMESTAMPTZ,
  conversation_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id AS conversation_id,
    ci.lead_id,
    ci.pipeline_id,
    unnest(ci.action_items) AS action_item,
    ci.occurred_at,
    ci.type AS conversation_type
  FROM conversation_items ci
  WHERE ci.user_id = p_user_id
    AND ci.action_items IS NOT NULL
    AND array_length(ci.action_items, 1) > 0
    AND NOT ci.is_archived
  ORDER BY ci.occurred_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversation_items IS 'Unified conversation tracking - SMS, calls, voice memos, email, notes. Zone G Week 8.';
COMMENT ON COLUMN conversation_items.type IS 'Conversation type: sms, call, voice_memo, email, note';
COMMENT ON COLUMN conversation_items.direction IS 'Direction: inbound (from contact), outbound (from user), internal (note)';
COMMENT ON COLUMN conversation_items.transcript IS 'AI-generated transcript for voice memos and calls';
COMMENT ON COLUMN conversation_items.sentiment IS 'AI-analyzed sentiment: positive, neutral, negative';
COMMENT ON COLUMN conversation_items.key_phrases IS 'AI-extracted key phrases from the conversation';
COMMENT ON COLUMN conversation_items.action_items IS 'AI-extracted action items from the conversation';
COMMENT ON COLUMN conversation_items.ai_summary IS 'AI-generated short summary of the conversation';
COMMENT ON COLUMN conversation_items.occurred_at IS 'When the conversation actually happened (may differ from created_at for imported items)';

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created conversation_items table for unified conversation tracking (Zone G Week 8)',
  jsonb_build_object(
    'migration', '20260116_create_conversation_tracking',
    'table', 'conversation_items',
    'types', ARRAY['sms', 'call', 'voice_memo', 'email', 'note'],
    'features', ARRAY[
      'Unified timeline for all conversations',
      'AI sentiment analysis',
      'AI key phrase extraction',
      'AI action item extraction',
      'Full text search',
      'Links to leads and deals'
    ]
  )
);
