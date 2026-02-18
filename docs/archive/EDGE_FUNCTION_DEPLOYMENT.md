# Edge Function Deployment & Testing Guide

This guide covers deploying and testing all Zone A edge functions.

---

## Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

---

## Deploying Edge Functions

### Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy integration-health
supabase functions deploy stripe-api
supabase functions deploy openai
supabase functions deploy sms-webhook
supabase functions deploy scheduled-reminders
```

### Verify Deployment

```bash
# List deployed functions
supabase functions list
```

---

## Testing Edge Functions

### 1. Integration Health Function

**Test OpenAI Integration Health**:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/integration-health' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai"}'
```

**Expected Response**:
```json
{
  "success": true,
  "service": "openai",
  "status": "healthy",
  "last_checked": "2026-01-15T10:30:00Z",
  "metadata": {
    "response_time_ms": 150
  }
}
```

**Test Stripe Integration Health**:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/integration-health' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"service": "stripe"}'
```

### 2. SMS Webhook Function

**Simulate Twilio Webhook**:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/sms-webhook' \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B15555551234" \
  -d "Body=Hi, I have a 3/2 house at 123 Main St for sale. Needs some work. Asking 150k. Call me at 555-1234 - John Doe" \
  -d "MessageSid=SM12345678901234567890123456789012"
```

**Expected Response** (TwiML):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks! We received your property details and will review them shortly. Someone from our team will reach out soon.</Message>
</Response>
```

**Verify SMS was stored**:
```sql
SELECT * FROM sms_inbox ORDER BY created_at DESC LIMIT 1;
```

**Check AI extraction results** (wait 5-10 seconds):
```sql
SELECT
  phone_number,
  message_body,
  status,
  parsed_data
FROM sms_inbox
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Scheduled Reminders Function

**Manual Trigger** (for testing, normally runs on cron):
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-reminders' \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "count": 3,
  "users": 2,
  "push": {
    "sent": 2,
    "failed": 0
  },
  "in_app": 3,
  "notifications": [
    {
      "user_id": "uuid-1",
      "deal_count": 2,
      "push_sent": true,
      "notification_created": true,
      "deals": [...]
    }
  ]
}
```

**Verify notifications created**:
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

### 4. OpenAI Function

**Test Chat Completion**:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/openai' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a professional email template for a real estate cold call follow-up"}
    ],
    "model": "gpt-4o",
    "temperature": 0.7
  }'
```

**Expected Response**:
```json
{
  "id": "chatcmpl-...",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Subject: Following Up on Our Conversation About [Property Address]..."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

### 5. Stripe API Function

**Test Create Checkout Session**:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-api' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_checkout_session",
    "priceId": "price_1234567890",
    "successUrl": "https://app.doughy.ai/success",
    "cancelUrl": "https://app.doughy.ai/cancel"
  }'
```

**Test Create Customer Portal Session**:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-api' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_customer_portal_session",
    "returnUrl": "https://app.doughy.ai/settings"
  }'
```

---

## Setting Up Cron Job

The `scheduled-reminders` function should run daily at 8am.

### Configure in Supabase Dashboard

1. Go to **Database** → **Cron Jobs** (or use pg_cron extension)
2. Create new cron job:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 8am UTC
SELECT cron.schedule(
  'daily-deal-reminders',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.secret_key')
      )
    );
  $$
);
```

### Verify Cron Job

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check cron job execution history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Test Cron Job Manually

```sql
-- Trigger the job immediately (for testing)
SELECT cron.schedule(
  'test-reminders-now',
  '* * * * *',  -- Every minute
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.secret_key')
      )
    );
  $$
);

-- Wait 1 minute, then check notifications table
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Unschedule test job
SELECT cron.unschedule('test-reminders-now');
```

---

## Environment Variables

Ensure these environment variables are set in Supabase Dashboard → Settings → Edge Functions:

### Required for All Functions
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `ENVIRONMENT` (set to 'production' in prod)

### For Integration Health & OpenAI Functions
- OpenAI API key stored in `api_keys` table (encrypted)

### For Stripe Function
- Stripe API key stored in `api_keys` table (encrypted)

### For SMS Webhook Function
- OpenAI API key stored in `api_keys` table (encrypted)

---

## Monitoring & Logs

### View Function Logs

```bash
# View logs for specific function
supabase functions logs integration-health

# Follow logs in real-time
supabase functions logs scheduled-reminders --follow

# Filter by level
supabase functions logs sms-webhook --level error
```

### Query System Logs

```sql
-- Check recent function executions
SELECT
  level,
  source,
  message,
  details,
  created_at
FROM system_logs
WHERE source LIKE '%scheduled-reminders%'
ORDER BY created_at DESC
LIMIT 20;

-- Check integration health results
SELECT
  service,
  status,
  last_checked,
  metadata
FROM api_keys
WHERE service IN ('openai', 'stripe', 'twilio')
ORDER BY last_checked DESC;
```

---

## Troubleshooting

### Function Returns 401 Unauthorized

**Issue**: Missing or invalid API key

**Fix**: Ensure `Authorization: Bearer YOUR_ANON_KEY` header is included

### Function Returns CORS Error

**Issue**: Origin not allowed

**Fix**:
1. Check `ENVIRONMENT` variable is set correctly
2. For development, ensure your origin matches allowed origins in `cors-standardized.ts`
3. For production, ensure your production domain is in allowed origins

### SMS Webhook Not Processing

**Issue**: AI extraction failing

**Fix**:
1. Check OpenAI API key is stored in `api_keys` table
2. Verify encryption key is set in environment
3. Check function logs: `supabase functions logs sms-webhook`

### Scheduled Reminders Not Sending

**Issue**: Cron job not executing

**Fix**:
1. Verify cron job is scheduled: `SELECT * FROM cron.job;`
2. Check execution history: `SELECT * FROM cron.job_run_details;`
3. Ensure users have `expo_push_token` set in profiles table
4. Check function logs for errors

### Stripe Webhooks Failing

**Issue**: Webhook signature validation

**Fix**:
1. Ensure Stripe webhook secret is configured
2. Verify webhook endpoint URL in Stripe dashboard
3. Check Stripe API key is valid

---

## Next Steps

After deployment and testing:

1. **Set up monitoring alerts** in Supabase dashboard
2. **Configure webhook endpoints** in third-party services:
   - Twilio: Point SMS webhook to `sms-webhook` function
   - Stripe: Point webhook to `stripe-api` function
3. **Test end-to-end flows** with real data
4. **Monitor system_logs** for any errors
5. **Review integration health** regularly

---

## Security Checklist

Before going to production:

- [ ] `ENVIRONMENT=production` set in edge functions
- [ ] All API keys encrypted in `api_keys` table
- [ ] Secret key NOT exposed in client code
- [ ] CORS origins restricted to production domains
- [ ] RLS policies enabled on all tables
- [ ] Webhook signature validation enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up
