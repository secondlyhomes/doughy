-- =============================================
-- AUDIT LOGGING DATABASE SCHEMA
-- =============================================
-- Comprehensive audit logging system for tracking
-- all user actions, data changes, and security events
--
-- Compliance: SOC 2, ISO 27001, GDPR, HIPAA
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
-- Core audit logging table that captures all system events

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization/tenant context
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- User who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL, -- e.g., 'create', 'update', 'delete', 'login', 'logout'
  action_category TEXT NOT NULL DEFAULT 'data', -- 'data', 'auth', 'security', 'admin'

  -- Resource being acted upon
  resource_type TEXT NOT NULL, -- e.g., 'tasks', 'users', 'organizations'
  resource_id UUID,
  resource_name TEXT, -- Human-readable name for reports

  -- Change tracking
  changes JSONB, -- { before: {...}, after: {...} }

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id UUID, -- Link to request tracing
  session_id UUID, -- Link to user session

  -- Compliance & security
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  compliance_tags TEXT[] DEFAULT '{}', -- ['gdpr', 'hipaa', 'soc2']

  -- Additional context
  metadata JSONB DEFAULT '{}', -- Flexible field for extra data

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_action_category CHECK (
    action_category IN ('data', 'auth', 'security', 'admin', 'system')
  ),
  CONSTRAINT valid_severity CHECK (
    severity IN ('info', 'warning', 'error', 'critical')
  )
);

-- Performance indexes
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, action_category);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_logs_compliance ON audit_logs USING GIN(compliance_tags);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Partial index for security events
CREATE INDEX idx_audit_logs_security ON audit_logs(created_at DESC)
  WHERE action_category = 'security' OR severity IN ('error', 'critical');

COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all system events';
COMMENT ON COLUMN audit_logs.changes IS 'JSONB containing before/after values for updates';
COMMENT ON COLUMN audit_logs.compliance_tags IS 'Tags for compliance frameworks (GDPR, HIPAA, etc.)';
COMMENT ON COLUMN audit_logs.metadata IS 'Flexible field for additional context';

-- =============================================
-- AUDIT LOG SUMMARIES (Materialized View)
-- =============================================
-- Pre-aggregated audit statistics for faster reporting

CREATE MATERIALIZED VIEW audit_log_summaries AS
SELECT
  organization_id,
  user_id,
  action_category,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS event_count,
  COUNT(DISTINCT resource_type) AS resource_types_affected,
  COUNT(*) FILTER (WHERE severity = 'critical') AS critical_events,
  COUNT(*) FILTER (WHERE severity = 'error') AS error_events
FROM audit_logs
GROUP BY organization_id, user_id, action_category, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX idx_audit_summary_unique
  ON audit_log_summaries(organization_id, user_id, action_category, date);

COMMENT ON MATERIALIZED VIEW audit_log_summaries IS 'Daily aggregated audit statistics';

-- =============================================
-- SENSITIVE DATA ACCESS LOG
-- =============================================
-- Specialized logging for PHI/PII access (HIPAA/GDPR)

CREATE TABLE IF NOT EXISTS sensitive_data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What was accessed
  data_type TEXT NOT NULL, -- 'phi', 'pii', 'financial', 'credentials'
  data_classification TEXT NOT NULL, -- 'public', 'internal', 'confidential', 'restricted'
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,

  -- Access details
  access_reason TEXT, -- Required for HIPAA minimum necessary
  fields_accessed TEXT[], -- Specific fields that were accessed
  access_granted BOOLEAN DEFAULT true,
  denial_reason TEXT, -- If access was denied

  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,

  -- Timestamps
  accessed_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_data_type CHECK (
    data_type IN ('phi', 'pii', 'financial', 'credentials', 'confidential')
  ),
  CONSTRAINT valid_classification CHECK (
    data_classification IN ('public', 'internal', 'confidential', 'restricted')
  )
);

