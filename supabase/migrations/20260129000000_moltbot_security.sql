-- Migration: MoltBot Security Infrastructure
-- Description: Creates security audit logging and rate limiting tables for MoltBot
-- Phase: MoltBot Ecosystem Expansion - Phase 1 (Security Hardening)

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Security event types for audit logging
CREATE TYPE moltbot_security_event_type AS ENUM (
  'injection_attempt',    -- Prompt injection detected
  'exfil_attempt',        -- Data exfiltration attempt
  'rate_limit',           -- Rate limit exceeded
  'output_filtered',      -- Sensitive content filtered from output
  'jailbreak_attempt',    -- AI jailbreak attempt
  'suspicious_pattern',   -- General suspicious pattern detected
  'auth_failure',         -- Authentication failure
  'impersonation'         -- Impersonation attempt detected
);

-- Severity levels for security events
CREATE TYPE moltbot_security_severity AS ENUM (
  'low',      -- Minor concern, logged for analysis
  'medium',   -- Notable concern, may warrant review
  'high',     -- Significant threat, requires attention
  'critical'  -- Immediate threat, may be blocked
);

-- Actions taken in response to security events
CREATE TYPE moltbot_security_action AS ENUM (
  'allowed',    -- Request processed normally
  'sanitized',  -- Content was sanitized before processing
  'flagged',    -- Request processed but flagged for review
  'blocked'     -- Request was blocked entirely
);

-- ============================================================================
-- 1. MOLTBOT_SECURITY_LOG
-- ============================================================================
-- Audit log for all security-related events
-- Used for threat analysis, incident response, and pattern detection

CREATE TABLE IF NOT EXISTS moltbot_security_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User context (nullable for unauthenticated events)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Event classification
  event_type moltbot_security_event_type NOT NULL,
  severity moltbot_security_severity NOT NULL,
  action_taken moltbot_security_action NOT NULL,

  -- Event context
  channel TEXT,                          -- 'email', 'whatsapp', 'telegram', etc.
  platform TEXT,                         -- 'airbnb', 'furnishedfinder', etc.
  contact_id UUID,                       -- Related contact if applicable
  conversation_id UUID,                  -- Related conversation if applicable

  -- Threat details
  raw_input TEXT,                        -- Truncated input that triggered event
  sanitized_input TEXT,                  -- Sanitized version if applicable
  detected_patterns TEXT[],              -- Patterns that matched
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),

  -- Request context
  ip_address INET,                       -- Source IP if available
  user_agent TEXT,                       -- User agent string if available
  endpoint TEXT,                         -- API endpoint accessed

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security log queries
CREATE INDEX idx_security_log_user_id ON moltbot_security_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_log_event_type ON moltbot_security_log(event_type);
CREATE INDEX idx_security_log_severity ON moltbot_security_log(severity) WHERE severity IN ('high', 'critical');
CREATE INDEX idx_security_log_created_at ON moltbot_security_log(created_at);
CREATE INDEX idx_security_log_severity_time ON moltbot_security_log(severity, created_at DESC);

-- Composite index for user security analysis
CREATE INDEX idx_security_log_user_analysis ON moltbot_security_log(user_id, event_type, created_at DESC)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- 2. MOLTBOT_RATE_LIMITS
-- ============================================================================
-- Tracks request counts for rate limiting
-- Uses time windows for efficient rate limit checking

CREATE TABLE IF NOT EXISTS moltbot_rate_limits (
  -- Composite primary key for user + channel + time window
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,                 -- 'email', 'whatsapp', 'api', etc.
  window_start TIMESTAMPTZ NOT NULL,     -- Start of the time window

  -- Counters
  request_count INTEGER DEFAULT 1,
  last_request_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite primary key
  PRIMARY KEY (user_id, channel, window_start)
);

-- Index for rate limit lookups
CREATE INDEX idx_rate_limits_lookup ON moltbot_rate_limits(user_id, channel, window_start DESC);

-- Index for cleanup of old rate limit records
CREATE INDEX idx_rate_limits_cleanup ON moltbot_rate_limits(window_start);

-- ============================================================================
-- 3. MOLTBOT_BLOCKED_PATTERNS
-- ============================================================================
-- Customizable blocking patterns that can be managed via admin UI
-- Allows adding new threat patterns without code deployment

CREATE TABLE IF NOT EXISTS moltbot_blocked_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern definition
  pattern TEXT NOT NULL,                 -- Regex pattern
  pattern_type TEXT NOT NULL,            -- 'injection', 'exfiltration', 'spam', etc.
  severity moltbot_security_severity NOT NULL DEFAULT 'medium',

  -- Scope
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = global
  applies_to_channels TEXT[],            -- NULL = all channels

  -- Status
  is_active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active patterns lookup
CREATE INDEX idx_blocked_patterns_active ON moltbot_blocked_patterns(is_active, pattern_type)
  WHERE is_active = true;

-- Index for user-specific patterns
CREATE INDEX idx_blocked_patterns_user ON moltbot_blocked_patterns(user_id)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- 4. MOLTBOT_IP_BLOCKLIST
-- ============================================================================
-- IP-based blocking for repeated abusers

