# Environment Variables Guide

Comprehensive guide to managing secrets and configuration across development, staging, and production environments.

## Overview

This blueprint uses a multi-layered approach to environment variable management:

1. **`.env.example`** - Template with all required variables (committed to git)
2. **`.env`** - Local development secrets (gitignored, never committed)
3. **`.env.local`** - Personal overrides (gitignored, optional)
4. **EAS Secrets** - Production/staging secrets for cloud builds
5. **Supabase Vault** - Encrypted API key storage (server-side only)

## Quick Start

### 1. Copy Example File

```bash
cp .env.example .env
```

### 2. Fill in Your Values

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_ENV=development
```

### 3. Verify Configuration

```bash
npm run validate:env   # Checks all required variables are set
```

## Environment Variable Types

### Public Variables (`EXPO_PUBLIC_*`)

These are **embedded in the client bundle** and visible to users. Only use for non-sensitive configuration.

```bash
# ✅ Safe - Public configuration
EXPO_PUBLIC_SUPABASE_URL=https://project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Anon key is public (protected by RLS)
EXPO_PUBLIC_APP_ENV=development

# ✅ Safe - Feature flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

### Private Variables (No Prefix)

These are **server-side only** and never bundled into the client app. Use for sensitive credentials.

```bash
# ✅ Safe - Server-side only (Edge Functions, backend)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NEVER expose to client
DATABASE_PASSWORD=super-secret
```

**Critical:** Private variables are only accessible in:
- Supabase Edge Functions
- Server-side code (not Expo app)
- CI/CD pipelines
- Build processes

## File Structure

### `.env.example` (Template)

**Purpose:** Shows all required variables without real values

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI API (server-side only)
OPENAI_API_KEY=sk-your-openai-key

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token

# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

**Status:** ✅ Committed to git

---

### `.env` (Development Secrets)

**Purpose:** Your actual development credentials

```bash
# Your real values
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-abc123...
EXPO_PUBLIC_APP_ENV=development
```

**Status:** ❌ Gitignored (never commit)

---

### `.env.local` (Personal Overrides)

**Purpose:** Override values without modifying `.env` (useful for team members with different configs)

```bash
# Override API base URL for local testing
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Use local Supabase instance
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
```

**Load order:** `.env.local` overrides `.env`

**Status:** ❌ Gitignored (never commit)

---

### EAS Secrets (Production/Staging)

**Purpose:** Secure cloud-based secrets for production builds

```bash
# Set secrets for EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://prod.supabase.co --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... --type string
eas secret:create --scope project --name SENTRY_DSN --value https://... --type string
```

**Status:** ☁️ Stored in Expo cloud (encrypted)

## Multi-Environment Setup

### Development (Local)

```bash
# .env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Staging (EAS)

```bash
# eas.json - staging profile
{
  "build": {
    "staging": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging",
        "EXPO_PUBLIC_SUPABASE_URL": "https://staging-project.supabase.co"
      }
    }
  }
}
```

Build staging:
```bash
eas build --profile staging --platform ios
```

### Production (EAS)

```bash
# eas.json - production profile
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production",
        "EXPO_PUBLIC_SUPABASE_URL": "https://prod-project.supabase.co"
      }
    }
  }
}
```

Build production:
```bash
eas build --profile production --platform ios
```

## Environment-Specific Configuration

### In Your Code

```typescript
// src/config/environment.ts
const ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development'

export const config = {
  isDevelopment: ENV === 'development',
  isStaging: ENV === 'staging',
  isProduction: ENV === 'production',

  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,

  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com',
    timeout: ENV === 'production' ? 10000 : 30000,
  },

  analytics: {
    enabled: ENV === 'production',
  },

  logging: {
    level: ENV === 'production' ? 'error' : 'debug',
  },
}
```

### Usage

```typescript
import { config } from '@/config/environment'

// Conditional behavior
if (config.isDevelopment) {
  console.log('Running in development mode')
}

// Environment-specific URLs
const apiClient = createClient(config.api.baseUrl)

// Feature flags
if (config.analytics.enabled) {
  trackEvent('user_action')
}
```

## Required Variables

### Minimal Setup (No Database)

```bash
# .env
EXPO_PUBLIC_APP_ENV=development
```

App works with local state only (AsyncStorage). No Supabase required.

---

### With Supabase

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_ENV=development
```

---

### Full Stack (All Features)

```bash
# .env
# Supabase (required for database features)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (required for AI features, server-side only)
OPENAI_API_KEY=sk-proj-...

# Upstash Redis (required for rate limiting, server-side only)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token

# Sentry (required for error tracking)
SENTRY_DSN=https://your-sentry-dsn

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_live_...                    # Server-side only
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   # Client-safe

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

## Validation Script

Create `scripts/validate-env.js`:

```javascript
#!/usr/bin/env node

const required = [
  'EXPO_PUBLIC_APP_ENV',
]

