# Supabase Reference Guide

> **Important:** This project was last actively developed 8+ months ago. The database has been massively refactored, and some connections may not be working. Use this guide to understand the current state and test integrations before assuming they work.

---

## Quick Start

```bash
# Check you're logged in
supabase projects list

# Link to dev/stage project
supabase link --project-ref lqmbyobweeaigrwmvizo

# Test database connection
supabase inspect db table-sizes
```

---

## Project Overview

| Environment | Project ID | Region | Dashboard |
|-------------|-----------|--------|-----------|
| **Dev/Stage** | `lqmbyobweeaigrwmvizo` | East US (North Virginia) | [Dashboard](https://supabase.com/dashboard/project/lqmbyobweeaigrwmvizo) |
| **Production** | `vpqglbaedcpeprnlnfxd` | West US (Oregon) | [Dashboard](https://supabase.com/dashboard/project/vpqglbaedcpeprnlnfxd) |

**Base URLs:**
- Dev/Stage: `https://lqmbyobweeaigrwmvizo.supabase.co`
- Production: `https://vpqglbaedcpeprnlnfxd.supabase.co`

---

## Database Schema (65 Tables)

### Real Estate Domain

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `re_properties` | Property listings | `address_line_1`, `city`, `state`, `zip`, `bedrooms`, `bathrooms`, `square_feet`, `arv`, `purchase_price`, `property_type`, `status`, `geo_point` |
| `re_comps` | Comparable sales | `property_id`, `address`, `price`, `sale_date`, `square_feet`, `lot_size`, `distance`, `source` |
| `re_property_analyses` | Deal analysis results | `property_id`, `analysis_type`, `results` |
| `re_repair_estimates` | Repair cost breakdowns | `property_id`, `category`, `description`, `cost`, `is_diy` |
| `re_financing_scenarios` | Financing options | `property_id`, `scenario_name`, `loan_amount`, `interest_rate`, `term_months` |
| `re_property_documents` | Document metadata | `property_id`, `file_name`, `file_path`, `document_type`, `file_size` |
| `re_property_images` | Image references | `property_id`, `image_url`, `is_primary`, `caption` |
| `re_property_debt` | Existing debt info | `property_id`, `debt_type`, `balance`, `monthly_payment` |
| `re_property_mortgages` | Mortgage details | `property_id`, `lender`, `balance`, `rate`, `payment` |
| `re_buying_criteria` | User buying preferences | `user_id`, `min_beds`, `max_price`, `target_markets`, `property_types` |
| `re_lead_properties` | Lead-to-property links | `lead_id`, `property_id`, `relationship`, `is_primary` |
| `re_document_embeddings` | AI vector embeddings | `document_id`, `embedding`, `chunk_text` |
| `re_document_processing_queue` | Doc processing jobs | `document_id`, `status`, `error_message` |

### Lead Management

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `leads` | Main leads table | `name`, `email`, `phone`, `emails[]`, `phones[]`, `company`, `status` (new/active/won/closed), `score`, `tags[]`, `workspace_id`, `is_deleted` |
| `lead_notes` | Notes on leads | `lead_id`, `content`, `created_by` |
| `lead_contacts` | Lead-contact relationships | `lead_id`, `contact_id`, `relationship_type` |

**Lead Status Enum:** `new` | `active` | `won` | `closed`

### User & Auth

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles | `id` (matches auth.users), `email`, `full_name`, `avatar_url`, `role` (admin/standard/user/support), `workspace_id` |
| `user_subscriptions` | Subscription state | `user_id`, `customer_id`, `subscription_id`, `status`, `plan_tier` |
| `user_plans` | Plan tier details | `user_id`, `tier`, `status`, `trial_ends_at`, `monthly_token_cap` |
| `user_mfa` | MFA configuration | `user_id`, `mfa_enabled`, `totp_secret` |
| `mfa_recovery_codes` | Backup MFA codes | `user_id`, `code`, `used_at` |
| `mfa_pending_setup` | In-progress MFA setup | `user_id`, `temp_secret`, `expires_at` |
| `user_notifications` | Notification preferences | `user_id`, `email_enabled`, `push_enabled`, `sms_enabled` |
| `user_retention` | Retention metrics | `user_id`, `last_active`, `session_count` |
| `oauth_tokens` | OAuth integration tokens | `user_id`, `provider`, `access_token`, `refresh_token`, `expires_at` |
| `api_keys` | Encrypted API keys | `service`, `key_ciphertext`, `user_id`, `status`, `last_used` |
| `rate_limits` | API rate limiting | `user_id`, `endpoint`, `request_count`, `window_start` |
| `email_change_history` | Email change audit | `user_id`, `old_email`, `new_email`, `changed_at` |
| `reset_tokens` | Password reset tokens | `user_id`, `token`, `expires_at` |
| `scheduled_deletions` | Account deletion queue | `user_id`, `scheduled_for`, `reason` |

**User Role Enum:** `admin` | `standard` | `user` | `support`

### Messaging & Communication

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `messages` | Message history | `lead_id`, `contact_id`, `content`, `channel` (sms/email/call), `direction` (inbound/outbound), `status`, `sent_at` |
| `calls` | Call records | `lead_id`, `duration_secs`, `recording_url`, `summary` |
| `transcripts` | Call transcripts | `call_id`, `full_text`, `language` |
| `transcript_segments` | Transcript chunks | `transcript_id`, `speaker`, `text`, `start_time`, `end_time` |
| `scheduled_messages` | Queued messages | `lead_id`, `content`, `channel`, `scheduled_for`, `status` |
| `contacts` | Contact records | `first_name`, `last_name`, `email`, `phone`, `emails[]`, `phones[]`, `company`, `sms_opt_status` |
| `email_logs` | Email send history | `recipient`, `subject`, `status`, `sent_at`, `error` |
| `reminder_logs` | Reminder history | `user_id`, `lead_id`, `reminder_type`, `sent_at` |
| `reminder_states` | Reminder state tracking | `user_id`, `reminder_type`, `last_sent`, `snooze_until` |

### Stripe & Billing

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `stripe_customers` | Stripe customer mapping | `user_id`, `stripe_customer_id`, `email` |
| `stripe_products` | Product catalog | `stripe_product_id`, `name`, `description`, `active` |
| `subscription_events` | Subscription event log | `subscription_id`, `event_type`, `data`, `created_at` |
| `subscription_notifications` | Billing alerts | `user_id`, `notification_type`, `message`, `read` |

### Analytics & System

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `analytics_metrics` | Usage metrics | `category`, `metric_name`, `metric_value`, `date` |
| `feature_flags` | Feature toggles | `code`, `description`, `enabled_for_plan[]` |
| `feature_usage_stats` | Feature analytics | `feature_name`, `usage_count`, `unique_users`, `date` |
| `system_logs` | System event logs | `level`, `message`, `context`, `created_at` |
| `system_logs_settings` | Log configuration | `retention_days`, `log_level` |
| `system_settings` | App configuration | `key`, `value`, `description` |
| `usage_logs` | API usage tracking | `user_id`, `endpoint`, `tokens_used`, `created_at` |
| `security_event_logs` | Security audit log | `user_id`, `event_type`, `ip_address`, `details` |
| `api_health_checks` | API health status | `service`, `status`, `latency`, `last_checked` |

### Onboarding & Surveys

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `onboarding_surveys` | Survey responses | `user_id`, `responses`, `completed_at` |
| `onboarding_steps` | Step definitions | `step_name`, `order`, `required` |
| `onboarding_status` | User progress | `user_id`, `current_step`, `completed_steps[]` |
| `survey_analytics` | Survey metrics | `survey_id`, `completion_rate`, `avg_time` |
| `survey_step_views` | Step view tracking | `user_id`, `step_name`, `viewed_at` |
| `survey_interactions` | Interaction tracking | `user_id`, `interaction_type`, `metadata` |

### Workspace

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `workspace` | Workspace config | `id`, `name`, `settings`, `created_at` |
| `workspace_members` | Team membership | `workspace_id`, `user_id`, `role`, `invited_at` |

### Utility Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `assistant_sessions` | AI assistant sessions | `user_id`, `context`, `tokens_used` |
| `email_preferences` | Email opt preferences | `user_id`, `marketing`, `product_updates`, `weekly_digest` |
| `user_import_mappings` | Import column mappings | `user_id`, `mapping_name`, `column_mappings` |
| `spatial_ref_sys` | PostGIS reference | (system table for geographic data) |
| `secure_spatial_ref_sys` | Secure PostGIS view | (RLS-protected spatial reference) |
| `wrappers_fdw_stats` | Foreign data wrapper stats | (system table) |

---

## Edge Functions (37 Total)

### AI & Processing

#### `openai`
OpenAI chat completions proxy with encrypted API key retrieval.

```
POST /functions/v1/openai
Auth: Bearer <user_token>
Content-Type: application/json

Request:
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Hello!" }
  ],
  "model": "gpt-4.1-mini",        // optional, default: gpt-4.1-mini
  "temperature": 0.7,              // optional
  "max_tokens": 500                // optional
}

Response:
{
  "choices": [{ "message": { "content": "Hi there!" } }],
  "pure_text": "Hi there!",        // convenience field
  "usage": { "total_tokens": 25 }
}
```

#### `perplexity-api`
Perplexity AI search integration.

```
POST /functions/v1/perplexity-api
Auth: Bearer <user_token>

Request:
{
  "query": "What are typical repair costs for a 3br house?",
  "model": "sonar-small-chat"     // optional
}

Response:
{
  "answer": "...",
  "sources": [...]
}
```

#### `process-document`
PDF/document text extraction and processing.

```
POST /functions/v1/process-document
Auth: Bearer <user_token>

Request:
{
  "document_id": "uuid",
  "file_path": "userId/propertyId/file.pdf"
}

Response:
{
  "success": true,
  "text": "Extracted document text...",
  "pages": 5
}
```

#### `document-search`
Vector similarity search across processed documents.

```
POST /functions/v1/document-search
Auth: Bearer <user_token>

Request:
{
  "query": "roof inspection results",
  "property_id": "uuid",          // optional filter
  "limit": 10                     // optional
}

Response:
{
  "results": [
    { "document_id": "...", "chunk": "...", "similarity": 0.89 }
  ]
}
```

#### `generate-report`
AI-powered report generation.

```
POST /functions/v1/generate-report
Auth: Bearer <user_token>

Request:
{
  "report_type": "deal_analysis",
  "property_id": "uuid"
}

Response:
{
  "report": "# Deal Analysis Report\n...",
  "generated_at": "2025-01-13T..."
}
```

#### `generate-transcript-summary`
Summarize call transcripts.

```
POST /functions/v1/generate-transcript-summary
Auth: Bearer <user_token>

Request:
{
  "transcript_id": "uuid"
}

Response:
{
  "summary": "Call discussed property at 123 Main St...",
  "key_points": ["...", "..."],
  "action_items": ["..."]
}
```

### Stripe Integration

#### `stripe-api`
Stripe operations proxy. Uses action-based routing.

```
POST /functions/v1/stripe-api
Auth: Bearer <user_token>

Actions:
- createCheckoutSession
- createCustomer
- getSubscription
- cancelSubscription
- listProducts
- createPortalSession
- getCheckoutSession
```

**createCheckoutSession:**
```json
{
  "action": "createCheckoutSession",
  "priceId": "price_xxx",
  "customerId": "cus_xxx",         // optional
  "successUrl": "https://...",
  "cancelUrl": "https://...",
  "options": {
    "allow_promotion_codes": true,
    "trial_from_plan": true
  }
}

Response:
{
  "status": "success",
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

**createCustomer:**
```json
{
  "action": "createCustomer",
  "email": "user@example.com",
  "name": "John Doe",
  "metadata": { "user_id": "..." }
}

Response:
{
  "status": "success",
  "customerId": "cus_xxx",
  "customer": { ... }
}
```

**listProducts:**
```json
{
  "action": "listProducts"
}

Response:
{
  "status": "success",
  "products": [{ "id": "prod_xxx", "name": "Pro Plan", ... }]
}
```

**createPortalSession:**
```json
{
  "action": "createPortalSession",
  "customerId": "cus_xxx",
  "returnUrl": "https://app.doughy.app/settings"
}

Response:
{
  "status": "success",
  "url": "https://billing.stripe.com/..."
}
```

#### `stripe-webhook`
Stripe webhook handler. Receives events from Stripe.

**Handled Events:**
- `checkout.session.completed` - Updates `user_subscriptions`
- `invoice.payment_succeeded` - Marks subscription active
- `invoice.payment_failed` - Marks payment failed
- `customer.subscription.deleted` - Marks subscription canceled

### Lead Operations

#### `import-leads`
Bulk CSV/JSON lead import with property linking.

```
POST /functions/v1/import-leads
Auth: Bearer <user_token>
Content-Type: application/json

Request:
{
  "rows": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email_1": "john@example.com",
      "phone_1": "555-1234",
      "property_address_1": "123 Main St",
      "property_city": "Austin",
      "property_state": "TX",
      "property_zip": "78701"
    }
  ],
  "import_id": "custom-batch-id"   // optional
}

