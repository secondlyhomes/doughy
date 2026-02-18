# Edge Functions

> Last verified: 2026-02-16 by querying Supabase staging (`lqmbyobweeaigrwmvizo`) via MCP `list_edge_functions`.
> 62 functions deployed, all ACTIVE status.

## Summary

| Category | Count | Status |
|----------|-------|--------|
| AI & Intelligence | 9 | Production-quality |
| SMS & Communications | 7 | Production-quality |
| Drip Campaigns | 3 | Production-quality |
| Email / Gmail | 5 | Production-quality |
| Investor Pipeline | 3 | Production-quality |
| Leads & Data Import | 3 | Production-quality |
| Documents & Search | 3 | Production-quality |
| Property & Location | 5 | Production-quality |
| Billing & Stripe | 3 | Production-quality |
| Auth & Security | 7 | Production-quality |
| System & Analytics | 8 | Production-quality |
| Rental Operations | 2 | Production-quality |
| Transcription | 1 | Production-quality |
| Legacy / Utility | 3 | Mixed |
| **Total** | **62** | |

**JWT verification:** 58/62 require JWT. 4 do not: `api-health-check`, `openstreetmap-api`, `document-search`, `gmail-oauth-callback`, `google-calendar`.

---

## AI & Intelligence (9 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `ai-responder` | v8 | Yes | Generate AI responses for guest/lead messages using Claude |
| `moltbot-bridge` | v7 | Yes | **Legacy name.** Gmail webhook → AI pipeline bridge. Routes actions to Supabase |
| `openclaw-bridge` | v1 | Yes | **Replacement for moltbot-bridge.** Same functionality, new naming |
| `openai` | v50 | Yes | OpenAI API proxy (GPT-4 for property analysis, deal evaluation) |
| `perplexity-api` | v42 | Yes | Perplexity search API proxy (real-time market data) |
| `memory-manager` | v9 | Yes | Manage AI user memories (CRUD on openclaw_user_memories) |
| `lead-scorer` | v7 | Yes | Score leads based on engagement, demographics, behavior |
| `investor-scorer` | v7 | Yes | Score investment deals based on financials, market data |
| `recalculate_lead_score` | v49 | Yes | Batch recalculate scores across all leads |

**Notes:**
- `moltbot-bridge` should be deprecated in favor of `openclaw-bridge` (v1, just deployed)
- `openai` is the most-updated function (v50) — heavily iterated
- `perplexity-api` used for real-time market comps and property research

---

## SMS & Communications (7 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `twilio-sms` | v8 | Yes | Send SMS via Twilio REST API. Supports encrypted credentials per user |
| `sms-webhook` | v8 | Yes | Receive inbound SMS via Twilio webhook |
| `test-sms` | v29 | Yes | Development SMS testing utility |
| `resend-email` | v34 | Yes | Send transactional emails via Resend API |
| `notification-push` | v7 | Yes | Push notifications via Expo Push API |
| `lead-response-sender` | v5 | Yes | Deliver AI-approved responses to leads (SMS/email) |
| `direct-mail-sender` | v8 | Yes | Send physical mail via Postgrid API |

**Notes:**
- `twilio-sms` is called by openclaw-server for Claw SMS and by the mobile app for investor outreach
- `notification-push` is used by The Claw for approval notifications
- `direct-mail-sender` handles Postgrid postcards, yellow letters, letters

---

## Drip Campaigns (3 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `drip-campaign-processor` | v8 | Yes | Scheduled processor: advance enrollments, queue next touches |
| `drip-campaign-enroll` | v6 | Yes | Enroll contacts into drip campaigns |
| `drip-touch-executor` | v10 | Yes | Execute individual touches (SMS, email, direct mail, Meta DM) |

**Notes:**
- These three form the complete drip campaign pipeline
- `drip-touch-executor` calls `twilio-sms`, `resend-email`, `direct-mail-sender`, or `meta-dm-sender` based on channel

---

## Email / Gmail (5 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `gmail-oauth-callback` | v6 | No | Handle Google OAuth2 callback for Gmail integration |
| `gmail-sync` | v5 | Yes | Sync Gmail inbox (incremental via history_id) |
| `gmail-disconnect` | v5 | Yes | Revoke Gmail tokens and disconnect |
| `platform-email-parser` | v9 | Yes | Parse platform emails (Airbnb, FurnishedFinder, Zillow, etc.) into structured data |
| `google-calendar` | v1 | No | Google Calendar integration (newly deployed) |

**Notes:**
- `platform-email-parser` is key for landlord inbox — auto-detects booking platforms and extracts guest info
- `google-calendar` is brand new (v1), may need testing

---

## Investor Pipeline (3 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `investor-bridge` | v7 | Yes | Bridge between investor mobile app and AI pipeline |
| `investor-outreach` | v7 | Yes | Automated investor lead outreach |
| `meta-dm-sender` | v9 | Yes | Send Facebook/Instagram DMs via Meta Graph API |

---

## Leads & Data Import (3 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `import-leads` | v46 | Yes | CSV lead import with column mapping |
| `leads-data-import` | v16 | Yes | Bulk lead data import (alternative format) |
| `leads-data-import-undo` | v17 | Yes | Reverse a lead import by import_id |

