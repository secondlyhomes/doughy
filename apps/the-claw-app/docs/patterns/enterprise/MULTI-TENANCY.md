# Multi-Tenancy Pattern

> Organization and workspace switching for enterprise applications.

## Overview

Multi-tenancy allows a single application instance to serve multiple organizations (tenants) while keeping their data isolated. This pattern covers shared-database multi-tenancy with Row Level Security.

## Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-tenant membership
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Add tenant_id to all tenant-scoped tables
ALTER TABLE projects ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tasks ADD COLUMN tenant_id UUID REFERENCES tenants(id);
```

## Row Level Security

```sql
-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can see tenants they belong to
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

-- Tenant-scoped data access
CREATE POLICY "Users can view tenant projects"
  ON projects FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

-- Insert requires active tenant context
CREATE POLICY "Users can create in their tenant"
  ON projects FOR INSERT
  WITH CHECK (
    tenant_id = (current_setting('app.current_tenant_id', true))::UUID
    AND tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );
```

## Tenant Context Provider

```typescript
// src/contexts/TenantContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<void>;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*');

    if (data) {
      setTenants(data);
      const savedTenantId = await AsyncStorage.getItem('currentTenantId');
      const tenant = data.find(t => t.id === savedTenantId) || data[0];
      if (tenant) {
        await switchTenant(tenant.id);
      }
    }
    setIsLoading(false);
  };

  const switchTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      await AsyncStorage.setItem('currentTenantId', tenantId);
      // Set tenant context for RLS
      await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    }
  };

  return (
    <TenantContext.Provider value={{ currentTenant, tenants, switchTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
```

## Tenant Switcher Component

```typescript
// src/components/TenantSwitcher.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';

export const TenantSwitcher: React.FC = () => {
  const { currentTenant, tenants, switchTenant } = useTenant();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = async (tenantId: string) => {
    await switchTenant(tenantId);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.surface }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.tenantName, { color: colors.text }]}>
          {currentTenant?.name || 'Select Organization'}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Switch Organization
            </Text>
            <FlatList
              data={tenants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tenantItem,
                    item.id === currentTenant?.id && styles.selected
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <Text style={{ color: colors.text }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: { padding: 12, borderRadius: 8 },
  tenantName: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  tenantItem: { padding: 16, borderRadius: 8 },
  selected: { backgroundColor: 'rgba(0,122,255,0.1)' },
});
```

## Server-Side Tenant Context

```sql
-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Examples

See `.examples/enterprise/multi-tenant-app/` for a complete working example.

## Related Patterns

- [Tenant Isolation](./TENANT-ISOLATION.md)
- [RBAC](./RBAC.md)
- [White-Labeling](./WHITE-LABELING.md)
