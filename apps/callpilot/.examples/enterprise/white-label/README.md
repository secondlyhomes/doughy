# White-Labeling System

Complete white-labeling solution for multi-tenant SaaS applications. Allow organizations to customize branding, colors, features, and more.

## Overview

White-labeling enables:
- Custom branding per organization
- Feature toggles per tenant
- Multi-brand mobile apps from single codebase
- Custom domains and URLs
- Tenant-specific configurations

## Quick Start

```tsx
import { WhiteLabelProvider, useWhiteLabel } from './ThemeCustomization'

// Wrap your app
function App() {
  return (
    <WhiteLabelProvider organizationId="org-123">
      <YourApp />
    </WhiteLabelProvider>
  )
}

// Use in components
function MyComponent() {
  const { config, theme } = useWhiteLabel()
  
  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      <Text>{config.branding.appName}</Text>
    </View>
  )
}
```

## Features

### Branding Customization
- App name and tagline
- Primary, secondary, and accent colors
- Logo and icon
- Splash screen
- Background images

### Feature Toggles
- Authentication methods
- AI assistant
- Analytics
- Integrations
- Custom fields
- API access

### URL Customization
- Website
- Privacy policy
- Terms of service
- Support portal
- Documentation

## Database Schema

```sql
CREATE TABLE white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  branding JSONB NOT NULL,
  features JSONB NOT NULL,
  urls JSONB NOT NULL,
  customization JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Best Practices

1. **Cache configurations** - Load once, cache locally
2. **Preload assets** - Download logos/icons on app start
3. **Validate colors** - Ensure hex codes are valid
4. **Provide defaults** - Always have fallback config
5. **Version control** - Track branding changes over time

## Build Process

For multiple branded apps from one codebase:

```bash
# Build for Org A
BRAND=org-a npm run build:ios

# Build for Org B  
BRAND=org-b npm run build:android
```

See full documentation for multi-brand build automation.
