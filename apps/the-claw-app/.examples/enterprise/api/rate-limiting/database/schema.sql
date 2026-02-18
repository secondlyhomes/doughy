-- ============================================================================
-- RATE LIMITING DATABASE SCHEMA
-- ============================================================================
-- This schema provides comprehensive rate limiting for API endpoints
-- Supports multiple strategies: fixed window, sliding window, token bucket
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Rate limit configurations per endpoint
CREATE TABLE rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  strategy TEXT NOT NULL CHECK (strategy IN ('fixed_window', 'sliding_window', 'token_bucket')),
  max_requests INT NOT NULL,
  window_duration INTERVAL NOT NULL,
  burst_size INT, -- For token bucket only
  refill_rate INT, -- For token bucket only
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rate limit tracking for fixed window strategy
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ,
  limit_exceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rate limit tracking for sliding window strategy
CREATE TABLE rate_limit_sliding_window (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  endpoint TEXT NOT NULL,
  request_timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Token bucket tracking
CREATE TABLE rate_limit_token_bucket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  endpoint TEXT NOT NULL,
  tokens DECIMAL(10,2) NOT NULL,
  last_refill TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Rate limit violations log
CREATE TABLE rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  endpoint TEXT NOT NULL,
  strategy TEXT NOT NULL,
  current_count INT,
  max_allowed INT,
  window_duration INTERVAL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rate limit exemptions (whitelisted users/keys)
CREATE TABLE rate_limit_exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  endpoint TEXT, -- NULL means all endpoints
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API keys for external access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_tier TEXT DEFAULT 'standard',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Rate limits indexes
CREATE INDEX idx_rate_limits_user ON rate_limits(user_id);
CREATE INDEX idx_rate_limits_api_key ON rate_limits(api_key);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);

-- Sliding window indexes
CREATE INDEX idx_sliding_window_user ON rate_limit_sliding_window(user_id);
CREATE INDEX idx_sliding_window_endpoint ON rate_limit_sliding_window(endpoint);
CREATE INDEX idx_sliding_window_timestamp ON rate_limit_sliding_window(request_timestamp);
CREATE INDEX idx_sliding_window_user_endpoint_time ON rate_limit_sliding_window(user_id, endpoint, request_timestamp);

-- Token bucket indexes
CREATE INDEX idx_token_bucket_user ON rate_limit_token_bucket(user_id);
CREATE INDEX idx_token_bucket_endpoint ON rate_limit_token_bucket(endpoint);

-- Violations indexes
CREATE INDEX idx_violations_user ON rate_limit_violations(user_id);
CREATE INDEX idx_violations_endpoint ON rate_limit_violations(endpoint);
CREATE INDEX idx_violations_created ON rate_limit_violations(created_at);

-- Exemptions indexes
CREATE INDEX idx_exemptions_user ON rate_limit_exemptions(user_id);
CREATE INDEX idx_exemptions_api_key ON rate_limit_exemptions(api_key);
CREATE INDEX idx_exemptions_endpoint ON rate_limit_exemptions(endpoint);

