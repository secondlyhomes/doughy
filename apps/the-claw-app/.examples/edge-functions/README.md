# Supabase Edge Functions Examples

Production-ready Edge Function examples using Deno and Supabase Edge Runtime.

## What are Edge Functions?

Edge Functions are server-side TypeScript functions deployed globally at the edge, running close to your users for low latency. They're perfect for:

- **AI API calls** - Keep API keys secure, add rate limiting
- **Webhooks** - Handle third-party service events
- **Push notifications** - Send notifications via Expo Push Service
- **Background jobs** - Process data, send emails, generate reports
- **Authentication** - Custom auth flows, OAuth callbacks
- **Payment processing** - Handle Stripe webhooks

## Available Examples

### 1. AI Chat (`ai-chat/`)

OpenAI/Anthropic chat completions with streaming, cost optimization, and rate limiting.

**Features:**
- Streaming responses
- Automatic model selection
- Rate limiting (10/min, 300/day)
- Usage tracking
- Secure API key storage via Vault

[View AI Chat Documentation →](./ai-chat/README.md)

### 2. Push Notifications (`notifications/`)

Send push notifications via Expo Push Service with batch sending and scheduling.

**Features:**
- Single & batch notifications
- Scheduled notifications
- Platform-specific options (iOS/Android)
- Receipt tracking
- Logging

[View Notifications Documentation →](./notifications/README.md)

### 3. Webhooks (`webhooks/`)

Stripe and GitHub webhook handlers with signature verification and idempotency.

**Features:**
- Signature verification
- Duplicate event prevention
- Error handling
- Event logging
- Retry logic

[View Webhooks Documentation →](./webhooks/README.md)

## Quick Start

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Supabase project created
- Docker Desktop running (for local development)

### 1. Initialize Supabase

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Pull existing database schema (if any)
supabase db pull
```

### 2. Deploy an Edge Function

```bash
# Deploy ai-chat function
supabase functions deploy ai-chat

# Deploy with environment variables
supabase secrets set MY_SECRET=value
supabase functions deploy ai-chat
```

### 3. Test Locally

```bash
# Start local Supabase (includes Edge Functions runtime)
supabase start

# Serve specific function
supabase functions serve ai-chat

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

## Project Structure

```
.examples/edge-functions/
├── ai-chat/
│   ├── index.ts          # Main function code
│   └── README.md         # Setup and usage guide
├── notifications/
│   ├── index.ts
│   └── README.md
├── webhooks/
│   ├── stripe.ts         # Stripe webhook handler
│   ├── github.ts         # GitHub webhook handler
│   └── README.md
└── README.md             # This file
```

When deploying to production, copy files to `supabase/functions/`:

```bash
# Copy example to your supabase/functions directory
cp -r .examples/edge-functions/ai-chat supabase/functions/

# Deploy
supabase functions deploy ai-chat
```

## Environment Variables

Edge Functions have automatic access to:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SECRET_KEY` - Admin key (server-side only)

### Setting Secrets

For sensitive values, use Supabase secrets:

```bash
# Set a secret
supabase secrets set OPENAI_API_KEY=sk-xxx

# List secrets
supabase secrets list

# Unset a secret
supabase secrets unset OPENAI_API_KEY
```

**Best Practice:** Use [Supabase Vault](../../docs/09-security/API-KEY-MANAGEMENT.md) for API keys instead of environment variables. Vault provides:
- Encrypted storage
- Key rotation
- Audit trails
- Client-side protection

## Local Development

### Start Supabase Locally

```bash
# Start all Supabase services (Postgres, Auth, Storage, Edge Functions)
supabase start

# Your local services will be available at:
# - API: http://localhost:54321
# - Studio: http://localhost:54323
# - Edge Functions: http://localhost:54321/functions/v1/
```

### Serve Function in Watch Mode

```bash
# Auto-reload on file changes
supabase functions serve ai-chat --no-verify-jwt

# With environment file
supabase functions serve ai-chat --env-file .env.local
```

### Debug Locally

```typescript
// Use console.log for debugging
console.log('Processing request:', req.method);
console.error('Error occurred:', error);

// Logs appear in terminal where `supabase functions serve` is running
```

## Deployment

### Deploy Single Function

```bash
# Deploy to production
supabase functions deploy ai-chat

# Deploy to staging
supabase functions deploy ai-chat --project-ref staging-project-ref
```

### Deploy All Functions

```bash
# Deploy all functions in supabase/functions/
supabase functions deploy
```

### Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test deployed function
curl https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"test": true}'
```

## Calling Edge Functions

### From React Native App

```typescript
// src/services/edgeFunctions.ts
import { supabase } from './supabase';

export async function callAiChat(messages: any[]) {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { messages },
  });

  if (error) throw error;
  return data;
}

// Usage in component
import { callAiChat } from '@/services/edgeFunctions';

async function handleSend(message: string) {
  try {
    const response = await callAiChat([
      { role: 'user', content: message }
    ]);
    console.log(response);
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

### From Web App

```typescript
// Using fetch
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/ai-chat',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  }
);

const data = await response.json();
```

### From Another Edge Function

```typescript
// supabase/functions/orchestrator/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SECRET_KEY')!
);

// Call another Edge Function
const { data, error } = await supabase.functions.invoke('ai-chat', {
  body: { messages: [...] },
});
```

## Security Best Practices

### 1. Authentication

Always verify user authentication:

```typescript
// Get user from auth header
const authHeader = req.headers.get('authorization');
const supabase = createClient(url, serviceKey, {
  global: { headers: { Authorization: authHeader } },
});

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 2. Use Vault for Secrets