Limits:
- Max 10,000 rows per request
- Max 6MB payload size

Response:
{
  "inserted": 95,
  "failed": [
    { "row_index": 5, "error": "Missing required email or phone" }
  ]
}
```

**Supported Fields:**
- Contact: `first_name`, `last_name`, `email_1-4`, `phone_1-4`, `company`
- Lead Address: `address_line_1`, `address_line_2`, `city`, `state`, `zip`, `county`
- Property: `property_address_1`, `property_city`, `property_state`, `property_zip`, `bedrooms`, `bathrooms`, `square_feet`, `arv`, `purchase_price`

#### `leads-data-import-undo`
Rollback a lead import batch.

```
POST /functions/v1/leads-data-import-undo
Auth: Bearer <user_token>

Request:
{
  "import_id": "batch-uuid"
}

Response:
{
  "deleted_leads": 95,
  "deleted_properties": 80
}
```

#### `recalculate_lead_score`
Recompute lead scores based on activity.

```
POST /functions/v1/recalculate_lead_score
Auth: Bearer <user_token>

Request:
{
  "lead_id": "uuid"                // optional, recalc all if omitted
}

Response:
{
  "updated": 150,
  "scores": [{ "lead_id": "...", "new_score": 85 }]
}
```

### System & Health

#### `health`
Basic health check.

```
GET /functions/v1/health

