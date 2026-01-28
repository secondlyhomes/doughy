-- Migration: MoltBot Memory System
-- Description: Creates memory tables for user preferences, global knowledge, and episodic memory
-- Phase: MoltBot Ecosystem Expansion - Phase 2 (Memory System)

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User memory types
CREATE TYPE moltbot_user_memory_type AS ENUM (
  'preference',         -- User preference (e.g., "prefer_morning_checkins")
  'writing_style',      -- Writing style pattern (e.g., "greeting_style", "formality")
  'property_rule',      -- Property-specific rule
  'response_pattern',   -- Learned response pattern
  'contact_rule',       -- Rule for specific contact types
  'template_override',  -- Custom template variation
  'personality_trait'   -- AI personality customization
);

-- Memory source types
CREATE TYPE moltbot_memory_source AS ENUM (
  'manual',             -- Explicitly set by user
  'learned',            -- Learned from user feedback
  'imported',           -- Imported from external source (Fibery, Notion)
  'inferred',           -- Inferred from behavior patterns
  'system'              -- System-generated default
);

-- Global knowledge categories
CREATE TYPE moltbot_knowledge_category AS ENUM (
  'platform_rules',      -- Platform-specific policies (Airbnb, FF, etc.)
  'best_practices',      -- Industry best practices
  'legal_requirements',  -- Legal compliance info
  'faq_patterns',        -- Common question patterns
  'response_templates',  -- Standard response templates
  'community_wisdom'     -- Insights from community discussions
);

-- Episodic memory types
CREATE TYPE moltbot_episodic_type AS ENUM (
  'interaction_summary',  -- Summary of a conversation or interaction
  'preference_learned',   -- Preference learned about a contact
  'issue_history',        -- Record of an issue or complaint
  'booking_context',      -- Context about a booking
  'relationship_note'     -- Note about relationship status
);

-- ============================================================================
-- 1. MOLTBOT_USER_MEMORY (USER.md equivalent)
-- ============================================================================
-- Per-user preferences and learned patterns
-- This is the primary way MoltBot personalizes responses per landlord

CREATE TABLE IF NOT EXISTS moltbot_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Memory classification
  memory_type moltbot_user_memory_type NOT NULL,
  key TEXT NOT NULL,                     -- Unique key within type (e.g., "greeting_style")
  value JSONB NOT NULL,                  -- The actual memory content

  -- Scope (optional - for property/channel specific memories)
  property_id UUID,                      -- If memory is property-specific
  channel TEXT,                          -- If memory is channel-specific (email, whatsapp, etc.)
  contact_type TEXT,                     -- If memory applies to specific contact type

  -- Memory metadata
  source moltbot_memory_source DEFAULT 'learned',
  confidence NUMERIC(5,4) DEFAULT 1.0000 CHECK (confidence >= 0 AND confidence <= 1),
  use_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,       -- Times used with positive outcome
  last_used_at TIMESTAMPTZ,

  -- Learning metadata
  learned_from_outcome_id UUID,          -- Reference to ai_response_outcomes
  external_source_id TEXT,               -- ID from external system (Fibery, Notion)
  external_source_type TEXT,             -- Type of external source

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index: one memory per user/type/key/scope combination
-- Using index instead of constraint to allow COALESCE expressions
CREATE UNIQUE INDEX idx_user_memory_unique ON moltbot_user_memory(
  user_id,
  memory_type,
  key,
  COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(channel, ''),
  COALESCE(contact_type, '')
);

-- Indexes for efficient memory retrieval
CREATE INDEX idx_user_memory_lookup ON moltbot_user_memory(user_id, memory_type);
CREATE INDEX idx_user_memory_key ON moltbot_user_memory(user_id, key);
CREATE INDEX idx_user_memory_property ON moltbot_user_memory(user_id, property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_user_memory_confidence ON moltbot_user_memory(user_id, confidence DESC) WHERE confidence > 0.5;

-- ============================================================================
-- 2. MOLTBOT_GLOBAL_KNOWLEDGE (SOUL.md equivalent)
-- ============================================================================
-- Global knowledge and best practices shared across all users
-- Managed by admins, provides baseline knowledge for all MoltBot instances

CREATE TABLE IF NOT EXISTS moltbot_global_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Knowledge classification
  category moltbot_knowledge_category NOT NULL,
  key TEXT NOT NULL,                     -- Unique key within category
  value JSONB NOT NULL,                  -- The knowledge content

  -- Applicability
  applies_to_platforms TEXT[],           -- ['landlord', 'investor', 'personal'] or NULL for all
  applies_to_channels TEXT[],            -- ['email', 'whatsapp'] or NULL for all
  applies_to_regions TEXT[],             -- ['US', 'CA'] or NULL for all

  -- Content metadata
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  -- Source tracking
  source_url TEXT,                       -- Where this knowledge came from
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique key per category
  CONSTRAINT unique_global_knowledge UNIQUE (category, key)
);

