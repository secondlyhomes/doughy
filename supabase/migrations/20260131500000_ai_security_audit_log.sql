-- Migration: AI Security Audit Logging with Hash Chaining
-- Description: Creates tamper-evident audit logging for admin security actions
--              Implements hash chaining for integrity verification (EU AI Act compliance)
-- Phase: AI Security Hardening
-- DBA Guidelines: Following docs/DATABASE_NAMING_CONVENTIONS.md

-- ============================================================================
-- 1. AUDIT LOG TABLE (ai_security_audit_log)
-- ============================================================================
-- Immutable audit trail for all security-related admin actions
-- Uses hash chaining for tamper detection

CREATE TABLE IF NOT EXISTS ai_security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event classification
  event_type TEXT NOT NULL, -- 'pattern', 'circuit_breaker', 'threat_score', 'user'

  -- Actor identification
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'system', 'automated'

  -- Target identification
  target_type TEXT, -- 'pattern', 'circuit_breaker', 'user_score', 'user'
  target_id TEXT,

  -- Action details
  action TEXT NOT NULL, -- 'create', 'update', 'soft_delete', 'restore', 'reset', 'trip', 'block', 'unblock'

  -- State change (old/new values for audit trail)
  old_value JSONB,
  new_value JSONB,

  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context like reason, ip_hash, user_agent

  -- Hash chain for integrity (tamper-evident)
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,

  -- Timestamp (TIMESTAMPTZ per DBA guidelines)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient querying (idx_{table}_{column} pattern per DBA guidelines)
CREATE INDEX idx_ai_security_audit_log_event_type
  ON ai_security_audit_log(event_type);
CREATE INDEX idx_ai_security_audit_log_actor_id
  ON ai_security_audit_log(actor_id);
CREATE INDEX idx_ai_security_audit_log_target
  ON ai_security_audit_log(target_type, target_id);
CREATE INDEX idx_ai_security_audit_log_created_at
  ON ai_security_audit_log(created_at DESC);
CREATE INDEX idx_ai_security_audit_log_action
  ON ai_security_audit_log(action);

-- ============================================================================
-- 2. HASH GENERATION FUNCTION
-- ============================================================================
-- Generates cryptographic hash chain for tamper detection

CREATE OR REPLACE FUNCTION generate_audit_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_hash TEXT;
  v_payload TEXT;
BEGIN
  -- Get the hash from the most recent audit entry
  SELECT current_hash INTO v_previous_hash
  FROM ai_security_audit_log
  ORDER BY created_at DESC
  LIMIT 1;

  -- If this is the first entry, use a genesis hash
  IF v_previous_hash IS NULL THEN
    v_previous_hash := 'GENESIS_' || encode(gen_random_bytes(16), 'hex');
  END IF;

  -- Create the hash payload from all relevant fields
  -- Order matters for verification!
  v_payload := concat_ws('|',
    NEW.id::TEXT,
    NEW.event_type,
    COALESCE(NEW.actor_id::TEXT, 'NULL'),
    NEW.actor_type,
    COALESCE(NEW.target_type, 'NULL'),
    COALESCE(NEW.target_id, 'NULL'),
    NEW.action,
    COALESCE(NEW.old_value::TEXT, 'NULL'),
    COALESCE(NEW.new_value::TEXT, 'NULL'),
    COALESCE(NEW.metadata::TEXT, '{}'),
    NEW.created_at::TEXT,
    v_previous_hash
  );

  -- Set the hash chain values
  NEW.previous_hash := v_previous_hash;
  NEW.current_hash := encode(sha256(v_payload::BYTEA), 'hex');

  RETURN NEW;
END;
$$;

-- Trigger to automatically generate hash on insert
CREATE TRIGGER trigger_ai_security_audit_hash
  BEFORE INSERT ON ai_security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION generate_audit_hash();

