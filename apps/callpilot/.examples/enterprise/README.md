# Enterprise Authentication & Authorization Examples

Production-ready enterprise authentication and authorization examples for React Native + Expo + Supabase applications.

## What's Included

This directory contains complete implementations for enterprise-grade authentication features:

### 1. Multi-Tenancy (`./multi-tenancy/`)

Organization-based data isolation for B2B SaaS applications.

**Features:**
- Organization management
- Member roles (Owner, Admin, Member, Guest)
- Data isolation with RLS
- Organization switching
- Invitation system
- Audit logging

**Files:**
- `database/schema.sql` - Database schema with RLS policies
- `OrganizationContext.tsx` - React context for organizations
- `README.md` - Complete implementation guide

**Quick Start:**
```tsx
import { useOrganization } from './contexts/OrganizationContext'

const { currentOrg, createOrganization, inviteMember } = useOrganization()
```

### 2. RBAC (`./rbac/`)

Role-Based Access Control with fine-grained permissions.

**Features:**
- Dynamic role creation
- Permission model (resource:action)
- Permission guards
- Resource-level permissions
- System roles (Owner, Admin, Member, Guest)

**Files:**
- `database/schema.sql` - RBAC schema
- `RBACContext.tsx` - React context for permissions
- `components/PermissionGuard.tsx` - Declarative permission guards
- `README.md` - Complete implementation guide

**Quick Start:**
```tsx
import { useRBAC } from './contexts/RBACContext'
import { PermissionGuard } from './components/PermissionGuard'

const { hasPermission } = useRBAC()

<PermissionGuard permission="tasks:delete">
  <DeleteButton />
</PermissionGuard>
```

### 3. SSO (`./sso/`)

Single Sign-On with SAML, OAuth, and OIDC support.

**Features:**
- SAML 2.0 (Okta, Azure AD, OneLogin)
- OAuth 2.0 (Google, GitHub)
- OpenID Connect (Auth0, Keycloak)
- Just-In-Time provisioning
- Domain-based provider detection

**Files:**
- `SSOContext.tsx` - SSO implementation
- `README.md` - Configuration guides for major IdPs

**Quick Start:**
```tsx
import { useSSO } from './contexts/SSOContext'

const { signInWithSSO } = useSSO()
await signInWithSSO('user@company.com') // Auto-detects provider
```

### 4. Teams (`./teams/`)

Team-based collaboration within organizations.

**Features:**
- Team creation and management
- Team roles (Lead, Member)
- Team-scoped resources
- Public/private teams
- Team permissions

**Files:**
- `TeamsContext.tsx` - Teams context
- `README.md` - Implementation guide

**Quick Start:**
```tsx
import { useTeams } from './contexts/TeamsContext'

const { createTeam, addMember } = useTeams()
```

### 5. Main Documentation (`./auth/`)

Comprehensive guide covering all features.

**Files:**
- `README.md` - Complete enterprise auth guide

---

## Installation

### 1. Database Setup

Run schemas in order:

```bash
# Multi-tenancy (required first)
psql $DATABASE_URL -f ./multi-tenancy/database/schema.sql

# RBAC (requires multi-tenancy)
psql $DATABASE_URL -f ./rbac/database/schema.sql
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
npm install expo-web-browser expo-linking
```

### 3. Add Providers

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

---

## Common Use Cases

### Use Case 1: B2B SaaS Application

**Requirements:**
- Multiple organizations (companies)
- Role-based permissions
- SSO for enterprise customers
- Team collaboration

**Implementation:**
```tsx
// 1. Multi-tenancy for organization isolation
const { currentOrg, switchOrganization } = useOrganization()

// 2. RBAC for permissions
const { hasPermission } = useRBAC()
if (hasPermission('billing:manage')) {
  // Show billing settings
}

// 3. SSO for enterprise auth
const { signInWithSSO } = useSSO()
await signInWithSSO('user@enterprise.com')

// 4. Teams for collaboration
const { createTeam } = useTeams()
await createTeam({ name: 'Engineering' })
```

### Use Case 2: Internal Tool

**Requirements:**
- Single organization
- Department-based access
- LDAP/Active Directory integration

**Implementation:**
```tsx
// 1. Create single organization
const org = await createOrganization({ name: 'Company' })

// 2. Configure SSO with Active Directory
await createProvider({
  type: 'saml',
  domain: 'company.com',
  settings: { ssoUrl: '...' }
})

// 3. Create department teams
await createTeam({ name: 'Engineering' })
await createTeam({ name: 'Sales' })

// 4. Assign department-specific roles
await createRole({
  name: 'Sales Manager',
  permissions: ['reports:read', 'deals:manage']
})
```

### Use Case 3: Multi-Workspace App

**Requirements:**
- Users belong to multiple organizations
- Quick workspace switching
- Shared resources between workspaces

**Implementation:**
```tsx
// 1. User joins multiple orgs
const { organizations } = useOrganization()

// 2. Quick switching
<OrganizationSwitcher
  organizations={organizations}
  onSwitch={switchOrganization}
/>

// 3. Shared resources (optional)
// Grant cross-org access via resource permissions
await grantResourcePermission({
  resourceType: 'document',
  resourceId: docId,
  userId: externalUserId,
  permissions: ['read']
})
```

---

## Architecture Patterns

### Pattern 1: Organization-First