Response:
{
  "status": "ok",
  "timestamp": "2025-01-13T..."
}
```

#### `health-check`
Extended health check with DB connection test.

```
GET /functions/v1/health-check

Response:
{
  "status": "healthy",
  "database": "connected",
  "latency_ms": 45
}
```

#### `api-health-check`
External API health status.

```
GET /functions/v1/api-health-check

Response:
{
  "services": {
    "openai": { "status": "ok", "latency": 120 },
    "stripe": { "status": "ok", "latency": 85 },
    "resend": { "status": "ok", "latency": 65 }
  }
}
```

#### `integration-health`
All integrations status check.

```
GET /functions/v1/integration-health

Response:
{
  "overall": "healthy",
  "integrations": {
    "openai": "ok",
    "stripe": "ok",
    "perplexity": "ok",
    "resend": "ok"
  }
}
```

#### `database-metrics`
Database performance statistics.

```
GET /functions/v1/database-metrics
Auth: Bearer <admin_token>

Response:
{
  "table_sizes": [...],
  "index_stats": [...],
  "connection_count": 15
}
```

#### `collect-daily-metrics`
Scheduled job to collect daily analytics.

```
POST /functions/v1/collect-daily-metrics
Auth: Service role key (cron job)

Response:
{
  "metrics_collected": 25,
  "date": "2025-01-13"
}
```

#### `get-analytics`
Retrieve analytics data.

```
GET /functions/v1/get-analytics?start=2025-01-01&end=2025-01-13
Auth: Bearer <user_token>