-- ============================================================================
-- 3. HASH CHAIN VERIFICATION FUNCTION
-- ============================================================================
-- Verifies the integrity of the audit log hash chain

CREATE OR REPLACE FUNCTION verify_audit_hash_chain(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  created_at TIMESTAMPTZ,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_expected_hash TEXT;
  v_payload TEXT;
  v_prev_hash TEXT := NULL;
  v_is_first BOOLEAN := true;
BEGIN
  FOR rec IN
    SELECT * FROM ai_security_audit_log a
    WHERE (p_start_date IS NULL OR a.created_at >= p_start_date)
      AND (p_end_date IS NULL OR a.created_at <= p_end_date)
    ORDER BY a.created_at ASC
  LOOP
    -- For the first record, just verify it has a genesis hash if it's truly first
    IF v_is_first THEN
      v_is_first := false;
      -- First record's previous_hash should be a genesis hash or link to prior
    ELSE
      -- Check that this record's previous_hash matches the last record's current_hash
      IF rec.previous_hash != v_prev_hash THEN
        id := rec.id;
        created_at := rec.created_at;
        is_valid := false;
        error_message := 'Previous hash mismatch - chain may be broken';
        RETURN NEXT;
        CONTINUE;
      END IF;
    END IF;

    -- Rebuild the expected hash
    v_payload := concat_ws('|',
      rec.id::TEXT,
      rec.event_type,
      COALESCE(rec.actor_id::TEXT, 'NULL'),
      rec.actor_type,
      COALESCE(rec.target_type, 'NULL'),
      COALESCE(rec.target_id, 'NULL'),
      rec.action,
      COALESCE(rec.old_value::TEXT, 'NULL'),
      COALESCE(rec.new_value::TEXT, 'NULL'),
      COALESCE(rec.metadata::TEXT, '{}'),
      rec.created_at::TEXT,
      rec.previous_hash
    );

    v_expected_hash := encode(sha256(v_payload::BYTEA), 'hex');

    IF rec.current_hash != v_expected_hash THEN
      id := rec.id;
      created_at := rec.created_at;
      is_valid := false;
      error_message := 'Hash verification failed - record may be tampered';
      RETURN NEXT;
    ELSE
      id := rec.id;
      created_at := rec.created_at;
      is_valid := true;
      error_message := NULL;
      RETURN NEXT;
    END IF;

    v_prev_hash := rec.current_hash;
  END LOOP;
END;
$$;

-- ============================================================================
-- 4. RLS POLICIES (Append-Only)
-- ============================================================================
-- Audit logs are append-only - no UPDATE or DELETE allowed via RLS

ALTER TABLE ai_security_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view all audit_logs"
  ON ai_security_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Service role can insert (used by triggers and functions)
CREATE POLICY "Service role can insert audit_logs"
  ON ai_security_audit_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Note: No UPDATE or DELETE policies = immutable

-- ============================================================================
-- 5. AUDIT TRIGGER FOR BLOCKED PATTERNS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_blocked_pattern_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ai_security_audit_log (
      event_type, actor_id, actor_type, target_type, target_id,
      action, old_value, new_value
    ) VALUES (
      'pattern',
      auth.uid(),
      'admin',
      'pattern',
      NEW.id::TEXT,
      'create',
      NULL,
      jsonb_build_object(
        'pattern', NEW.pattern,
        'pattern_type', NEW.pattern_type,
        'severity', NEW.severity,
        'description', NEW.description,
        'is_active', NEW.is_active
      )
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if this is a soft-delete (deleted_at being set)
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      INSERT INTO ai_security_audit_log (
        event_type, actor_id, actor_type, target_type, target_id,
        action, old_value, new_value
      ) VALUES (
        'pattern',
        auth.uid(),
        'admin',
        'pattern',
        NEW.id::TEXT,
        'soft_delete',
        jsonb_build_object(
          'pattern', OLD.pattern,
          'pattern_type', OLD.pattern_type,
          'severity', OLD.severity,
          'description', OLD.description,
          'is_active', OLD.is_active
        ),
        jsonb_build_object(
          'deleted_at', NEW.deleted_at,
          'deleted_by', NEW.deleted_by
        )
      );
    -- Check if this is a restore (deleted_at being cleared)
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      INSERT INTO ai_security_audit_log (
        event_type, actor_id, actor_type, target_type, target_id,
        action, old_value, new_value
      ) VALUES (
        'pattern',
        auth.uid(),
        'admin',
        'pattern',
        NEW.id::TEXT,
        'restore',
        jsonb_build_object(
          'deleted_at', OLD.deleted_at,
          'deleted_by', OLD.deleted_by
        ),
        jsonb_build_object(
          'pattern', NEW.pattern,
          'is_active', NEW.is_active
        )
      );
    -- Regular update
    ELSE
      INSERT INTO ai_security_audit_log (
        event_type, actor_id, actor_type, target_type, target_id,
        action, old_value, new_value
      ) VALUES (
        'pattern',
        auth.uid(),
        'admin',
        'pattern',
        NEW.id::TEXT,
        'update',
        jsonb_build_object(
          'pattern', OLD.pattern,
          'pattern_type', OLD.pattern_type,
          'severity', OLD.severity,
          'description', OLD.description,
          'is_active', OLD.is_active
        ),
        jsonb_build_object(
          'pattern', NEW.pattern,
          'pattern_type', NEW.pattern_type,
          'severity', NEW.severity,
          'description', NEW.description,
          'is_active', NEW.is_active
        )
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Log hard deletes (should be rare/never in production)
    INSERT INTO ai_security_audit_log (
      event_type, actor_id, actor_type, target_type, target_id,
      action, old_value, new_value
    ) VALUES (
      'pattern',
      auth.uid(),
      'admin',
      'pattern',
      OLD.id::TEXT,
      'hard_delete',
      jsonb_build_object(
        'pattern', OLD.pattern,
        'pattern_type', OLD.pattern_type,
        'severity', OLD.severity,
        'description', OLD.description,
        'is_active', OLD.is_active
      ),
      NULL
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_audit_blocked_patterns
  AFTER INSERT OR UPDATE OR DELETE ON ai_moltbot_blocked_patterns
  FOR EACH ROW
  EXECUTE FUNCTION audit_blocked_pattern_changes();

-- ============================================================================
-- 6. AUDIT TRIGGER FOR CIRCUIT BREAKERS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_circuit_breaker_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Only log state changes (trip or reset)
    IF NEW.is_open != OLD.is_open THEN
      INSERT INTO ai_security_audit_log (
        event_type, actor_id, actor_type, target_type, target_id,
        action, old_value, new_value, metadata
      ) VALUES (
        'circuit_breaker',
        COALESCE(NEW.opened_by, auth.uid()),
        'admin',
        'circuit_breaker',
        NEW.scope,
        CASE WHEN NEW.is_open THEN 'trip' ELSE 'reset' END,
        jsonb_build_object(
          'is_open', OLD.is_open,
          'reason', OLD.reason,
          'opened_at', OLD.opened_at
        ),
        jsonb_build_object(
          'is_open', NEW.is_open,
          'reason', NEW.reason,
          'opened_at', NEW.opened_at,
          'auto_close_at', NEW.auto_close_at
        ),
        jsonb_build_object(
          'trip_count', NEW.trip_count
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_audit_circuit_breakers
  AFTER UPDATE ON ai_moltbot_circuit_breakers
  FOR EACH ROW
  EXECUTE FUNCTION audit_circuit_breaker_changes();

-- ============================================================================
-- 7. AUDIT TRIGGER FOR THREAT SCORES
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_threat_score_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log when manually reset to 0 (not automatic decay)
    IF NEW.current_score = 0 AND OLD.current_score > 0 AND OLD.event_count_24h > 0 AND NEW.event_count_24h = 0 THEN
      INSERT INTO ai_security_audit_log (
        event_type, actor_id, actor_type, target_type, target_id,
        action, old_value, new_value
      ) VALUES (
        'threat_score',
        auth.uid(),
        'admin',
        'user_score',
        NEW.user_id::TEXT,
        'reset',
        jsonb_build_object(
          'current_score', OLD.current_score,
          'event_count_24h', OLD.event_count_24h,
          'event_count_total', OLD.event_count_total,
          'is_flagged', OLD.is_flagged,
          'is_blocked', OLD.is_blocked
        ),
        jsonb_build_object(
          'current_score', NEW.current_score,
          'event_count_24h', NEW.event_count_24h,
          'event_count_total', NEW.event_count_total,
          'is_flagged', NEW.is_flagged,
          'is_blocked', NEW.is_blocked
        )
      );
    -- Log flag/block status changes
    ELSIF NEW.is_flagged != OLD.is_flagged OR NEW.is_blocked != OLD.is_blocked THEN
      INSERT INTO ai_security_audit_log (
        event_type, actor_id, actor_type, target_type, target_id,
        action, old_value, new_value
      ) VALUES (
        'threat_score',
        auth.uid(),
        CASE
          WHEN auth.uid() IS NOT NULL THEN 'admin'
          ELSE 'automated'
        END,
        'user_score',
        NEW.user_id::TEXT,
        CASE
          WHEN NEW.is_blocked AND NOT OLD.is_blocked THEN 'block'
          WHEN NOT NEW.is_blocked AND OLD.is_blocked THEN 'unblock'
          WHEN NEW.is_flagged AND NOT OLD.is_flagged THEN 'flag'
          WHEN NOT NEW.is_flagged AND OLD.is_flagged THEN 'unflag'
          ELSE 'update'
        END,
        jsonb_build_object(
          'is_flagged', OLD.is_flagged,
          'is_blocked', OLD.is_blocked,
          'current_score', OLD.current_score
        ),
        jsonb_build_object(
          'is_flagged', NEW.is_flagged,
          'is_blocked', NEW.is_blocked,
          'current_score', NEW.current_score
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_audit_threat_scores
  AFTER UPDATE ON ai_moltbot_user_threat_scores
  FOR EACH ROW
  EXECUTE FUNCTION audit_threat_score_changes();

-- ============================================================================
-- 8. TABLE COMMENTS (per DBA guidelines)
-- ============================================================================

COMMENT ON TABLE ai_security_audit_log IS 'Immutable audit trail for all security-related admin actions with hash chaining for tamper detection';

COMMENT ON COLUMN ai_security_audit_log.event_type IS 'Category of event: pattern, circuit_breaker, threat_score, user';
COMMENT ON COLUMN ai_security_audit_log.actor_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN ai_security_audit_log.actor_type IS 'Type of actor: admin, system, automated';
COMMENT ON COLUMN ai_security_audit_log.target_type IS 'Type of entity affected';
COMMENT ON COLUMN ai_security_audit_log.target_id IS 'ID of entity affected';
COMMENT ON COLUMN ai_security_audit_log.action IS 'Action performed: create, update, soft_delete, restore, reset, trip, block, unblock';
COMMENT ON COLUMN ai_security_audit_log.old_value IS 'State before the change (JSONB)';
COMMENT ON COLUMN ai_security_audit_log.new_value IS 'State after the change (JSONB)';
COMMENT ON COLUMN ai_security_audit_log.previous_hash IS 'Hash of the previous audit entry (for chain verification)';
COMMENT ON COLUMN ai_security_audit_log.current_hash IS 'Hash of this entry including previous_hash (tamper detection)';

COMMENT ON FUNCTION generate_audit_hash IS 'Generates cryptographic hash chain for each audit entry';
COMMENT ON FUNCTION verify_audit_hash_chain IS 'Verifies integrity of the audit log hash chain';