-- Indexes for knowledge retrieval
CREATE INDEX idx_global_knowledge_category ON moltbot_global_knowledge(category) WHERE is_active = true;
CREATE INDEX idx_global_knowledge_platform ON moltbot_global_knowledge USING GIN (applies_to_platforms) WHERE is_active = true;
CREATE INDEX idx_global_knowledge_priority ON moltbot_global_knowledge(category, priority DESC) WHERE is_active = true;

-- ============================================================================
-- 3. MOLTBOT_EPISODIC_MEMORY (Per-contact conversation summaries)
-- ============================================================================
-- Stores summaries and learnings from interactions with specific contacts
-- Enables MoltBot to remember past interactions and personalize responses

CREATE TABLE IF NOT EXISTS moltbot_episodic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact reference
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  contact_email TEXT,                    -- Backup if contact is deleted
  contact_phone TEXT,                    -- Backup identifier

  -- Memory content
  memory_type moltbot_episodic_type NOT NULL,
  summary TEXT NOT NULL,                 -- Human-readable summary
  key_facts JSONB,                       -- Structured facts extracted
  context JSONB,                         -- Additional context

  -- Sentiment and importance
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),

  -- Source tracking
  source_conversation_id UUID,           -- Conversation this memory came from
  source_message_ids UUID[],             -- Specific messages referenced

  -- Lifecycle
  expires_at TIMESTAMPTZ,                -- NULL = never expires
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for episodic memory retrieval
CREATE INDEX idx_episodic_contact ON moltbot_episodic_memory(user_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_episodic_type ON moltbot_episodic_memory(user_id, memory_type);
CREATE INDEX idx_episodic_importance ON moltbot_episodic_memory(user_id, importance DESC) WHERE is_active = true;
CREATE INDEX idx_episodic_recent ON moltbot_episodic_memory(user_id, created_at DESC) WHERE is_active = true;

-- Index for finding unexpired memories
CREATE INDEX idx_episodic_active ON moltbot_episodic_memory(user_id, is_active)
  WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW());

-- ============================================================================
-- 4. MOLTBOT_RESPONSE_EXAMPLES
-- ============================================================================
-- Stores examples of good responses for learning and reference
-- Can be from user's own history or imported templates

CREATE TABLE IF NOT EXISTS moltbot_response_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Example classification
  category TEXT NOT NULL,                -- 'inquiry', 'complaint', 'check_in', etc.
  subcategory TEXT,                      -- More specific classification
  topic TEXT,                            -- Primary topic (wifi, pricing, etc.)

  -- The example
  trigger_message TEXT NOT NULL,         -- What the guest said
  response TEXT NOT NULL,                -- The good response
  context JSONB,                         -- Any relevant context

  -- Quality metrics
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  outcome TEXT,                          -- 'positive', 'negative', 'neutral'
  is_verified BOOLEAN DEFAULT false,     -- Manually verified as good example

  -- Source
  source TEXT NOT NULL,                  -- 'user_approved', 'imported', 'generated'
  source_conversation_id UUID,

  -- Usage
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for response example lookup
CREATE INDEX idx_response_examples_category ON moltbot_response_examples(user_id, category) WHERE is_active = true;
CREATE INDEX idx_response_examples_topic ON moltbot_response_examples(user_id, topic) WHERE is_active = true;
CREATE INDEX idx_response_examples_quality ON moltbot_response_examples(user_id, rating DESC) WHERE is_active = true AND is_verified = true;

-- ============================================================================
-- 5. MOLTBOT_LEARNING_QUEUE
-- ============================================================================
-- Queue for processing learning opportunities from user interactions
-- Used by background jobs to extract learnings from outcomes

CREATE TABLE IF NOT EXISTS moltbot_learning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Learning source
  outcome_id UUID NOT NULL,              -- Reference to ai_response_outcomes
  conversation_id UUID,
  contact_id UUID,

  -- Learning context
  original_response TEXT NOT NULL,
  final_response TEXT,                   -- If edited
  outcome TEXT NOT NULL,                 -- 'approved', 'edited', 'rejected'

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Extracted learnings (filled during processing)
  extracted_learnings JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queue processing