const optional = {
  database: ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
  ai: ['OPENAI_API_KEY'],
  rateLimit: ['UPSTASH_REDIS_URL', 'UPSTASH_REDIS_TOKEN'],
  errorTracking: ['SENTRY_DSN'],
  payments: ['STRIPE_SECRET_KEY', 'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
}

console.log('🔍 Validating environment variables...\n')

// Check required
let hasErrors = false
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required: ${key}`)
    hasErrors = true
  } else {
    console.log(`✅ ${key}`)
  }
})

// Check optional (warnings only)
console.log('\n📦 Optional Features:')
Object.entries(optional).forEach(([feature, vars]) => {
  const allPresent = vars.every(key => process.env[key])
  const somePresent = vars.some(key => process.env[key])

  if (allPresent) {
    console.log(`✅ ${feature}: Enabled`)
  } else if (somePresent) {
    console.warn(`⚠️  ${feature}: Partially configured`)
    vars.forEach(key => {
      if (!process.env[key]) console.warn(`   Missing: ${key}`)
    })
  } else {
    console.log(`⚪ ${feature}: Disabled`)
  }
})

if (hasErrors) {
  console.error('\n❌ Environment validation failed!')
  process.exit(1)
}

console.log('\n✅ Environment validation passed!')
```

Add to `package.json`:

```json
{
  "scripts": {
    "validate:env": "node scripts/validate-env.js"
  }
}
```

Run before starting development:

```bash
npm run validate:env
```

## Security Best Practices

### ✅ DO

- **Use `.env.example` as template** - Shows structure without real values
- **Gitignore `.env` and `.env.local`** - Never commit secrets
- **Use `EXPO_PUBLIC_*` prefix** - Only for truly public config
- **Use EAS Secrets for production** - Encrypted cloud storage
- **Rotate secrets regularly** - Every 90 days minimum
- **Use Supabase Vault for API keys** - Server-side encrypted storage (see [API-KEY-MANAGEMENT.md](docs/09-security/API-KEY-MANAGEMENT.md))
- **Validate environment on startup** - Fail fast if misconfigured

### ❌ DON'T

- **Never commit `.env` files** - Contains real secrets
- **Never hardcode secrets in code** - Use environment variables
- **Never expose service_role key to client** - Server-side only
- **Never use `EXPO_PUBLIC_*` for sensitive data** - Embedded in bundle
- **Never share `.env` files via Slack/email** - Use secure channels (1Password, EAS Secrets)
- **Never log environment variables** - Leaks secrets to logs

## Common Issues

### Variable Not Loading

**Problem:** `process.env.MY_VAR` is undefined

**Solutions:**
1. Restart Expo dev server (`npm start` again)
2. Clear cache: `npx expo start --clear`
3. Check variable name has `EXPO_PUBLIC_` prefix (for client-side)
4. Verify `.env` file exists and is in project root

---

### Variable Shows in Bundle

**Problem:** Private key visible in compiled JavaScript

**Solutions:**
1. Remove `EXPO_PUBLIC_` prefix (makes it server-side only)
2. Move to Supabase Vault (for API keys)
3. Use EAS Secrets (for build-time secrets)

---

### Different Values in Build vs Dev

**Problem:** App behaves differently in production build

**Solutions:**
1. Check `eas.json` environment overrides
2. Verify EAS Secrets are set: `eas secret:list`
3. Use same environment in both: `EXPO_PUBLIC_APP_ENV=production npm start`

## EAS Secrets Management

### List All Secrets

```bash
eas secret:list --scope project
```

### Create Secret

```bash
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value https://prod.supabase.co \
  --type string
```

### Update Secret

```bash
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value https://new-prod.supabase.co \
  --type string \
  --force
```

### Delete Secret

```bash
eas secret:delete --scope project --name OLD_SECRET_NAME
```

### Environment-Specific Secrets

Use build profiles in `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000"
      }
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.example.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com"
      }
    }
  }
}
```

## Related Documentation

- **API Key Storage:** [docs/09-security/API-KEY-MANAGEMENT.md](docs/09-security/API-KEY-MANAGEMENT.md) - Supabase Vault for encrypted API keys
- **Supabase Setup:** [docs/03-database/SUPABASE-SETUP.md](docs/03-database/SUPABASE-SETUP.md) - Getting Supabase credentials
- **Security Checklist:** [docs/09-security/SECURITY-CHECKLIST.md](docs/09-security/SECURITY-CHECKLIST.md) - Pre-launch security audit
- **EAS Build:** [docs/11-deployment/](docs/11-deployment/) - Cloud build configuration

## Example Configurations

### Local Development (Minimal)

```bash
# .env
EXPO_PUBLIC_APP_ENV=development
```

### Local Development (Full Features)

```bash
# .env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://dev.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SENTRY_DSN=https://dev-sentry-dsn
```

### Staging Build

```bash
# EAS Secrets
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=https://staging.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SENTRY_DSN=https://staging-sentry-dsn
```

### Production Build

```bash
# EAS Secrets
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://prod.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SENTRY_DSN=https://prod-sentry-dsn
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

---

**Questions?** Check [docs/09-security/](docs/09-security/) for security best practices or [docs/03-database/SUPABASE-SETUP.md](docs/03-database/SUPABASE-SETUP.md) for Supabase configuration.