Best for: B2B SaaS, enterprise tools

```
User → Organization → Teams → Resources
```

Users must belong to an organization. All resources are org-scoped.

### Pattern 2: User-First with Optional Orgs

Best for: Productivity apps, freelancer tools

```
User → Personal Space OR Organization → Resources
```

Users have personal workspace, can join organizations.

### Pattern 3: Hybrid

Best for: Collaboration platforms

```
User → Personal + Organizations → Teams → Resources
```

Users have both personal space and organization memberships.

---

## Security Best Practices

### 1. Always Enable RLS

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### 2. Validate on Server

```typescript
// Edge Function
const canDelete = await supabase.rpc('has_permission', {
  p_user_id: user.id,
  p_organization_id: orgId,
  p_permission: 'tasks:delete'
})

if (!canDelete) {
  return new Response('Forbidden', { status: 403 })
}
```

### 3. Audit Everything

```typescript
await supabase.rpc('log_audit_event', {
  p_organization_id: orgId,
  p_action: 'task.deleted',
  p_resource_id: taskId
})
```

### 4. Principle of Least Privilege

Grant minimum required permissions:

```tsx
// ✅ Good
permissions: ['tasks:read', 'tasks:create']

// ❌ Bad
permissions: getAllPermissions()
```

### 5. Regular Permission Audits

```sql
-- Find users with sensitive permissions
SELECT u.email, r.name, p.resource, p.action
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource IN ('billing', 'settings', 'users')
  AND ur.status = 'active';
```

---

## Testing Strategies

### Unit Tests

Test individual context hooks:

```typescript
test('permission checking', () => {
  const { result } = renderHook(() => useRBAC())
  expect(result.current.hasPermission('tasks:create')).toBe(true)
})
```

### Integration Tests

Test multi-component flows:

```typescript
test('organization creation and member invite', async () => {
  const org = await createOrganization({ name: 'Test' })
  const invitation = await inviteMember('user@test.com', 'member')
  expect(invitation.status).toBe('pending')
})
```

### E2E Tests

Test complete user flows:

```typescript
test('SSO login flow', async () => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@sso-domain.com')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL(/idp\.sso-domain\.com/)
})
```

---

## Performance Optimization

### 1. Index Database Columns

```sql
CREATE INDEX idx_tasks_org_user ON tasks(organization_id, user_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id, organization_id);
```

### 2. Cache Permission Checks

```tsx
const permissions = useMemo(() => ({
  canCreate: hasPermission('tasks:create'),
  canDelete: hasPermission('tasks:delete'),
}), [hasPermission])
```

### 3. Batch Queries

```tsx
// Bad: Multiple queries
const tasks = await getTasks()
const users = await getUsers()
const teams = await getTeams()

// Good: Single query
const { data } = await supabase
  .from('tasks')
  .select('*, user:user_id(*), team:team_id(*)')
```

---

## Troubleshooting

### Common Issues

**"User can't see organization data"**
- Check `organization_members` table
- Verify RLS policies
- Check `status = 'active'`

**"Permission check always returns false"**
- Verify role assignments in `user_roles`
- Check role permissions in `role_permissions`
- Debug with `get_user_permissions()` function

**"SSO not working"**
- Verify domain configuration
- Check IdP metadata/certificate
- Test callback URL
- Review error logs

---

## Production Checklist

- [ ] All database schemas applied
- [ ] RLS policies enabled on all tables
- [ ] Audit logging configured
- [ ] SSO providers tested with real IdP
- [ ] Permission checks in Edge Functions
- [ ] Error handling and logging
- [ ] Backup and recovery tested
- [ ] Performance monitoring
- [ ] Security review completed
- [ ] Documentation updated

---

## Migration Guides

### From Single-Tenant to Multi-Tenant

See `./multi-tenancy/README.md` - "Migration Guide" section

### From Simple Roles to RBAC

See `./rbac/README.md` - "Migration Path" section

---

## Examples by Feature

| Feature | Example | Location |
|---------|---------|----------|
| Organization creation | `createOrganization()` | `./multi-tenancy/OrganizationContext.tsx` |
| Member invitation | `inviteMember()` | `./multi-tenancy/OrganizationContext.tsx` |
| Permission checking | `hasPermission()` | `./rbac/RBACContext.tsx` |
| Permission guards | `<PermissionGuard>` | `./rbac/components/PermissionGuard.tsx` |
| Role creation | `createRole()` | `./rbac/RBACContext.tsx` |
| SSO login | `signInWithSSO()` | `./sso/SSOContext.tsx` |
| Team creation | `createTeam()` | `./teams/TeamsContext.tsx` |
| Audit logging | RLS triggers | `./multi-tenancy/database/schema.sql` |

---

## Support

### Documentation

- [Multi-Tenancy Guide](./multi-tenancy/README.md)
- [RBAC Guide](./rbac/README.md)
- [SSO Guide](./sso/README.md)
- [Teams Guide](./teams/README.md)
- [Main Auth Guide](./auth/README.md)

### External Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SAML 2.0 Spec](http://docs.oasis-open.org/security/saml/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

---

## License

Part of the mobile-app-blueprint project.

## Contributing

When adding new features:

1. Follow existing naming conventions
2. Add comprehensive RLS policies
3. Include audit logging
4. Write tests
5. Update documentation

---

**Built with:** React Native + Expo + Supabase + TypeScript