**Notes:**
- `import-leads` is the primary import function (v46, heavily iterated)
- Undo capability prevents data mistakes from being permanent

---

## Documents & Search (3 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `process-document` | v31 | Yes | Process uploaded documents (text extraction, chunking, embedding) |
| `document-search` | v23 | No | Vector similarity search across document embeddings |
| `generate-report` | v22 | Yes | Generate AI reports (deal analysis, property evaluation) |

**Notes:**
- `process-document` feeds into `investor.document_embeddings` for RAG
- `document-search` is one of the few functions without JWT requirement (used by AI backend)

---

## Property & Location (5 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `availability-check` | v7 | Yes | Check property/room availability for date range |
| `seam-locks` | v7 | Yes | Smart lock management via Seam API (lock/unlock, codes) |
| `convert-geo-point` | v24 | Yes | Geocode address to PostGIS geography point |
| `convert-geo-point-simple` | v18 | Yes | Simplified geocoding (no PostGIS dependency) |
| `openstreetmap-api` | v27 | No | OpenStreetMap/Nominatim geocoding proxy |

---

## Property Data (1 function)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `zillow-api` | v8 | Yes | Zillow property data proxy (valuations, comps) |

---

## Billing & Stripe (3 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `stripe-api` | v33 | Yes | Stripe API proxy (create checkout, manage subscriptions) |
| `stripe-webhook` | v26 | Yes | Handle Stripe webhook events (payment, subscription changes) |
| `purchase-mail-credits` | v8 | Yes | Purchase direct mail credits via Stripe |

---

## Auth & Security (7 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `google-oauth` | v24 | Yes | Initiate Google OAuth2 flow |
| `oauth` | v19 | Yes | Generic OAuth initiation |
| `oauth_callback` | v33 | Yes | Generic OAuth callback handler |
| `staging-auth` | v17 | Yes | Staging environment auth helper |
| `set-api-key` | v24 | Yes | Securely store encrypted API keys |
| `check-api-keys` | v12 | Yes | Validate stored API keys |
| `check-openai-key` | v13 | Yes | Validate OpenAI API key specifically |
| `get-encryption-key` | v13 | Yes | Retrieve encryption key for client-side operations |

---

## System & Analytics (8 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `health` | v30 | Yes | System health check (DB connectivity, service status) |
| `health-check` | v27 | Yes | Additional health check endpoint |
| `api-health-check` | v28 | No | Public health check (no auth required) |
| `integration-health` | v66 | Yes | Check status of all integrations (Gmail, Seam, Meta, etc.) |
| `collect-daily-metrics` | v13 | Yes | Scheduled: collect daily usage metrics |
| `database-metrics` | v19 | Yes | Database performance metrics |
| `get-analytics` | v14 | Yes | Retrieve analytics data for dashboard |
| `logs-manage` | v32 | Yes | Log management (cleanup, retention) |

**Notes:**
- `integration-health` is the most-updated system function (v66) — critical for monitoring
- Three separate health check functions is redundant — consolidation candidate

---

## Scheduled & Maintenance (3 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `scheduled-reminders` | v8 | Yes | Send scheduled user reminders (follow-ups, renewals) |
| `clean-orphaned-users` | v15 | Yes | Remove auth users with no profile |
| `create-missing-profiles` | v13 | Yes | Create user_profiles for auth users missing them |

---

## Transcription (1 function)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `generate-transcript-summary` | v16 | Yes | AI summarization of call transcripts |

---

## Utility (2 functions)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `map-headers` | v23 | Yes | Map/geocode header utility |
| `alert_webhook` | v25 | Yes | Webhook for system alerts |

---

## Deployment Notes

### Naming Conventions
- Kebab-case for most: `twilio-sms`, `drip-campaign-processor`
- Some use underscores (legacy): `recalculate_lead_score`, `alert_webhook`, `oauth_callback`

### Legacy Functions to Rename/Consolidate
1. **`moltbot-bridge`** → `openclaw-bridge` already deployed as replacement. Keep `moltbot-bridge` as fallback until all references updated.
2. **Three health checks** (`health`, `health-check`, `api-health-check`) — consolidate to one public + one authenticated.
3. **Two lead import functions** (`import-leads`, `leads-data-import`) — may be duplicates or different formats.

### Functions Called by OpenClaw Server
The server (`openclaw-server/src/`) calls these edge functions via `callEdgeFunction()`:
- `openclaw-bridge` (or `moltbot-bridge`) — Gmail webhook actions
- `twilio-sms` — Send SMS on approval execution
- `notification-push` — Push notifications for approval requests

### Functions Called by Mobile App
The Doughy mobile app calls edge functions via Supabase client:
- `openai` — Property analysis, deal evaluation
- `perplexity-api` — Market research
- `stripe-api` — Billing operations
- `import-leads` — CSV import
- `process-document` — Document processing
- `twilio-sms` — Direct SMS sending
- `resend-email` — Email sending
- Most other functions via feature-specific hooks