CREATE TABLE IF NOT EXISTS moltbot_ip_blocklist (
  ip_address INET PRIMARY KEY,

  -- Block metadata
  reason TEXT NOT NULL,
  severity moltbot_security_severity NOT NULL DEFAULT 'high',

  -- Block duration
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                -- NULL = permanent

  -- Related events
  related_user_ids UUID[],
  incident_count INTEGER DEFAULT 1,

  -- Admin info
  blocked_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Index for block lookups (filtering by expiration done at query time since NOW() is not immutable)
CREATE INDEX idx_ip_blocklist_expires ON moltbot_ip_blocklist(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE moltbot_security_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_blocked_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_ip_blocklist ENABLE ROW LEVEL SECURITY;

-- Security log: Users can only view their own security events
CREATE POLICY "Users can view own security events"
  ON moltbot_security_log FOR SELECT
  USING (auth.uid() = user_id);

-- Security log: Service role has full access for logging
CREATE POLICY "Service role full access to security log"
  ON moltbot_security_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Rate limits: Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
  ON moltbot_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Rate limits: Service role manages rate limits
CREATE POLICY "Service role manages rate limits"
  ON moltbot_rate_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Blocked patterns: Users can view global and their own patterns
CREATE POLICY "Users can view applicable patterns"
  ON moltbot_blocked_patterns FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Blocked patterns: Only service role can manage patterns
CREATE POLICY "Service role manages blocked patterns"
  ON moltbot_blocked_patterns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- IP blocklist: Service role only
CREATE POLICY "Service role manages IP blocklist"
  ON moltbot_ip_blocklist FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to log a security event
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type moltbot_security_event_type,
  p_severity moltbot_security_severity,
  p_action_taken moltbot_security_action,
  p_channel TEXT DEFAULT NULL,
  p_raw_input TEXT DEFAULT NULL,
  p_detected_patterns TEXT[] DEFAULT NULL,
  p_risk_score INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO moltbot_security_log (
    user_id,
    event_type,
    severity,
    action_taken,
    channel,
    raw_input,
    detected_patterns,
    risk_score,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_severity,
    p_action_taken,
    p_channel,
    -- Truncate raw input for safety
    LEFT(p_raw_input, 1000),
    p_detected_patterns,
    p_risk_score,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_channel TEXT,
  p_hourly_limit INTEGER DEFAULT 100,
  p_burst_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_count INTEGER,
  remaining INTEGER,
  window_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hour_start TIMESTAMPTZ;
  v_minute_start TIMESTAMPTZ;
  v_hourly_count INTEGER;
  v_burst_count INTEGER;
BEGIN
  -- Calculate window starts
  v_hour_start := date_trunc('hour', NOW());
  v_minute_start := date_trunc('minute', NOW());

  -- Get or create hourly count
  INSERT INTO moltbot_rate_limits (user_id, channel, window_start, request_count, last_request_at)
  VALUES (p_user_id, p_channel, v_hour_start, 1, NOW())
  ON CONFLICT (user_id, channel, window_start) DO UPDATE
  SET request_count = moltbot_rate_limits.request_count + 1,
      last_request_at = NOW()
  RETURNING request_count INTO v_hourly_count;

  -- Get burst count (last minute)
  SELECT COALESCE(SUM(rl.request_count), 0)
  INTO v_burst_count
  FROM moltbot_rate_limits rl
  WHERE rl.user_id = p_user_id
    AND rl.channel = p_channel
    AND rl.window_start >= v_minute_start;

  -- Check burst limit first (stricter)
  IF v_burst_count > p_burst_limit THEN
    RETURN QUERY SELECT
      false,
      v_burst_count,
      0,
      'burst'::TEXT;
    RETURN;
  END IF;

  -- Check hourly limit
  IF v_hourly_count > p_hourly_limit THEN
    RETURN QUERY SELECT
      false,
      v_hourly_count,
      0,
      'hourly'::TEXT;
    RETURN;
  END IF;

  -- Within limits
  RETURN QUERY SELECT
    true,
    v_hourly_count,
    GREATEST(0, p_hourly_limit - v_hourly_count),
    'hourly'::TEXT;
END;
$$;

-- Function to check if an IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM moltbot_ip_blocklist
    WHERE ip_address = p_ip_address
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM moltbot_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Function to get security summary for a user
CREATE OR REPLACE FUNCTION get_user_security_summary(p_user_id UUID)
RETURNS TABLE(
  total_events BIGINT,
  critical_events BIGINT,
  high_events BIGINT,
  blocked_events BIGINT,
  last_event_at TIMESTAMPTZ,
  most_common_event moltbot_security_event_type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_events,
    COUNT(*) FILTER (WHERE severity = 'high')::BIGINT as high_events,
    COUNT(*) FILTER (WHERE action_taken = 'blocked')::BIGINT as blocked_events,
    MAX(created_at) as last_event_at,
    (
      SELECT sl.event_type
      FROM moltbot_security_log sl
      WHERE sl.user_id = p_user_id
      GROUP BY sl.event_type
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as most_common_event
  FROM moltbot_security_log
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update blocked_patterns updated_at on modification
CREATE OR REPLACE FUNCTION update_blocked_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blocked_patterns_updated_at
  BEFORE UPDATE ON moltbot_blocked_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_blocked_patterns_updated_at();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE moltbot_security_log IS 'Audit log for all MoltBot security events including injection attempts, rate limits, and output filtering';
COMMENT ON TABLE moltbot_rate_limits IS 'Rate limiting state for users across channels with time-windowed counters';
COMMENT ON TABLE moltbot_blocked_patterns IS 'Customizable threat detection patterns that can be managed without code changes';
COMMENT ON TABLE moltbot_ip_blocklist IS 'IP-based blocking for repeat abusers and known malicious sources';

COMMENT ON FUNCTION log_security_event IS 'Log a security event to the audit log with automatic input truncation';
COMMENT ON FUNCTION check_rate_limit IS 'Check and update rate limits for a user/channel, returns whether request is allowed';
COMMENT ON FUNCTION is_ip_blocked IS 'Check if an IP address is currently blocked';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Clean up rate limit records older than 24 hours';
COMMENT ON FUNCTION get_user_security_summary IS 'Get security event summary for a user over the last 30 days';