Never hardcode API keys:

```typescript
// ❌ Bad
const apiKey = 'sk-proj-xxx'; // Exposed in code

// ❌ Bad
const apiKey = Deno.env.get('OPENAI_API_KEY'); // Can be leaked via logs

// ✅ Good
const { data } = await supabase
  .from('vault.decrypted_secrets')
  .select('decrypted_secret')
  .eq('name', 'openai_api_key')
  .single();
const apiKey = data.decrypted_secret;
```

### 3. Input Validation

Always validate and sanitize input:

```typescript
// Validate request body
if (!body.messages || !Array.isArray(body.messages)) {
  return new Response('Invalid input', { status: 400 });
}

// Check length limits
if (body.text.length > 10000) {
  return new Response('Input too long', { status: 400 });
}

// Sanitize input
const sanitized = body.text
  .slice(0, 10000)
  .replace(/<script>/g, '')
  .trim();
```

### 4. Rate Limiting

Prevent abuse with rate limiting:

```typescript
// Check rate limit
const { count } = await supabase
  .from('api_usage')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', new Date(Date.now() - 60000).toISOString());

if (count! >= 10) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### 5. Error Handling

Never expose internal errors to clients:

```typescript
try {
  // Your code
} catch (error) {
  // Log full error server-side
  console.error('Internal error:', error);

  // Return generic error to client
  return new Response(
    JSON.stringify({ error: 'Processing failed' }),
    { status: 500 }
  );
}
```

## Performance Optimization

### 1. Cache Frequently Accessed Data

```typescript
// Cache Vault secrets in memory
let cachedSecrets: Record<string, string> = {};

async function getSecret(name: string): Promise<string> {
  if (cachedSecrets[name]) {
    return cachedSecrets[name];
  }

  const { data } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', name)
    .single();

  cachedSecrets[name] = data.decrypted_secret;
  return cachedSecrets[name];
}
```

### 2. Use Connection Pooling

```typescript
// Reuse Supabase client
const supabase = createClient(url, key);

// Don't create new client on every request
// ❌ Bad
Deno.serve(async (req) => {
  const supabase = createClient(url, key); // Creates new connection
});

// ✅ Good
const supabase = createClient(url, key); // Reused across requests
Deno.serve(async (req) => {
  // Use existing supabase client
});
```

### 3. Parallel Requests

Use `Promise.all()` for independent operations:

```typescript
// ❌ Slow (sequential)
const user = await supabase.auth.getUser();
const profile = await supabase.from('profiles').select().single();
const settings = await supabase.from('settings').select().single();

// ✅ Fast (parallel)
const [userResult, profileResult, settingsResult] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from('profiles').select().single(),
  supabase.from('settings').select().single(),
]);
```

## Monitoring & Debugging

### View Function Logs

```bash
# Stream logs in real-time
supabase functions logs ai-chat --tail

# View last 100 log entries
supabase functions logs ai-chat --limit 100
```

### Track Performance

```sql
-- Create performance tracking table
CREATE TABLE function_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  user_id UUID,
  duration_ms INT NOT NULL,
  status_code INT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- View average performance
SELECT
  function_name,
  AVG(duration_ms) as avg_ms,
  COUNT(*) as requests,
  COUNT(*) FILTER (WHERE status_code >= 400) as errors
FROM function_performance
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY function_name;
```

## Common Issues

### "Import map not found"

Ensure you're using HTTPS URLs for imports:

```typescript
// ❌ Won't work (deprecated)
import { serve } from 'std/http/server.ts';

// ✅ Works (modern - Deno.serve is built-in)
// No import needed - use Deno.serve() directly
```

### "Module not found"

Use versioned imports with `esm.sh` for npm packages:

```typescript
// ✅ Correct format
import Stripe from 'https://esm.sh/stripe@14.17.0?target=deno';
```

### "Timeout after 150 seconds"

Edge Functions timeout after 150 seconds. For long-running tasks:

1. Return response immediately
2. Process asynchronously
3. Use scheduled functions or webhooks

### "Cannot find environment variable"

Check secrets are set:

```bash
# List all secrets
supabase secrets list

# Set missing secret
supabase secrets set MY_SECRET=value
```

## Testing

### Unit Tests

```typescript
// tests/ai-chat.test.ts
import { assertEquals } from 'jsr:@std/assert';

Deno.test('selectModel returns correct model', () => {
  const result = selectModel('short query');
  assertEquals(result, 'gpt-4o-mini');
});
```

Run tests:

```bash
deno test tests/
```

### Integration Tests

```bash
# Test against local Edge Function
curl -X POST http://localhost:54321/functions/v1/ai-chat \
  -H "Authorization: Bearer $(supabase status -o json | jq -r .anon_key)" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Deno Deploy](https://deno.com/deploy)
- [Example Functions Repository](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

## Getting Help

- [Supabase Discord](https://discord.supabase.com/)
- [Supabase GitHub Discussions](https://github.com/orgs/supabase/discussions)
- [Stack Overflow - supabase tag](https://stackoverflow.com/questions/tagged/supabase)

## Related Documentation

- [API Key Management](../../docs/09-security/API-KEY-MANAGEMENT.md) - Secure secret storage
- [AI API Call Pattern](../../docs/patterns/AI-API-CALL.md) - AI integration best practices
- [Security Checklist](../../docs/09-security/SECURITY-CHECKLIST.md) - Pre-launch security audit
- [Push Notifications](../../docs/06-native-features/PUSH-NOTIFICATIONS.md) - Mobile push setup
- [Stripe Web Billing](../../docs/08-payments/STRIPE-WEB-BILLING.md) - Payment webhooks
