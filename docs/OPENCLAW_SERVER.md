# OpenClaw Server

> Last verified: 2026-02-16 by reading all source files in `openclaw-server/src/`.

## Overview

Express.js multi-channel AI gateway that handles inbound webhooks (Gmail, SMS, WhatsApp, Telegram), routes them through security scanning, and either processes them via the legacy email pipeline or The Claw intelligence layer.

**Location:** `doughy-app-mobile/openclaw-server/`
**Runtime:** Node.js >= 20, TypeScript, compiled to `dist/`
**Process Manager:** PM2 (`ecosystem.config.cjs`)
**Deployment Target:** DigitalOcean droplet at `openclaw.doughy.app`
**Status:** Deployed at `openclaw.doughy.app` (Feb 2026)

---

## Source File Inventory (32 files)

### Core Server (5 files, ~1,500 lines)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `src/server.ts` | 815 | Express app, all route definitions, middleware, startup | `app` (default) |
| `src/config.ts` | 71 | Environment variables with `requireEnv`/`optionalEnv` | `config` |
| `src/handler.ts` | 344 | Legacy email webhook pipeline (8-step flow) | `handleIncomingEmail` |
| `src/supabase.ts` | 227 | Edge function caller + Gmail token CRUD | `callEdgeFunction`, `getUserSettings`, `getUserGmailTokens`, `saveUserGmailTokens`, `updateUserHistoryId`, `getUsersNeedingWatchRenewal`, `getUserByGmailEmail` |
| `src/types.ts` | 141 | Gmail, email, contact, lead score, AI response types | 11 interfaces |

### The Claw Intelligence Layer (11 files, ~2,900 lines)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `src/claw/controller.ts` | 398 | Master controller: intent classification, routing, conversation | `handleClawMessage`, `handleClawSms` |
| `src/claw/agents.ts` | 294 | Agent execution engine: load profile, Claude loop, tool calls | `runAgent`, `getAgentProfile` |
| `src/claw/briefing.ts` | 278 | Cross-schema briefing generator + Claude/text formatting | `generateBriefingData`, `formatBriefing` |
| `src/claw/tools.ts` | ~570 | 21 agent tools: 12 read + 9 write, module-aware CRM queries | `TOOL_REGISTRY` |
| `src/claw/routes.ts` | 478 | Express router at `/api/claw` with JWT auth | `default` (Router) |
| `src/claw/prompts.ts` | 99 | System prompts for 4 AI roles | `INTENT_CLASSIFIER_PROMPT`, `MASTER_CONTROLLER_PROMPT`, `LEAD_OPS_PROMPT`, `DRAFT_SPECIALIST_PROMPT` |
| `src/claw/db.ts` | 104 | Supabase REST helpers (Accept-Profile/Content-Profile headers) | `schemaQuery`, `schemaInsert`, `schemaUpdate`, `publicInsert`, `clawQuery`, `clawInsert`, `clawUpdate` |
| `src/claw/types.ts` | 114 | Claw-specific TypeScript types | `ClawIntent`, `BriefingData`, `AgentProfile`, `ClawResponse`, `ApprovalDecision`, etc. |
| `src/claw/broadcast.ts` | 304 | Multi-channel broadcast: SMS, WhatsApp, Discord, email, app | `broadcastMessage`, `sendProactiveMessage`, `getUserEnabledChannels`, `registerDiscordSender` |
| `src/claw/discord.ts` | 491 | Discord bot: rich embeds, button approvals, batch approve | `initDiscordBot`, `getDiscordClient` |
| `src/claw/scheduler.ts` | 147 | Scheduled briefings + follow-up nudges (cron-triggered) | `runMorningBriefings`, `runFollowUpNudges` |

