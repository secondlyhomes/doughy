# Tenant Isolation Pattern

> Data separation strategies for multi-tenant React Native applications.

## Overview

Tenant isolation ensures that data from one tenant cannot be accessed by another. This pattern covers various isolation strategies with Supabase RLS and their trade-offs.

## Isolation Strategies

### 1. Shared Database with RLS (Recommended)

All tenants share the same database, with RLS enforcing isolation.

```sql
-- All tables have tenant_id
ALTER TABLE projects ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tasks ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- RLS policy template
CREATE POLICY "Tenant isolation"
  ON projects FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );
```

### 2. Schema-Per-Tenant

Each tenant gets their own PostgreSQL schema.

```sql
-- Create schema for new tenant
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_slug TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS tenant_%s', tenant_slug);

  -- Create tables in tenant schema
  EXECUTE format('
    CREATE TABLE tenant_%s.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )', tenant_slug);

  EXECUTE format('
    CREATE TABLE tenant_%s.tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES tenant_%s.projects(id),
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )', tenant_slug, tenant_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search path based on tenant
CREATE OR REPLACE FUNCTION set_tenant_schema(tenant_slug TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('search_path', format('tenant_%s, public', tenant_slug), false);
END;
$$ LANGUAGE plpgsql;
```

## Hybrid Isolation Model

```sql
-- Shared tables (used across tenants)
CREATE TABLE shared.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT
);

-- Tenant-specific tables with RLS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensitive data in separate table with extra controls
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  encrypted_data BYTEA NOT NULL,
  access_level TEXT CHECK (access_level IN ('normal', 'restricted', 'confidential')),
  last_accessed_at TIMESTAMPTZ,
  last_accessed_by UUID
);

-- Stricter RLS for sensitive data
CREATE POLICY "Restricted access to sensitive data"
  ON sensitive_data FOR SELECT
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM tenant_members tm
      JOIN role_permissions rp ON rp.role_id = tm.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE tm.user_id = auth.uid()
        AND p.name = 'sensitive_data.read'
    )
  );
```

## Tenant Context Service

```typescript
// src/services/tenantContext.ts
import { supabase } from './supabase';

class TenantContextService {
  private currentTenantId: string | null = null;

  async setTenant(tenantId: string): Promise<void> {
    this.currentTenantId = tenantId;

    // Set tenant context for RLS
    await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
  }

  getTenantId(): string {
    if (!this.currentTenantId) {
      throw new Error('Tenant context not set');
    }
    return this.currentTenantId;
  }

  // Helper to add tenant_id to queries
  withTenant<T extends Record<string, unknown>>(data: T): T & { tenant_id: string } {
    return { ...data, tenant_id: this.getTenantId() };
  }
}

export const tenantContext = new TenantContextService();
```

## Isolation Verification Hook

```typescript
// src/hooks/useTenantIsolation.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useTenant } from '@/contexts/TenantContext';

interface IsolationStatus {
  isVerified: boolean;
  lastChecked: Date;
  violations: string[];
}

export const useTenantIsolation = () => {
  const { currentTenant } = useTenant();
  const [status, setStatus] = useState<IsolationStatus>({
    isVerified: false,
    lastChecked: new Date(),
    violations: [],
  });

  useEffect(() => {
    if (currentTenant) {
      verifyIsolation();
    }
  }, [currentTenant]);

  const verifyIsolation = async () => {
    const violations: string[] = [];

    // Check that all queries return only current tenant's data
    const tables = ['projects', 'tasks', 'documents'];

    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select('tenant_id')
        .limit(100);

      const foreignData = data?.filter(row => row.tenant_id !== currentTenant?.id);
      if (foreignData && foreignData.length > 0) {
        violations.push(`Found ${foreignData.length} foreign records in ${table}`);
      }
    }

    setStatus({
      isVerified: violations.length === 0,
      lastChecked: new Date(),
      violations,
    });
  };

  return status;
};
```

## Cross-Tenant Data Sharing

```sql
-- Shared resources between specific tenants
CREATE TABLE shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_tenant_id UUID REFERENCES tenants(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shared_resource_access (
  shared_resource_id UUID REFERENCES shared_resources(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('read', 'write')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (shared_resource_id, tenant_id)
);

-- RLS for shared resources
CREATE POLICY "Access shared resources"
  ON projects FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
    OR
    id IN (
      SELECT sr.resource_id FROM shared_resources sr
      JOIN shared_resource_access sra ON sra.shared_resource_id = sr.id
      WHERE sr.resource_type = 'project'
        AND sra.tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
    )
  );
```

## Tenant Isolation Screen

```typescript
// src/screens/tenant-isolation-screen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTenantIsolation } from '@/hooks/useTenantIsolation';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';

export const TenantIsolationScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isVerified, lastChecked, violations } = useTenantIsolation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.statusIndicator, { backgroundColor: isVerified ? colors.success : colors.error }]} />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            {isVerified ? 'Isolation Verified' : 'Isolation Issues Detected'}
          </Text>
          <Text style={[styles.statusDate, { color: colors.textSecondary }]}>
            Last checked: {format(lastChecked, 'MMM d, h:mm a')}
          </Text>
        </View>
      </View>

      {violations.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Violations</Text>
          <FlatList
            data={violations}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={[styles.violationItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.violationText, { color: colors.error }]}>{item}</Text>
              </View>
            )}
          />
        </>
      )}

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>About Tenant Isolation</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Tenant isolation ensures your organization's data is completely separated from other organizations.
          All database queries are filtered using Row Level Security (RLS) policies.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  statusCard: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 24 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 18, fontWeight: '600' },
  statusDate: { fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  violationItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  violationText: { fontSize: 14 },
  infoSection: { marginTop: 32 },
  infoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  infoText: { fontSize: 14, lineHeight: 20 },
});
```

## Database Triggers for Isolation

```sql
-- Prevent tenant_id modification
CREATE OR REPLACE FUNCTION prevent_tenant_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Cannot change tenant_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_tenant_immutability
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION prevent_tenant_change();

-- Auto-set tenant_id on insert
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := (current_setting('app.current_tenant_id', true))::UUID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_tenant
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();
```

## Comparison Table

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| Shared + RLS | Simple, cost-effective | Shared resources | Most SaaS apps |
| Schema-per-tenant | Strong isolation | Complex migrations | Regulated industries |
| Database-per-tenant | Complete isolation | High cost, maintenance | Enterprise/healthcare |

## Implementation Examples

See `.examples/enterprise/tenant-isolation/` for complete isolation implementations.

## Related Patterns

- [Multi-Tenancy](./MULTI-TENANCY.md)
- [RBAC](./RBAC.md)
- [Compliance](./COMPLIANCE.md)
