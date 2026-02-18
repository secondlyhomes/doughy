# Audit Logging Pattern

> Tracking user actions for compliance and security in React Native apps.

## Overview

Audit logging records user actions for security monitoring, compliance requirements, and debugging. This pattern implements comprehensive, tamper-resistant audit logs with Supabase.

## Database Schema

```sql
-- Audit logs table (append-only)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Prevent updates and deletes
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
```

## Row Level Security

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their tenant's logs
CREATE POLICY "View tenant audit logs"
  ON audit_logs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

-- Only secret key can insert (via Edge Functions)
CREATE POLICY "Service role inserts logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

## Audit Log Service

```typescript
// src/services/auditLog.ts
import { supabase } from './supabase';

interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const logAuditEvent = async (entry: AuditLogEntry): Promise<void> => {
  // Send to Edge Function for server-side logging
  const { error } = await supabase.functions.invoke('audit-log', {
    body: entry,
  });

  if (error) {
    console.error('Audit log failed:', error);
    // Queue for retry if needed
  }
};

// Predefined action types
export const AuditActions = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',
  PASSWORD_CHANGED: 'auth.password_changed',

  // Resources
  CREATED: 'resource.created',
  UPDATED: 'resource.updated',
  DELETED: 'resource.deleted',
  VIEWED: 'resource.viewed',
  EXPORTED: 'resource.exported',

  // Settings
  SETTINGS_UPDATED: 'settings.updated',
  ROLE_ASSIGNED: 'role.assigned',
  MEMBER_INVITED: 'member.invited',
  MEMBER_REMOVED: 'member.removed',
} as const;
```

## Edge Function for Audit Logging

```typescript
// supabase/functions/audit-log/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!
  );

  // Get user from JWT
  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();

  // Get tenant context
  const { data: membership } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase.from('audit_logs').insert({
    tenant_id: membership?.tenant_id,
    user_id: user.id,
    action: body.action,
    resource_type: body.resourceType,
    resource_id: body.resourceId,
    old_values: body.oldValues,
    new_values: body.newValues,
    metadata: body.metadata,
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
  });

  return new Response(JSON.stringify({ success: !error }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Audit Log Viewer

```typescript
// src/screens/audit-logs-screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/services/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  user: { email: string };
}

export const AuditLogsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { currentTenant } = useTenant();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [currentTenant]);

  const loadLogs = async () => {
    if (!currentTenant) return;

    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:auth.users(email)')
      .eq('tenant_id', currentTenant.id)
      .order('created_at', { ascending: false })
      .limit(100);

    setLogs(data || []);
    setIsLoading(false);
  };

  const renderLogItem = ({ item }: { item: AuditLog }) => (
    <View style={[styles.logItem, { borderBottomColor: colors.border }]}>
      <View style={styles.logHeader}>
        <Text style={[styles.action, { color: colors.text }]}>{item.action}</Text>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {format(new Date(item.created_at), 'MMM d, h:mm a')}
        </Text>
      </View>
      <Text style={[styles.details, { color: colors.textSecondary }]}>
        {item.user?.email} · {item.resource_type}
      </Text>
    </View>
  );

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  list: { padding: 16 },
  logItem: { paddingVertical: 12, borderBottomWidth: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { fontSize: 15, fontWeight: '500' },
  timestamp: { fontSize: 13 },
  details: { fontSize: 13, marginTop: 4 },
});
```

## Automatic Logging with Triggers

```sql
-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to tables needing automatic auditing
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

## Implementation Examples

See `.examples/enterprise/audit-dashboard/` for a complete audit log viewer with filtering.

## Related Patterns

- [Compliance](./COMPLIANCE.md)
- [RBAC](./RBAC.md)
- [Data Export](./DATA-EXPORT.md)
