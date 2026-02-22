# API Key Management Guide

Comprehensive guide to storing API keys securely in Supabase using Vault with encrypted storage.

## Table of Contents

1. [Overview](#overview)
2. [Supabase Vault Setup](#supabase-vault-setup)
3. [Storing Secrets](#storing-secrets)
4. [Retrieving Secrets](#retrieving-secrets-server-side-only)
5. [Access Control](#access-control)
6. [Key Rotation](#key-rotation)
7. [Migrating from Environment Variables](#migrating-from-environment-variables)
8. [Common Patterns](#common-patterns)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Why API Keys Must NEVER Be in Client Code

**The Problem:**

```typescript
// ❌ INSECURE - Exposed to anyone who inspects your app
const OPENAI_API_KEY = 'sk-proj-abc123...'  // Hardcoded secret
const STRIPE_SECRET_KEY = process.env.EXPO_PUBLIC_STRIPE_KEY  // Wrong prefix, becomes public!

// Anyone can extract this from your compiled JavaScript bundle
fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`  // ❌ Exposed!
  }
})
```

**Security Risks:**

1. **API Key Theft** - Malicious users can extract keys from your app bundle
2. **Unauthorized Usage** - Stolen keys used to rack up charges on your account
3. **Data Breaches** - Access to your third-party services and data
4. **Cost Overruns** - Bad actors can drain your API credits
5. **Service Suspension** - Providers may suspend accounts with exposed keys

**The Solution: Supabase Vault**

Supabase Vault provides **encrypted storage** for API keys using the `pgsodium` extension. Secrets are:
- ✅ Encrypted at rest in the database
- ✅ Only accessible server-side (Edge Functions)
- ✅ Never exposed to client code
- ✅ Rotatable without redeploying your app
- ✅ Auditable (track access)

---

## Supabase Vault Setup

### 1. Verify `pgsodium` Extension

Vault uses the `pgsodium` extension for encryption. It's enabled by default on Supabase projects created after 2021.

**Check if enabled:**

```sql
SELECT * FROM pg_extension WHERE extname = 'pgsodium';
```

**If not enabled:**

```sql
CREATE EXTENSION IF NOT EXISTS pgsodium;
```

**Verify encryption is working:**

```sql
SELECT pgsodium.crypto_aead_det_keygen();
```

Should return a key ID (not an error).

---

### 2. Disable Statement Logging (CRITICAL)

**Before inserting secrets**, disable SQL statement logging to prevent secrets from appearing in logs.

```sql
-- Disable logging (run this FIRST)
ALTER DATABASE postgres SET log_statement = 'none';
```

**Why this is critical:**
- PostgreSQL logs all SQL statements by default
- Your secrets would be visible in logs: `INSERT INTO vault.secrets VALUES ('sk-proj-abc123...')`
- Logs are stored in Supabase and accessible to team members
- Attackers with log access could steal secrets

**Verify logging is disabled:**

```sql
SHOW log_statement;
```

Should return `'none'`.

---

### 3. Create Encryption Key (Optional)

Supabase automatically creates encryption keys, but you can create a custom key if needed.

```sql
-- Create a new encryption key
SELECT pgsodium.create_key();
```

Returns a UUID (key ID).

**View all keys:**

```sql
SELECT * FROM pgsodium.valid_key;
```

---

## Storing Secrets

### Basic Usage

Insert secrets into the `vault.secrets` table:

```sql
-- Store OpenAI API key
INSERT INTO vault.secrets (name, secret)
VALUES ('openai_api_key', 'sk-proj-your-actual-key-here');

-- Store Stripe secret key
INSERT INTO vault.secrets (name, secret)
VALUES ('stripe_secret_key', 'sk_live_your-stripe-key');

-- Store with description
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'sendgrid_api_key',
  'SG.abc123...',
  'SendGrid API key for transactional emails'
);
```

**Important:** After inserting secrets, **re-enable logging**:

```sql
-- Re-enable logging after all secrets are inserted
ALTER DATABASE postgres SET log_statement = 'all';
```

---

### Bulk Insert (Multiple Secrets)

```sql
-- Disable logging first
ALTER DATABASE postgres SET log_statement = 'none';

-- Insert multiple secrets
INSERT INTO vault.secrets (name, secret, description) VALUES
  ('openai_api_key', 'sk-proj-abc123...', 'OpenAI API for AI features'),
  ('stripe_secret_key', 'sk_live_xyz789...', 'Stripe for payments'),
  ('sendgrid_api_key', 'SG.def456...', 'SendGrid for emails'),
  ('twilio_auth_token', 'abc123...', 'Twilio for SMS');

-- Re-enable logging
ALTER DATABASE postgres SET log_statement = 'all';
```

---

### Verifying Secrets Are Encrypted

```sql
-- View encrypted secrets (you'll see encrypted values, not plaintext)
SELECT id, name, description, created_at FROM vault.secrets;

-- ❌ This will NOT show decrypted secrets (requires secret key)
SELECT secret FROM vault.secrets WHERE name = 'openai_api_key';
```

The `secret` column is **encrypted** and unreadable in raw queries.

---

## Retrieving Secrets (Server-Side Only)

Secrets can **ONLY** be retrieved server-side. **NEVER** in client code.

### In Supabase Edge Functions

**Setup:**

```typescript
// supabase/functions/ai-chat/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Create admin client with secret key
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!  // Server-side only
  )

  // Retrieve decrypted secret from Vault
  const { data, error } = await supabaseAdmin
    .from('vault.decrypted_secrets')  // Special view for decryption
    .select('decrypted_secret')
    .eq('name', 'openai_api_key')
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve API key' }),
      { status: 500 }
    )
  }

  const openaiApiKey = data.decrypted_secret

  // Use the API key
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
    }),
  })

  const result = await response.json()
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

