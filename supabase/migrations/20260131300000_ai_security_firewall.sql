-- Migration: AI Security Firewall Enhancement
-- Description: Adds circuit breaker, cumulative threat tracking, cross-function rate limiting,
--              and activates database-driven threat patterns for the AI security infrastructure
-- Phase: AI Security Firewall Enhancement
-- DBA Guidelines: Following docs/DATABASE_NAMING_CONVENTIONS.md

-- ============================================================================
-- 1. MOLTBOT_CIRCUIT_BREAKERS TABLE (moltbot_* prefix per DBA guidelines)
-- ============================================================================
-- Emergency stop capability for AI systems
-- Allows instant shutdown at global, function, or user level

CREATE TABLE IF NOT EXISTS moltbot_circuit_breakers (
  -- Scope can be 'global', 'function:ai-responder', 'user:uuid', etc.
  scope TEXT PRIMARY KEY,

  -- Circuit state (is_* prefix for boolean per DBA guidelines)
  is_open BOOLEAN DEFAULT false,

  -- When and why it was opened
  opened_at TIMESTAMPTZ,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,

  -- Optional auto-close time (NULL = manual close only)
  auto_close_at TIMESTAMPTZ,

  -- Audit trail ({noun}_count suffix per DBA guidelines)
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  trip_count INTEGER DEFAULT 0,

  -- Timestamps (TIMESTAMPTZ per DBA guidelines)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (idx_{table}_{column} pattern per DBA guidelines)
CREATE INDEX idx_moltbot_circuit_breakers_is_open
  ON moltbot_circuit_breakers(is_open) WHERE is_open = true;
CREATE INDEX idx_moltbot_circuit_breakers_auto_close
  ON moltbot_circuit_breakers(auto_close_at)
  WHERE auto_close_at IS NOT NULL AND is_open = true;

-- ============================================================================
-- 2. MOLTBOT_USER_THREAT_SCORES TABLE (plural per DBA guidelines)
-- ============================================================================
-- Tracks cumulative threat scores for users to detect slow attacks

CREATE TABLE IF NOT EXISTS moltbot_user_threat_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current threat score (0-1000)
  current_score INTEGER DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 1000),

  -- Event tracking ({noun}_count suffix per DBA guidelines)
  event_count_24h INTEGER DEFAULT 0,
  event_count_total INTEGER DEFAULT 0,
  last_event_at TIMESTAMPTZ,

  -- Status flags (is_* prefix for boolean per DBA guidelines)
  is_flagged BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,

  -- Score configuration
  decay_rate NUMERIC(4,3) DEFAULT 0.900 CHECK (decay_rate > 0 AND decay_rate <= 1),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (idx_{table}_{column} pattern per DBA guidelines)
