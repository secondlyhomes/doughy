# Auditing & Compliance

> Audit trails, data retention, GDPR compliance, and regulatory requirements.

## Overview

Proper auditing enables:
- Debugging issues in production
- Security incident investigation
- Regulatory compliance (GDPR, CCPA, HIPAA)
- User trust through transparency

## Audit Trail System

### Audit Log Table

```sql
-- Core audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,

  -- What
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export'
  resource_type TEXT NOT NULL, -- 'task', 'user', 'payment'
  resource_id UUID,

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- Prevent modification (audit logs are immutable)
CREATE POLICY "No updates to audit logs"
ON audit_logs FOR UPDATE
USING (false);

CREATE POLICY "No deletes from audit logs"
ON audit_logs FOR DELETE
USING (false);
```

### Automatic Audit Trigger

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id, new_values
    ) VALUES (
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id, old_values, new_values
    ) VALUES (
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id, old_values
    ) VALUES (
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to tables that need auditing
CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Logging in Edge Functions

```typescript
// supabase/functions/_shared/audit.ts
import { supabase } from './supabase-admin.ts';

interface AuditEntry {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry) {
  await supabase.from('audit_logs').insert({
    user_id: entry.userId,
    user_email: entry.userEmail,
    ip_address: entry.ipAddress,
    user_agent: entry.userAgent,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    old_values: entry.oldValues,
    new_values: entry.newValues,
  });
}

// Usage in Edge Function
Deno.serve(async (req) => {
  const user = await getUser(req);

  // Log sensitive action
  await logAudit({
    userId: user.id,
    userEmail: user.email,
    ipAddress: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
    action: 'export_data',
    resourceType: 'user_data',
    resourceId: user.id,
    metadata: { format: 'json', includeDeleted: false },
  });

  // Proceed with export...
});
```

## GDPR Compliance

### User Rights Implementation

| Right | Implementation |
|-------|----------------|
| Access | Data export endpoint |
| Rectification | Profile update UI |
| Erasure | Account deletion with cascade |
| Portability | JSON/CSV export |
| Restriction | Account suspension |
| Objection | Marketing opt-out |

### Data Export (Right to Access)

```typescript
// supabase/functions/export-user-data/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!
  );

  const authHeader = req.headers.get('Authorization');
  const { data: { user } } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '')
  );

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Collect all user data
  const [profile, tasks, preferences, auditLogs] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('tasks').select('*').eq('user_id', user.id),
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile.data,
    tasks: tasks.data,
    preferences: preferences.data,
    activity_log: auditLogs.data,
  };

  // Log the export action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'data_export',
    resource_type: 'user_data',
    resource_id: user.id,
  });

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="user-data-${user.id}.json"`,
    },
  });
});
```

### Account Deletion (Right to Erasure)

```typescript
// supabase/functions/delete-account/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!
  );

  const { data: { user } } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.replace('Bearer ', '')
  );

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify deletion request (require password or 2FA)
  const { password } = await req.json();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (authError) {
    return new Response('Invalid credentials', { status: 400 });
  }

  // Log deletion before performing it
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'account_deletion_requested',
    resource_type: 'user',
    resource_id: user.id,
  });

  // Option 1: Hard delete (if CASCADE is set up)
  // await supabase.auth.admin.deleteUser(user.id);

  // Option 2: Soft delete with anonymization (recommended)
  await supabase.from('user_profiles').update({
    display_name: '[Deleted User]',
    avatar_url: null,
    bio: null,
    deleted_at: new Date().toISOString(),
  }).eq('user_id', user.id);

  // Anonymize user in auth
  await supabase.auth.admin.updateUserById(user.id, {
    email: `deleted-${user.id}@deleted.local`,
    user_metadata: { deleted: true, deleted_at: new Date().toISOString() },
  });

  return new Response(JSON.stringify({ success: true }));
});
```

### Consent Management

```sql
-- Track user consent
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Consent types
  marketing_emails BOOLEAN DEFAULT false,
  analytics_tracking BOOLEAN DEFAULT false,
  third_party_sharing BOOLEAN DEFAULT false,

  -- Audit
  consent_given_at TIMESTAMPTZ,
  consent_withdrawn_at TIMESTAMPTZ,
  consent_ip INET,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
```

```typescript
// src/services/consent.ts
export async function updateConsent(
  userId: string,
  consents: {
    marketingEmails?: boolean;
    analyticsTracking?: boolean;
    thirdPartySharing?: boolean;
  }
) {
  const { error } = await supabase
    .from('user_consents')
    .upsert({
      user_id: userId,
      marketing_emails: consents.marketingEmails,
      analytics_tracking: consents.analyticsTracking,
      third_party_sharing: consents.thirdPartySharing,
      consent_given_at: new Date().toISOString(),
    });

  // Log consent change
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'consent_updated',
    resource_type: 'user_consents',
    new_values: consents,
  });

  return { error };
}
```

## Data Retention

### Retention Policies

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| User content | Until deletion request | User owns their data |
| Audit logs | 7 years | Legal/compliance |
| Session logs | 90 days | Debugging |
| Error logs | 30 days | Debugging |
| Analytics (aggregated) | Indefinite | Business insights |
| Analytics (raw) | 90 days | Privacy |
| Soft-deleted data | 30 days | Recovery period |

### Automated Cleanup

```sql
-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Permanently delete soft-deleted records older than 30 days
  DELETE FROM tasks
  WHERE deleted_at < NOW() - INTERVAL '30 days';

  DELETE FROM user_profiles
  WHERE deleted_at < NOW() - INTERVAL '30 days';

  -- Clean up old session logs
  DELETE FROM session_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Clean up old error logs
  DELETE FROM error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Log the cleanup
  INSERT INTO audit_logs (action, resource_type, new_values)
  VALUES ('data_cleanup', 'system', jsonb_build_object('executed_at', NOW()));
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (Supabase Pro)
SELECT cron.schedule(
  'cleanup-old-data',
  '0 3 * * *', -- Daily at 3 AM
  'SELECT cleanup_old_data()'
);
```

## Security Event Logging

### Critical Events to Log

```typescript
// Events that MUST be logged
const CRITICAL_EVENTS = [
  'login_success',
  'login_failure',
  'logout',
  'password_change',
  'email_change',
  'mfa_enabled',
  'mfa_disabled',
  'account_created',
  'account_deleted',
  'permission_change',
  'data_export',
  'payment_processed',
  'subscription_change',
  'admin_action',
];
```

### Authentication Event Logging

```typescript
// src/services/auth-events.ts
import { supabase } from './supabase';