-- API keys indexes
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Check if user/key is exempted from rate limiting
CREATE OR REPLACE FUNCTION is_rate_limit_exempt(
  p_user_id UUID,
  p_api_key TEXT,
  p_endpoint TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exempt BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM rate_limit_exemptions
    WHERE (user_id = p_user_id OR api_key = p_api_key)
      AND (endpoint IS NULL OR endpoint = p_endpoint)
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_exempt;

  RETURN v_exempt;
END;
$$ LANGUAGE plpgsql;

-- Check rate limit using fixed window strategy
CREATE OR REPLACE FUNCTION check_rate_limit_fixed_window(
  p_user_id UUID,
  p_api_key TEXT,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 100,
  p_window INTERVAL DEFAULT '1 minute'
)
RETURNS JSONB AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_record RECORD;
  v_exempt BOOLEAN;
BEGIN
  -- Check exemption
  v_exempt := is_rate_limit_exempt(p_user_id, p_api_key, p_endpoint);
  IF v_exempt THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'exempt', true,
      'remaining', NULL,
      'reset_at', NULL
    );
  END IF;

  -- Calculate current window
  v_window_start := date_trunc('minute', now());
  v_window_end := v_window_start + p_window;

  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE (user_id = p_user_id OR api_key = p_api_key)
    AND endpoint = p_endpoint
    AND window_start = v_window_start
    AND window_end = v_window_end
  FOR UPDATE;

  IF v_record IS NULL THEN
    -- Create new window record
    INSERT INTO rate_limits (user_id, api_key, endpoint, request_count, window_start, window_end)
    VALUES (p_user_id, p_api_key, p_endpoint, 1, v_window_start, v_window_end)
    RETURNING * INTO v_record;

    RETURN jsonb_build_object(
      'allowed', true,
      'exempt', false,
      'remaining', p_max_requests - 1,
      'reset_at', v_window_end,
      'current_count', 1
    );
  END IF;

  -- Check if limit exceeded
  IF v_record.request_count >= p_max_requests THEN
    -- Log violation
    INSERT INTO rate_limit_violations (
      user_id, api_key, endpoint, strategy, current_count, max_allowed, window_duration
    )
    VALUES (
      p_user_id, p_api_key, p_endpoint, 'fixed_window', v_record.request_count, p_max_requests, p_window
    );

    -- Update limit exceeded flag
    UPDATE rate_limits
    SET limit_exceeded = true, updated_at = now()
    WHERE id = v_record.id;

    RETURN jsonb_build_object(
      'allowed', false,
      'exempt', false,
      'remaining', 0,
      'reset_at', v_window_end,
      'current_count', v_record.request_count,
      'retry_after', EXTRACT(EPOCH FROM (v_window_end - now()))
    );
  END IF;

  -- Increment counter
  UPDATE rate_limits
  SET request_count = request_count + 1, updated_at = now()
  WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'exempt', false,
    'remaining', p_max_requests - v_record.request_count - 1,
    'reset_at', v_window_end,
    'current_count', v_record.request_count + 1
  );
END;
$$ LANGUAGE plpgsql;

-- Check rate limit using sliding window strategy
CREATE OR REPLACE FUNCTION check_rate_limit_sliding_window(
  p_user_id UUID,
  p_api_key TEXT,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 100,
  p_window INTERVAL DEFAULT '1 minute'
)
RETURNS JSONB AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
  v_exempt BOOLEAN;
BEGIN
  -- Check exemption
  v_exempt := is_rate_limit_exempt(p_user_id, p_api_key, p_endpoint);
  IF v_exempt THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'exempt', true,
      'remaining', NULL,
      'reset_at', NULL
    );
  END IF;

  -- Calculate sliding window start
  v_window_start := now() - p_window;

  -- Count requests in sliding window
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_sliding_window
  WHERE (user_id = p_user_id OR api_key = p_api_key)
    AND endpoint = p_endpoint
    AND request_timestamp > v_window_start;

  -- Check if limit exceeded
  IF v_count >= p_max_requests THEN
    -- Log violation
    INSERT INTO rate_limit_violations (
      user_id, api_key, endpoint, strategy, current_count, max_allowed, window_duration
    )
    VALUES (
      p_user_id, p_api_key, p_endpoint, 'sliding_window', v_count, p_max_requests, p_window
    );

    -- Find oldest request to calculate retry_after
    DECLARE
      v_oldest_timestamp TIMESTAMPTZ;
    BEGIN
      SELECT MIN(request_timestamp) INTO v_oldest_timestamp
      FROM rate_limit_sliding_window
      WHERE (user_id = p_user_id OR api_key = p_api_key)
        AND endpoint = p_endpoint
        AND request_timestamp > v_window_start;

      RETURN jsonb_build_object(
        'allowed', false,
        'exempt', false,
        'remaining', 0,
        'reset_at', v_oldest_timestamp + p_window,
        'current_count', v_count,
        'retry_after', EXTRACT(EPOCH FROM ((v_oldest_timestamp + p_window) - now()))
      );
    END;
  END IF;

  -- Record this request
  INSERT INTO rate_limit_sliding_window (user_id, api_key, endpoint, request_timestamp)
  VALUES (p_user_id, p_api_key, p_endpoint, now());

  RETURN jsonb_build_object(
    'allowed', true,
    'exempt', false,
    'remaining', p_max_requests - v_count - 1,
    'reset_at', now() + p_window,
    'current_count', v_count + 1
  );
END;
$$ LANGUAGE plpgsql;