CREATE INDEX idx_learning_queue_pending ON moltbot_learning_queue(status, created_at)
  WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE moltbot_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_global_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_episodic_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_response_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_learning_queue ENABLE ROW LEVEL SECURITY;

-- User memory: Users can only access their own memories
CREATE POLICY "Users can view own memories"
  ON moltbot_user_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON moltbot_user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON moltbot_user_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON moltbot_user_memory FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user memories"
  ON moltbot_user_memory FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Global knowledge: Anyone can read, only service role can modify
CREATE POLICY "Anyone can read global knowledge"
  ON moltbot_global_knowledge FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages global knowledge"
  ON moltbot_global_knowledge FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Episodic memory: Users can only access their own
CREATE POLICY "Users can view own episodic memories"
  ON moltbot_episodic_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own episodic memories"
  ON moltbot_episodic_memory FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to episodic memories"
  ON moltbot_episodic_memory FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Response examples: Users can only access their own
CREATE POLICY "Users can view own response examples"
  ON moltbot_response_examples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own response examples"
  ON moltbot_response_examples FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to response examples"
  ON moltbot_response_examples FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Learning queue: Service role only
CREATE POLICY "Service role manages learning queue"
  ON moltbot_learning_queue FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get all relevant user memories for AI context
CREATE OR REPLACE FUNCTION get_user_memory_context(
  p_user_id UUID,
  p_property_id UUID DEFAULT NULL,
  p_channel TEXT DEFAULT NULL,
  p_contact_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'preferences', (
      SELECT jsonb_object_agg(key, value)
      FROM moltbot_user_memory
      WHERE user_id = p_user_id
        AND memory_type = 'preference'
        AND confidence > 0.5
        AND (property_id IS NULL OR property_id = p_property_id)
        AND (channel IS NULL OR channel = p_channel)
    ),
    'writing_style', (
      SELECT jsonb_object_agg(key, value)
      FROM moltbot_user_memory
      WHERE user_id = p_user_id
        AND memory_type = 'writing_style'
        AND confidence > 0.5
    ),
    'property_rules', (
      SELECT jsonb_agg(value)
      FROM moltbot_user_memory
      WHERE user_id = p_user_id
        AND memory_type = 'property_rule'
        AND (property_id IS NULL OR property_id = p_property_id)
        AND confidence > 0.5
    ),
    'contact_rules', (
      SELECT jsonb_agg(value)
      FROM moltbot_user_memory
      WHERE user_id = p_user_id
        AND memory_type = 'contact_rule'
        AND (contact_type IS NULL OR contact_type = p_contact_type)
        AND confidence > 0.5
    ),
    'personality_traits', (
      SELECT jsonb_object_agg(key, value)
      FROM moltbot_user_memory
      WHERE user_id = p_user_id
        AND memory_type = 'personality_trait'
        AND confidence > 0.5
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Function to get episodic memories for a contact
CREATE OR REPLACE FUNCTION get_contact_episodic_memories(
  p_user_id UUID,
  p_contact_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  memory_type moltbot_episodic_type,
  summary TEXT,
  key_facts JSONB,
  sentiment TEXT,
  importance INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    em.memory_type,
    em.summary,
    em.key_facts,
    em.sentiment,
    em.importance,
    em.created_at
  FROM moltbot_episodic_memory em
  WHERE em.user_id = p_user_id
    AND em.contact_id = p_contact_id
    AND em.is_active = true
    AND (em.expires_at IS NULL OR em.expires_at > NOW())
  ORDER BY em.importance DESC, em.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to store a user memory with upsert
CREATE OR REPLACE FUNCTION store_user_memory(
  p_user_id UUID,
  p_memory_type moltbot_user_memory_type,
  p_key TEXT,
  p_value JSONB,
  p_source moltbot_memory_source DEFAULT 'learned',
  p_confidence NUMERIC DEFAULT 1.0,
  p_property_id UUID DEFAULT NULL,
  p_channel TEXT DEFAULT NULL,
  p_contact_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  INSERT INTO moltbot_user_memory (
    user_id,
    memory_type,
    key,
    value,
    source,
    confidence,
    property_id,
    channel,
    contact_type
  ) VALUES (
    p_user_id,
    p_memory_type,
    p_key,
    p_value,
    p_source,
    p_confidence,
    p_property_id,
    p_channel,
    p_contact_type
  )
  ON CONFLICT (user_id, memory_type, key, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(channel, ''), COALESCE(contact_type, ''))
  DO UPDATE SET
    value = p_value,
    confidence = GREATEST(moltbot_user_memory.confidence, p_confidence),
    updated_at = NOW()
  RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$$;

-- Function to store episodic memory
CREATE OR REPLACE FUNCTION store_episodic_memory(
  p_user_id UUID,
  p_contact_id UUID,
  p_memory_type moltbot_episodic_type,
  p_summary TEXT,
  p_key_facts JSONB DEFAULT NULL,
  p_sentiment TEXT DEFAULT 'neutral',
  p_importance INTEGER DEFAULT 5,
  p_conversation_id UUID DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_memory_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calculate expiration if specified
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO moltbot_episodic_memory (
    user_id,
    contact_id,
    memory_type,
    summary,
    key_facts,
    sentiment,
    importance,
    source_conversation_id,
    expires_at
  ) VALUES (
    p_user_id,
    p_contact_id,
    p_memory_type,
    p_summary,
    p_key_facts,
    p_sentiment,
    p_importance,
    p_conversation_id,
    v_expires_at
  )
  RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$$;

-- Function to record memory usage and update stats
CREATE OR REPLACE FUNCTION record_memory_usage(
  p_memory_id UUID,
  p_was_successful BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE moltbot_user_memory
  SET
    use_count = use_count + 1,
    success_count = success_count + (CASE WHEN p_was_successful THEN 1 ELSE 0 END),
    last_used_at = NOW(),
    -- Adjust confidence based on success rate
    confidence = LEAST(1.0, confidence + (CASE WHEN p_was_successful THEN 0.01 ELSE -0.05 END))
  WHERE id = p_memory_id;
END;
$$;

-- Function to queue a learning opportunity
CREATE OR REPLACE FUNCTION queue_learning_opportunity(
  p_user_id UUID,
  p_outcome_id UUID,
  p_conversation_id UUID,
  p_contact_id UUID,
  p_original_response TEXT,
  p_final_response TEXT,
  p_outcome TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO moltbot_learning_queue (
    user_id,
    outcome_id,
    conversation_id,
    contact_id,
    original_response,
    final_response,
    outcome
  ) VALUES (
    p_user_id,
    p_outcome_id,
    p_conversation_id,
    p_contact_id,
    p_original_response,
    p_final_response,
    p_outcome
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on user_memory modification
CREATE OR REPLACE FUNCTION update_user_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_memory_updated_at
  BEFORE UPDATE ON moltbot_user_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_updated_at();

-- Update updated_at on episodic_memory modification
CREATE TRIGGER trigger_episodic_memory_updated_at
  BEFORE UPDATE ON moltbot_episodic_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_updated_at();

-- Update updated_at on response_examples modification
CREATE TRIGGER trigger_response_examples_updated_at
  BEFORE UPDATE ON moltbot_response_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_updated_at();

-- Update updated_at on global_knowledge modification
CREATE TRIGGER trigger_global_knowledge_updated_at
  BEFORE UPDATE ON moltbot_global_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_updated_at();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE moltbot_user_memory IS 'Per-user learned preferences and patterns (USER.md equivalent)';
COMMENT ON TABLE moltbot_global_knowledge IS 'Global knowledge and best practices (SOUL.md equivalent)';
COMMENT ON TABLE moltbot_episodic_memory IS 'Per-contact interaction summaries and learnings';
COMMENT ON TABLE moltbot_response_examples IS 'Examples of good responses for learning and reference';
COMMENT ON TABLE moltbot_learning_queue IS 'Queue for processing learning opportunities from user interactions';

COMMENT ON FUNCTION get_user_memory_context IS 'Get all relevant user memories formatted for AI context injection';
COMMENT ON FUNCTION get_contact_episodic_memories IS 'Get past interaction summaries for a specific contact';
COMMENT ON FUNCTION store_user_memory IS 'Store or update a user memory with automatic upsert';
COMMENT ON FUNCTION store_episodic_memory IS 'Store a new episodic memory for a contact';
COMMENT ON FUNCTION record_memory_usage IS 'Record that a memory was used and update its stats';
COMMENT ON FUNCTION queue_learning_opportunity IS 'Queue a user interaction for learning extraction';
