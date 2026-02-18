# Enterprise Patterns

> Patterns for building enterprise-grade React Native applications with Supabase.

## Overview

Enterprise applications require additional patterns beyond standard consumer apps. This documentation covers multi-tenancy, compliance, security, and scalability patterns specifically designed for React Native + Supabase.

## Pattern Categories

### Identity & Access

| Pattern | Description | Complexity |
|---------|-------------|------------|
| [RBAC](./RBAC.md) | Role-based access control | Medium |
| [Enterprise Authentication](./ENTERPRISE-AUTHENTICATION.md) | SAML, OIDC, SSO integration | High |

### Multi-Tenancy

| Pattern | Description | Complexity |
|---------|-------------|------------|
| [Multi-Tenancy](./MULTI-TENANCY.md) | Organization/workspace switching | High |
| [Tenant Isolation](./TENANT-ISOLATION.md) | Data separation strategies | High |
| [White-Labeling](./WHITE-LABELING.md) | Theme customization per tenant | Medium |

### Security & Compliance

| Pattern | Description | Complexity |
|---------|-------------|------------|
| [Audit Logging](./AUDIT-LOGGING.md) | Tracking user actions | Medium |
| [Compliance](./COMPLIANCE.md) | GDPR, SOC2, HIPAA | High |
| [Data Export](./DATA-EXPORT.md) | User data portability | Medium |

### API & Infrastructure

| Pattern | Description | Complexity |
|---------|-------------|------------|
| [API Versioning](./API-VERSIONING.md) | Managing API changes | Medium |
| [Feature Flags](./FEATURE-FLAGS.md) | Gradual rollouts | Low |
| [Rate Limiting](./RATE-LIMITING.md) | Protecting resources | Medium |

## Quick Start

### 1. Choose Your Tenancy Model

```typescript
// Shared database with tenant_id column (recommended)
// See: MULTI-TENANCY.md

// Separate schemas per tenant
// See: TENANT-ISOLATION.md
```

### 2. Implement RBAC

```typescript
// src/contexts/RBACContext.tsx
import { usePermissions } from '@/hooks/usePermissions';

export const useCanAccess = (permission: string) => {
  const { permissions } = usePermissions();
  return permissions.includes(permission);
};
```

### 3. Add Audit Logging

```sql
-- See: AUDIT-LOGGING.md for full implementation
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Examples

See the `.examples/enterprise/` directory for reference implementations of these patterns.

## Architecture Decision Records

Key decisions made for enterprise patterns:

1. **Shared database with RLS** over separate databases per tenant
2. **JWT claims** for tenant context over session storage
3. **Event-driven audit logs** over synchronous logging
4. **Feature flags in database** over config files

## Prerequisites

Before implementing enterprise patterns:

- [ ] Supabase project with RLS enabled
- [ ] Authentication configured
- [ ] TypeScript strict mode enabled
- [ ] Error tracking (Sentry) set up

## Related Documentation

- [Security Checklist](../../09-security/SECURITY-CHECKLIST.md)
- [Supabase Setup](../../03-database/SUPABASE-SETUP.md)
- [API Key Management](../../09-security/API-KEY-MANAGEMENT.md)

## Support

For enterprise support inquiries, contact the maintainers or open an issue with the `enterprise` label.
