# Webhook Handlers

Production-ready webhook handlers with signature verification, idempotency, and error handling.

## Available Webhooks

- **Stripe** - Payment and subscription events
- **GitHub** - Repository events (push, PR, issues)

## Security Best Practices

### 1. Signature Verification

**Always verify webhook signatures** to prevent unauthorized requests.

#### Stripe Signature Verification

```typescript
const signature = req.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
// This throws if signature is invalid
```

#### GitHub Signature Verification

```typescript
const signature = req.headers.get('x-hub-signature-256');
const isValid = await verifyGitHubSignature(body, signature, webhookSecret);
if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}
```

### 2. Idempotency

**Prevent duplicate event processing** by tracking event IDs.

```sql
-- Check if event already processed
SELECT id FROM stripe_events WHERE event_id = 'evt_xxx';

-- If found, skip processing
-- If not found, process and insert
INSERT INTO stripe_events (event_id, type, data) VALUES (...);
```

### 3. Store Secrets in Vault

**Never hardcode webhook secrets** in code or environment variables.

```sql
-- Store webhook secrets in Vault
INSERT INTO vault.secrets (name, secret, description)
VALUES
  ('stripe_webhook_secret', 'whsec_xxx...', 'Stripe webhook secret'),
  ('github_webhook_secret', 'ghp_xxx...', 'GitHub webhook secret');
```

### 4. Rate Limiting

Protect against webhook flooding:

```typescript
// Check rate limit before processing
const recentEvents = await supabase
  .from('stripe_events')
  .select('*', { count: 'exact' })
  .gte('created_at', new Date(Date.now() - 60000).toISOString());

if (recentEvents.count! > 100) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### 5. IP Whitelisting (Optional)

For extra security, verify requests come from known IPs:

```typescript
// Stripe IPs: https://stripe.com/docs/ips
const STRIPE_IPS = [
  '3.18.12.63',
  '3.130.192.231',
  // ... add all Stripe webhook IPs
];

const clientIp = req.headers.get('x-forwarded-for');
if (!STRIPE_IPS.includes(clientIp)) {
  return new Response('Unauthorized IP', { status: 403 });
}
```

## Setup

### 1. Create Database Tables

```sql
-- Stripe events table
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub webhooks table
CREATE TABLE github_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub commits table
CREATE TABLE github_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_sha TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  repository TEXT NOT NULL,
  branch TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub pull requests table
CREATE TABLE github_pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id BIGINT UNIQUE NOT NULL,
  pr_number INT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  repository TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  merged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub issues table
CREATE TABLE github_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number INT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  repository TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repository, issue_number)
);

-- Indexes
CREATE INDEX idx_stripe_events_type ON stripe_events(type, created_at DESC);
CREATE INDEX idx_github_webhooks_type ON github_webhooks(event_type, created_at DESC);
CREATE INDEX idx_github_commits_repo ON github_commits(repository, created_at DESC);
CREATE INDEX idx_github_prs_repo ON github_pull_requests(repository, updated_at DESC);
CREATE INDEX idx_github_issues_repo ON github_issues(repository, updated_at DESC);
```

### 2. Store Webhook Secrets in Vault

```sql
-- Disable logging
ALTER DATABASE postgres SET log_statement = 'none';

-- Store secrets
INSERT INTO vault.secrets (name, secret, description) VALUES
  ('stripe_secret_key', 'sk_live_xxx', 'Stripe API key'),
  ('stripe_webhook_secret', 'whsec_xxx', 'Stripe webhook signing secret'),
  ('github_webhook_secret', 'your-github-secret', 'GitHub webhook secret');

-- Re-enable logging
ALTER DATABASE postgres SET log_statement = 'all';
```

### 3. Deploy Edge Functions

```bash
# Deploy Stripe webhook
supabase functions deploy stripe-webhook

# Deploy GitHub webhook
supabase functions deploy github-webhook
```

### 4. Configure Webhooks

#### Stripe Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and store in Vault

#### GitHub Configuration

1. Go to GitHub Repository → Settings → Webhooks
2. Click "Add webhook"
3. Payload URL: `https://your-project.supabase.co/functions/v1/github-webhook`
4. Content type: `application/json`
5. Secret: Generate a random secret and store in Vault
6. Select events:
   - Push events
   - Pull requests
   - Issues
7. Ensure "Active" is checked

## Testing Webhooks

### Local Testing

#### Test Stripe Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Edge Function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

#### Test GitHub Webhooks Locally