Response:
{
  "metrics": [
    { "date": "2025-01-13", "leads_created": 15, "deals_analyzed": 8 }
  ]
}
```

### Email & Communication

#### `resend-email`
Send transactional emails via Resend.

```
POST /functions/v1/resend-email
Auth: Bearer <user_token>

Request:
{
  "to": "user@example.com",
  "subject": "Your Deal Analysis",
  "html": "<h1>Report Ready</h1>...",
  "template": "deal_report"        // optional, use template instead
}

Response:
{
  "success": true,
  "message_id": "..."
}
```

#### `test-sms`
SMS testing endpoint.

```
POST /functions/v1/test-sms
Auth: Bearer <user_token>

Request:
{
  "to": "+15551234567",
  "message": "Test message"
}

Response:
{
  "success": true,
  "sid": "..."
}
```

### OAuth & Auth

#### `oauth` / `google-oauth`
Initiate OAuth flow.

```
GET /functions/v1/oauth?provider=google&redirect_uri=...

Response: Redirects to provider auth page
```

#### `oauth_callback`
OAuth callback handler.

```
GET /functions/v1/oauth_callback?code=...&state=...

Response: Redirects to app with tokens
```

#### `staging-auth`
Development/staging auth bypass for testing.

```
POST /functions/v1/staging-auth
Auth: None (staging only)