### Caching Secrets (Performance Optimization)

**Problem:** Fetching from Vault on every request adds latency.

**Solution:** Cache secrets in memory for the Edge Function lifetime.

```typescript
// supabase/functions/_shared/secrets.ts

let cachedSecrets: Record<string, string> = {}

export async function getSecret(supabase: any, secretName: string): Promise<string> {
  // Check cache first
  if (cachedSecrets[secretName]) {
    return cachedSecrets[secretName]
  }

  // Fetch from Vault
  const { data, error } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', secretName)
    .single()

  if (error) throw new Error(`Secret '${secretName}' not found`)

  // Cache for future requests
  cachedSecrets[secretName] = data.decrypted_secret
  return data.decrypted_secret
}

// Usage in Edge Function
import { getSecret } from '../_shared/secrets.ts'

const openaiKey = await getSecret(supabaseAdmin, 'openai_api_key')
```

**Cache invalidation:** Edge Functions restart periodically, clearing cache automatically.

---

### Multiple Secrets at Once

```typescript
// Fetch multiple secrets in one query
const { data, error } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('name, decrypted_secret')
  .in('name', ['openai_api_key', 'stripe_secret_key', 'sendgrid_api_key'])

if (error) throw error

// Convert to object for easy access
const secrets = data.reduce((acc, { name, decrypted_secret }) => {
  acc[name] = decrypted_secret
  return acc
}, {} as Record<string, string>)

// Use secrets
const openaiKey = secrets.openai_api_key
const stripeKey = secrets.stripe_secret_key
```

---

## Access Control

### RLS Policies for `vault.secrets`

**Default behavior:** Only the `secret` key (service role) can access `vault.secrets`.

**Verify RLS is enabled:**

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'vault' AND tablename = 'secrets';
```

Should show `rowsecurity = true`.

---

### Explicit RLS Policy (Recommended)

```sql
-- Enable RLS (if not already enabled)
ALTER TABLE vault.secrets ENABLE ROW LEVEL SECURITY;

-- Deny all user access (only secret key / service_role can access)
CREATE POLICY "No user access to secrets"
  ON vault.secrets
  USING (false);

-- Alternative: Allow specific roles (advanced)
CREATE POLICY "Service role only"
  ON vault.secrets
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

### Edge Function Permissions

Only Edge Functions with the **secret key** can access `vault.decrypted_secrets`.

**❌ Client code cannot access Vault:**

```typescript
// ❌ This will FAIL in client code (anon key doesn't have access)
const { data, error } = await supabase  // Using anon key
  .from('vault.decrypted_secrets')
  .select('*')

// Error: "permission denied for table vault.secrets"
```