supabase.auth.onAuthStateChange(async (event, session) => {
  const user = session?.user;

  const eventMap: Record<string, string> = {
    SIGNED_IN: 'login_success',
    SIGNED_OUT: 'logout',
    USER_UPDATED: 'profile_updated',
    PASSWORD_RECOVERY: 'password_recovery_requested',
  };

  if (eventMap[event]) {
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      user_email: user?.email,
      action: eventMap[event],
      resource_type: 'auth',
    });
  }
});
```

### Failed Login Tracking

```sql
-- Track failed logins for security monitoring
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT, -- 'invalid_password', 'user_not_found', 'account_locked'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for monitoring
CREATE INDEX idx_failed_logins_email ON failed_login_attempts(email, created_at DESC);
CREATE INDEX idx_failed_logins_ip ON failed_login_attempts(ip_address, created_at DESC);

-- Alert on suspicious activity (5+ failures in 10 minutes)
CREATE OR REPLACE FUNCTION check_login_anomaly()
RETURNS TRIGGER AS $$
DECLARE
  failure_count INT;
BEGIN
  SELECT COUNT(*) INTO failure_count
  FROM failed_login_attempts
  WHERE (email = NEW.email OR ip_address = NEW.ip_address)
    AND created_at > NOW() - INTERVAL '10 minutes';

  IF failure_count >= 5 THEN
    -- Insert security alert
    INSERT INTO security_alerts (alert_type, severity, details)
    VALUES (
      'brute_force_attempt',
      'high',
      jsonb_build_object(
        'email', NEW.email,
        'ip', NEW.ip_address,
        'attempt_count', failure_count
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_login_anomaly_trigger
  AFTER INSERT ON failed_login_attempts
  FOR EACH ROW EXECUTE FUNCTION check_login_anomaly();
```

## Compliance Reports

### Generate Compliance Report

```typescript
// supabase/functions/compliance-report/index.ts
interface ComplianceReport {
  generated_at: string;
  period: { start: string; end: string };
  metrics: {
    total_users: number;
    data_exports_requested: number;
    deletion_requests: number;
    consent_changes: number;
    security_incidents: number;
  };
  audit_summary: {
    total_events: number;
    by_action: Record<string, number>;
  };
}

Deno.serve(async (req) => {
  // Verify admin access
  const isAdmin = await verifyAdminAccess(req);
  if (!isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  const { startDate, endDate } = await req.json();

  // Gather metrics
  const [users, exports, deletions, consents, incidents, auditSummary] =
    await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact' }),
      supabase.from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action', 'data_export')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase.from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action', 'account_deletion_requested')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase.from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action', 'consent_updated')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase.from('security_alerts')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase.rpc('get_audit_summary', { start_date: startDate, end_date: endDate }),
    ]);

  const report: ComplianceReport = {
    generated_at: new Date().toISOString(),
    period: { start: startDate, end: endDate },
    metrics: {
      total_users: users.count || 0,
      data_exports_requested: exports.count || 0,
      deletion_requests: deletions.count || 0,
      consent_changes: consents.count || 0,
      security_incidents: incidents.count || 0,
    },
    audit_summary: auditSummary.data,
  };

  return new Response(JSON.stringify(report, null, 2));
});
```

## Checklist

### Audit System

- [ ] Audit log table created
- [ ] Audit triggers on sensitive tables
- [ ] Audit logs are immutable (no UPDATE/DELETE)
- [ ] Edge functions log critical actions
- [ ] Failed login attempts tracked

### GDPR Compliance

- [ ] Data export endpoint implemented
- [ ] Account deletion endpoint implemented
- [ ] Consent tracking in place
- [ ] Privacy policy updated
- [ ] Cookie consent banner (if web)

### Data Retention

- [ ] Retention policies documented
- [ ] Automated cleanup jobs scheduled
- [ ] Soft delete with grace period
- [ ] Backup retention matches policy

### Security Monitoring

- [ ] Authentication events logged
- [ ] Failed login alerts configured
- [ ] Admin action logging
- [ ] Anomaly detection in place

## Related Docs

- [Security Checklist](./SECURITY-CHECKLIST.md) - Overall security
- [RLS Policies](../03-database/RLS-POLICIES.md) - Data access control
- [Schema Best Practices](../03-database/SCHEMA-BEST-PRACTICES.md) - Database design