Request:
{
  "email": "dev@example.com"
}

Response:
{
  "access_token": "...",
  "user": { ... }
}
```

### Utilities

#### `convert-geo-point` / `convert-geo-point-simple`
Convert addresses to PostGIS points.

```
POST /functions/v1/convert-geo-point
Auth: Bearer <user_token>

Request:
{
  "address": "123 Main St, Austin, TX 78701"
}

Response:
{
  "lat": 30.2672,
  "lng": -97.7431,
  "geo_point": "POINT(-97.7431 30.2672)"
}
```

#### `openstreetmap-api`
Geocoding via OpenStreetMap.

```
POST /functions/v1/openstreetmap-api
Auth: Bearer <user_token>

Request:
{
  "address": "123 Main St, Austin, TX"
}

Response:
{
  "lat": 30.2672,
  "lng": -97.7431,
  "display_name": "123 Main St, Austin, Travis County, TX, USA"
}
```

#### `set-api-key`
Store an encrypted API key.

```
POST /functions/v1/set-api-key
Auth: Bearer <admin_token>

Request:
{
  "service": "openai",
  "key": "sk-..."
}

Response:
{
  "success": true,
  "service": "openai"
}
```

#### `check-api-keys` / `check-openai-key`
Validate stored API keys.

```
GET /functions/v1/check-api-keys
Auth: Bearer <admin_token>

Response:
{
  "keys": {
    "openai": { "valid": true, "last_checked": "..." },
    "stripe": { "valid": true, "last_checked": "..." }
  }
}
```

#### `get-encryption-key`
Get encryption key for client-side operations.

```
GET /functions/v1/get-encryption-key
Auth: Bearer <user_token>

Response:
{
  "key": "base64-encoded-key"
}
```

#### `map-headers`
Map CSV headers to canonical field names.

```
POST /functions/v1/map-headers
Auth: Bearer <user_token>

Request:
{
  "headers": ["First Name", "Last Name", "Email Address", "Phone Number"]
}

Response:
{
  "mappings": {
    "First Name": "first_name",
    "Last Name": "last_name",
    "Email Address": "email_1",
    "Phone Number": "phone_1"
  }
}
```

#### `create-missing-profiles`
Create profile records for auth users without profiles.

```
POST /functions/v1/create-missing-profiles
Auth: Service role key

Response:
{
  "created": 5,
  "users": ["uuid1", "uuid2", ...]
}
```

#### `clean-orphaned-users`
Remove orphaned auth users without profiles.

```
POST /functions/v1/clean-orphaned-users
Auth: Service role key

Response:
{
  "deleted": 3
}
```

#### `logs-manage`
System log management.

```
POST /functions/v1/logs-manage
Auth: Bearer <admin_token>

Request:
{
  "action": "cleanup",
  "older_than_days": 30
}

Response:
{
  "deleted": 1500
}
```

#### `alert_webhook`
Alert notification handler for monitoring.

```
POST /functions/v1/alert_webhook
Auth: Webhook secret

Request:
{
  "alert_type": "error_spike",
  "message": "Error rate exceeded threshold",
  "severity": "high"
}

Response:
{
  "received": true
}
```

---

## RLS Policies

### Current Status
- Most tables have RLS **enabled** but policies need audit
- Storage bucket policies are **PENDING** (see `docs/supabase-migrations/001_storage_policies.sql`)

### Common Policy Patterns

**User-scoped tables** (e.g., `profiles`, `user_subscriptions`):
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

**Workspace-scoped tables** (e.g., `leads`, `re_properties`):
```sql
-- Users can see data in their workspace
CREATE POLICY "Users can view workspace leads"
ON leads FOR SELECT
USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
```

### Debugging RLS Issues

```sql
-- Check if RLS is blocking (run as service_role in SQL Editor)
SELECT * FROM your_table LIMIT 5;