**✅ Only server-side code can access Vault:**

```typescript
// ✅ This works in Edge Functions (secret key)
const supabaseAdmin = createClient(url, secretKey)
const { data, error } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('*')
```

---

## Key Rotation

Rotate API keys **every 90 days** to minimize risk if keys are compromised.

### Rotation Workflow

**Step 1: Generate New Key**

Generate a new API key from your provider (OpenAI, Stripe, etc.).

**Step 2: Update Vault**

```sql
-- Update existing secret with new key
UPDATE vault.secrets
SET
  secret = 'sk-proj-NEW-KEY-HERE',
  updated_at = NOW()
WHERE name = 'openai_api_key';
```

**Step 3: Test with New Key**

Deploy Edge Function and test that it works with the new key.

**Step 4: Revoke Old Key**

Revoke the old API key in your provider's dashboard (OpenAI, Stripe, etc.).

**Step 5: Document Rotation**

```sql
-- Add rotation note
UPDATE vault.secrets
SET description = 'OpenAI API key (rotated 2026-02-05)'
WHERE name = 'openai_api_key';
```

---

### Automated Rotation Reminders

**Create a rotation schedule table:**

```sql
CREATE TABLE key_rotation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL,
  last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
  rotation_interval_days INT DEFAULT 90,
  next_rotation_due TIMESTAMPTZ GENERATED ALWAYS AS (last_rotated_at + (rotation_interval_days || ' days')::INTERVAL) STORED
);

-- Insert rotation schedule for each key
INSERT INTO key_rotation_schedule (secret_name) VALUES
  ('openai_api_key'),
  ('stripe_secret_key'),
  ('sendgrid_api_key');

-- Query keys due for rotation
SELECT
  secret_name,
  last_rotated_at,
  next_rotation_due,
  next_rotation_due < NOW() AS is_overdue
FROM key_rotation_schedule
WHERE next_rotation_due < NOW() + INTERVAL '7 days'
ORDER BY next_rotation_due;
```

**Create Edge Function to send rotation reminders via email.**

---

### Rotation Checklist

- [ ] Generate new API key in provider dashboard
- [ ] Update `vault.secrets` with new key
- [ ] Test Edge Function with new key
- [ ] Verify all features work correctly
- [ ] Revoke old key in provider dashboard
- [ ] Update rotation schedule (`last_rotated_at`)
- [ ] Document rotation date and reason

---

## Migrating from Environment Variables

### Before (INSECURE)

```bash
# .env
OPENAI_API_KEY=sk-proj-abc123...  # ❌ Visible in code, logs, git history
STRIPE_SECRET_KEY=sk_live_xyz789...  # ❌ Exposed in compiled bundle
```

```typescript
// Client code (INSECURE)
const openaiKey = process.env.OPENAI_API_KEY  // ❌ Exposed to client
```

---

### After (SECURE)

**Step 1: Store secrets in Vault**

```sql
-- Disable logging
ALTER DATABASE postgres SET log_statement = 'none';

-- Insert secrets
INSERT INTO vault.secrets (name, secret) VALUES
  ('openai_api_key', 'sk-proj-abc123...'),
  ('stripe_secret_key', 'sk_live_xyz789...');

-- Re-enable logging
ALTER DATABASE postgres SET log_statement = 'all';
```

**Step 2: Update Edge Functions to use Vault**

```typescript
// supabase/functions/ai-chat/index.ts

// OLD:
// const openaiKey = Deno.env.get('OPENAI_API_KEY')  // ❌ From environment

// NEW:
const { data } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('decrypted_secret')
  .eq('name', 'openai_api_key')
  .single()

const openaiKey = data.decrypted_secret  // ✅ From Vault
```

**Step 3: Remove from `.env`**

```bash
# .env (remove these)
# OPENAI_API_KEY=...  # ❌ Removed
# STRIPE_SECRET_KEY=...  # ❌ Removed
```

**Step 4: Update client code to call Edge Functions**

```typescript
// Client code (call Edge Function instead of direct API)
const response = await fetch('https://your-project.supabase.co/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Hello!' }),
})
```

---

## Common Patterns

### OpenAI API Keys