```bash
# Use ngrok to expose local server
ngrok http 54321

# Configure webhook URL in GitHub:
# https://xxxxx.ngrok.io/functions/v1/github-webhook

# Or use GitHub CLI to forward webhooks
gh webhook forward --repo=owner/repo --events=push,pull_request,issues \
  --url=http://localhost:54321/functions/v1/github-webhook
```

### Manual Testing with curl

#### Test Stripe Webhook

```bash
# Get webhook secret from Vault
WEBHOOK_SECRET="whsec_xxx"

# Create test payload
PAYLOAD='{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_xxx"}}}'

# Generate signature (requires openssl)
TIMESTAMP=$(date +%s)
SIGNATURE=$(echo -n "$TIMESTAMP.$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')

# Send request
curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=$TIMESTAMP,v1=$SIGNATURE" \
  -d "$PAYLOAD"
```

## Monitoring

### View Webhook Activity

```sql
-- Recent Stripe events
SELECT
  event_id,
  type,
  processed,
  created_at
FROM stripe_events
ORDER BY created_at DESC
LIMIT 50;

-- Recent GitHub webhooks
SELECT
  delivery_id,
  event_type,
  processed,
  created_at
FROM github_webhooks
ORDER BY created_at DESC
LIMIT 50;

-- Unprocessed events
SELECT * FROM stripe_events WHERE processed = false;
SELECT * FROM github_webhooks WHERE processed = false;
```

### Error Monitoring

```sql
-- Events that took too long to process
SELECT
  event_id,
  type,
  created_at,
  processed_at,
  EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_seconds
FROM stripe_events
WHERE processed = true
  AND processed_at - created_at > INTERVAL '10 seconds'
ORDER BY processing_seconds DESC;
```

### Retry Failed Events

```typescript
// supabase/functions/retry-webhooks/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!
  );

  // Get unprocessed events older than 5 minutes
  const { data: failed } = await supabase
    .from('stripe_events')
    .select('*')
    .eq('processed', false)
    .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(10);

  if (!failed || failed.length === 0) {
    return new Response(JSON.stringify({ retried: 0 }));
  }

  let retried = 0;
  for (const event of failed) {
    try {
      // Re-process event
      await processStripeEvent(supabase, event.data);

      await supabase
        .from('stripe_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('event_id', event.event_id);

      retried++;
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }

  return new Response(JSON.stringify({ retried }));
});
```

## Common Issues

### "Invalid signature" error

**Stripe:**
- Verify webhook secret is correct in Vault
- Ensure you're using raw request body (not parsed JSON)
- Check that secret matches environment (test vs live)

**GitHub:**
- Verify webhook secret matches GitHub configuration
- Use SHA-256 algorithm (not SHA-1)
- Ensure constant-time comparison to prevent timing attacks

### Duplicate events

Events should be deduplicated automatically by checking event IDs. If duplicates persist:

```sql
-- Find duplicate events
SELECT event_id, COUNT(*)
FROM stripe_events
GROUP BY event_id
HAVING COUNT(*) > 1;

-- Clean up duplicates (keep first occurrence)
DELETE FROM stripe_events
WHERE id NOT IN (
  SELECT MIN(id)
  FROM stripe_events
  GROUP BY event_id
);
```

### Webhook timeouts

Stripe/GitHub expect responses within 5-10 seconds. If processing takes longer:

1. Return 200 immediately
2. Process asynchronously

```typescript
// Return success immediately
const response = new Response(JSON.stringify({ received: true }));

// Process asynchronously (don't await)
processEventAsync(supabase, event).catch(console.error);

return response;
```

### Missing events

Check webhook configuration in Stripe/GitHub dashboard. Ensure:
- Webhook endpoint URL is correct
- Required events are selected
- Webhook is active
- No IP restrictions blocking requests

## Security Checklist

- [ ] Webhook secrets stored in Vault (never in code)
- [ ] Signature verification implemented
- [ ] Idempotency checks prevent duplicates
- [ ] Rate limiting protects against floods
- [ ] Events logged for auditing
- [ ] Errors handled gracefully
- [ ] Processing times monitored
- [ ] Failed events retry automatically
- [ ] Sensitive data not logged
- [ ] HTTPS only (never HTTP)

## Related Documentation

- [API Key Management](../../../docs/09-security/API-KEY-MANAGEMENT.md)
- [Stripe Web Billing](../../../docs/08-payments/STRIPE-WEB-BILLING.md)
- [Security Checklist](../../../docs/09-security/SECURITY-CHECKLIST.md)

## External Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