CREATE INDEX idx_sensitive_access_org ON sensitive_data_access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_sensitive_access_user ON sensitive_data_access_logs(user_id, accessed_at DESC);
CREATE INDEX idx_sensitive_access_resource ON sensitive_data_access_logs(resource_type, resource_id);
CREATE INDEX idx_sensitive_access_denied ON sensitive_data_access_logs(accessed_at DESC)
  WHERE access_granted = false;

COMMENT ON TABLE sensitive_data_access_logs IS 'HIPAA/GDPR compliant logging for sensitive data access';

-- =============================================
-- SECURITY EVENTS LOG
-- =============================================
-- Dedicated table for security-related events

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Event classification
  event_type TEXT NOT NULL, -- 'login_failure', 'permission_denied', 'suspicious_activity'
  severity TEXT NOT NULL DEFAULT 'warning',

  -- Event details
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,

  -- Response
  was_blocked BOOLEAN DEFAULT false,
  action_taken TEXT, -- 'blocked', 'flagged', 'alerted'

  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'login_failure', 'login_success', 'logout',
      'permission_denied', 'rate_limit_exceeded',
      'suspicious_activity', 'data_breach_attempt',
      'unauthorized_access', 'password_reset',
      'mfa_enabled', 'mfa_disabled', 'api_key_leaked'
    )
  ),
  CONSTRAINT valid_severity CHECK (
    severity IN ('info', 'warning', 'error', 'critical')
  )
);

CREATE INDEX idx_security_events_org ON security_events(organization_id, occurred_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id, occurred_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, occurred_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity, occurred_at DESC)
  WHERE severity IN ('error', 'critical');
CREATE INDEX idx_security_events_blocked ON security_events(occurred_at DESC)
  WHERE was_blocked = true;

COMMENT ON TABLE security_events IS 'Security-specific events for threat monitoring';

-- =============================================
-- AUDIT RETENTION POLICIES
-- =============================================
-- Table to configure audit log retention per organization

CREATE TABLE IF NOT EXISTS audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Retention periods (in days)
  general_retention_days INTEGER DEFAULT 365,
  security_retention_days INTEGER DEFAULT 730, -- 2 years for security events
  compliance_retention_days INTEGER DEFAULT 2555, -- 7 years for compliance

  -- Archive settings
  archive_enabled BOOLEAN DEFAULT true,
  archive_location TEXT, -- S3 bucket, etc.

  -- Auto-deletion settings
  auto_delete_enabled BOOLEAN DEFAULT false,
  auto_delete_older_than_days INTEGER DEFAULT 365,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE audit_retention_policies IS 'Configure audit log retention per organization';

-- =============================================
-- AUDIT FUNCTIONS
-- =============================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id UUID;
  v_user_id UUID;
  v_changes JSONB;
  v_action TEXT;