```sql
-- Store OpenAI key
INSERT INTO vault.secrets (name, secret, description) VALUES
  ('openai_api_key', 'sk-proj-abc123...', 'OpenAI API for AI chat');
```

**Usage in Edge Function:**

```typescript
const { data } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('decrypted_secret')
  .eq('name', 'openai_api_key')
  .single()

const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${data.decrypted_secret}` },
  method: 'POST',
  body: JSON.stringify({ model: 'gpt-4', messages })
})
```

**Key format:** `sk-proj-...` (project keys) or `sk-...` (legacy keys)

---

### Stripe API Keys

```sql
-- Store Stripe keys (separate for test and live)
INSERT INTO vault.secrets (name, secret, description) VALUES
  ('stripe_secret_key_test', 'sk_test_abc123...', 'Stripe test mode'),
  ('stripe_secret_key_live', 'sk_live_xyz789...', 'Stripe live mode');
```

**Usage:**

```typescript
// Determine environment
const isProduction = Deno.env.get('ENVIRONMENT') === 'production'
const keyName = isProduction ? 'stripe_secret_key_live' : 'stripe_secret_key_test'

// Retrieve key
const { data } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('decrypted_secret')
  .eq('name', keyName)
  .single()

// Create payment intent
const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${data.decrypted_secret}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'amount=1000&currency=usd',
})
```

**Key formats:**
- Test: `sk_test_...`
- Live: `sk_live_...`

---

### Third-Party API Tokens

```sql
-- Generic pattern for any API token
INSERT INTO vault.secrets (name, secret, description) VALUES
  ('sendgrid_api_key', 'SG.abc123...', 'SendGrid for transactional emails'),
  ('twilio_auth_token', 'abc123...', 'Twilio for SMS verification'),
  ('google_maps_api_key', 'AIza...', 'Google Maps for location services');
```

**Usage pattern is the same:**

```typescript
const { data } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('decrypted_secret')
  .eq('name', 'sendgrid_api_key')
  .single()

// Use API key with third-party service
```

---

### OAuth Client Secrets

```sql
-- Store OAuth secrets (Google, GitHub, etc.)
INSERT INTO vault.secrets (name, secret, description) VALUES
  ('google_oauth_client_secret', 'GOCSPX-abc123...', 'Google OAuth for sign-in'),
  ('github_oauth_client_secret', 'ghp_xyz789...', 'GitHub OAuth for sign-in');
```

**Use in auth callback handlers.**

---

## Best Practices

### ✅ DO

- **Store ALL sensitive API keys in Vault** - Never in environment variables or code
- **Use secret key ONLY server-side** - Edge Functions, backend services
- **Disable logging before inserting secrets** - Prevent secrets in logs
- **Rotate keys every 90 days** - Minimize risk window
- **Document which Edge Function uses which secret** - Audit trail
- **Use descriptive secret names** - `openai_api_key`, not `key1`
- **Cache secrets in Edge Functions** - Reduce latency
- **Test rotation in staging first** - Before rotating production keys
- **Revoke old keys after rotation** - Don't leave exposed keys active
- **Monitor API usage** - Detect unauthorized access early

---

### ❌ DON'T

- **Never store secrets in .env files accessible to client** - Compiled into bundle
- **Never log API keys** - Even in server logs
- **Never commit Vault secrets to git** - Defeats the purpose
- **Never expose secret key to client code** - Full database access
- **Never use anon key to access Vault** - Will fail with permission error
- **Never hardcode secrets in Edge Functions** - Use Vault instead
- **Never share secrets via Slack/email** - Use secure channels (1Password, Vault)
- **Never reuse the same API key across environments** - Separate test/prod keys
- **Never skip rotation** - Set calendar reminders
- **Never disable RLS on `vault.secrets`** - Keep locked down

---

## Troubleshooting

### Issue: "Permission denied for table vault.secrets"

**Symptom:** Query fails when trying to access Vault.

**Cause:** Using anon key instead of secret key.

**Solution:**

```typescript
// ❌ Wrong: Using anon key (client-side)
const supabase = createClient(url, anonKey)
const { data, error } = await supabase
  .from('vault.decrypted_secrets')
  .select('*')
// Error: Permission denied

