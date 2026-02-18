# Multi-Tenancy Implementation Guide

Complete guide to implementing multi-tenant architecture in your React Native + Expo + Supabase application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Setup](#database-setup)
4. [Frontend Integration](#frontend-integration)
5. [Organization Management](#organization-management)
6. [Data Isolation](#data-isolation)
7. [Billing & Subscriptions](#billing--subscriptions)
8. [Best Practices](#best-practices)
9. [Testing](#testing)
10. [Migration Guide](#migration-guide)

---

## Overview

### What is Multi-Tenancy?

Multi-tenancy allows a single instance of your application to serve multiple customers (tenants/organizations) while keeping their data isolated and secure.

### Benefits

- **Scalability**: Serve thousands of organizations from one deployment
- **Cost Efficiency**: Shared infrastructure reduces operational costs
- **Easier Maintenance**: Single codebase, centralized updates
- **Team Collaboration**: Users can belong to multiple organizations
- **Enterprise Ready**: Required feature for B2B SaaS applications

### Architecture Type

This implementation uses **shared database, shared schema** with row-level security (RLS) for data isolation.

**Alternatives:**
- Separate databases per tenant (high isolation, expensive)
- Separate schemas per tenant (moderate isolation, complex)
- Shared database/schema (our approach - balance of isolation and cost)

---

## Architecture

### Data Model

```
┌─────────────────┐
│  Organizations  │ ← Tenant root entity
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
┌────────▼─────────────┐  ┌───▼──────────────┐
│ Organization Members │  │  Tasks (scoped)  │
└──────────────────────┘  └──────────────────┘
         │
         │
┌────────▼────────────────┐
│ Organization Invitations│
└─────────────────────────┘
```

### Key Components

1. **Organizations**: The tenant entity
2. **Organization Members**: User-to-organization mapping with roles
3. **Organization Invitations**: Pending membership invitations
4. **Scoped Resources**: All user data linked to organization_id
5. **Audit Log**: Track all organization activities

---

## Database Setup

### 1. Run the Schema Migration

```bash
# Apply the multi-tenancy schema
psql $DATABASE_URL -f .examples/enterprise/multi-tenancy/database/schema.sql

# Or using Supabase CLI
supabase db reset
supabase db push
```

### 2. Verify Tables

```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'organization%';

-- Should show:
-- organizations
-- organization_members
-- organization_invitations
-- organization_audit_log
```

### 3. Test RLS Policies

```sql
-- Set user context (simulate authenticated user)
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Try selecting organizations (should only see user's orgs)
SELECT * FROM organizations;

-- Try selecting another org's tasks (should be empty)
SELECT * FROM tasks WHERE organization_id = 'other-org-uuid';
```

---

## Frontend Integration

### 1. Add Provider to App

```tsx
// App.tsx
import { OrganizationProvider } from './contexts/OrganizationContext'

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Navigation />
      </OrganizationProvider>
    </AuthProvider>
  )
}
```

### 2. Use in Components

```tsx
import { useOrganization } from './contexts/OrganizationContext'

export function TasksScreen() {
  const { currentOrg, switchOrganization } = useOrganization()

  // All queries are automatically scoped to currentOrg
  const { data: tasks } = useQuery({
    queryKey: ['tasks', currentOrg?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', currentOrg!.id)
      return data
    },
    enabled: !!currentOrg,
  })

  return (
    <View>
      <Text>Organization: {currentOrg?.name}</Text>
      {tasks?.map(task => <TaskCard key={task.id} task={task} />)}
    </View>
  )
}
```

### 3. Organization Switcher

```tsx
import { useOrganization } from './contexts/OrganizationContext'

export function OrganizationSwitcher() {
  const { organizations, currentOrg, switchOrganization } = useOrganization()

  return (
    <View>
      <Text>Current: {currentOrg?.name}</Text>
      {organizations.map(org => (
        <TouchableOpacity
          key={org.id}
          onPress={() => switchOrganization(org.id)}
        >
          <Text>{org.name} ({org.role})</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
```

---

## Organization Management

### Creating an Organization

```tsx
import { useOrganization } from './contexts/OrganizationContext'

export function CreateOrgScreen() {
  const { createOrganization } = useOrganization()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  async function handleCreate() {
    try {
      const org = await createOrganization({
        name,
        slug,
        description: 'My new organization',
      })

      console.log('Created:', org)
      // Navigate to org dashboard
    } catch (error) {
      console.error('Failed to create org:', error)
    }
  }

  return (
    <View>
      <TextInput
        placeholder="Organization Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Slug (e.g., acme-corp)"
        value={slug}
        onChangeText={setSlug}
      />
      <Button title="Create" onPress={handleCreate} />
    </View>
  )
}
```

### Inviting Members

```tsx
import { useOrganization } from './contexts/OrganizationContext'

export function InviteMemberScreen() {
  const { inviteMember, canManageMembers } = useOrganization()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrganizationRole>('member')

  if (!canManageMembers()) {
    return <Text>You don't have permission to invite members</Text>
  }

  async function handleInvite() {
    try {
      const invitation = await inviteMember(
        email,
        role,
        'Join our team!'
      )

      // Send email notification
      await sendInvitationEmail(invitation)

      Alert.alert('Success', `Invitation sent to ${email}`)
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Picker selectedValue={role} onValueChange={setRole}>
        <Picker.Item label="Member" value="member" />
        <Picker.Item label="Admin" value="admin" />
        <Picker.Item label="Guest" value="guest" />
      </Picker>

      <Button title="Send Invitation" onPress={handleInvite} />
    </View>
  )
}
```

### Managing Members

```tsx
import { useOrganization } from './contexts/OrganizationContext'

export function MembersScreen() {
  const { members, updateMemberRole, removeMember, canManageMembers } = useOrganization()

  async function handleChangeRole(memberId: string, newRole: OrganizationRole) {
    try {
      await updateMemberRole(memberId, newRole)
      Alert.alert('Success', 'Role updated')
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  async function handleRemove(memberId: string) {
    Alert.alert(
      'Remove Member',
      'Are you sure?',
      [
        { text: 'Cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeMember(memberId)
          },
        },
      ]
    )
  }

  return (
    <ScrollView>
      {members.map(member => (
        <View key={member.id}>
          <Text>{member.user.email}</Text>
          <Text>Role: {member.role}</Text>

          {canManageMembers() && member.role !== 'owner' && (
            <>
              <Picker
                selectedValue={member.role}
                onValueChange={(role) => handleChangeRole(member.id, role)}
              >
                <Picker.Item label="Member" value="member" />
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Guest" value="guest" />
              </Picker>

              <Button
                title="Remove"
                onPress={() => handleRemove(member.id)}
              />
            </>
          )}
        </View>
      ))}
    </ScrollView>
  )
}
```

---

## Data Isolation

### Automatic Scoping with RLS

Row-level security ensures users can only access data from their organizations:

```sql
-- Users can only see tasks from their organizations
CREATE POLICY "Users can view organization tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
```

### Client-Side Best Practices

**Always scope queries to current organization:**

```tsx
// ✅ GOOD: Explicit organization filter
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('organization_id', currentOrg.id)

// ❌ BAD: Relying only on RLS (harder to debug)
const { data } = await supabase
  .from('tasks')
  .select('*')
```

**Use a custom hook for scoped queries:**

```tsx
// hooks/useOrganizationQuery.ts
export function useOrganizationQuery<T>(
  table: string,
  query?: (q: any) => any
) {
  const { currentOrg } = useOrganization()

  return useQuery({
    queryKey: [table, currentOrg?.id],
    queryFn: async () => {
      let q = supabase
        .from(table)
        .select('*')
        .eq('organization_id', currentOrg!.id)

      if (query) {
        q = query(q)
      }

      const { data, error } = await q
      if (error) throw error
      return data as T[]
    },
    enabled: !!currentOrg,
  })
}

// Usage:
const { data: tasks } = useOrganizationQuery<Task>('tasks')
```

### Preventing Data Leakage

**Server-side validation (Edge Functions):**

```typescript
// supabase/functions/create-task/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { organization_id, ...taskData } = await req.json()

  // Verify user is member of organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    return new Response('Forbidden', { status: 403 })
  }

  // Create task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...taskData, organization_id, user_id: user.id })
    .select()
    .single()

  return new Response(JSON.stringify(task), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## Billing & Subscriptions

### Subscription Tiers

```typescript
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      max_users: 5,
      max_tasks: 100,
      max_storage_mb: 100,
    },
    features: {
      ai_enabled: false,
      analytics_enabled: false,
      api_access: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 29,
    limits: {
      max_users: 10,
      max_tasks: 1000,
      max_storage_mb: 1000,
    },
    features: {
      ai_enabled: true,
      analytics_enabled: false,
      api_access: false,
    },
  },
  professional: {
    name: 'Professional',
    price: 99,
    limits: {
      max_users: 50,
      max_tasks: 10000,
      max_storage_mb: 5000,
    },
    features: {
      ai_enabled: true,
      analytics_enabled: true,
      api_access: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    limits: {
      max_users: -1, // unlimited
      max_tasks: -1,
      max_storage_mb: -1,
    },
    features: {
      ai_enabled: true,
      analytics_enabled: true,
      api_access: true,
    },
  },
}
```

### Usage Tracking

```tsx
import { useOrganization } from './contexts/OrganizationContext'

export function UsageScreen() {
  const { currentOrg, usage } = useOrganization()

  if (!currentOrg || !usage) return null

  const tier = SUBSCRIPTION_TIERS[currentOrg.subscription_tier]

  return (
    <View>
      <Text>Current Plan: {tier.name}</Text>

      <ProgressBar
        label="Members"
        current={usage.member_count}
        max={tier.limits.max_users}
      />

      <ProgressBar
        label="Tasks"
        current={usage.task_count}
        max={tier.limits.max_tasks}
      />

      <ProgressBar
        label="Storage"
        current={usage.storage_mb}
        max={tier.limits.max_storage_mb}
      />

      {currentOrg.subscription_status === 'past_due' && (
        <Alert severity="error">
          Your subscription is past due. Please update your payment method.
        </Alert>
      )}
    </View>
  )
}
```

### Enforcing Limits

```typescript
// hooks/useEnforceLimits.ts
export function useEnforceLimits() {
  const { currentOrg, usage } = useOrganization()

  function canAddMember(): boolean {
    if (!currentOrg || !usage) return false

    const tier = SUBSCRIPTION_TIERS[currentOrg.subscription_tier]

    if (tier.limits.max_users === -1) return true // unlimited

    return usage.member_count < tier.limits.max_users
  }

  function canCreateTask(): boolean {
    if (!currentOrg || !usage) return false

    const tier = SUBSCRIPTION_TIERS[currentOrg.subscription_tier]

    if (tier.limits.max_tasks === -1) return true

    return usage.task_count < tier.limits.max_tasks
  }

  return {
    canAddMember,
    canCreateTask,
  }
}

// Usage:
function CreateTaskButton() {
  const { canCreateTask } = useEnforceLimits()

  if (!canCreateTask()) {
    return <UpgradePrompt message="Upgrade to create more tasks" />
  }

  return <Button title="Create Task" onPress={handleCreate} />
}
```

---

## Best Practices

### 1. Always Validate Organization Membership

```typescript
// Before any sensitive operation
async function deleteTask(taskId: string) {
  const { currentOrg } = useOrganization()

  // Verify task belongs to current org
  const { data: task } = await supabase
    .from('tasks')
    .select('organization_id')
    .eq('id', taskId)
    .single()

  if (task.organization_id !== currentOrg.id) {
    throw new Error('Task does not belong to current organization')
  }

  // Proceed with deletion
  await supabase.from('tasks').delete().eq('id', taskId)
}
```

### 2. Use Database Constraints

```sql
-- Prevent orphaned records
ALTER TABLE tasks
  ADD CONSTRAINT fk_organization
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE CASCADE;

-- Prevent duplicate memberships
ALTER TABLE organization_members
  ADD CONSTRAINT unique_org_user
  UNIQUE (organization_id, user_id);
```

### 3. Implement Audit Logging

```typescript
// Log all important actions
async function updateOrganizationSettings(settings: any) {
  await supabase.from('organizations').update({ settings }).eq('id', orgId)

  // Log the change
  await supabase.rpc('log_audit_event', {
    p_organization_id: orgId,
    p_action: 'organization.settings_updated',
    p_resource_type: 'organization',
    p_resource_id: orgId,
    p_metadata: { old_settings: oldSettings, new_settings: settings },
  })
}
```

### 4. Handle Organization Switching Gracefully

```typescript
// Clear local state when switching orgs
useEffect(() => {
  if (currentOrg) {
    // Reset local caches
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['members'] })

    // Clear navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  }
}, [currentOrg?.id])
```

### 5. Test with Multiple Organizations

```typescript
// __tests__/multi-tenancy.test.ts
describe('Multi-tenancy', () => {
  it('isolates data between organizations', async () => {
    // Create two orgs
    const org1 = await createOrganization('Org 1')
    const org2 = await createOrganization('Org 2')

    // Create task in org1
    const task = await createTask({ organization_id: org1.id })

    // Switch to org2
    await switchOrganization(org2.id)

    // Verify task is not visible
    const { data } = await supabase.from('tasks').select('*')
    expect(data).not.toContainEqual(expect.objectContaining({ id: task.id }))
  })
})
```

---

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks'
import { useOrganization } from './OrganizationContext'

describe('useOrganization', () => {
  it('creates organization and adds user as owner', async () => {
    const { result } = renderHook(() => useOrganization())

    await act(async () => {
      const org = await result.current.createOrganization({
        name: 'Test Org',
        slug: 'test-org',
      })
      expect(org.role).toBe('owner')
    })
  })

  it('switches organization and updates current org', async () => {
    const { result } = renderHook(() => useOrganization())

    const org1 = await result.current.createOrganization({
      name: 'Org 1',
      slug: 'org-1',
    })

    const org2 = await result.current.createOrganization({
      name: 'Org 2',
      slug: 'org-2',
    })

    await act(async () => {
      await result.current.switchOrganization(org2.id)
    })

    expect(result.current.currentOrg?.id).toBe(org2.id)
  })
})
```

### Integration Tests

```typescript
describe('Multi-tenant data isolation', () => {
  it('prevents cross-tenant data access', async () => {
    // User 1 creates org A
    const user1 = await signUp('user1@example.com')
    const orgA = await createOrganization('Org A', user1)
    const taskA = await createTask({ organization_id: orgA.id }, user1)

    // User 2 creates org B
    const user2 = await signUp('user2@example.com')
    const orgB = await createOrganization('Org B', user2)

    // User 2 should not see taskA
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskA.id)
      .single()

    expect(data).toBeNull()
  })
})
```

---

## Migration Guide

### Migrating from Single-Tenant to Multi-Tenant

**Step 1: Add organization_id column**

```sql
-- Add column (nullable initially)
ALTER TABLE tasks ADD COLUMN organization_id UUID;
```

**Step 2: Create default organization for each user**

```sql
-- Function to backfill organizations
CREATE OR REPLACE FUNCTION backfill_task_organizations()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_org_id UUID;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM tasks WHERE organization_id IS NULL
  LOOP
    -- Create personal organization
    INSERT INTO organizations (name, slug)
    VALUES (
      'Personal - ' || v_user.user_id::TEXT,
      'personal-' || substring(v_user.user_id::TEXT, 1, 8)
    )
    RETURNING id INTO v_org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user.user_id, 'owner');

    -- Update tasks
    UPDATE tasks
    SET organization_id = v_org_id
    WHERE user_id = v_user.user_id
      AND organization_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run backfill
SELECT backfill_task_organizations();
```

**Step 3: Make organization_id required**

```sql
-- After backfill is complete
ALTER TABLE tasks
  ALTER COLUMN organization_id SET NOT NULL;
```

**Step 4: Update application code**

```tsx
// Before (single-tenant)
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)

// After (multi-tenant)
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('organization_id', currentOrg.id)
```

**Step 5: Test thoroughly**

- Verify all queries include organization_id
- Test RLS policies with multiple users
- Validate data isolation
- Check performance with organization filters

---

## Conclusion

This multi-tenancy implementation provides:

- Secure data isolation with RLS
- Flexible role-based access control
- Scalable architecture for B2B SaaS
- Built-in audit logging
- Subscription management support

**Next Steps:**

1. Implement RBAC (see `.examples/enterprise/rbac/`)
2. Add SSO support (see `.examples/enterprise/sso/`)
3. Set up team management (see `.examples/enterprise/teams/`)
4. Configure billing integration (Stripe, Chargebee)

**Resources:**

- [Supabase Multi-Tenancy Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [B2B SaaS Architecture Patterns](https://aws.amazon.com/blogs/apn/saas-architecture-fundamentals/)