BEGIN
  -- Determine organization_id (handle different table structures)
  IF TG_OP = 'DELETE' THEN
    v_organization_id := OLD.organization_id;
  ELSE
    v_organization_id := NEW.organization_id;
  END IF;

  -- Get current user
  v_user_id := auth.uid();

  -- Determine action type
  v_action := LOWER(TG_OP);

  -- Build changes JSON
  IF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object('before', to_jsonb(OLD));
  ELSE -- INSERT
    v_changes := jsonb_build_object('after', to_jsonb(NEW));
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    action_category,
    resource_type,
    resource_id,
    changes,
    metadata
  ) VALUES (
    v_organization_id,
    v_user_id,
    v_action,
    'data',
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_changes,
    jsonb_build_object(
      'trigger', TG_NAME,
      'timestamp', now()
    )
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger IS 'Generic trigger function for audit logging';

-- Audit trigger for authentication events
CREATE OR REPLACE FUNCTION audit_auth_event(
  p_action TEXT,
  p_user_id UUID,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    action_category,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    severity
  ) VALUES (
    p_user_id,
    p_action,
    'auth',
    'auth_events',
    p_user_id,
    p_metadata,
    inet_client_addr(),
    CASE
      WHEN p_action LIKE '%_failure' THEN 'warning'
      WHEN p_action LIKE '%_blocked' THEN 'error'
      ELSE 'info'
    END
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_auth_event IS 'Log authentication events (login, logout, etc.)';

-- Audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION audit_sensitive_access(
  p_data_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_fields_accessed TEXT[],
  p_access_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_organization_id UUID;
BEGIN
  -- Get organization from context
  v_organization_id := current_setting('app.current_organization_id', true)::UUID;

  INSERT INTO sensitive_data_access_logs (
    organization_id,
    user_id,
    data_type,
    data_classification,
    resource_type,
    resource_id,
    access_reason,
    fields_accessed,
    access_granted,
    ip_address,
    user_agent
  ) VALUES (
    v_organization_id,
    auth.uid(),
    p_data_type,
    'confidential', -- Default classification
    p_resource_type,
    p_resource_id,
    p_access_reason,
    p_fields_accessed,
    true,
    inet_client_addr(),
    current_setting('request.headers', true)::JSON->>'user-agent'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_sensitive_access IS 'Log access to sensitive data (PHI/PII)';

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_organization_id UUID;
BEGIN
  v_organization_id := current_setting('app.current_organization_id', true)::UUID;

  INSERT INTO security_events (
    organization_id,
    user_id,
    event_type,
    severity,
    description,
    details,
    ip_address,
    user_agent
  ) VALUES (
    v_organization_id,
    auth.uid(),
    p_event_type,
    p_severity,
    p_description,
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::JSON->>'user-agent'
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_security_event IS 'Log security events with automatic context';

-- =============================================
-- EXAMPLE: Apply audit triggers to tables
-- =============================================
-- Add these triggers to any tables you want to audit

-- Example: Audit tasks table
-- CREATE TRIGGER tasks_audit
--   AFTER INSERT OR UPDATE OR DELETE ON tasks
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Example: Audit users table
-- CREATE TRIGGER users_audit
--   AFTER INSERT OR UPDATE OR DELETE ON users
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Example: Audit organizations table
-- CREATE TRIGGER organizations_audit
--   AFTER INSERT OR UPDATE OR DELETE ON organizations
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all audit tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- Audit logs: Only admins can view
CREATE POLICY "audit_logs_select_policy"
  ON audit_logs FOR SELECT
  USING (
    -- User must have audit:read permission in the organization
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = audit_logs.organization_id
        AND rp.permission = 'audit:read'
    )
  );

-- No one can update or delete audit logs (immutable)
CREATE POLICY "audit_logs_no_update"
  ON audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "audit_logs_no_delete"
  ON audit_logs FOR DELETE
  USING (false);

-- Sensitive data access logs: Compliance officers only
CREATE POLICY "sensitive_access_select_policy"
  ON sensitive_data_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = sensitive_data_access_logs.organization_id
        AND rp.permission IN ('audit:read', 'compliance:read')
    )
  );

-- Security events: Security admins only
CREATE POLICY "security_events_select_policy"
  ON security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = security_events.organization_id
        AND rp.permission IN ('security:read', 'audit:read')
    )
  );

-- Audit retention policies: Organization admins
CREATE POLICY "audit_retention_select_policy"
  ON audit_retention_policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = audit_retention_policies.organization_id
        AND ur.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "audit_retention_update_policy"
  ON audit_retention_policies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = audit_retention_policies.organization_id
        AND ur.role = 'owner'
    )
  );

-- =============================================
-- MAINTENANCE & CLEANUP
-- =============================================

-- Function to refresh audit summaries
CREATE OR REPLACE FUNCTION refresh_audit_summaries()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY audit_log_summaries;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_audit_summaries IS 'Refresh audit summary materialized view';

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER := 0;
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT * FROM audit_retention_policies WHERE archive_enabled = true
  LOOP
    -- Archive logs older than retention period
    -- This is a placeholder - implement actual archiving to S3/external storage
    v_archived_count := v_archived_count + 1;
  END LOOP;

  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_audit_logs IS 'Archive old audit logs per retention policy';