### Channel Adapters (8 files, ~1,750 lines)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `src/channels/base.ts` | 136 | Channel interface + registry + `messageToEmail` converter | `ChannelAdapter`, `ChannelRegistry`, `channelRegistry`, `IncomingMessage`, `OutgoingMessage` |
| `src/channels/index.ts` | 66 | Re-exports + `registerAllChannels` + `initializeChannels` | barrel exports |
| `src/channels/gmail.ts` | 370 | Gmail adapter: OAuth, watch, fetch, send via Google APIs | `gmailAdapter`, `GmailAdapter` |
| `src/channels/sms.ts` | 135 | Twilio SMS adapter: normalize webhook, send via REST | `smsAdapter`, `SMSAdapter` |
| `src/channels/whatsapp.ts` | 200 | WhatsApp Cloud API adapter | `whatsappAdapter`, `WhatsAppAdapter` |
| `src/channels/telegram.ts` | 177 | Telegram Bot API adapter | `telegramAdapter`, `TelegramAdapter` |
| `src/channels/postgrid.ts` | 351 | PostGrid direct mail adapter (postcards, letters) | `postgridAdapter`, `PostGridAdapter` |
| `src/channels/meta.ts` | 366 | Facebook/Instagram DM adapter via Meta Graph API | `metaAdapter`, `MetaAdapter` |

### Services (3 files, ~1,150 lines)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `src/services/security.ts` | 352 | Threat scanning (regex patterns) + rate limiting (in-memory) + security event logging | `scanForThreats`, `quickThreatCheck`, `checkRateLimit`, `logSecurityEvent` |
| `src/services/router.ts` | 550 | Platform router: domain detection, context classification, skill selection | `PlatformRouter`, `routeMessage`, `getSkillsForContext` |
| `src/services/email-capture.ts` | 256 | Inbound email → CRM capture: match/create contact, log touch, AI sentiment | `captureInboundEmail`, `getContactEmailTimeline` |

### CallPilot Module (6 files, ~1,400 lines)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `src/callpilot/routes.ts` | ~470 | Express router at `/api/calls` with JWT auth (16 endpoints) | `default` (Router) |
| `src/callpilot/engines.ts` | ~380 | 3 AI engines: pre-call briefing (Sonnet, module-aware), live coaching (Haiku), post-call summary (Sonnet) | `generatePreCallBriefing`, `generateCoachingCard`, `generatePostCallSummary` |
| `src/callpilot/db.ts` | 14 | Schema-aware DB helpers for callpilot schema | `cpQuery`, `cpInsert`, `cpUpdate` |
| `src/callpilot/voice.ts` | ~120 | Twilio Voice: outbound call initiation, TwiML, status/recording webhooks | `initiateOutboundCall`, `handleVoiceStatus`, `handleVoiceRecording`, `voiceWebhookRouter` |
| `src/callpilot/session.ts` | ~180 | Active call session manager: coaching interval (25s), phase detection, post-call pipeline (transcribe → summarize → create Claw task) | `startCallSession`, `stopCallSession`, `endCallSession`, `getSessionInfo` |
| `src/callpilot/transcription.ts` | ~130 | Deepgram REST transcription: audio → speaker-diarized chunks → `callpilot.transcript_chunks` | `transcribeRecording`, `getCallTranscript` |

### Connectors (4 files, ~2,000 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `src/connectors/index.ts` | 94 | Connector barrel exports |
| `src/connectors/discord.ts` | 606 | Discord bot connector |
| `src/connectors/fibery.ts` | 457 | Fibery PM connector |
| `src/connectors/notion.ts` | 557 | Notion connector |
| `src/connectors/utils.ts` | 305 | Shared connector utilities |

### Types (1 file)

| File | Lines | Purpose |
|------|-------|---------|
| `src/types/knowledge.ts` | 197 | Knowledge base types for connectors |

### Tests (3 files)

| File | Purpose |
|------|---------|
| `src/__tests__/security.test.ts` | Security scanning tests |
| `src/__tests__/memory-manager.test.ts` | Memory manager tests |
| `src/__tests__/connectors.test.ts` | Connector tests |

### Deploy (3 files)

| File | Purpose |
|------|---------|
| `deploy/setup.sh` | Ubuntu droplet setup script (still references `moltbot` naming) |
| `deploy/nginx.conf` | Nginx reverse proxy config (still references `moltbot` naming) |
| `deploy/gcloud-setup.sh` | Google Cloud Pub/Sub setup |

