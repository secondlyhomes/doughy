-- Migration: Investor Communication Tables
-- Description: Tables for Lead Communication Inbox - conversations, messages, AI queue, and adaptive learning
-- Phase: Lead Communication Inbox Feature
-- Note: Mirrors rental_* communication tables for RE Investor platform

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Communication channel for investor communications
CREATE TYPE investor_channel AS ENUM (
  'sms',
  'email',
  'whatsapp',
  'phone'
);

-- Conversation status
CREATE TYPE investor_conversation_status AS ENUM (
  'active',
  'resolved',
  'escalated',
  'archived'
);

-- Message direction (reuse existing if available)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_direction') THEN
    CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
  END IF;
END$$;

-- Message content type (reuse existing if available)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
    CREATE TYPE content_type AS ENUM ('text', 'image', 'file', 'voice', 'video');
  END IF;
END$$;

-- Message sender type for investor context
CREATE TYPE investor_sender AS ENUM ('lead', 'ai', 'user');

-- AI queue status (reuse existing if available)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_queue_status') THEN
    CREATE TYPE ai_queue_status AS ENUM (
      'pending',
      'approved',
      'edited',
      'rejected',
      'expired',
      'sent'
    );
  END IF;
END$$;

-- ============================================================================
-- 1. INVESTOR_CONVERSATIONS TABLE
-- ============================================================================
-- Message threads with leads (mirrors rental_conversations)
CREATE TABLE IF NOT EXISTS investor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES re_properties(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Channel info
  channel investor_channel NOT NULL,
  external_thread_id TEXT, -- Thread ID from external platform (Gmail thread ID, etc.)

  -- Status and settings
  status investor_conversation_status NOT NULL DEFAULT 'active',
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_respond BOOLEAN DEFAULT FALSE, -- Auto-send high-confidence responses

  -- AI settings for this conversation
  ai_confidence_threshold INT DEFAULT 60, -- Min confidence to auto-respond (starts low, rises with learning)

  -- Tracking
  unread_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investor_conversations
CREATE INDEX idx_investor_conversations_user_id ON investor_conversations(user_id);
CREATE INDEX idx_investor_conversations_lead_id ON investor_conversations(lead_id);
CREATE INDEX idx_investor_conversations_property_id ON investor_conversations(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_investor_conversations_deal_id ON investor_conversations(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_investor_conversations_user_status ON investor_conversations(user_id, status);
CREATE INDEX idx_investor_conversations_last_message ON investor_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_investor_conversations_unread ON investor_conversations(user_id, unread_count) WHERE unread_count > 0;
CREATE INDEX idx_investor_conversations_channel ON investor_conversations(channel);

-- ============================================================================
-- 2. INVESTOR_MESSAGES TABLE
-- ============================================================================
-- Individual messages in conversations (mirrors rental_messages)
CREATE TABLE IF NOT EXISTS investor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES investor_conversations(id) ON DELETE CASCADE,

  -- Message details
  direction message_direction NOT NULL,
  content TEXT NOT NULL,
  content_type content_type NOT NULL DEFAULT 'text',

  -- Sender info
  sent_by investor_sender NOT NULL,

  -- AI metadata (for AI-generated messages)
  ai_confidence NUMERIC, -- 0-1 scale
  ai_model TEXT, -- Which model generated this

  -- Delivery status
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Metadata (external_message_id, raw_headers, etc.)
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investor_messages
CREATE INDEX idx_investor_messages_conversation_id ON investor_messages(conversation_id);
CREATE INDEX idx_investor_messages_created_at ON investor_messages(created_at DESC);
CREATE INDEX idx_investor_messages_conversation_created ON investor_messages(conversation_id, created_at DESC);
CREATE INDEX idx_investor_messages_direction ON investor_messages(direction);

-- ============================================================================
-- 3. INVESTOR_AI_QUEUE TABLE
-- ============================================================================
-- Pending AI responses for human review
CREATE TABLE IF NOT EXISTS investor_ai_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  conversation_id UUID NOT NULL REFERENCES investor_conversations(id) ON DELETE CASCADE,
  trigger_message_id UUID REFERENCES investor_messages(id) ON DELETE SET NULL,

  -- AI response
  suggested_response TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1), -- 0-1 scale
  reasoning TEXT, -- Why AI generated this response
  intent TEXT, -- Detected intent: 'price_inquiry', 'availability', 'objection', etc.
  detected_topics TEXT[], -- ['foreclosure', 'timeline', 'repairs', etc.]

  -- Status
  status ai_queue_status NOT NULL DEFAULT 'pending',
  final_response TEXT, -- What was actually sent (may be edited)

  -- Review
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investor_ai_queue
CREATE INDEX idx_investor_ai_queue_user_id ON investor_ai_queue(user_id);
CREATE INDEX idx_investor_ai_queue_conversation_id ON investor_ai_queue(conversation_id);
CREATE INDEX idx_investor_ai_queue_pending ON investor_ai_queue(user_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_investor_ai_queue_status ON investor_ai_queue(status);
CREATE INDEX idx_investor_ai_queue_expires ON investor_ai_queue(expires_at) WHERE status = 'pending';

-- ============================================================================
-- 4. INVESTOR_AI_PATTERNS TABLE
-- ============================================================================
-- Lightweight rules learned from user feedback (memory-efficient)
CREATE TABLE IF NOT EXISTS investor_ai_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context
  lead_situation TEXT NOT NULL, -- 'preforeclosure', 'probate', 'tired_landlord', etc.

  -- Pattern definition
  pattern_type TEXT NOT NULL, -- 'tone', 'avoid', 'prefer', 'template'
  pattern_value TEXT NOT NULL, -- 'empathetic tone', 'avoid pressure tactics', etc.

  -- Learning metadata
  confidence_impact NUMERIC DEFAULT 0.05, -- How much this pattern affects confidence
  times_reinforced INT DEFAULT 1, -- How many times this pattern was confirmed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investor_ai_patterns
CREATE INDEX idx_investor_ai_patterns_user ON investor_ai_patterns(user_id);
CREATE INDEX idx_investor_ai_patterns_user_situation ON investor_ai_patterns(user_id, lead_situation);
CREATE INDEX idx_investor_ai_patterns_type ON investor_ai_patterns(pattern_type);

-- Prevent duplicate patterns
CREATE UNIQUE INDEX idx_investor_ai_patterns_unique
  ON investor_ai_patterns(user_id, lead_situation, pattern_type, pattern_value);

-- ============================================================================
-- 5. INVESTOR_AI_CONFIDENCE TABLE
-- ============================================================================
-- Per user + lead situation type confidence tracking
CREATE TABLE IF NOT EXISTS investor_ai_confidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context
  lead_situation TEXT NOT NULL, -- Matches crm_leads situation or tag

  -- Confidence tracking
  confidence_score NUMERIC DEFAULT 0.6 CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Statistics
  total_approvals INT DEFAULT 0,
  total_edits INT DEFAULT 0,
  total_rejections INT DEFAULT 0,

  -- Auto-send setting
  auto_send_enabled BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user + situation
  CONSTRAINT unique_investor_ai_confidence UNIQUE(user_id, lead_situation)
);

-- Indexes for investor_ai_confidence
CREATE INDEX idx_investor_ai_confidence_user ON investor_ai_confidence(user_id);
CREATE INDEX idx_investor_ai_confidence_auto_send ON investor_ai_confidence(user_id, auto_send_enabled) WHERE auto_send_enabled = TRUE;

-- ============================================================================
-- 6. INVESTOR_AI_RESPONSE_OUTCOMES TABLE
-- ============================================================================
-- Log of AI response outcomes for adaptive learning
CREATE TABLE IF NOT EXISTS investor_ai_response_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related records
  queue_item_id UUID REFERENCES investor_ai_queue(id) ON DELETE SET NULL,
  conversation_id UUID NOT NULL REFERENCES investor_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES investor_messages(id) ON DELETE SET NULL,

  -- Context
  lead_situation TEXT, -- Captured at time of outcome
  channel investor_channel,

  -- Outcome
  outcome TEXT NOT NULL, -- 'approved', 'edited_minor', 'edited_major', 'rejected', 'thumbs_up', 'thumbs_down'
  original_response TEXT,
  final_response TEXT,

  -- Metrics
  original_confidence NUMERIC,
  response_time_seconds INT, -- How long user took to respond

  -- Feedback
  edit_severity TEXT, -- 'none', 'minor', 'major' for edits
  feedback_notes TEXT, -- Optional user notes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investor_ai_response_outcomes
CREATE INDEX idx_investor_ai_response_outcomes_user ON investor_ai_response_outcomes(user_id);
CREATE INDEX idx_investor_ai_response_outcomes_conversation ON investor_ai_response_outcomes(conversation_id);
CREATE INDEX idx_investor_ai_response_outcomes_outcome ON investor_ai_response_outcomes(user_id, outcome);
CREATE INDEX idx_investor_ai_response_outcomes_situation ON investor_ai_response_outcomes(user_id, lead_situation);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE investor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_ai_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_ai_confidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_ai_response_outcomes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- investor_conversations
CREATE POLICY "Users can view their own investor conversations"
  ON investor_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investor conversations"
  ON investor_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investor conversations"
  ON investor_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investor conversations"
  ON investor_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- investor_messages (access via conversation ownership)
CREATE POLICY "Users can view messages in their conversations"
  ON investor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM investor_conversations c
      WHERE c.id = investor_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON investor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investor_conversations c
      WHERE c.id = investor_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- investor_ai_queue
CREATE POLICY "Users can view their own AI queue items"
  ON investor_ai_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI queue items"
  ON investor_ai_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI queue items"
  ON investor_ai_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- investor_ai_patterns
CREATE POLICY "Users can manage their own AI patterns"
  ON investor_ai_patterns FOR ALL
  USING (auth.uid() = user_id);

-- investor_ai_confidence
CREATE POLICY "Users can manage their own AI confidence settings"
  ON investor_ai_confidence FOR ALL
  USING (auth.uid() = user_id);

-- investor_ai_response_outcomes
CREATE POLICY "Users can manage their own AI response outcomes"
  ON investor_ai_response_outcomes FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================
CREATE TRIGGER trigger_investor_conversations_updated_at
  BEFORE UPDATE ON investor_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_investor_ai_patterns_updated_at
  BEFORE UPDATE ON investor_ai_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_investor_ai_confidence_updated_at
  BEFORE UPDATE ON investor_ai_confidence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Update conversation stats on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION update_investor_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE investor_conversations
  SET
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN investor_conversations.unread_count + 1
      ELSE investor_conversations.unread_count
    END,
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_investor_conversation_on_message
  AFTER INSERT ON investor_messages
  FOR EACH ROW EXECUTE FUNCTION update_investor_conversation_on_message();

-- ============================================================================
-- FUNCTION: Update AI confidence based on outcome
-- ============================================================================
CREATE OR REPLACE FUNCTION update_investor_ai_confidence_from_outcome()
RETURNS TRIGGER AS $$
DECLARE
  v_confidence_change NUMERIC;
  v_situation TEXT;
BEGIN
  v_situation := COALESCE(NEW.lead_situation, 'general');

  -- Calculate confidence change based on outcome
  CASE NEW.outcome
    WHEN 'approved' THEN v_confidence_change := 0.10;
    WHEN 'thumbs_up' THEN v_confidence_change := 0.05;
    WHEN 'edited_minor' THEN v_confidence_change := 0.05;
    WHEN 'edited_major' THEN v_confidence_change := 0.00;
    WHEN 'rejected' THEN v_confidence_change := -0.05;
    WHEN 'thumbs_down' THEN v_confidence_change := -0.05;
    ELSE v_confidence_change := 0.00;
  END CASE;

  -- Upsert confidence record
  INSERT INTO investor_ai_confidence (
    user_id,
    lead_situation,
    confidence_score,
    total_approvals,
    total_edits,
    total_rejections
  )
  VALUES (
    NEW.user_id,
    v_situation,
    GREATEST(0, LEAST(1, 0.6 + v_confidence_change)),
    CASE WHEN NEW.outcome IN ('approved', 'thumbs_up') THEN 1 ELSE 0 END,
    CASE WHEN NEW.outcome LIKE 'edited%' THEN 1 ELSE 0 END,
    CASE WHEN NEW.outcome IN ('rejected', 'thumbs_down') THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, lead_situation) DO UPDATE SET
    confidence_score = GREATEST(0, LEAST(1, investor_ai_confidence.confidence_score + v_confidence_change)),
    total_approvals = investor_ai_confidence.total_approvals +
      CASE WHEN NEW.outcome IN ('approved', 'thumbs_up') THEN 1 ELSE 0 END,
    total_edits = investor_ai_confidence.total_edits +
      CASE WHEN NEW.outcome LIKE 'edited%' THEN 1 ELSE 0 END,
    total_rejections = investor_ai_confidence.total_rejections +
      CASE WHEN NEW.outcome IN ('rejected', 'thumbs_down') THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_investor_ai_confidence
  AFTER INSERT ON investor_ai_response_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_investor_ai_confidence_from_outcome();

-- ============================================================================
-- FUNCTION: Get or create conversation
-- ============================================================================
CREATE OR REPLACE FUNCTION get_or_create_investor_conversation(
  p_user_id UUID,
  p_lead_id UUID,
  p_channel investor_channel,
  p_property_id UUID DEFAULT NULL,
  p_deal_id UUID DEFAULT NULL,
  p_external_thread_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing active conversation
  SELECT id INTO v_conversation_id
  FROM investor_conversations
  WHERE user_id = p_user_id
    AND lead_id = p_lead_id
    AND channel = p_channel
    AND status = 'active'
  LIMIT 1;

  -- Create new if not found
  IF v_conversation_id IS NULL THEN
    INSERT INTO investor_conversations (
      user_id, lead_id, channel, property_id, deal_id, external_thread_id
    )
    VALUES (
      p_user_id, p_lead_id, p_channel, p_property_id, p_deal_id, p_external_thread_id
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created investor communication tables for Lead Communication Inbox',
  jsonb_build_object(
    'migration', '20260129140000_investor_communication_tables',
    'tables_created', ARRAY[
      'investor_conversations',
      'investor_messages',
      'investor_ai_queue',
      'investor_ai_patterns',
      'investor_ai_confidence',
      'investor_ai_response_outcomes'
    ],
    'enums_created', ARRAY[
      'investor_channel',
      'investor_conversation_status',
      'investor_sender'
    ],
    'note', 'Powers Lead Communication Inbox feature for RE Investor platform'
  )
);