-- Check rate limit using token bucket strategy
CREATE OR REPLACE FUNCTION check_rate_limit_token_bucket(
  p_user_id UUID,
  p_api_key TEXT,
  p_endpoint TEXT,
  p_bucket_size INT DEFAULT 100,
  p_refill_rate DECIMAL DEFAULT 10.0, -- tokens per second
  p_cost DECIMAL DEFAULT 1.0 -- cost of this request
)
RETURNS JSONB AS $$
DECLARE
  v_bucket RECORD;
  v_time_elapsed DECIMAL;
  v_tokens_to_add DECIMAL;
  v_new_tokens DECIMAL;
  v_exempt BOOLEAN;
BEGIN
  -- Check exemption
  v_exempt := is_rate_limit_exempt(p_user_id, p_api_key, p_endpoint);
  IF v_exempt THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'exempt', true,
      'tokens_remaining', NULL
    );
  END IF;

  -- Get or create bucket
  SELECT * INTO v_bucket
  FROM rate_limit_token_bucket
  WHERE (user_id = p_user_id OR api_key = p_api_key)
    AND endpoint = p_endpoint
  FOR UPDATE;

  IF v_bucket IS NULL THEN
    -- Create new bucket (full)
    INSERT INTO rate_limit_token_bucket (user_id, api_key, endpoint, tokens, last_refill)
    VALUES (p_user_id, p_api_key, p_endpoint, p_bucket_size - p_cost, now())
    RETURNING * INTO v_bucket;

    RETURN jsonb_build_object(
      'allowed', true,
      'exempt', false,
      'tokens_remaining', p_bucket_size - p_cost,
      'tokens_consumed', p_cost
    );
  END IF;

  -- Calculate tokens to add based on time elapsed
  v_time_elapsed := EXTRACT(EPOCH FROM (now() - v_bucket.last_refill));
  v_tokens_to_add := v_time_elapsed * p_refill_rate;
  v_new_tokens := LEAST(v_bucket.tokens + v_tokens_to_add, p_bucket_size::DECIMAL);

  -- Check if enough tokens available
  IF v_new_tokens < p_cost THEN
    -- Log violation
    INSERT INTO rate_limit_violations (
      user_id, api_key, endpoint, strategy, current_count, max_allowed, window_duration
    )
    VALUES (
      p_user_id, p_api_key, p_endpoint, 'token_bucket', 0, p_bucket_size, NULL
    );

    -- Calculate retry_after
    DECLARE
      v_tokens_needed DECIMAL;
      v_retry_after DECIMAL;
    BEGIN
      v_tokens_needed := p_cost - v_new_tokens;
      v_retry_after := v_tokens_needed / p_refill_rate;

      RETURN jsonb_build_object(
        'allowed', false,
        'exempt', false,
        'tokens_remaining', v_new_tokens,
        'tokens_needed', v_tokens_needed,
        'retry_after', CEIL(v_retry_after)
      );
    END;
  END IF;

  -- Consume tokens
  UPDATE rate_limit_token_bucket
  SET tokens = v_new_tokens - p_cost,
      last_refill = now(),
      updated_at = now()
  WHERE id = v_bucket.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'exempt', false,
    'tokens_remaining', v_new_tokens - p_cost,
    'tokens_consumed', p_cost,
    'refill_rate', p_refill_rate
  );
END;
$$ LANGUAGE plpgsql;

-- Smart rate limit check (uses config table)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_api_key TEXT,
  p_endpoint TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