-- See all policies for a table
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'leads';

-- Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid", "role": "authenticated"}';
SELECT * FROM leads;
```

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://lqmbyobweeaigrwmvizo.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `EXPO_PUBLIC_USE_MOCK_DATA` | Skip database, use mocks | `true` or `false` |

### Environment Files

| File | Purpose |
|------|---------|
| `.env.dev` | Local dev with mock data (`USE_MOCK_DATA=true`) |
| `.env.stage` | Staging database (credentials are placeholders) |
| `.env.prod` | Production database |

```bash
# Switch environments
cp .env.dev .env.local    # Mock data mode
cp .env.stage .env.local  # Staging database
cp .env.prod .env.local   # Production database
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/integrations/supabase/types.ts` | Auto-generated TypeScript types |
| `src/integrations/supabase/domains/*.ts` | Domain-specific type exports |
| `src/lib/mockData/seed.ts` | Mock data for local development |
| `supabase/functions/` | Downloaded edge function source |
| `docs/supabase-migrations/` | Pending migrations |

---

## Quick Commands

```bash
# === CONNECTION ===
# Check login status
supabase projects list

# Link to project
supabase link --project-ref lqmbyobweeaigrwmvizo

# === DATABASE ===
# View table sizes
supabase inspect db table-sizes

# Dump schema
supabase db dump --schema public > schema.sql

# === EDGE FUNCTIONS ===
# List all functions
supabase functions list

# Download a function
supabase functions download openai --project-ref lqmbyobweeaigrwmvizo

# View function logs
supabase functions logs openai --project-ref lqmbyobweeaigrwmvizo

# === TYPES ===
# Regenerate TypeScript types
supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts

# Validate types
npx tsc --noEmit
```

---

## Keep-Alive Solution

Supabase pauses free-tier projects after **7 days of inactivity**. A GitHub Actions workflow pings both projects daily.

**File:** `.github/workflows/supabase-keepalive.yml`

**Required GitHub Secrets:**
| Secret | Value | Where to find |
|--------|-------|---------------|
| `SUPABASE_STAGE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbWJ5b2J3ZWVhaWdyd212aXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODQxMDksImV4cCI6MjA2MDE2MDEwOX0.BH_AE4GPGrUnwRlExMt6vQkX2Dqpzdg1ckn_0w4yii4` | `.env.prod` or Supabase Dashboard → Settings → API |
| `SUPABASE_PROD_ANON_KEY` | Get from Supabase Dashboard | Dashboard → Project vpqglbaedcpeprnlnfxd → Settings → API |

**To add secrets:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret above

**To test manually:**
1. Go to GitHub repo → Actions → Supabase Keep-Alive
2. Click "Run workflow"

---

## Known Issues & TODOs

**Critical (found during health check):**
- [ ] **`api_keys` table is EMPTY** - Edge functions needing OpenAI/Stripe won't work
- [ ] **Production has NO edge functions** - All 37 only deployed to Dev/Stage
- [ ] **`.env.stage` has placeholders** - Not configured with real credentials

**Other:**
- [ ] **8-month hiatus** - Test all integrations before assuming they work
- [ ] **Storage RLS policies** - Not yet applied (`001_storage_policies.sql`)
- [ ] **No migration framework** - Migrations are manual SQL files
- [ ] **Edge functions not in version control** - Only exist in Supabase dashboard
- [ ] **TypeScript errors** - Pre-existing type mismatches in codebase

### Testing Connectivity

```bash
# 1. Check database
supabase inspect db table-sizes

# 2. Test edge function
curl -X GET "https://lqmbyobweeaigrwmvizo.supabase.co/functions/v1/health"

# 3. Test with auth
curl -X POST "https://lqmbyobweeaigrwmvizo.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

*Last updated: January 2025*
*Note: This doc was created after an 8-month development hiatus. Verify all endpoints before use.*