CREATE INDEX idx_moltbot_user_threat_scores_is_flagged
  ON moltbot_user_threat_scores(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_moltbot_user_threat_scores_is_blocked
  ON moltbot_user_threat_scores(is_blocked) WHERE is_blocked = true;
CREATE INDEX idx_moltbot_user_threat_scores_high_score
  ON moltbot_user_threat_scores(current_score DESC) WHERE current_score >= 500;

-- ============================================================================
-- 3. ENHANCE MOLTBOT_RATE_LIMITS
-- ============================================================================
-- Add function-level tracking for cross-function rate limiting

ALTER TABLE moltbot_rate_limits
  ADD COLUMN IF NOT EXISTS function_name TEXT DEFAULT 'default';

-- Drop and recreate the primary key to include function_name
ALTER TABLE moltbot_rate_limits DROP CONSTRAINT IF EXISTS moltbot_rate_limits_pkey;
ALTER TABLE moltbot_rate_limits
  ADD PRIMARY KEY (user_id, channel, window_start, function_name);

-- Create index for cross-function queries (idx_{table}_{columns} pattern)
CREATE INDEX IF NOT EXISTS idx_moltbot_rate_limits_user_function
  ON moltbot_rate_limits(user_id, function_name, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_moltbot_rate_limits_user_window
  ON moltbot_rate_limits(user_id, window_start DESC);

-- ============================================================================
-- 4. MOLTBOT_SECURITY_PATTERNS_CACHE TABLE (moltbot_* prefix)
-- ============================================================================
-- Cache for loaded security patterns to reduce DB queries

CREATE TABLE IF NOT EXISTS moltbot_security_patterns_cache (
  cache_key TEXT PRIMARY KEY DEFAULT 'active_patterns',
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  pattern_count INTEGER DEFAULT 0,
  last_loaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (Following RLS_SECURITY_MODEL.md patterns)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE moltbot_circuit_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_user_threat_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_security_patterns_cache ENABLE ROW LEVEL SECURITY;

-- Circuit breakers: Admin/support can view, service role can modify
-- Pattern: "{Subject} can {action} {object}"
CREATE POLICY "Admins can view all circuit_breakers"
  ON moltbot_circuit_breakers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

CREATE POLICY "Service role can manage circuit_breakers"
  ON moltbot_circuit_breakers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Threat scores: Users can view own, admin/support can view all, service role manages
CREATE POLICY "Users can view own threat_score"
  ON moltbot_user_threat_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all threat_scores"
  ON moltbot_user_threat_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

CREATE POLICY "Service role can manage threat_scores"
  ON moltbot_user_threat_scores FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Patterns cache: Admin can view, service role manages
CREATE POLICY "Admins can view patterns_cache"
  ON moltbot_security_patterns_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

CREATE POLICY "Service role can manage patterns_cache"
  ON moltbot_security_patterns_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if circuit breaker is open for a given context
CREATE OR REPLACE FUNCTION is_circuit_breaker_open(
  p_function_name TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  is_open BOOLEAN,
  scope TEXT,
  reason TEXT,
  opened_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-close expired circuit breakers first
  UPDATE moltbot_circuit_breakers
  SET is_open = false, updated_at = NOW()
  WHERE moltbot_circuit_breakers.is_open = true
    AND auto_close_at IS NOT NULL
    AND auto_close_at < NOW();

  -- Check in order: global > function > user
  -- Return the first open circuit breaker found

  -- Check global first
  IF EXISTS (
    SELECT 1 FROM moltbot_circuit_breakers cb
    WHERE cb.scope = 'global' AND cb.is_open = true
  ) THEN
    RETURN QUERY
    SELECT cb.is_open, cb.scope, cb.reason, cb.opened_at
    FROM moltbot_circuit_breakers cb
    WHERE cb.scope = 'global' AND cb.is_open = true
    LIMIT 1;
    RETURN;
  END IF;

  -- Check function-specific
  IF p_function_name IS NOT NULL AND EXISTS (
    SELECT 1 FROM moltbot_circuit_breakers cb
    WHERE cb.scope = 'function:' || p_function_name AND cb.is_open = true
  ) THEN
    RETURN QUERY
    SELECT cb.is_open, cb.scope, cb.reason, cb.opened_at
    FROM moltbot_circuit_breakers cb
    WHERE cb.scope = 'function:' || p_function_name AND cb.is_open = true
    LIMIT 1;
    RETURN;
  END IF;

  -- Check user-specific
  IF p_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM moltbot_circuit_breakers cb
    WHERE cb.scope = 'user:' || p_user_id::TEXT AND cb.is_open = true
  ) THEN
    RETURN QUERY
    SELECT cb.is_open, cb.scope, cb.reason, cb.opened_at
    FROM moltbot_circuit_breakers cb
    WHERE cb.scope = 'user:' || p_user_id::TEXT AND cb.is_open = true
    LIMIT 1;
    RETURN;
  END IF;

  -- No open circuit breakers found
  RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ;
END;
$$;

-- Function to trip the circuit breaker
CREATE OR REPLACE FUNCTION trip_circuit_breaker(
  p_scope TEXT,
  p_reason TEXT,
  p_user_id UUID DEFAULT NULL,
  p_auto_close_minutes INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auto_close TIMESTAMPTZ;
BEGIN
  -- Calculate auto-close time if specified
  IF p_auto_close_minutes IS NOT NULL THEN
    v_auto_close := NOW() + (p_auto_close_minutes || ' minutes')::INTERVAL;
  END IF;

  -- Insert or update circuit breaker
  INSERT INTO moltbot_circuit_breakers (scope, is_open, opened_at, opened_by, reason, auto_close_at, trip_count)
  VALUES (p_scope, true, NOW(), p_user_id, p_reason, v_auto_close, 1)
  ON CONFLICT (scope) DO UPDATE SET
    is_open = true,
    opened_at = NOW(),
    opened_by = COALESCE(p_user_id, moltbot_circuit_breakers.opened_by),
    reason = p_reason,
    auto_close_at = v_auto_close,
    trip_count = moltbot_circuit_breakers.trip_count + 1,
    updated_at = NOW();

  RETURN true;
END;
$$;

-- Function to reset circuit breaker
CREATE OR REPLACE FUNCTION reset_circuit_breaker(
  p_scope TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE moltbot_circuit_breakers
  SET is_open = false, updated_at = NOW()
  WHERE scope = p_scope;

  RETURN FOUND;
END;
$$;

-- Function to get active security patterns from database
CREATE OR REPLACE FUNCTION get_active_security_patterns()
RETURNS TABLE(
  id UUID,
  pattern TEXT,
  pattern_type TEXT,
  severity moltbot_security_severity,
  description TEXT,
  applies_to_channels TEXT[],
  hit_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.pattern,
    bp.pattern_type,
    bp.severity,
    bp.description,
    bp.applies_to_channels,
    bp.hit_count
  FROM moltbot_blocked_patterns bp
  WHERE bp.is_active = true
    AND (bp.user_id IS NULL)  -- Only global patterns for now
  ORDER BY
    CASE bp.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    bp.hit_count DESC;
END;
$$;

-- Function to update threat score for a user
CREATE OR REPLACE FUNCTION update_user_threat_score(
  p_user_id UUID,
  p_score_delta INTEGER,
  p_event_type TEXT DEFAULT 'unknown'
)
RETURNS TABLE(
  new_score INTEGER,
  is_flagged BOOLEAN,
  is_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_score INTEGER;
  v_new_score INTEGER;
  v_is_flagged BOOLEAN;
  v_is_blocked BOOLEAN;
  v_flag_threshold INTEGER := 500;
  v_block_threshold INTEGER := 800;
BEGIN
  -- Get or create threat score record
  INSERT INTO moltbot_user_threat_scores (user_id, current_score, event_count_24h, event_count_total, last_event_at)
  VALUES (p_user_id, LEAST(1000, GREATEST(0, p_score_delta)), 1, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_score = LEAST(1000, GREATEST(0, moltbot_user_threat_scores.current_score + p_score_delta)),
    event_count_24h = moltbot_user_threat_scores.event_count_24h + 1,
    event_count_total = moltbot_user_threat_scores.event_count_total + 1,
    last_event_at = NOW(),
    updated_at = NOW()
  RETURNING
    moltbot_user_threat_scores.current_score,
    moltbot_user_threat_scores.is_flagged,
    moltbot_user_threat_scores.is_blocked
  INTO v_new_score, v_is_flagged, v_is_blocked;

  -- Check if we need to update flags
  IF v_new_score >= v_block_threshold AND NOT v_is_blocked THEN
    UPDATE moltbot_user_threat_scores
    SET is_blocked = true, blocked_at = NOW(), is_flagged = true, flagged_at = COALESCE(flagged_at, NOW())
    WHERE user_id = p_user_id;
    v_is_blocked := true;
    v_is_flagged := true;
  ELSIF v_new_score >= v_flag_threshold AND NOT v_is_flagged THEN
    UPDATE moltbot_user_threat_scores
    SET is_flagged = true, flagged_at = NOW()
    WHERE user_id = p_user_id;
    v_is_flagged := true;
  END IF;

  RETURN QUERY SELECT v_new_score, v_is_flagged, v_is_blocked;
END;
$$;

-- Function to decay threat scores (run daily via cron)
CREATE OR REPLACE FUNCTION decay_threat_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE moltbot_user_threat_scores
  SET
    current_score = GREATEST(0, FLOOR(current_score * decay_rate)::INTEGER),
    event_count_24h = 0,
    updated_at = NOW()
  WHERE current_score > 0;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Reset flags for users below thresholds
  UPDATE moltbot_user_threat_scores
  SET is_flagged = false
  WHERE is_flagged = true AND current_score < 500 AND is_blocked = false;

  RETURN v_updated;
END;
$$;

-- Function to check cross-function rate limit
CREATE OR REPLACE FUNCTION check_cross_function_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_channel TEXT DEFAULT 'api',
  p_global_hourly_limit INTEGER DEFAULT 200,
  p_function_hourly_limit INTEGER DEFAULT 100,
  p_burst_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  allowed BOOLEAN,
  limit_type TEXT,
  current_count INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour_start TIMESTAMPTZ;
  v_minute_start TIMESTAMPTZ;
  v_global_count INTEGER;
  v_function_count INTEGER;
  v_burst_count INTEGER;
BEGIN
  v_hour_start := date_trunc('hour', NOW());
  v_minute_start := date_trunc('minute', NOW());

  -- Get global hourly count (across all functions)
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_global_count
  FROM moltbot_rate_limits
  WHERE user_id = p_user_id
    AND window_start = v_hour_start;

  -- Get function-specific hourly count
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_function_count
  FROM moltbot_rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND window_start = v_hour_start;

  -- Get burst count (last minute, all functions)
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_burst_count
  FROM moltbot_rate_limits
  WHERE user_id = p_user_id
    AND window_start >= v_minute_start;

  -- Check burst limit first
  IF v_burst_count >= p_burst_limit THEN
    RETURN QUERY SELECT false, 'burst'::TEXT, v_burst_count, 0;
    RETURN;
  END IF;

  -- Check global hourly limit
  IF v_global_count >= p_global_hourly_limit THEN
    RETURN QUERY SELECT false, 'global_hourly'::TEXT, v_global_count, 0;
    RETURN;
  END IF;

  -- Check function-specific hourly limit
  IF v_function_count >= p_function_hourly_limit THEN
    RETURN QUERY SELECT false, 'function_hourly'::TEXT, v_function_count, 0;
    RETURN;
  END IF;

  -- Update rate limit counters
  INSERT INTO moltbot_rate_limits (user_id, channel, window_start, function_name, request_count, last_request_at)
  VALUES (p_user_id, p_channel, v_hour_start, p_function_name, 1, NOW())
  ON CONFLICT (user_id, channel, window_start, function_name) DO UPDATE
  SET request_count = moltbot_rate_limits.request_count + 1,
      last_request_at = NOW();

  -- Return success with remaining counts
  RETURN QUERY SELECT
    true,
    'allowed'::TEXT,
    v_global_count + 1,
    LEAST(p_global_hourly_limit - v_global_count - 1, p_function_hourly_limit - v_function_count - 1);
END;
$$;

-- Function to record pattern hit (for analytics)
CREATE OR REPLACE FUNCTION record_pattern_hit(p_pattern_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE moltbot_blocked_patterns
  SET hit_count = hit_count + 1, last_hit_at = NOW()
  WHERE id = p_pattern_id;
END;
$$;

-- ============================================================================
-- SEED DEFAULT CIRCUIT BREAKER ENTRIES
-- ============================================================================

INSERT INTO moltbot_circuit_breakers (scope, is_open, reason)
VALUES
  ('global', false, 'Global AI system circuit breaker'),
  ('function:ai-responder', false, 'AI Responder circuit breaker'),
  ('function:openai', false, 'OpenAI function circuit breaker'),
  ('function:perplexity-api', false, 'Perplexity API circuit breaker'),
  ('function:memory-manager', false, 'Memory Manager circuit breaker'),
  ('function:process-document', false, 'Process Document circuit breaker')
ON CONFLICT (scope) DO NOTHING;

-- ============================================================================
-- SEED ADDITIONAL BLOCKED PATTERNS
-- ============================================================================
-- These activate the moltbot_blocked_patterns table with common threats

INSERT INTO moltbot_blocked_patterns (pattern, pattern_type, severity, description, is_active)
VALUES
  -- Additional injection patterns
  ('(?i)system\s*:?\s*you\s+are', 'injection', 'critical', 'System role injection attempt', true),
  ('(?i)<<\s*SYS\s*>>', 'injection', 'critical', 'LLaMA system tag injection', true),
  ('(?i)\[\s*\/?\s*INST\s*\]', 'injection', 'critical', 'LLaMA instruction tag injection', true),
  ('(?i)assistant\s*:?\s*(sure|okay|yes|absolutely)', 'injection', 'high', 'Fake assistant response injection', true),
  ('(?i)ignore\s+(the\s+)?(previous|above|all)\s+(text|context|instructions)', 'injection', 'critical', 'Context override attempt', true),

  -- Data exfiltration patterns
  ('(?i)(send|post|upload|forward)\s+(to|this|data|info)\s+(to\s+)?(http|ftp|email)', 'exfiltration', 'critical', 'External data transfer attempt', true),
  ('(?i)base64\s*(encode|decode)', 'exfiltration', 'medium', 'Encoding obfuscation attempt', true),
  ('(?i)(webhook|callback)\s*(url|endpoint)', 'exfiltration', 'high', 'Webhook endpoint reference', true),

  -- Privilege escalation
  ('(?i)(admin|root|sudo|superuser)\s+(access|mode|privilege)', 'escalation', 'critical', 'Privilege escalation attempt', true),
  ('(?i)execute\s+(as|with)\s+(admin|root|system)', 'escalation', 'critical', 'Admin execution attempt', true),

  -- Code execution
  ('(?i)(eval|exec|spawn|popen)\s*\(', 'code_execution', 'critical', 'Code execution function', true),
  ('(?i)import\s+(os|sys|subprocess|shutil)', 'code_execution', 'high', 'System module import', true),
  ('(?i)__import__', 'code_execution', 'critical', 'Dynamic import attempt', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for circuit breakers
CREATE OR REPLACE FUNCTION update_moltbot_circuit_breakers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_moltbot_circuit_breakers_updated_at
  BEFORE UPDATE ON moltbot_circuit_breakers
  FOR EACH ROW
  EXECUTE FUNCTION update_moltbot_circuit_breakers_updated_at();

-- Update timestamp trigger for threat scores
CREATE OR REPLACE FUNCTION update_moltbot_user_threat_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_moltbot_user_threat_scores_updated_at
  BEFORE UPDATE ON moltbot_user_threat_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_moltbot_user_threat_scores_updated_at();

-- ============================================================================
-- TABLE COMMENTS (per DBA guidelines)
-- ============================================================================

COMMENT ON TABLE moltbot_circuit_breakers IS 'Emergency stop capability for AI systems - can halt AI at global, function, or user level';
COMMENT ON TABLE moltbot_user_threat_scores IS 'Cumulative threat tracking for users - detects slow attacks over multiple messages';
COMMENT ON TABLE moltbot_security_patterns_cache IS 'Cache for loaded security patterns to reduce database queries';

COMMENT ON COLUMN moltbot_circuit_breakers.scope IS 'Circuit breaker scope: global, function:{name}, or user:{uuid}';
COMMENT ON COLUMN moltbot_circuit_breakers.is_open IS 'Whether the circuit breaker is currently open (blocking AI operations)';
COMMENT ON COLUMN moltbot_circuit_breakers.trip_count IS 'Number of times this circuit breaker has been tripped';

COMMENT ON COLUMN moltbot_user_threat_scores.current_score IS 'Cumulative threat score (0-1000)';
COMMENT ON COLUMN moltbot_user_threat_scores.event_count_24h IS 'Number of security events in the last 24 hours';
COMMENT ON COLUMN moltbot_user_threat_scores.event_count_total IS 'Total number of security events for this user';
COMMENT ON COLUMN moltbot_user_threat_scores.is_flagged IS 'Whether user is flagged for review (score >= 500)';
COMMENT ON COLUMN moltbot_user_threat_scores.is_blocked IS 'Whether user is blocked from AI services (score >= 800)';

COMMENT ON FUNCTION is_circuit_breaker_open IS 'Check if any circuit breaker is open for the given context (global > function > user hierarchy)';
COMMENT ON FUNCTION trip_circuit_breaker IS 'Trip a circuit breaker to stop AI processing for a given scope';
COMMENT ON FUNCTION reset_circuit_breaker IS 'Reset a circuit breaker to allow AI processing to resume';
COMMENT ON FUNCTION get_active_security_patterns IS 'Get all active security patterns from the database for threat scanning';
COMMENT ON FUNCTION update_user_threat_score IS 'Update cumulative threat score for a user and check flag/block thresholds';
COMMENT ON FUNCTION decay_threat_scores IS 'Apply daily decay to threat scores (run via cron job)';
COMMENT ON FUNCTION check_cross_function_rate_limit IS 'Check rate limits across all AI functions for a user';