BEGIN
  -- Get configuration for endpoint
  SELECT * INTO v_config
  FROM rate_limit_configs
  WHERE endpoint = p_endpoint
    AND enabled = true;

  IF v_config IS NULL THEN
    -- No rate limit configured, allow request
    RETURN jsonb_build_object(
      'allowed', true,
      'exempt', false,
      'no_limit', true
    );
  END IF;

  -- Route to appropriate strategy
  CASE v_config.strategy
    WHEN 'fixed_window' THEN
      RETURN check_rate_limit_fixed_window(
        p_user_id, p_api_key, p_endpoint,
        v_config.max_requests, v_config.window_duration
      );
    WHEN 'sliding_window' THEN
      RETURN check_rate_limit_sliding_window(
        p_user_id, p_api_key, p_endpoint,
        v_config.max_requests, v_config.window_duration
      );
    WHEN 'token_bucket' THEN
      RETURN check_rate_limit_token_bucket(
        p_user_id, p_api_key, p_endpoint,
        v_config.burst_size, v_config.refill_rate::DECIMAL
      );
    ELSE
      RAISE EXCEPTION 'Unknown rate limit strategy: %', v_config.strategy;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INT AS $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Delete old fixed window records (older than 1 hour)
  DELETE FROM rate_limits
  WHERE window_end < now() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Delete old sliding window records (older than 1 hour)
  DELETE FROM rate_limit_sliding_window
  WHERE request_timestamp < now() - INTERVAL '1 hour';

  -- Delete old violations (older than 30 days)
  DELETE FROM rate_limit_violations
  WHERE created_at < now() - INTERVAL '30 days';

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limit_configs_updated_at
  BEFORE UPDATE ON rate_limit_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER token_bucket_updated_at
  BEFORE UPDATE ON rate_limit_token_bucket
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER exemptions_updated_at
  BEFORE UPDATE ON rate_limit_exemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE rate_limit_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_sliding_window ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_token_bucket ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Configs: Admin only
CREATE POLICY rate_limit_configs_admin ON rate_limit_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Rate limits: Users can view their own
CREATE POLICY rate_limits_view_own ON rate_limits
  FOR SELECT USING (user_id = auth.uid());

-- Sliding window: Users can view their own
CREATE POLICY sliding_window_view_own ON rate_limit_sliding_window
  FOR SELECT USING (user_id = auth.uid());

-- Token bucket: Users can view their own
CREATE POLICY token_bucket_view_own ON rate_limit_token_bucket
  FOR SELECT USING (user_id = auth.uid());

-- Violations: Users can view their own, admins can view all
CREATE POLICY violations_view ON rate_limit_violations
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Exemptions: Admin only
CREATE POLICY exemptions_admin ON rate_limit_exemptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- API keys: Users can manage their own
CREATE POLICY api_keys_own ON api_keys
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert default rate limit configurations
INSERT INTO rate_limit_configs (endpoint, strategy, max_requests, window_duration, description) VALUES
  ('api.tasks.create', 'fixed_window', 60, '1 minute', 'Task creation - 60 per minute'),
  ('api.tasks.update', 'fixed_window', 120, '1 minute', 'Task updates - 120 per minute'),
  ('api.tasks.list', 'sliding_window', 200, '1 minute', 'Task listing - 200 per minute'),
  ('api.ai.chat', 'token_bucket', 100, '1 minute', 'AI chat - token bucket'),
  ('api.ai.completion', 'token_bucket', 50, '1 minute', 'AI completion - token bucket'),
  ('api.search', 'sliding_window', 30, '1 minute', 'Search - 30 per minute'),
  ('api.export', 'fixed_window', 5, '1 hour', 'Data export - 5 per hour'),
  ('api.import', 'fixed_window', 10, '1 hour', 'Data import - 10 per hour');

-- Update token bucket configs with burst and refill
UPDATE rate_limit_configs
SET burst_size = 100, refill_rate = 10
WHERE strategy = 'token_bucket' AND endpoint = 'api.ai.chat';

UPDATE rate_limit_configs
SET burst_size = 50, refill_rate = 5
WHERE strategy = 'token_bucket' AND endpoint = 'api.ai.completion';

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View current rate limit status per user/endpoint
CREATE OR REPLACE VIEW rate_limit_status AS
SELECT
  COALESCE(u.email, rl.api_key) as identifier,
  rl.endpoint,
  rl.request_count,
  rlc.max_requests,
  rlc.window_duration,
  rl.window_start,
  rl.window_end,
  rl.limit_exceeded,
  CASE
    WHEN rl.limit_exceeded THEN 0
    ELSE rlc.max_requests - rl.request_count
  END as remaining_requests
FROM rate_limits rl
LEFT JOIN auth.users u ON rl.user_id = u.id
LEFT JOIN rate_limit_configs rlc ON rl.endpoint = rlc.endpoint
WHERE rl.window_end > now();

-- View rate limit violations summary
CREATE OR REPLACE VIEW rate_limit_violations_summary AS
SELECT
  endpoint,
  strategy,
  COUNT(*) as violation_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_violation,
  AVG(current_count) as avg_exceeded_by
FROM rate_limit_violations
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY endpoint, strategy
ORDER BY violation_count DESC;
