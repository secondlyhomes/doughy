# Role-Based Access Control (RBAC) Pattern

> Implementing fine-grained permissions in React Native with Supabase.

## Overview

RBAC restricts system access based on user roles and permissions. This pattern provides a flexible, scalable approach to authorization that works with multi-tenant applications.

## Database Schema

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- Built-in roles can't be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage'))
);

-- Role-permission mapping
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User-role assignment (extends tenant_members)
ALTER TABLE tenant_members ADD COLUMN role_id UUID REFERENCES roles(id);

-- Seed default permissions
INSERT INTO permissions (name, resource, action) VALUES
  ('projects.create', 'projects', 'create'),
  ('projects.read', 'projects', 'read'),
  ('projects.update', 'projects', 'update'),
  ('projects.delete', 'projects', 'delete'),
  ('members.manage', 'members', 'manage'),
  ('settings.manage', 'settings', 'manage'),
  ('billing.manage', 'billing', 'manage');
```

## Row Level Security

```sql
-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Users can view roles in their tenant
CREATE POLICY "View tenant roles"
  ON roles FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- Only admins can modify roles
CREATE POLICY "Admins manage roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN roles r ON r.id = tm.role_id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = roles.tenant_id
        AND p.name = 'members.manage'
    )
  );
```

## Permission Helper Functions

```sql
-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tenant_members tm
    JOIN role_permissions rp ON rp.role_id = tm.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE tm.user_id = p_user_id
      AND tm.tenant_id = p_tenant_id
      AND p.name = p_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all permissions for user in tenant
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_tenant_id UUID
) RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(DISTINCT p.name)
  FROM tenant_members tm
  JOIN role_permissions rp ON rp.role_id = tm.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE tm.user_id = p_user_id
    AND tm.tenant_id = p_tenant_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

## RBAC Context Provider

```typescript
// src/contexts/RBACContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useTenant } from './TenantContext';
import { useAuth } from './AuthContext';

interface RBACContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && currentTenant) {
      loadPermissions();
    }
  }, [user, currentTenant]);

  const loadPermissions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: user!.id,
      p_tenant_id: currentTenant!.id,
    });

    if (data) {
      setPermissions(data);
    }
    setIsLoading(false);
  };

  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasAnyPermission = (perms: string[]) => perms.some(p => permissions.includes(p));
  const hasAllPermissions = (perms: string[]) => perms.every(p => permissions.includes(p));

  return (
    <RBACContext.Provider value={{ permissions, hasPermission, hasAnyPermission, hasAllPermissions, isLoading }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) throw new Error('useRBAC must be used within RBACProvider');
  return context;
};
```

## Permission Gate Component

```typescript
// src/components/PermissionGate.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRBAC } from '@/contexts/RBACContext';
import { useTheme } from '@/contexts/ThemeContext';

interface PermissionGateProps {
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBAC();

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Access denied fallback component
export const AccessDenied: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        You don't have permission to access this feature.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center' },
});
```

## Usage Example

```typescript
// src/screens/settings-screen.tsx
import { PermissionGate, AccessDenied } from '@/components/PermissionGate';

export const SettingsScreen: React.FC = () => {
  return (
    <View>
      <PermissionGate permission="settings.manage" fallback={<AccessDenied />}>
        <BillingSettings />
      </PermissionGate>

      <PermissionGate permission="members.manage">
        <TeamManagement />
      </PermissionGate>
    </View>
  );
};
```

## Implementation Examples

See `.examples/enterprise/rbac-system/` for a complete working example with role management UI.

## Related Patterns

- [Multi-Tenancy](./MULTI-TENANCY.md)
- [Audit Logging](./AUDIT-LOGGING.md)
- [Enterprise Authentication](./ENTERPRISE-AUTHENTICATION.md)
