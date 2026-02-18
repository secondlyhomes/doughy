# Feature Flags

Comprehensive feature flag system for gradual rollouts, A/B testing, and feature management.

## Quick Start

```tsx
import { FeatureFlagProvider, useFeatureFlag, FeatureGate } from './FeatureFlagContext'

// Wrap your app
<FeatureFlagProvider>
  <App />
</FeatureFlagProvider>

// Use hook
function MyComponent() {
  const newUIEnabled = useFeatureFlag('new-ui')
  return newUIEnabled ? <NewUI /> : <OldUI />
}

// Use component
<FeatureGate flag="new-ui">
  <NewUI />
</FeatureGate>
```

## Features

- **Gradual Rollouts**: Roll out to X% of users
- **User Targeting**: Enable for specific users
- **Organization Targeting**: Enable per organization
- **Role Targeting**: Enable per user role
- **A/B Testing**: Multiple variants
- **Date Ranges**: Auto-enable/disable on dates
- **Real-time Updates**: Flags update without app restart

## Database Schema

```sql
CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INT CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users TEXT[],
  target_organizations TEXT[],
  target_roles TEXT[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Examples

### Gradual Rollout

```typescript
// Start at 10%
await createFeatureFlag({
  key: 'new-ui',
  name: 'New UI',
  enabled: true,
  rolloutPercentage: 10,
})

// Increase to 50%
await increaseRollout('new-ui', 50)

// Full rollout
await increaseRollout('new-ui', 100)
```

### User Targeting

```typescript
// Enable for beta users
await enableForUsers('new-feature', ['user-1', 'user-2'])

// Enable for premium organizations
await enableForOrganizations('premium-feature', ['org-1', 'org-2'])
```

### A/B Testing

```typescript
const variant = getVariant('button-color')
const buttonColor = variant === 'red' ? '#FF0000' : '#0000FF'
```

## Best Practices

1. **Start Small**: Begin with 1-5% rollout
2. **Monitor**: Watch error rates during rollout
3. **Gradual Increase**: 10% → 25% → 50% → 100%
4. **Clean Up**: Remove flags after full rollout
5. **Document**: Explain what each flag controls

## Flag Lifecycle

1. **Development**: Flag created, disabled
2. **Testing**: Enabled for internal users only
3. **Beta**: Rolled out to 10% of users
4. **Gradual**: Increased to 50%, then 100%
5. **Stable**: Flag removed, feature is standard
6. **Cleanup**: Remove flag code and database entry