---

## Express Routes

### Webhook Endpoints (inbound)

| Method | Path | Auth | Middleware | Handler |
|--------|------|------|------------|---------|
| POST | `/webhooks/gmail` | None | rateLimitMiddleware('gmail'), securityMiddleware('gmail') | Gmail Pub/Sub push notification |
| GET | `/webhooks/whatsapp` | None | None | Meta webhook verification (challenge) |
| POST | `/webhooks/whatsapp` | None | rateLimitMiddleware('whatsapp'), securityMiddleware('whatsapp') | WhatsApp message |
| POST | `/webhooks/telegram` | None | rateLimitMiddleware('telegram'), securityMiddleware('telegram') | Telegram message |
| POST | `/webhooks/sms` | Twilio signature | twilioSignatureMiddleware(), rateLimitMiddleware('sms'), securityMiddleware('sms') | SMS/WhatsApp via Twilio |

### Health & Status

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | None | Basic health (status, timestamp, version, env) |
| GET | `/status` | None | Extended status (Supabase connectivity, channel configs) |

### OAuth Flows

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/oauth/gmail/start` | user_id query param | Redirect to Google OAuth consent |
| GET | `/oauth/gmail/callback` | OAuth code + state | Exchange code for tokens, save, start watch |
| GET | `/oauth/start` | Legacy | Forwards to `/oauth/gmail/start` |
| GET | `/oauth/callback` | Legacy | Forwards to `/oauth/gmail/callback` |
| POST | `/oauth/disconnect` | user_id in body | Stop Gmail watch, delete tokens |

### Cron

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/cron/renew-watches` | x-cron-secret header | Renew Gmail Pub/Sub watches (7-day expiry) |

### Development (non-production only)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/test/process-message` | None | Test message processing |
| GET | `/test/channels` | None | List registered/configured channels |

### The Claw API (`/api/claw/*`)

