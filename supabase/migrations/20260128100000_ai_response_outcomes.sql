-- Migration: Create AI response outcomes table for adaptive learning
-- Description: Tracks AI response outcomes to enable learning from user behavior
-- Phase: Zone 2 - AI Enhancement
-- Note: Enables the system to learn which responses get approved vs edited

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- AI mode for landlord settings
CREATE TYPE ai_mode AS ENUM (
  'training',   -- Queue most responses for review, learn from every action
  'assisted',   -- Auto-send high confidence, queue uncertain ones
  'autonomous'  -- Handle almost everything automatically
);

-- Response style preference
CREATE TYPE ai_response_style AS ENUM (
  'friendly',
  'professional',
  'brief'
);

-- Outcome of AI response review
CREATE TYPE ai_outcome AS ENUM (
  'auto_sent',  -- AI sent automatically (high confidence)
  'approved',   -- User approved unchanged
  'edited',     -- User edited before sending
  'rejected'    -- User rejected the response
);

-- Severity of edits made to AI responses
CREATE TYPE ai_edit_severity AS ENUM (
  'none',       -- No changes
  'minor',      -- Small tweaks (typos, phrasing)
  'major'       -- Significant changes to content/meaning
);

-- ============================================================================
-- AI_RESPONSE_OUTCOMES TABLE
-- ============================================================================
-- Tracks every AI response and its outcome for learning
CREATE TABLE IF NOT EXISTS ai_response_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context
  conversation_id UUID REFERENCES rental_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES rental_messages(id) ON DELETE SET NULL,
  property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Classification
  message_type TEXT NOT NULL, -- 'faq', 'inquiry', 'complaint', 'booking_request', 'maintenance', etc.
  topic TEXT NOT NULL,        -- 'wifi', 'pricing', 'availability', 'check_in', 'maintenance', etc.
  contact_type TEXT NOT NULL, -- 'lead', 'guest', 'tenant'
  channel TEXT,               -- 'email', 'whatsapp', 'sms', etc.
  platform TEXT,              -- 'airbnb', 'furnishedfinder', etc.

  -- AI Response Details
  initial_confidence NUMERIC(5,4) NOT NULL CHECK(initial_confidence >= 0 AND initial_confidence <= 1),
  suggested_response TEXT NOT NULL,
  final_response TEXT,        -- What was actually sent (if approved/edited)

  -- Outcome Tracking
  outcome ai_outcome NOT NULL,
  edit_severity ai_edit_severity DEFAULT 'none',

  -- Timing
  response_time_seconds INT,  -- How long user took to review (NULL for auto_sent)

  -- Learning Metadata
  sensitive_topics_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  actions_suggested TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,

  -- Ensure we can track patterns over time
  CONSTRAINT valid_review_timing CHECK (
    (outcome = 'auto_sent' AND reviewed_at IS NULL) OR
    (outcome != 'auto_sent' AND reviewed_at IS NOT NULL)
  )
);

-- ============================================================================
-- INDEXES FOR LEARNING QUERIES
-- ============================================================================

-- User-based filtering
CREATE INDEX idx_ai_outcomes_user_id ON ai_response_outcomes(user_id);

-- Pattern recognition by type/topic
CREATE INDEX idx_ai_outcomes_message_type ON ai_response_outcomes(user_id, message_type);
CREATE INDEX idx_ai_outcomes_topic ON ai_response_outcomes(user_id, topic);
CREATE INDEX idx_ai_outcomes_contact_type ON ai_response_outcomes(user_id, contact_type);

-- Outcome analysis
CREATE INDEX idx_ai_outcomes_outcome ON ai_response_outcomes(user_id, outcome);
CREATE INDEX idx_ai_outcomes_edit_severity ON ai_response_outcomes(user_id, edit_severity)
  WHERE edit_severity != 'none';

-- Time-based analysis (for recent behavior)
CREATE INDEX idx_ai_outcomes_recent ON ai_response_outcomes(user_id, created_at DESC);

-- Confidence calibration
CREATE INDEX idx_ai_outcomes_confidence ON ai_response_outcomes(user_id, initial_confidence);

-- Composite for pattern matching
CREATE INDEX idx_ai_outcomes_pattern ON ai_response_outcomes(
  user_id, message_type, contact_type, outcome
);

