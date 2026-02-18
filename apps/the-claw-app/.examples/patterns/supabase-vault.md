# Supabase Vault Pattern

How to store and retrieve API keys securely using Supabase Vault with `pgsodium` encryption.

## Overview

**Never store API keys in client code or environment variables.** Use Supabase Vault for encrypted server-side storage.

## Quick Start

### 1. Store Secret in Vault

```sql
-- Disable logging first (CRITICAL)
ALTER DATABASE postgres SET log_statement = 'none';

-- Store API key
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'openai_api_key',
  'sk-proj-your-actual-key-here',
  'OpenAI API key for AI features'
);

-- Re-enable logging
ALTER DATABASE postgres SET log_statement = 'all';
```

### 2. Retrieve Secret in Edge Function

```typescript
// supabase/functions/ai-chat/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Create admin client (service_role key)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Retrieve decrypted secret
  const { data, error } = await supabaseAdmin
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', 'openai_api_key')
    .single()

  if (error) throw error

  const apiKey = data.decrypted_secret

  // Use API key
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
    }),
  })

  return new Response(JSON.stringify(await response.json()))
})
```

### 3. Call Edge Function from Client

```typescript
// Client-side (React Native app)
import { supabase } from '@/services/supabase'

async function getChatResponse(message: string) {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  )

  return response.json()
}
```

## Complete Example

See [docs/09-security/API-KEY-MANAGEMENT.md](../../docs/09-security/API-KEY-MANAGEMENT.md) for comprehensive guide including:
- Setup instructions
- Key rotation strategy
- Access control
- Troubleshooting
- Best practices

## Key Points

✅ **DO:**
- Store ALL sensitive API keys in Vault
- Use service_role key ONLY in Edge Functions
- Disable logging before inserting secrets
- Rotate keys every 90 days

❌ **DON'T:**
- Never store secrets in `.env` files
- Never use anon key to access Vault
- Never expose service_role key to client
- Never log API keys