All routes require JWT auth via `requireAuth` middleware (validates token with Supabase Auth API).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/claw/message` | Send a message to The Claw (max 2000 chars) |
| GET | `/api/claw/briefing` | Get a fresh business briefing |
| GET | `/api/claw/tasks` | List user's tasks (optional `?status=` filter) |
| GET | `/api/claw/approvals` | List approvals (default `?status=pending`) |
| POST | `/api/claw/approvals/:id/decide` | Approve or reject a single approval |
| POST | `/api/claw/approvals/batch` | Batch approve/reject (max 20 per batch) |
| GET | `/api/claw/activity` | Combined task + approval activity feed |
| GET | `/api/claw/messages` | Conversation history (optional `?channel=` filter) |
| GET | `/api/claw/agent-profiles` | List agent profiles and capabilities |
| PATCH | `/api/claw/agent-profiles/:id` | Enable/disable an agent (`{ is_active: bool }`) |
| GET | `/api/claw/kill-switch` | Check kill switch status (`{ active, log? }`) |
| POST | `/api/claw/kill-switch` | Activate kill switch (`{ reason }`) |
| DELETE | `/api/claw/kill-switch` | Deactivate kill switch |

### CallPilot API (`/api/calls/*`)

All routes require JWT auth via `requireAuth` middleware.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/calls` | Call history (paginated, `?limit=` up to 100) |
| GET | `/api/calls/templates` | List script templates |
| POST | `/api/calls/pre-call` | Create call record + generate AI pre-call briefing |
| POST | `/api/calls/:id/start` | Mark call as in-progress |
| POST | `/api/calls/:id/end` | End call + generate AI summary |
| GET | `/api/calls/:id/coaching` | Get coaching cards (`?since_ms=` for polling) |
| POST | `/api/calls/:id/coaching` | Generate new coaching card (elapsed, phase, context) |
| POST | `/api/calls/:id/coaching/:cardId/dismiss` | Dismiss a coaching card |
| GET | `/api/calls/:id/summary` | Get post-call summary + action items |
| POST | `/api/calls/:id/actions/:actionId/approve` | Approve action item |
| POST | `/api/calls/:id/actions/:actionId/dismiss` | Dismiss action item |
| POST | `/api/calls/:id/connect` | Initiate outbound Twilio Voice call |
| GET | `/api/calls/:id/session` | Get active coaching session info |
| POST | `/api/calls/:id/transcribe` | Transcribe call recording via Deepgram |
| GET | `/api/calls/:id/transcript` | Get transcript chunks for a call |

---

## The Claw Intelligence Layer

### Intent Classification

**Entry point:** `controller.ts:classifyIntent()`

```
User message + conversation history (last 6 messages)
  ↓
Claude Haiku (max 20 tokens, temperature 0, cached system prompt)
  ↓
Returns one of 8 intent labels:
  briefing | draft_followups | query | action |
  chat | help | approve | unknown
(Legacy: check_deal/check_bookings/new_leads → query, what_did_i_miss → briefing)
```

**Fallback:** If no Anthropic API key, uses keyword regex matching (`guessIntentFromKeywords()`). Patterns cover greetings (→briefing), "draft"/"follow up" (→draft_followups), "deal"/"property" (→check_deal), etc.

### Agent Profiles (from `claw.agent_profiles`)

| Slug | Name | Model | Tools | Requires Approval | Temperature | Max Tokens |
|------|------|-------|-------|-------------------|-------------|------------|
| `master-controller` | Master Controller | claude-haiku-4-5-20251001 | None | No | 0 | 20 |
| `lead-ops` | Lead Operations Agent | claude-sonnet-4-5-20250929 | `read_deals`, `read_leads`, `read_bookings`, `read_follow_ups`, `read_email_timeline` | No | — | — |
| `draft-specialist` | Draft Specialist | claude-sonnet-4-5-20250929 | `draft_sms`, `create_approval` | Yes | — | — |

### Agent Execution Loop

**Entry point:** `agents.ts:runAgent()`

1. Load agent profile from `claw.agent_profiles` by slug
2. Create run record in `claw.agent_runs` (status: `running`)
3. Build Anthropic tool definitions from agent's `tools` array (with input schemas for each tool)
4. Wrap user message in `<user_message>` tags (prompt injection defense)
5. Call Claude Messages API with cached system prompt + tools
6. If `stop_reason === 'tool_use'`: execute each tool, collect results, continue conversation
7. **Repeat up to 5 iterations** (prevents infinite loops)
8. Extract final text response
9. Calculate cost (Haiku: $0.80/$4 per MTok, Sonnet: $3/$15 per MTok)
10. Update `claw.agent_runs` with tokens, cost, duration, tool_calls, result

**Tool error handling:** Tool execution failures return `"Tool execution failed. Try a different approach."` — sanitized to not leak schema/table names to the AI.

### Tool Registry (21 tools: 12 read + 9 write)

**Read Tools:**

| Tool | Schema.Table | Description | Parameters |
|------|-------------|-------------|------------|
| `read_deals` | `investor.deals_pipeline` | Active deals with stage, value, next action | `limit?`, `stage?` |
| `read_leads` | `crm.contacts` | Contacts by module (no scores) | `limit?`, `recent_days?`, `module?` |
| `read_bookings` | `landlord.bookings` | Upcoming bookings with dates, rates | `limit?`, `upcoming_only?` |
| `read_follow_ups` | `investor.follow_ups` | Scheduled follow-ups (overdue/upcoming) | `limit?`, `overdue_only?`, `upcoming_days?` |
| `read_maintenance` | `landlord.maintenance_records` | Open maintenance requests | `limit?`, `status?` |
| `read_vendors` | `landlord.vendors` | Active vendors/service providers | `limit?`, `category?` |
| `read_contacts_detail` | `crm.contacts` | Full contact records with module filter | `limit?`, `search?`, `contact_id?`, `module?` |
| `read_portfolio` | `investor.properties` | Investment properties with financials | `limit?` |
| `read_documents` | `investor.documents` | Deal/property documents | `limit?`, `deal_id?`, `property_id?` |
| `read_comps` | `investor.comps` | Comparable property sales | `limit?`, `property_id?` |
| `read_campaigns` | `investor.campaigns` | Marketing campaigns with metrics | `limit?`, `status?` |
| `read_conversations` | `investor.conversations` | Recent conversation history | `limit?` |
| `read_email_timeline` | `crm.touches` | Email interaction history for a CRM contact | `contact_id`, `limit?` |

**Write Tools:**

| Tool | Schema.Table | Description | Parameters |
|------|-------------|-------------|------------|
| `draft_sms` | (pure function) | Returns draft object, doesn't send | `recipient_name`, `recipient_phone`, `message`, `context?` |
| `create_approval` | `claw.approvals` | Insert pending approval entry (24h expiry) | `action_type`, `title`, `draft_content`, `recipient_*`, `task_id` (auto-injected) |
| `create_lead` | `crm.contacts` | Create new CRM contact with module tag | `first_name`, `last_name?`, `phone?`, `email?`, `source?`, `module?` |
| `update_lead` | `crm.contacts` | Update contact status, details | `contact_id`, `status?`, `phone?`, `email?`, `tags?` |
| `update_deal_stage` | `investor.deals_pipeline` | Move deal to new pipeline stage | `deal_id`, `stage`, `next_action?`, `next_action_due?` |
| `mark_followup_complete` | `investor.follow_ups` | Mark follow-up as completed | `followup_id` |
| `send_whatsapp` | (draft function) | Draft WhatsApp message (requires approval) | `recipient_name`, `recipient_phone`, `message`, `context?` |
| `send_email` | (draft function) | Draft email (requires approval) | `recipient_name`, `recipient_email`, `subject`, `body`, `context?` |
| `add_note` | various | Add note to deal, lead, property, or maintenance | `target_type`, `target_id`, `note` |
| `create_maintenance_request` | `landlord.maintenance_records` | Create maintenance request | `property_id`, `title`, `description?`, `priority?`, `category?` |

### Briefing Engine

**Entry point:** `briefing.ts:generateBriefingData()`

Runs 9 parallel cross-schema queries (module-aware):

| # | Schema.Table | What | Filter |
|---|-------------|------|--------|
| 0 | `crm.leads` | Top 50 investor leads | `user_id, is_deleted=false, module=investor` |
| 1 | `investor.deals_pipeline` | Active deals | `user_id, status=active` |
| 2 | `investor.portfolio_entries` | Active portfolio | `user_id, is_active=true` |
| 3 | `investor.deals_pipeline` | Closed-won deals | `user_id, stage=closed_won, status=active` |
| 4 | `investor.conversations` | Active conversations | `user_id, status=active` |
| 5 | `investor.ai_queue_items` | Pending AI items | `status=pending` |
| 6 | `investor.follow_ups` | **Overdue follow-ups** | `status=scheduled, scheduled_at < today` |
| 7 | `investor.follow_ups` | **Upcoming follow-ups (7 days)** | `status=scheduled, scheduled_at >= today` |
| 8 | `landlord.bookings` | **Upcoming bookings (7 days)** | `start_date >= today` |

Then resolves contact names for follow-ups + lead names for deals needing action, computes:
- Overdue follow-ups (with contact names, days overdue)
- Deals needing action (with lead names)
- Upcoming bookings
- Leads by status (new, contacted, qualified)
- Deals by stage + total value
- Inbox: unread conversations + pending AI responses

**Formatting:** `formatBriefing()` calls Claude Haiku (500 max_tokens) with instructions to lead with OVERDUE follow-ups, separate INVESTOR PIPELINE from LANDLORD OPERATIONS sections, and suppress raw portfolio stats. Falls back to `formatBriefingText()` plain text formatter.

**Text fallback section order:** OVERDUE FOLLOW-UPS → INVESTOR PIPELINE → LANDLORD OPERATIONS → UPCOMING → INBOX

### System Prompts

| Prompt | Used By | Key Instructions |
|--------|---------|------------------|
| `INTENT_CLASSIFIER_PROMPT` | Master Controller (Haiku) | Classify to 1 of 9 intents. Use conversation context only for ambiguous short replies. |
| `MASTER_CONTROLLER_PROMPT` | (Not yet wired — future use) | SMS-friendly, lead with actionable items, max ~300 words briefings, no emojis |
| `LEAD_OPS_PROMPT` | Lead Operations agent | Read follow-ups first, then leads. Return structured data with names/dates/amounts. |
| `DRAFT_SPECIALIST_PROMPT` | Draft Specialist agent | Write as the USER (first person). Under 160 chars. NEVER send directly. |

---

## Communication Flows

### SMS → Briefing (end-to-end)

```
1. User texts "What's going on?" to Twilio number
2. Twilio POST → /webhooks/sms
3. twilioSignatureMiddleware() validates (HMAC-SHA1 with timing-safe compare)
4. rateLimitMiddleware('sms') — burst: 10/min, channel: 50/hr
5. securityMiddleware('sms') — quickThreatCheck + scanForThreats
6. smsAdapter.normalizeMessage() → IncomingMessage
7. Respond immediately with empty TwiML (<Response></Response>)
8. config.clawEnabled → handleClawSms()
9. Phone→user lookup via config.phoneUserMap (JSON env var)
10. UUID validation (defense against config injection)
11. handleClawMessage(userId, body, 'sms')
12. loadRecentMessages() → GET claw.messages (last 10)
13. saveMessage() → INSERT claw.messages (role: user)
14. classifyIntent() → Haiku returns "briefing"
15. handleBriefing() → createTask() → INSERT claw.tasks (type: briefing)
16. generateBriefingData() → 6 parallel queries (see Briefing Engine)
17. formatBriefing() → Haiku formats to natural language
18. clawUpdate() → UPDATE claw.tasks (status: done)
19. saveMessage() → INSERT claw.messages (role: assistant)
20. SMS reply via Twilio REST API (truncated to 1500 chars + "[Open app]" footer)
```

### SMS → Draft Follow-Ups (end-to-end)

```
1-13. Same as briefing flow, intent = "draft_followups"
14. handleDraftFollowups() → createTask() → INSERT claw.tasks
15. runAgent(lead-ops):
    - Loads "lead-ops" profile (Sonnet, read-only tools)
    - Creates agent_run record
    - Agent calls read_follow_ups → overdue + upcoming from investor.follow_ups
    - Agent calls read_leads → contact details from crm.contacts
    - Returns structured leads data
16. runAgent(draft-specialist):
    - Loads "draft-specialist" profile (Sonnet, draft+approval tools)
    - Receives leads_data from step 15 as context
    - For each lead: calls draft_sms then create_approval
    - Each creates a row in claw.approvals (status: pending, 24h expiry)
17. Count approvals created
18. Push notification via notification-push edge function
19. Update task (status: awaiting_approval)
20. SMS reply: "I've drafted N follow-up messages. Open The Claw app to review."
```

### App → Approve → Send SMS

```
1. The Claw app calls POST /api/claw/approvals/:id/decide
2. requireAuth middleware validates Supabase JWT → user_id
3. UUID format validation on approval_id
4. Query claw.approvals (id + user_id + status=pending)
5. On reject: UPDATE status=rejected, decided_at
6. On approve: UPDATE status=approved, draft_content (may be edited)
7. executeSmsApproval():
   - POST to twilio-sms edge function (service role key)
   - Log to public.conversation_items (type: sms_sent, source: claw_approval)
8. UPDATE status=executed, executed_at
```

---

## Legacy Email Pipeline

**Entry point:** `handler.ts:handleIncomingEmail()`

8-step flow for processing inbound emails from rental platforms:

1. **Parse** — `platform-email-parser` edge function detects platform (Airbnb, FurnishedFinder, etc.), extracts contact info
2. **Contact** — `openclaw-bridge` edge function upserts contact (CRM)
3. **Property** — `openclaw-bridge` matches property by address hint (optional)
4. **Conversation** — `openclaw-bridge` creates conversation + logs inbound message
5. **Score** — `lead-scorer` edge function scores the lead (0-100)
6. **Settings** — `getUserSettings()` reads AI mode from `user_platform_settings`
7. **AI Response** — `ai-responder` edge function generates reply
8. **Decision** — Auto-send (if autonomous/assisted+high confidence) or queue for review

Edge functions called: `platform-email-parser`, `openclaw-bridge` (x4), `lead-scorer`, `ai-responder`, `notification-push`

---

## Security

### Twilio Signature Validation

`twilioSignatureMiddleware()` in `server.ts`:
- Reconstructs full public URL (handles Nginx SSL termination)
- HMAC-SHA1 with auth token as key
- Timing-safe comparison via `crypto.timingSafeEqual`
- Skipped if no auth token configured (dev mode)

### Threat Scanning

`services/security.ts` provides multi-layer protection:

**Quick check** (`quickThreatCheck`): 6 regex patterns for fast pre-filtering.

**Full scan** (`scanForThreats`): 20+ regex patterns across 2 categories:
- **Injection patterns** (14): instruction override, role manipulation, jailbreak, system prompt extraction, markup injection
- **Exfiltration patterns** (4): data theft, credential extraction

**Severity → Action mapping:**
| Risk Score | Highest Severity | Action |
|------------|-----------------|--------|
| >= 75 | critical | `blocked` (silently dropped) |
| >= 50 | high | `flagged` |
| > 0 | medium/low | `sanitized` |
| 0 | — | `allowed` |

**Logging:** Events with risk score >= 25 are logged via `log_security_event` RPC function to Supabase.

### Rate Limiting

In-memory rate limiter (`services/security.ts`):
| Limit Type | Window | Max Requests |
|-----------|--------|-------------|
| Burst | 1 minute | 10 |
| Channel | 1 hour | 50 |
| User | 1 hour | 100 |

Cleanup runs every 10 minutes to evict stale entries.

### Claw API Auth

`routes.ts:requireAuth()`:
- Validates Bearer token via `GET /auth/v1/user` with **anon key** (not service role)
- UUID validation on returned user ID (defense against PostgREST injection)
- Sets `req.userId` for downstream handlers

### Prompt Injection Defense

- Agent context wrapped in `<user_message>` tags (`agents.ts`)
- Tool errors sanitized — don't leak schema/table names to AI
- UUID validation on phone→user mapping (`controller.ts`)
- Input length validation on `/api/claw/message` (max 2000 chars)

---

## Platform Router

`services/router.ts` provides intelligent message routing (not currently wired into main flow — prepared for future multi-platform expansion).

### Routing Logic
1. Check user's custom routing rules (priority-ordered)
2. Detect sender domain → match against known platforms:
   - Rental platforms (11 domains): Airbnb, FurnishedFinder, Zillow, etc. → `landlord`
   - Investor platforms (6 domains): PropStream, BatchLeads, etc. → `investor`
3. Content-based detection using regex patterns for 7 contexts: lead, guest, tenant, seller, agent, personal, room
4. Map context → platform with confidence score

### Skill Registry

Skills are loaded per-platform per-context from `SKILL_REGISTRY`:
- **Landlord:** doughy-core, doughy-lead, doughy-platform, doughy-guest, doughy-booking, doughy-room
- **Investor:** doughy-core, doughy-investor-core, doughy-investor-outreach
- **Personal:** doughy-core, doughy-personal-crm

---

## Data Access Patterns

The server uses **Supabase REST API** with service role key for all database operations:

### Cross-Schema Reads (service role key)
```
Accept-Profile: {schema_name}
GET /rest/v1/{table}?{postgrest_params}
```

### Schema-Scoped Writes (service role key)
```
Content-Profile: {schema_name}
Accept-Profile: {schema_name}
POST /rest/v1/{table}
```

### Edge Function Calls
```
Authorization: Bearer {service_role_key}
POST /functions/v1/{function_name}
```

**Important:** The server NEVER uses Supabase JS client — all calls are raw `fetch()` against the REST API. This is intentional (service role REST bypasses RLS, which is what we want for server-side operations).

---

## Environment Variables

### Required (server won't start without these)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (e.g., `https://lqmbyobweeaigrwmvizo.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for Gmail) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project ID (for Gmail Pub/Sub topic) |

### Optional (have defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `SERVER_URL` | `http://localhost:3000` | Public URL (must match Twilio webhook URL) |
| `SUPABASE_ANON_KEY` | `""` | Anon key (used by Claw API auth middleware) |
| `GOOGLE_REDIRECT_URI` | `https://openclaw.doughy.app/oauth/callback` | Google OAuth redirect |
| `GMAIL_PUBSUB_TOPIC` | `gmail-notifications` | Gmail Pub/Sub topic name |
| `ANTHROPIC_API_KEY` | `""` | Anthropic API key (Claw features disabled without it) |
| `TWILIO_ACCOUNT_SID` | `""` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | `""` | Twilio auth token (also used for webhook signature validation) |
| `TWILIO_PHONE_NUMBER` | `""` | Twilio SMS phone number |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` | Twilio WhatsApp number (sandbox default) |
| `CLAW_ENABLED` | `true` | Enable/disable The Claw SMS routing |
| `CLAW_DEFAULT_MODEL` | `claude-sonnet-4-5-20250929` | Default Claude model for agents |
| `CLAW_PHONE_USER_MAP` | `{}` | JSON mapping phone numbers to user UUIDs |

### Derived

| Variable | Source | Description |
|----------|--------|-------------|
| `pubSubTopicName` | `GOOGLE_CLOUD_PROJECT_ID` + `GMAIL_PUBSUB_TOPIC` | Full Pub/Sub topic path |
| `phoneUserMap` | `CLAW_PHONE_USER_MAP` (parsed JSON) | Phone→UUID lookup map |

---

## Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.39.0",
  "dotenv": "^16.4.5",
  "express": "^4.21.2",
  "googleapis": "^144.0.0"
}
```

Dev dependencies: `@types/express`, `@types/node`, `tsx` (dev server), `typescript`

**Notable:** No `cors` package — CORS is handled manually in `server.ts` with an allowlist of origins.

---

## Build & Run

```bash
# Development
cd openclaw-server
npm install
npm run dev              # tsx watch mode (auto-reload)

# Production build
npm run build            # tsc → dist/
npm start                # node dist/server.js

# PM2 (production)
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## Deploy Files (legacy — still reference `moltbot` naming)

### `deploy/setup.sh`
Ubuntu 24.04 droplet setup: Node 20, PM2, Nginx, Certbot. Creates `/var/www/moltbot/` and `/var/log/moltbot/`. Prints manual step instructions.

### `deploy/nginx.conf`
Nginx reverse proxy: HTTP→HTTPS redirect, proxy to `localhost:3000`, security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection), 60s timeouts for webhook processing.

### `deploy/gcloud-setup.sh`
Google Cloud Pub/Sub setup for Gmail push notifications.

**All deploy files still reference `moltbot` domain/paths — need updating to `openclaw` before deployment.**

---

## Known Issues

1. **Deploy scripts up to date** — setup.sh, nginx.conf, gcloud-setup.sh all use `openclaw` naming (actual deploy uses manual scp/pm2)
2. **Rate limiter is in-memory** — resets on server restart, doesn't share across instances (fine for single-instance PM2)
3. **Platform router not wired** — `services/router.ts` is complete but not called from main flow (future multi-platform support)
4. **Discord bot needs token** — `DISCORD_BOT_TOKEN` must be set in droplet's `.env` for Discord integration to activate
5. **WhatsApp/Telegram handlers are stubs** — Webhook routes exist but user lookup is TODO
6. **No CORS package** — Manual CORS middleware, works but less standard
7. **Scheduler needs cron trigger** — `runMorningBriefings` / `runFollowUpNudges` exist but need a cron endpoint or external trigger