-- ============================================================================
-- AI_CONFIDENCE_ADJUSTMENTS TABLE
-- ============================================================================
-- Stores learned confidence adjustments per user
CREATE TABLE IF NOT EXISTS ai_confidence_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What this adjustment applies to
  message_type TEXT,          -- NULL = applies to all
  topic TEXT,                 -- NULL = applies to all in this type
  contact_type TEXT,          -- NULL = applies to all

  -- Adjustment
  confidence_adjustment NUMERIC(5,4) NOT NULL DEFAULT 0, -- -1 to +1
  sample_size INT NOT NULL DEFAULT 0,                     -- How many outcomes this is based on

  -- Stats
  approval_rate NUMERIC(5,4),  -- Ratio of approved/total
  edit_rate NUMERIC(5,4),      -- Ratio of edited/total
  rejection_rate NUMERIC(5,4), -- Ratio of rejected/total

  -- Timestamps
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per pattern
  CONSTRAINT unique_user_adjustment_pattern UNIQUE (
    user_id,
    COALESCE(message_type, ''),
    COALESCE(topic, ''),
    COALESCE(contact_type, '')
  )
);

-- Indexes for confidence lookups
CREATE INDEX idx_ai_confidence_user_id ON ai_confidence_adjustments(user_id);
CREATE INDEX idx_ai_confidence_lookup ON ai_confidence_adjustments(
  user_id, message_type, topic, contact_type
);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE ai_response_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_confidence_adjustments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Users can only see their own outcomes
CREATE POLICY "Users can view their own AI outcomes"
  ON ai_response_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI outcomes"
  ON ai_response_outcomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only see their own adjustments