-- Function to delete expired audit logs (use with caution!)
CREATE OR REPLACE FUNCTION delete_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT * FROM audit_retention_policies
    WHERE auto_delete_enabled = true
  LOOP
    -- Delete logs older than retention period
    WITH deleted AS (
      DELETE FROM audit_logs
      WHERE organization_id = v_policy.organization_id
        AND created_at < now() - (v_policy.auto_delete_older_than_days || ' days')::INTERVAL
        AND action_category != 'security' -- Never auto-delete security events
        AND NOT (compliance_tags && ARRAY['hipaa', 'gdpr']) -- Never auto-delete compliance logs
      RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  END LOOP;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_expired_audit_logs IS 'Delete expired audit logs per retention policy';

-- =============================================
-- SCHEDULED JOBS (using pg_cron extension)
-- =============================================
-- Requires: CREATE EXTENSION pg_cron;

-- Refresh audit summaries daily at 2 AM
-- SELECT cron.schedule('refresh-audit-summaries', '0 2 * * *', 'SELECT refresh_audit_summaries()');

-- Archive old logs weekly on Sunday at 3 AM
-- SELECT cron.schedule('archive-audit-logs', '0 3 * * 0', 'SELECT archive_old_audit_logs()');

-- =============================================
-- AUDIT LOG QUERIES (Views for common reports)
-- =============================================

-- Recent security events by severity
CREATE OR REPLACE VIEW recent_security_events AS
SELECT
  se.id,
  se.organization_id,
  se.user_id,
  u.email AS user_email,
  se.event_type,
  se.severity,
  se.description,
  se.was_blocked,
  se.occurred_at
FROM security_events se
LEFT JOIN auth.users u ON se.user_id = u.id
WHERE se.occurred_at > now() - interval '30 days'
ORDER BY se.occurred_at DESC;

-- User activity summary (last 30 days)
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  al.user_id,
  u.email,
  al.organization_id,
  COUNT(*) AS total_actions,
  COUNT(DISTINCT al.action) AS unique_actions,
  COUNT(DISTINCT al.resource_type) AS resource_types_accessed,
  MIN(al.created_at) AS first_action,
  MAX(al.created_at) AS last_action
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.created_at > now() - interval '30 days'
GROUP BY al.user_id, u.email, al.organization_id;

-- Failed login attempts (last 24 hours)
CREATE OR REPLACE VIEW failed_login_attempts AS
SELECT
  se.user_id,
  u.email,
  se.ip_address,
  COUNT(*) AS failed_attempts,
  MAX(se.occurred_at) AS last_attempt
FROM security_events se
LEFT JOIN auth.users u ON se.user_id = u.id
WHERE se.event_type = 'login_failure'
  AND se.occurred_at > now() - interval '24 hours'
GROUP BY se.user_id, u.email, se.ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

-- Sensitive data access by user
CREATE OR REPLACE VIEW sensitive_data_access_summary AS
SELECT
  sdal.user_id,
  u.email,
  sdal.organization_id,
  sdal.data_type,
  COUNT(*) AS access_count,
  COUNT(DISTINCT sdal.resource_id) AS unique_resources,
  MAX(sdal.accessed_at) AS last_access
FROM sensitive_data_access_logs sdal
LEFT JOIN auth.users u ON sdal.user_id = u.id
WHERE sdal.accessed_at > now() - interval '30 days'
GROUP BY sdal.user_id, u.email, sdal.organization_id, sdal.data_type;

-- =============================================
-- INITIALIZATION
-- =============================================

-- Create default retention policy for each organization
CREATE OR REPLACE FUNCTION create_default_retention_policy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_retention_policies (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create retention policy for new organizations
-- CREATE TRIGGER create_org_retention_policy
--   AFTER INSERT ON organizations
--   FOR EACH ROW EXECUTE FUNCTION create_default_retention_policy();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant read access to audit_logs for service role
GRANT SELECT ON audit_logs TO service_role;
GRANT SELECT ON sensitive_data_access_logs TO service_role;
GRANT SELECT ON security_events TO service_role;

-- Grant execute on audit functions
GRANT EXECUTE ON FUNCTION audit_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION audit_sensitive_access TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;

-- =============================================
-- END OF SCHEMA
-- =============================================
