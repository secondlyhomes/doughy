# Enterprise Authentication & Authorization Guide

Comprehensive guide to implementing enterprise-grade authentication and authorization in your React Native + Expo + Supabase application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Multi-Tenancy](#multi-tenancy)
5. [RBAC](#rbac)
6. [SSO](#sso)
7. [Teams](#teams)
8. [Security](#security)
9. [Compliance](#compliance)
10. [Testing](#testing)

---

## Overview

This enterprise authentication system provides:

- **Multi-Tenancy**: Organization-based data isolation
- **RBAC**: Fine-grained permission control
- **SSO**: SAML, OAuth, OIDC support
- **Teams**: Collaborative workspaces
- **Audit Logging**: Complete activity tracking
- **Security**: Production-ready RLS policies

### Key Features

- Row-level security (RLS) for data isolation
- Dynamic role and permission management
- Single Sign-On with major identity providers
- Just-In-Time (JIT) user provisioning
- Team-based collaboration
- Comprehensive audit trails
- Subscription tier enforcement

---

## Architecture

### System Layers

```
┌─────────────────────────────────────────┐
│          Mobile Application             │
│  (React Native + Expo)                  │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│        Context Providers                │
│  - AuthContext                          │
│  - OrganizationContext                  │
│  - RBACContext                          │
│  - SSOContext                           │
│  - TeamsContext                         │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Supabase Client                 │
│  - Auth                                 │
│  - Database (with RLS)                  │
│  - Edge Functions                       │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│          PostgreSQL                     │
│  - Organizations                        │
│  - Users & Roles                        │
│  - Permissions                          │
│  - Audit Logs                           │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: User signs in via SSO or email/password
2. **Organization Selection**: User selects active organization
3. **Permission Loading**: User's roles and permissions are loaded
4. **RLS Enforcement**: Database enforces data isolation
5. **Audit Logging**: All actions are logged

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
npm install expo-web-browser expo-linking
```

### 2. Database Setup

```bash
# Apply schemas in order
psql $DATABASE_URL -f .examples/enterprise/multi-tenancy/database/schema.sql
psql $DATABASE_URL -f .examples/enterprise/rbac/database/schema.sql
```

### 3. Add Providers to App

```tsx
// App.tsx
import { AuthProvider } from './contexts/AuthContext'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { RBACProvider } from './contexts/RBACContext'
import { SSOProvider } from './contexts/SSOContext'
import { TeamsProvider } from './contexts/TeamsContext'

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <RBACProvider>
          <SSOProvider>
            <TeamsProvider>
              <Navigation />
            </TeamsProvider>
          </SSOProvider>
        </RBACProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}
```

### 4. Use in Components

```tsx
import { useOrganization } from './contexts/OrganizationContext'
import { useRBAC } from './contexts/RBACContext'
import { PermissionGuard } from './components/PermissionGuard'

function TasksScreen() {
  const { currentOrg } = useOrganization()
  const { hasPermission } = useRBAC()

  return (
    <View>
      <Text>Organization: {currentOrg?.name}</Text>

      <PermissionGuard permission="tasks:create">
        <CreateTaskButton />
      </PermissionGuard>

      {hasPermission('tasks:export') && (
        <ExportButton />
      )}
    </View>
  )
}
```

---

## Multi-Tenancy

### Overview

Multi-tenancy allows multiple organizations to use your application while keeping their data completely isolated.

### Key Concepts

- **Organization**: Tenant entity (company, team, workspace)
- **Members**: Users who belong to organizations
- **Roles**: Organization-level roles (Owner, Admin, Member, Guest)
- **Data Isolation**: RLS ensures users only see their org's data

### Implementation

```tsx
import { useOrganization } from './contexts/OrganizationContext'

// Create organization
const { createOrganization } = useOrganization()
await createOrganization({
  name: 'Acme Corp',
  slug: 'acme-corp',
})

// Switch organization
const { switchOrganization } = useOrganization()
await switchOrganization(orgId)

// Invite member
const { inviteMember } = useOrganization()
await inviteMember('user@example.com', 'member')
```

### Documentation

See `.examples/enterprise/multi-tenancy/README.md` for complete guide.

---

## RBAC

### Overview

Role-Based Access Control provides fine-grained permission management.

### Permission Model

```
resource:action
```

Examples:
- `tasks:create`
- `users:manage`
- `settings:update`

### Implementation

```tsx
import { useRBAC } from './contexts/RBACContext'

// Check permission
const { hasPermission } = useRBAC()
if (hasPermission('tasks:delete')) {
  // Allow deletion
}

// Create custom role
const { createRole } = useRBAC()
await createRole({
  name: 'Project Manager',
  permissions: [
    'tasks:create',
    'tasks:update',
    'tasks:assign',
    'analytics:read',
  ],
})

// Assign role to user
const { assignRole } = useRBAC()
await assignRole(userId, roleId)
```

### Permission Guards

```tsx
import { PermissionGuard } from './components/PermissionGuard'

<PermissionGuard permission="tasks:delete">
  <DeleteButton />
</PermissionGuard>

<PermissionGuard
  permission={['tasks:update', 'tasks:delete']}
  requireMode="any"
>
  <EditActions />
</PermissionGuard>
```

### Documentation

See `.examples/enterprise/rbac/README.md` for complete guide.

---

## SSO

### Overview

Single Sign-On allows users to authenticate using their corporate identity provider.

### Supported Providers

- **SAML 2.0**: Okta, Azure AD, OneLogin, Ping Identity
- **OAuth 2.0**: Google Workspace, GitHub, GitLab
- **OIDC**: Auth0, Keycloak, AWS Cognito

### Implementation

```tsx
import { useSSO } from './contexts/SSOContext'

// Sign in with SSO (auto-detects provider by email domain)
const { signInWithSSO } = useSSO()
await signInWithSSO('user@company.com')

// Configure SSO provider (admin)
const { createProvider } = useSSO()
await createProvider({
  type: 'saml',
  name: 'Okta',
  domain: 'company.com',
  settings: {
    ssoUrl: 'https://company.okta.com/sso/saml',
    entityId: 'yourapp',
    certificate: '...',
  },
})
```

### SAML Configuration

```tsx
// Example: Okta SAML setup
{
  type: 'saml',
  name: 'Okta',
  domain: 'company.com',
  settings: {
    ssoUrl: 'https://company.okta.com/app/abc123/sso/saml',
    entityId: 'http://yourapp.com',
    certificate: 'MIIDpDCCAoygAwIBAgI...',
    signRequests: true,
    wantAssertionsSigned: true,
  }
}
```

### Documentation

See `.examples/enterprise/sso/README.md` for complete guide.

---

## Teams

### Overview

Teams are subgroups within organizations for better collaboration.

### Key Features

- Team creation and management
- Team member roles (Lead, Member)
- Team-scoped resources
- Private/public teams

### Implementation

```tsx
import { useTeams } from './contexts/TeamsContext'

// Create team
const { createTeam } = useTeams()
await createTeam({
  name: 'Engineering',
  description: 'Engineering team',
  settings: {
    visibility: 'public',
    allow_member_invite: true,
  },
})

// Add member
const { addMember } = useTeams()
await addMember(teamId, userId, 'member')

// Check team membership
const { isTeamMember } = useTeams()
if (isTeamMember(teamId)) {
  // Show team content
}
```

### Documentation

See `.examples/enterprise/teams/README.md` for complete guide.

---

## Security

### RLS Policies

All tables have Row-Level Security enabled:

```sql
-- Example: Tasks RLS policy
CREATE POLICY "Users can view org tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
```

### Best Practices

1. **Never Disable RLS**: Always keep RLS enabled
2. **Validate on Server**: Use Edge Functions for sensitive operations
3. **Audit Everything**: Log all important actions
4. **Principle of Least Privilege**: Grant minimum required permissions
5. **Regular Reviews**: Audit permissions quarterly

### Server-Side Validation

```typescript
// supabase/functions/delete-task/index.ts
Deno.serve(async (req) => {
  const { taskId } = await req.json()
  const supabase = createClient(...)

  // Verify user has permission
  const { data: canDelete } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_organization_id: orgId,
    p_permission: 'tasks:delete',
  })

  if (!canDelete) {
    return new Response('Forbidden', { status: 403 })
  }

  // Proceed with deletion
  await supabase.from('tasks').delete().eq('id', taskId)

  return new Response('OK')
})
```

---

## Compliance

### SOC 2

- Audit logging: All actions logged
- Access controls: RBAC implemented
- Data isolation: Multi-tenant RLS
- Encryption: At rest and in transit

### GDPR

- Data portability: Export functionality
- Right to deletion: User data cleanup
- Consent management: Permission tracking
- Data minimization: Only required fields

### HIPAA

- Access controls: Role-based permissions
- Audit trails: Complete logging
- Encryption: AES-256 at rest, TLS 1.3 in transit
- BAA: Business Associate Agreement with Supabase

### Audit Reports

```tsx
// Generate audit report
const { data: auditLogs } = await supabase
  .from('organization_audit_log')
  .select('*')
  .eq('organization_id', orgId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false })

// Export to CSV
exportToCSV(auditLogs, 'audit-report.csv')
```

---

## Testing

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react-hooks'
import { useRBAC } from './RBACContext'

test('permission checking', () => {
  const { result } = renderHook(() => useRBAC())

  expect(result.current.hasPermission('tasks:create')).toBe(true)
  expect(result.current.hasPermission('tasks:delete')).toBe(false)
})
```

### Integration Tests

```typescript
test('multi-tenant data isolation', async () => {
  const org1 = await createOrganization('Org 1')
  const org2 = await createOrganization('Org 2')

  const task1 = await createTask({ organization_id: org1.id })

  // Switch to org2
  await switchOrganization(org2.id)

  // Verify task1 is not visible
  const { data } = await supabase.from('tasks').select('*')
  expect(data).not.toContainEqual(task1)
})
```

### E2E Tests

```typescript
test('SSO authentication flow', async () => {
  // Configure SSO provider
  await configureSSOProvider({
    domain: 'test.com',
    type: 'saml',
    settings: {...},
  })

  // Attempt SSO login
  await page.goto('/login')
  await page.fill('[name=email]', 'user@test.com')
  await page.click('button[type=submit]')

  // Should redirect to IdP
  await page.waitForURL(/idp\.test\.com/)

  // Complete IdP authentication
  await completeIdPLogin()

  // Should redirect back and be authenticated
  await expect(page).toHaveURL('/dashboard')
})
```

---

## Performance

### Optimizations

1. **Index Key Columns**:
```sql
CREATE INDEX idx_tasks_org_user ON tasks(organization_id, user_id);
```

2. **Cache Permission Checks**:
```tsx
const permissions = useMemo(() => ({
  canCreate: hasPermission('tasks:create'),
  canDelete: hasPermission('tasks:delete'),
}), [hasPermission])
```

3. **Batch Permission Queries**:
```tsx
const { hasAllPermissions } = useRBAC()
const canManage = hasAllPermissions(
  'tasks:create',
  'tasks:update',
  'tasks:delete'
)
```

---

## Troubleshooting

### Common Issues

**Issue**: User can't see organization data
```sql
-- Check membership
SELECT * FROM organization_members
WHERE user_id = 'user-uuid' AND organization_id = 'org-uuid';

-- Check RLS policies
EXPLAIN SELECT * FROM tasks WHERE organization_id = 'org-uuid';
```

**Issue**: Permission check failing
```sql
-- Debug permissions
SELECT * FROM get_user_permissions('user-uuid', 'org-uuid');
```

**Issue**: SSO not working
- Verify domain configuration
- Check IdP metadata
- Test SAML assertion parsing
- Validate certificates

---

## Production Checklist

- [ ] All RLS policies enabled
- [ ] Audit logging configured
- [ ] SSO providers tested
- [ ] Permission checks in Edge Functions
- [ ] Backup strategy implemented
- [ ] Monitoring and alerts set up
- [ ] Compliance documentation ready
- [ ] Security review completed

---

## Resources

### Documentation

- [Multi-Tenancy Guide](./../multi-tenancy/README.md)
- [RBAC Guide](./../rbac/README.md)
- [SSO Guide](./../sso/README.md)
- [Teams Guide](./../teams/README.md)

### External Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SAML 2.0 Spec](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

---

## Support

For questions or issues:

1. Check documentation in `.examples/enterprise/`
2. Review Supabase docs
3. Search GitHub issues
4. Contact support

---

## License

This implementation is part of the mobile-app-blueprint project.