// ✅ Correct: Using secret key (server-side)
const supabaseAdmin = createClient(url, secretKey)
const { data, error } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('*')
```

---

### Issue: "Secret appears in logs"

**Symptom:** API key visible in Supabase logs.

**Cause:** Forgot to disable statement logging before INSERT.

**Solution:**

1. Clear existing logs (if possible)
2. Re-insert secret with logging disabled:

```sql
ALTER DATABASE postgres SET log_statement = 'none';
DELETE FROM vault.secrets WHERE name = 'exposed_key';
INSERT INTO vault.secrets (name, secret) VALUES ('exposed_key', 'new-key');
ALTER DATABASE postgres SET log_statement = 'all';
```

3. Rotate the exposed key immediately

---

### Issue: "Extension pgsodium not found"

**Symptom:** `pgsodium` functions not available.

**Cause:** Extension not enabled.

**Solution:**

```sql
-- Enable pgsodium
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'pgsodium';
```

If still failing, contact Supabase support (should be enabled by default).

---

### Issue: "Secret not found"

**Symptom:** Query returns no rows.

**Cause:** Secret name typo or not inserted.

**Solution:**

```sql
-- List all secrets
SELECT name, description, created_at FROM vault.secrets;

-- Check exact name
SELECT name FROM vault.secrets WHERE name LIKE '%openai%';

-- Insert if missing
INSERT INTO vault.secrets (name, secret) VALUES ('openai_api_key', 'sk-...');
```

---

### Issue: "Cannot decrypt secret"

**Symptom:** `decrypted_secret` is null or error.

**Cause:**
- Encryption key deleted
- Database corruption (rare)
- Wrong Supabase project

**Solution:**

1. Verify you're connected to correct project
2. Check encryption keys exist:

```sql
SELECT * FROM pgsodium.valid_key;
```

3. If keys missing, re-insert secret:

```sql
DELETE FROM vault.secrets WHERE name = 'broken_secret';
INSERT INTO vault.secrets (name, secret) VALUES ('broken_secret', 'new-value');
```

---

### Issue: "Slow Edge Function performance"

**Symptom:** Edge Function takes 2+ seconds to respond.

**Cause:** Fetching from Vault on every request.

**Solution:** Implement secret caching (see [Caching Secrets](#caching-secrets-performance-optimization)).

---

### Issue: "API key still works after rotation"

**Symptom:** Old API key continues to work after rotation.

**Cause:** Forgot to revoke old key in provider dashboard.

**Solution:**

1. Log into provider (OpenAI, Stripe, etc.)
2. Find API keys section
3. **Revoke** or **Delete** old key
4. Verify new key in Vault is correct
5. Test Edge Function with new key

---

## Related Documentation

- **Security Checklist:** [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) - Pre-launch security audit
- **Environment Variables:** [../../ENVIRONMENT-VARIABLES.md](../../ENVIRONMENT-VARIABLES.md) - Multi-environment configuration
- **Supabase Setup:** [../03-database/SUPABASE-SETUP.md](../03-database/SUPABASE-SETUP.md) - Database configuration
- **Edge Functions:** [Supabase Docs](https://supabase.com/docs/guides/functions) - Deploying Edge Functions

---

## Summary

**Key Takeaways:**

1. **Never store API keys in client code** - Always use Vault
2. **Server-side only** - Edge Functions with secret key
3. **Disable logging before inserting** - Prevent secrets in logs
4. **Rotate every 90 days** - Minimize exposure window
5. **Cache secrets** - Optimize Edge Function performance
6. **Audit regularly** - Monitor API usage for anomalies

**Quick Setup:**

```sql
-- 1. Disable logging
ALTER DATABASE postgres SET log_statement = 'none';

-- 2. Insert secret
INSERT INTO vault.secrets (name, secret)
VALUES ('openai_api_key', 'sk-proj-abc123...');

-- 3. Re-enable logging
ALTER DATABASE postgres SET log_statement = 'all';
```

**Quick Retrieval (Edge Function):**

```typescript
const { data } = await supabaseAdmin
  .from('vault.decrypted_secrets')
  .select('decrypted_secret')
  .eq('name', 'openai_api_key')
  .single()

const apiKey = data.decrypted_secret
```

---

**Questions?** Check [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) or [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault).