CREATE POLICY "Users can view their own confidence adjustments"
  ON ai_confidence_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own confidence adjustments"
  ON ai_confidence_adjustments FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: Calculate adaptive confidence
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_adaptive_confidence(
  p_user_id UUID,
  p_message_type TEXT,
  p_topic TEXT,
  p_contact_type TEXT,
  p_base_confidence NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  adjustment NUMERIC := 0;
  total_weight NUMERIC := 0;
  record_adjustment ai_confidence_adjustments%ROWTYPE;
BEGIN
  -- Look up adjustments from most specific to least specific

  -- 1. Exact match (message_type + topic + contact_type)
  SELECT * INTO record_adjustment
  FROM ai_confidence_adjustments
  WHERE user_id = p_user_id
    AND message_type = p_message_type
    AND topic = p_topic
    AND contact_type = p_contact_type
    AND sample_size >= 5;

  IF FOUND THEN
    adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.4);
    total_weight := total_weight + 0.4;
  END IF;

  -- 2. Message type + contact type (any topic)
  SELECT * INTO record_adjustment
  FROM ai_confidence_adjustments
  WHERE user_id = p_user_id
    AND message_type = p_message_type
    AND topic IS NULL
    AND contact_type = p_contact_type
    AND sample_size >= 10;

  IF FOUND THEN
    adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.3);
    total_weight := total_weight + 0.3;
  END IF;

  -- 3. Message type only
  SELECT * INTO record_adjustment
  FROM ai_confidence_adjustments
  WHERE user_id = p_user_id
    AND message_type = p_message_type
    AND topic IS NULL
    AND contact_type IS NULL
    AND sample_size >= 20;

  IF FOUND THEN
    adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.2);
    total_weight := total_weight + 0.2;
  END IF;

  -- 4. Global user adjustment
  SELECT * INTO record_adjustment
  FROM ai_confidence_adjustments
  WHERE user_id = p_user_id
    AND message_type IS NULL
    AND topic IS NULL
    AND contact_type IS NULL
    AND sample_size >= 50;

  IF FOUND THEN
    adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.1);
    total_weight := total_weight + 0.1;
  END IF;

  -- Normalize adjustment if we found any
  IF total_weight > 0 THEN
    adjustment := adjustment / total_weight;
  END IF;

  -- Apply adjustment and clamp to [0, 1]
  RETURN GREATEST(0, LEAST(1, p_base_confidence + adjustment));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Recalculate confidence adjustments for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_confidence_adjustments(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  pattern RECORD;
BEGIN
  -- Calculate adjustments for each unique pattern
  FOR pattern IN
    SELECT
      message_type,
      topic,
      contact_type,
      COUNT(*) as sample_size,
      AVG(CASE WHEN outcome = 'approved' THEN 1 ELSE 0 END) as approval_rate,
      AVG(CASE WHEN outcome = 'edited' THEN 1 ELSE 0 END) as edit_rate,
      AVG(CASE WHEN outcome = 'rejected' THEN 1 ELSE 0 END) as rejection_rate,
      AVG(CASE WHEN outcome IN ('approved', 'auto_sent') THEN 0.1
               WHEN outcome = 'edited' AND edit_severity = 'minor' THEN -0.05
               WHEN outcome = 'edited' AND edit_severity = 'major' THEN -0.15
               WHEN outcome = 'rejected' THEN -0.25
               ELSE 0 END) as confidence_adjustment
    FROM ai_response_outcomes
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '90 days'
    GROUP BY message_type, topic, contact_type
    HAVING COUNT(*) >= 5
  LOOP
    INSERT INTO ai_confidence_adjustments (
      user_id,
      message_type,
      topic,
      contact_type,
      confidence_adjustment,
      sample_size,
      approval_rate,
      edit_rate,
      rejection_rate,
      last_calculated_at
    ) VALUES (
      p_user_id,
      pattern.message_type,
      pattern.topic,
      pattern.contact_type,
      pattern.confidence_adjustment,
      pattern.sample_size,
      pattern.approval_rate,
      pattern.edit_rate,
      pattern.rejection_rate,
      NOW()
    )
    ON CONFLICT (user_id, COALESCE(message_type, ''), COALESCE(topic, ''), COALESCE(contact_type, ''))
    DO UPDATE SET
      confidence_adjustment = EXCLUDED.confidence_adjustment,
      sample_size = EXCLUDED.sample_size,
      approval_rate = EXCLUDED.approval_rate,
      edit_rate = EXCLUDED.edit_rate,
      rejection_rate = EXCLUDED.rejection_rate,
      last_calculated_at = NOW(),
      updated_at = NOW();
  END LOOP;

  -- Also calculate global adjustment
  INSERT INTO ai_confidence_adjustments (
    user_id,
    message_type,
    topic,
    contact_type,
    confidence_adjustment,
    sample_size,
    approval_rate,
    edit_rate,
    rejection_rate,
    last_calculated_at
  )
  SELECT
    p_user_id,
    NULL,
    NULL,
    NULL,
    AVG(CASE WHEN outcome IN ('approved', 'auto_sent') THEN 0.05
             WHEN outcome = 'edited' AND edit_severity = 'minor' THEN -0.02
             WHEN outcome = 'edited' AND edit_severity = 'major' THEN -0.10
             WHEN outcome = 'rejected' THEN -0.20
             ELSE 0 END),
    COUNT(*),
    AVG(CASE WHEN outcome = 'approved' THEN 1 ELSE 0 END),
    AVG(CASE WHEN outcome = 'edited' THEN 1 ELSE 0 END),
    AVG(CASE WHEN outcome = 'rejected' THEN 1 ELSE 0 END),
    NOW()
  FROM ai_response_outcomes
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '90 days'
  HAVING COUNT(*) >= 20
  ON CONFLICT (user_id, COALESCE(message_type, ''), COALESCE(topic, ''), COALESCE(contact_type, ''))
  DO UPDATE SET
    confidence_adjustment = EXCLUDED.confidence_adjustment,
    sample_size = EXCLUDED.sample_size,
    approval_rate = EXCLUDED.approval_rate,
    edit_rate = EXCLUDED.edit_rate,
    rejection_rate = EXCLUDED.rejection_rate,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-trigger recalculation periodically
-- ============================================================================
-- Recalculate adjustments after every 10 new outcomes
CREATE OR REPLACE FUNCTION trigger_recalculate_on_outcome_insert()
RETURNS TRIGGER AS $$
DECLARE
  outcome_count INT;
BEGIN
  -- Count recent outcomes for this user
  SELECT COUNT(*) INTO outcome_count
  FROM ai_response_outcomes
  WHERE user_id = NEW.user_id
    AND created_at > (
      SELECT COALESCE(MAX(last_calculated_at), '1970-01-01'::TIMESTAMPTZ)
      FROM ai_confidence_adjustments
      WHERE user_id = NEW.user_id
    );

  -- Recalculate every 10 new outcomes
  IF outcome_count >= 10 THEN
    PERFORM recalculate_confidence_adjustments(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_ai_outcome_recalculate
  AFTER INSERT ON ai_response_outcomes
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_on_outcome_insert();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created AI response outcomes and adaptive learning tables',
  jsonb_build_object(
    'migration', '20260128_ai_response_outcomes',
    'tables_created', ARRAY['ai_response_outcomes', 'ai_confidence_adjustments'],
    'enums_created', ARRAY['ai_mode', 'ai_response_style', 'ai_outcome', 'ai_edit_severity'],
    'functions_created', ARRAY['calculate_adaptive_confidence', 'recalculate_confidence_adjustments'],
    'note', 'Enables AI to learn from user review patterns'
  )
);
