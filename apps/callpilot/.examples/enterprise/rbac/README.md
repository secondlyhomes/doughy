# Role-Based Access Control (RBAC) Implementation Guide

Complete guide to implementing fine-grained RBAC in your React Native + Expo + Supabase application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Setup](#database-setup)
4. [Permission System](#permission-system)
5. [Role Management](#role-management)
6. [Frontend Integration](#frontend-integration)
7. [Permission Guards](#permission-guards)
8. [Resource-Level Permissions](#resource-level-permissions)
9. [Best Practices](#best-practices)
10. [Testing](#testing)

---

## Overview

### What is RBAC?

Role-Based Access Control (RBAC) is a security paradigm that restricts system access based on user roles. Users are assigned roles, and roles are granted permissions to perform specific actions.

### Benefits

- **Fine-Grained Control**: Precisely control who can do what
- **Scalability**: Easy to manage permissions for hundreds of users
- **Flexibility**: Create custom roles for specific needs
- **Auditability**: Track who has access to what
- **Compliance**: Meet regulatory requirements (SOC 2, HIPAA, etc.)

### Permission Model

```
resource:action
```

Examples:
- `tasks:create` - Can create tasks
- `tasks:delete` - Can delete tasks
- `users:manage` - Can manage users
- `settings:update` - Can update settings

---

## Architecture

### Data Model

```
┌─────────────┐
│ Permissions │ ← System-wide permission definitions
└──────┬──────┘
       │
       ├──────────────────────────────┐
       │                              │
┌──────▼──────┐              ┌────────▼────────┐
│    Roles    │              │ User Permissions│ (Direct)
└──────┬──────┘              └─────────────────┘
       │                              │
       ▼                              ▼
┌─────────────────┐           ┌──────────────┐
│ Role Permissions│           │  User Roles  │
└─────────────────┘           └──────────────┘
```

### Permission Inheritance

1. **Role Permissions**: Permissions granted to a role
2. **Direct Permissions**: Permissions granted directly to a user
3. **Priority**: Direct permissions override role permissions

### System Roles

Four built-in roles are created for each organization:

| Role | Priority | Permissions |
|------|----------|-------------|
| **Owner** | 100 | All permissions |
| **Admin** | 75 | All except billing |
| **Member** | 50 | Create, read, update tasks; view users |
| **Guest** | 25 | Read-only access |

---

## Database Setup

### 1. Run RBAC Schema

```bash
# Apply the RBAC schema (requires multi-tenancy schema first)
psql $DATABASE_URL -f .examples/enterprise/rbac/database/schema.sql
```

### 2. Verify Installation

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%permission%' OR table_name LIKE '%role%';

-- Should show:
-- permissions
-- roles
-- role_permissions
-- user_roles
-- user_permissions
-- resource_permissions
```

### 3. Test Permission Functions

```sql
-- Get user permissions
SELECT * FROM get_user_permissions(
  'user-uuid',
  'org-uuid'
);

-- Check specific permission
SELECT has_permission(
  'user-uuid',
  'org-uuid',
  'tasks:delete'
);
```

---

## Permission System

### Available Permissions

The system comes with predefined permissions organized by category:

**Task Management:**
- `tasks:create` - Create tasks
- `tasks:read` - View tasks
- `tasks:update` - Edit tasks
- `tasks:delete` - Delete tasks
- `tasks:assign` - Assign tasks to users
- `tasks:export` - Export tasks

**User Management:**
- `users:read` - View users
- `users:invite` - Invite new users
- `users:update` - Edit user profiles
- `users:remove` - Remove users
- `users:manage` - Full user management

**Role Management:**
- `roles:read` - View roles
- `roles:create` - Create roles
- `roles:update` - Modify roles
- `roles:delete` - Delete roles
- `roles:assign` - Assign roles to users

**Settings:**
- `settings:read` - View settings
- `settings:update` - Update settings
- `settings:billing` - Manage billing

**Analytics:**
- `analytics:read` - View analytics
- `analytics:export` - Export data

**API:**
- `api:access` - API access

### Adding Custom Permissions

```sql
-- Add a new permission
INSERT INTO permissions (resource, action, name, description, category, is_system)
VALUES (
  'reports',
  'create',
  'Create Reports',
  'Create custom reports',
  'Reporting',
  false
);
```

---

## Role Management

### Creating Custom Roles

```tsx
import { useRBAC } from './contexts/RBACContext'

function CreateRoleScreen() {
  const { createRole, availablePermissions } = useRBAC()
  const [name, setName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([])

  async function handleCreate() {
    await createRole({
      name,
      description: 'Custom role',
      color: '#3B82F6',
      permissions: selectedPermissions,
    })
  }

  return (
    <View>
      <TextInput
        placeholder="Role Name"
        value={name}
        onChangeText={setName}
      />

      <Text>Select Permissions:</Text>
      {availablePermissions.map(perm => (
        <CheckBox
          key={perm.id}
          label={perm.name}
          checked={selectedPermissions.includes(`${perm.resource}:${perm.action}`)}
          onPress={() => togglePermission(`${perm.resource}:${perm.action}`)}
        />
      ))}

      <Button title="Create Role" onPress={handleCreate} />
    </View>
  )
}
```

### Assigning Roles to Users

```tsx
import { useRBAC } from './contexts/RBACContext'

function AssignRoleScreen({ userId }: { userId: string }) {
  const { roles, assignRole } = useRBAC()

  async function handleAssign(roleId: string) {
    await assignRole(userId, roleId)
    Alert.alert('Success', 'Role assigned')
  }

  return (
    <View>
      {roles.map(role => (
        <TouchableOpacity
          key={role.id}
          onPress={() => handleAssign(role.id)}
        >
          <View style={{ backgroundColor: role.color }}>
            <Text>{role.name}</Text>
            <Text>{role.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}
```

### Temporary Role Assignment

```tsx
// Assign role that expires in 7 days
await assignRole(
  userId,
  roleId,
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
)
```

---

## Frontend Integration

### 1. Add RBAC Provider

```tsx
// App.tsx
import { RBACProvider } from './contexts/RBACContext'

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <RBACProvider>
          <Navigation />
        </RBACProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}
```

### 2. Use Permissions in Components

```tsx
import { useRBAC } from './contexts/RBACContext'

function TaskCard({ task }: { task: Task }) {
  const { hasPermission } = useRBAC()

  return (
    <View>
      <Text>{task.title}</Text>

      {hasPermission('tasks:update') && (
        <Button title="Edit" onPress={handleEdit} />
      )}

      {hasPermission('tasks:delete') && (
        <Button title="Delete" onPress={handleDelete} />
      )}
    </View>
  )
}
```

### 3. Programmatic Permission Checks

```tsx
import { useRBAC } from './contexts/RBACContext'

function useTaskActions(task: Task) {
  const { hasPermission, hasAnyPermission } = useRBAC()

  const canEdit = hasPermission('tasks:update')
  const canDelete = hasPermission('tasks:delete')
  const canManage = hasAnyPermission('tasks:update', 'tasks:delete', 'tasks:assign')

  return { canEdit, canDelete, canManage }
}
```

---

## Permission Guards

### Simple Permission Guard

```tsx
import { PermissionGuard } from './components/PermissionGuard'

<PermissionGuard permission="tasks:delete">
  <DeleteButton />
</PermissionGuard>
```

### Multiple Permissions (Any)

```tsx
<PermissionGuard
  permission={['tasks:update', 'tasks:delete']}
  requireMode="any"
>
  <EditActions />
</PermissionGuard>
```

### With Fallback UI

```tsx
<PermissionGuard
  permission="users:manage"
  fallback={<Text>Contact admin to manage users</Text>}
>
  <UserManagement />
</PermissionGuard>
```

### Role-Based Guard

```tsx
import { RoleGuard } from './components/PermissionGuard'

<RoleGuard roles={['Owner', 'Admin']}>
  <AdminPanel />
</RoleGuard>
```

### Feature Flag Guard

```tsx
import { FeatureFlagGuard } from './components/PermissionGuard'

<FeatureFlagGuard feature="ai_enabled">
  <AIAssistant />
</FeatureFlagGuard>
```

### Subscription Tier Guard

```tsx
import { SubscriptionGuard } from './components/PermissionGuard'

<SubscriptionGuard minTier="professional">
  <AdvancedFeatures />
</SubscriptionGuard>
```

### Combined Guards

```tsx
import { CombinedGuard } from './components/PermissionGuard'

// Requires permission AND subscription tier
<CombinedGuard
  permission="analytics:export"
  minTier="professional"
  mode="all"
>
  <ExportButton />
</CombinedGuard>
```

---

## Resource-Level Permissions

### Granting Resource Permissions

Resource-level permissions allow fine-grained control over specific items.

```tsx
import { useRBAC } from './contexts/RBACContext'

async function shareTask(taskId: string, userId: string) {
  const { grantResourcePermission } = useRBAC()

  await grantResourcePermission({
    resourceType: 'task',
    resourceId: taskId,
    userId: userId,
    permissions: ['read', 'update'], // Can read and update, but not delete
  })
}
```

### Checking Resource Permissions

```tsx
import { useRBAC } from './contexts/RBACContext'

async function TaskDetailScreen({ taskId }: { taskId: string }) {
  const { hasResourcePermission } = useRBAC()

  const canDelete = await hasResourcePermission('task', taskId, 'delete')

  return (
    <View>
      <TaskDetails taskId={taskId} />
      {canDelete && <DeleteButton />}
    </View>
  )
}
```

### Time-Limited Access

```tsx
// Grant access that expires in 24 hours
await grantResourcePermission({
  resourceType: 'document',
  resourceId: documentId,
  userId: guestUserId,
  permissions: ['read'],
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})
```

---

## Best Practices

### 1. Principle of Least Privilege

Grant users the minimum permissions needed to do their job:

```tsx
// ✅ GOOD: Specific permissions
const editorRole = {
  name: 'Editor',
  permissions: ['tasks:create', 'tasks:read', 'tasks:update'],
}

// ❌ BAD: Overly broad permissions
const editorRole = {
  name: 'Editor',
  permissions: getAllPermissions(), // Too much access
}
```

### 2. Use Permission Guards Consistently

```tsx
// ✅ GOOD: Guard UI and API
<PermissionGuard permission="tasks:delete">
  <DeleteButton onPress={handleDelete} />
</PermissionGuard>

async function handleDelete() {
  // Also check on backend/Edge Function
  if (!hasPermission('tasks:delete')) {
    throw new Error('Unauthorized')
  }
  await deleteTask()
}

// ❌ BAD: Only guard UI
<DeleteButton onPress={handleDelete} /> // Anyone can call handleDelete()
```

### 3. Cache Permission Checks

```tsx
// ✅ GOOD: Cache expensive checks
const canEdit = useMemo(
  () => hasPermission('tasks:update'),
  [hasPermission]
)

// ❌ BAD: Recalculate on every render
{hasPermission('tasks:update') && <EditButton />}
{hasPermission('tasks:update') && <QuickEdit />}
{hasPermission('tasks:update') && <InlineEditor />}
```

### 4. Server-Side Validation

Always validate permissions on the server:

```typescript
// supabase/functions/delete-task/index.ts
Deno.serve(async (req) => {
  const { taskId } = await req.json()
  const supabase = createClient(...)

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  // Check permission
  const { data: hasPermission } = await supabase
    .rpc('has_permission', {
      p_user_id: user.id,
      p_organization_id: orgId,
      p_permission: 'tasks:delete',
    })

  if (!hasPermission) {
    return new Response('Forbidden', { status: 403 })
  }

  // Proceed with deletion
  await supabase.from('tasks').delete().eq('id', taskId)

  return new Response('OK')
})
```

### 5. Audit Permission Changes

```tsx
async function assignRole(userId: string, roleId: string) {
  await supabase.from('user_roles').insert({...})

  // Log the change
  await supabase.rpc('log_audit_event', {
    p_organization_id: currentOrg.id,
    p_action: 'role.assigned',
    p_resource_type: 'user_role',
    p_metadata: { user_id: userId, role_id: roleId },
  })
}
```

---

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks'
import { useRBAC } from './RBACContext'

describe('RBAC', () => {
  it('checks permissions correctly', () => {
    const { result } = renderHook(() => useRBAC())

    expect(result.current.hasPermission('tasks:create')).toBe(true)
    expect(result.current.hasPermission('tasks:delete')).toBe(false)
  })

  it('checks multiple permissions with ANY mode', () => {
    const { result } = renderHook(() => useRBAC())

    expect(
      result.current.hasAnyPermission('tasks:update', 'tasks:delete')
    ).toBe(true)
  })
})
```

### Integration Tests

```typescript
describe('Role assignment', () => {
  it('grants permissions when role is assigned', async () => {
    const user = await createUser()
    const org = await createOrganization()

    // Initially no permissions
    expect(await hasPermission(user.id, org.id, 'tasks:delete')).toBe(false)

    // Assign admin role
    await assignRole(user.id, 'Admin')

    // Now has permissions
    expect(await hasPermission(user.id, org.id, 'tasks:delete')).toBe(true)
  })
})
```

### E2E Permission Tests

```typescript
describe('Permission enforcement', () => {
  it('prevents unauthorized task deletion', async () => {
    const guest = await signIn('guest@example.com')
    const task = await createTask()

    // Attempt to delete as guest (should fail)
    const response = await fetch('/api/tasks/' + task.id, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${guest.token}` },
    })

    expect(response.status).toBe(403)

    // Verify task still exists
    const { data } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', task.id)
      .single()

    expect(data).toBeTruthy()
  })
})
```

---

## Advanced Topics

### Permission Inheritance

```sql
-- Create role hierarchy
-- Managers inherit all Member permissions + additional ones

CREATE TABLE role_hierarchy (
  parent_role_id UUID REFERENCES roles(id),
  child_role_id UUID REFERENCES roles(id),
  PRIMARY KEY (parent_role_id, child_role_id)
);

-- Update permission function to check hierarchy
CREATE OR REPLACE FUNCTION get_user_permissions_with_hierarchy(...)
-- Implementation that traverses hierarchy
```

### Conditional Permissions

```sql
-- Permissions that apply only under certain conditions
CREATE TABLE conditional_permissions (
  id UUID PRIMARY KEY,
  permission_id UUID REFERENCES permissions(id),
  condition JSONB, -- e.g., {"time_range": {"start": "09:00", "end": "17:00"}}
  ...
);
```

### Attribute-Based Access Control (ABAC)

Combine RBAC with user/resource attributes:

```typescript
function canAccessTask(user: User, task: Task): boolean {
  // RBAC check
  if (!hasPermission('tasks:read')) return false

  // ABAC checks
  if (task.department !== user.department) return false
  if (task.confidential && user.clearance < 3) return false

  return true
}
```

---

## Migration Path

### From Simple Roles to RBAC

**Before (Simple):**
```typescript
if (user.role === 'admin') {
  // Show admin panel
}
```

**After (RBAC):**
```typescript
if (hasPermission('settings:update')) {
  // Show settings
}
```

**Benefits:**
- More granular control
- Easy to add new roles
- Flexible permission combinations

---

## Troubleshooting

### User Has No Permissions

```sql
-- Check user's roles
SELECT * FROM user_roles
WHERE user_id = 'user-uuid'
  AND organization_id = 'org-uuid'
  AND status = 'active';

-- Check role permissions
SELECT r.name, p.resource, p.action
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = 'user-uuid';
```

### Permission Check Failing

```sql
-- Debug permission function
SELECT * FROM get_user_permissions('user-uuid', 'org-uuid');

-- Check RLS policies
SELECT * FROM tasks WHERE id = 'task-uuid'; -- Should respect RLS
```

---

## Conclusion

This RBAC implementation provides:

- Fine-grained permission control
- Flexible role management
- Resource-level permissions
- Built-in audit logging
- Declarative permission guards

**Next Steps:**

1. Implement SSO (see `.examples/enterprise/sso/`)
2. Add team-based permissions (see `.examples/enterprise/teams/`)
3. Set up audit dashboard
4. Configure compliance reports

**Resources:**

- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Access Control](https://owasp.org/www-project-proactive-controls/v3/en/c7-enforce-access-controls)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
