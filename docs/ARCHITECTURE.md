# Architecture Overview

> Last updated: 2026-02-17 by querying Supabase staging (`lqmbyobweeaigrwmvizo`) directly.

## Three-Product Ecosystem

| Product | Role | Analogy | Stack | Repo |
|---------|------|---------|-------|------|
| **Doughy** | Source of truth — all data lives here | The brain | Expo 54 + RN + Supabase + TypeScript | `doughy-app-mobile` |
| **The Claw** | Nervous system — AI control plane | The nervous system | Expo + RN + Zustand + custom theme | `the-claw-app` |
| **CallPilot** | Communication companion — calling | The voice | Expo + RN + hooks+Context | `callpilot` |
| **OpenClaw Server** | AI gateway for all 3 apps | The spine | Express + Anthropic SDK + Twilio | `doughy-app-mobile/openclaw-server/` |

All apps share **one Supabase instance** (staging: `lqmbyobweeaigrwmvizo`). Auth is shared via Supabase Auth. Schemas are separated by data ownership.

**Design philosophy:** ADHD-friendly. One screen, three answers. Three taps or less. Cards over tables. Progressive disclosure.

## What Runs Where

```
┌──────────────────────────────────┐
│       SUPABASE (us-east-1)       │
│  PostgreSQL: 8 schemas, 170 tbl  │
│  Edge Functions: 62 deployed     │
│  Auth: shared across all apps    │
│  Realtime: WebSocket subs        │
│  Storage: file uploads           │
└──────────┬───────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────────────────────┐
│  Expo   │  │  DigitalOcean Droplet        │
│  Apps   │  │  openclaw-server (Express)    │
│ (3 apps)│  │  PM2 process manager          │
│         │  │  Nginx reverse proxy          │
│ Doughy  │  │  SSL via Let's Encrypt        │
│ The Claw│  │  Domain: openclaw.doughy.app  │
│ CallPilot│ │  Status: DEPLOYED (Feb 2026)  │
└─────────┘  └──────────────────────────────┘
```

## How Auth Works

All three apps authenticate against the **same Supabase Auth** instance:
- **Doughy (mobile):** Supabase JS client with anon key + SecureStore for tokens + RLS
- **The Claw (mobile):** Supabase Auth via `clawFetch` wrapper + SupabaseGatewayAdapter
- **CallPilot (mobile):** Supabase Auth via `callsFetch` wrapper + mock mode fallback
- **OpenClaw Server:** Service role key via REST API (bypasses RLS for server-side operations)
- **Edge Functions:** Service role key via Supabase client

Auth flow:
1. User signs in via Supabase Auth (email/password)
2. JWT issued with `auth.uid()` claim
3. All client-side queries filter via RLS using `auth.uid() = user_id`
4. Server-side operations use service role key + explicit `user_id` filtering

## System Diagram

```
                  ┌─────────────────────────────────────────────────┐
                  │              MESSAGING CHANNELS                  │
                  │   Gmail    SMS    WhatsApp    Telegram    Meta   │
                  └──────────────────┬──────────────────────────────┘
                                     │ webhooks
                                     ▼
                  ┌──────────────────────────────────────────────────┐
                  │           OPENCLAW SERVER (Express)               │
                  │                                                   │
                  │  Middleware:                                      │
                  │    Twilio signature → Rate limiter → Security scan│
                  │                                                   │
                  │  Two pipelines:                                   │
                  │  ┌──────────────┐  ┌───────────────────────────┐ │
                  │  │ Email Pipeline│  │ The Claw Intelligence     │ │
                  │  │ (handler.ts)  │  │ (src/claw/)               │ │
                  │  │ 8-step flow   │  │                           │ │
                  │  │ Parse→Contact │  │ Intent Classifier (Haiku) │ │
                  │  │ →Property     │  │       ↓                   │ │
                  │  │ →Conversation │  │ Route to handler          │ │
                  │  │ →Score→AI     │  │       ↓                   │ │
                  │  │ →Action       │  │ Agent Engine (Sonnet)     │ │
                  │  └──────┬───────┘  │ Tool-use loop (max 5)     │ │
                  │         │          │       ↓                   │ │
                  │         │          │ Approval gates             │ │
                  │         │          └───────────┬───────────────┘ │
                  └─────────┼─────────────────────┼─────────────────┘
                            │                     │
                            ▼                     ▼
                  ┌──────────────────────────────────────────────────┐
                  │             SUPABASE                              │
                  │                                                   │
                  │  Schemas:                                         │
                  │    claw (11)    - agent orchestration, notifs     │
                  │    callpilot (10) - calls, coaching, summaries   │
                  │    ai (25)     - security, memory, knowledge     │
                  │    investor (34) - deals, properties, pipeline   │
                  │    landlord (19) - rentals, bookings, vendors    │
                  │    crm (5)     - contacts, leads, skip trace     │
                  │    integrations (9) - gmail, seam, meta, postgrid│
                  │    public (57)  - users, workspaces, billing     │
                  │                                                   │
                  │  Edge Functions: 62 deployed (Deno runtime)      │
                  │  Realtime: WebSocket subscriptions               │
                  └──────────────────┬───────────────────────────────┘
                                     │ realtime + REST
                                     ▼
                  ┌──────────────────────────────────────────────────┐
                  │              MOBILE APPS (Expo)                   │
                  │                                                   │
                  │  Doughy: Full investor/landlord platform          │
                  │    - Supabase JS client + anon key + RLS         │
                  │    - Zustand (client state) + React Query (server)│
                  │    - NativeWind + useThemeColors()                │
                  │                                                   │
                  │  The Claw: Agent monitoring + approval + chat UI  │
                  │    - Live API via clawFetch → openclaw server     │
                  │    - Chat, activity, approvals, control tabs      │
                  │                                                   │
                  │  CallPilot: Call coaching + CRM integration       │
                  │    - API client via callsFetch + mock fallback    │
                  └──────────────────────────────────────────────────┘
```

## The Agent System

### Overview

The Claw uses a **multi-agent architecture** where specialized agents handle different tasks, coordinated by a master controller. All agents require human approval before taking outbound actions.

### Agent Profiles (from `claw.agent_profiles`, verified 2026-02-16)

| Slug | Name | Model | Tools | Requires Approval |
|------|------|-------|-------|-------------------|
| `master-controller` | Master Controller | claude-haiku-4-5-20251001 | None | No |
| `lead-ops` | Lead Operations Agent | claude-sonnet-4-5-20250929 | `read_deals`, `read_leads`, `read_bookings`, `read_follow_ups`, `read_email_timeline` | No |
| `draft-specialist` | Draft Specialist | claude-sonnet-4-5-20250929 | `draft_sms`, `create_approval` | Yes |

### Intent Classification

Entry point: `controller.ts:classifyIntent()`

1. User message arrives (SMS or app)
2. Claude Haiku classifies intent (20 max_tokens, temperature 0, prompt caching)
3. Falls back to keyword regex matching if no Anthropic API key
4. Valid intents: `briefing`, `draft_followups`, `check_deal`, `check_bookings`, `new_leads`, `what_did_i_miss`, `help`, `approve`, `unknown`

### Agent Execution Loop

Entry point: `agents.ts:runAgent()`

1. Load agent profile from `claw.agent_profiles` by slug
2. Create run record in `claw.agent_runs` (status: running)
3. Build Anthropic tool definitions from agent's tool list
4. Call Claude Messages API with system prompt (cached), user message, and tools
5. If `stop_reason === 'tool_use'`: execute each tool call, collect results, continue conversation
6. Repeat up to **5 iterations** (prevents infinite loops)
7. Extract final text response
8. Calculate cost (Haiku: $0.80/$4 per MTok, Sonnet: $3/$15 per MTok)
9. Update run record with tokens, cost, duration, tool_calls, result

### Tool Registry (21 tools in `tools.ts`)

**Read Tools (12):**

| Tool | Schema | Table | Description |
|------|--------|-------|-------------|
| `read_deals` | investor | deals_pipeline | Active deals with stage, value, lead info |
| `read_leads` | crm | contacts | Contacts filtered by module (investor/landlord) |
| `read_bookings` | landlord | bookings | Upcoming bookings with property info |
| `read_follow_ups` | investor | follow_ups | Overdue and upcoming follow-ups |
| `read_email_timeline` | crm | touches | Email interaction history for a CRM contact |
| `read_properties` | investor | properties | Investment properties with details |
| `read_maintenance` | landlord | maintenance_requests | Open maintenance requests |
| `read_vendors` | landlord | vendors | Vendor list with ratings |
| `read_campaigns` | investor | campaigns | Marketing campaigns status |
| `read_comps` | investor | comps | Comparable property data |
| `read_conversations` | investor | conversations | Active deal conversations |
| `read_portfolio` | investor | portfolio_entries | Portfolio summary |

**Write Tools (9):**

| Tool | Schema | Table | Description |
|------|--------|-------|-------------|
| `draft_sms` | — | — | Pure function: returns draft object (no DB) |
| `create_approval` | claw | approvals | Inserts pending approval entry |
| `create_lead` | crm | leads | Create new CRM lead (module-tagged) |
| `update_lead` | crm | leads | Update lead status/details |
| `create_follow_up` | investor | follow_ups | Schedule a follow-up |
| `update_deal_stage` | investor | deals_pipeline | Move deal to new pipeline stage |
| `create_task` | claw | tasks | Create a Claw task |
| `create_booking` | landlord | bookings | Create a booking |
| `create_maintenance` | landlord | maintenance_requests | Create a maintenance request |

All CRM queries filter by `module` parameter (defaults to `investor`). The `assertModule()` validator prevents PostgREST injection.

### Approval Flow

1. Agent calls `create_approval` tool → row inserted in `claw.approvals` (status: pending)
2. Push notification sent to user via `notification-push` edge function
3. User opens The Claw app → sees pending approval
4. User approves/rejects/edits
5. On approve: `routes.ts` calls `executeSmsApproval()` → `twilio-sms` edge function → SMS sent
6. Approval status updated: `approved` → `executed`

## Communication Flow: "Brief Me" End-to-End

```
1. User texts "What's going on?" to Twilio number
2. Twilio POST → /webhooks/sms
3. twilioSignatureMiddleware() validates
4. rateLimitMiddleware() + securityMiddleware() check
5. handleClawSms() looks up userId from CLAW_PHONE_USER_MAP
6. loadRecentMessages() → GET claw.messages (last 10)
7. saveMessage() → INSERT claw.messages (role: user)
8. classifyIntent() → Haiku returns "briefing"
9. handleBriefing() → createTask() → INSERT claw.tasks
10. generateBriefingData() → 9 parallel queries:
    - crm.leads (last 50, module=investor)
    - investor.deals_pipeline (active)
    - investor.portfolio_entries (active)
    - investor.deals_pipeline (closed_won)
    - investor.conversations (active)
    - investor.ai_queue_items (pending)
    - investor.follow_ups (overdue — scheduled before today)
    - investor.follow_ups (upcoming — next 7 days)
    - landlord.bookings (upcoming — next 7 days)
11. Resolve contact names for follow-ups (crm.contacts lookup)
12. formatBriefing() → Haiku formats to natural language (or plaintext fallback)
    - Leads with overdue follow-ups first, then deals, then bookings
    - Investor pipeline and landlord operations separated
12. clawUpdate() → UPDATE claw.tasks (status: done)
13. saveMessage() → INSERT claw.messages (role: assistant)
14. SMS reply sent via Twilio REST API (truncated to 1500 chars for SMS)
```

## Communication Flow: "Draft Follow-Ups" End-to-End

```
1-8. Same as briefing flow, intent = "draft_followups"
9. handleDraftFollowups() → createTask() → INSERT claw.tasks
10. runAgent(lead-ops):
    - Loads "lead-ops" profile (Sonnet, read-only tools)
    - Creates agent_run record
    - Agent calls read_follow_ups → overdue + upcoming from investor.follow_ups
    - Agent calls read_leads → contact details from crm.leads
    - Returns structured leads data
11. runAgent(draft-specialist):
    - Loads "draft-specialist" profile (Sonnet, draft+approval tools)
    - Receives leads_data from step 10 as context
    - For each lead: calls draft_sms then create_approval
    - Each creates a row in claw.approvals (status: pending)
12. Count approvals created
13. Send push notification via notification-push edge function
14. Update task (status: awaiting_approval)
15. SMS reply: "I've drafted N follow-up messages. Open The Claw app to review."
16. User opens app → reviews → approves → SMS sent to lead via Twilio
```

## LLM Strategy

| Use Case | Model | Why |
|----------|-------|-----|
| Intent classification | Haiku 4.5 | Fast (~200ms), cheap ($0.80/MTok in), 20 max_tokens |
| Briefing formatting | Haiku 4.5 | Simple text formatting, 400 max_tokens |
| Lead analysis | Sonnet 4.5 | Complex reasoning about deal pipeline + contacts |
| SMS drafting | Sonnet 4.5 | Personalized messages require nuance |
| Keyword fallback | None | Regex matching when no API key available |

All system prompts use `cache_control: { type: 'ephemeral' }` for prompt caching (reduces cost on repeated calls within 5-minute window).

## Database: 8 Schemas, 170 Tables

| Schema | Tables | Purpose |
|--------|--------|---------|
| `claw` | 12 | Agent orchestration: profiles, tasks, runs, approvals, messages, notifications, budgets, kill switch, cost_log |
| `callpilot` | 10 | Call coaching: calls, transcripts, coaching cards, summaries, action items, scripts, briefings |
| `ai` | 25 | AI infrastructure: security, memory, knowledge, circuit breakers |
| `investor` | 34 | Real estate investment: deals, properties, campaigns, portfolio |
| `landlord` | 19 | Rental management: properties, rooms, bookings, vendors |
| `crm` | 5 | Customer relationships: contacts, leads, skip trace, opt-outs |
| `integrations` | 9 | Third-party: Gmail, Seam locks, Meta, Postgrid |
| `public` | 57 | Shared: users, workspaces, billing, calls, system logs |

See `docs/SCHEMA_MAP.md` for complete table-by-table breakdown.

## Module Separation (Feb 2026)

The system manages two distinct business modes that must never be mixed:

| Module | Role | Contacts Are | Data Sources |
|--------|------|-------------|--------------|
| `investor` | Dino as **BUYER** | Property sellers, deal leads | deals_pipeline, follow_ups, campaigns |
| `landlord` | Dino as **OWNER** | Tenants, guests, rental contacts | bookings, maintenance, vendors |

Module tag is on: `crm.contacts.module`, `crm.leads.module`, `callpilot.script_templates.module`

All CRM queries in The Claw tools and briefings filter by module. CallPilot script templates are module-aware. The briefing engine separates output into "INVESTOR PIPELINE" and "LANDLORD OPERATIONS" sections.

## CallPilot Architecture

Call coaching platform with 3 AI engines and 6 server modules. See `docs/CALLPILOT.md` for full details.

```
User → CallPilot App → Supabase (crm.contacts) → Select contact
                     → POST /api/calls/pre-call → AI briefing (Sonnet)
                     → POST /:id/start → coaching session starts (25s intervals)
                     → [Optional] POST /:id/connect → Twilio outbound call
                     → During call: GET /:id/coaching → live coaching cards (Haiku)
                     → POST /:id/end → transcription (Deepgram) + summary (Sonnet) + Claw task
```

### Server Modules (`openclaw-server/src/callpilot/`)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `routes.ts` | 16 API endpoints at `/api/calls/*` | `default` (Express Router) |
| `engines.ts` | 3 AI engines (pre-call, coaching, post-call) | `generatePreCallBriefing()`, `generateCoachingCard()`, `generatePostCallSummary()` |
| `voice.ts` | Twilio outbound calls + webhooks | `initiateOutboundCall()`, `voiceWebhookRouter` |
| `session.ts` | Active call manager + post-call pipeline | `startCallSession()`, `endCallSession()`, `getSessionInfo()` |
| `transcription.ts` | Deepgram speech-to-text | `transcribeRecording()`, `getCallTranscript()` |
| `db.ts` | Schema-aware Supabase queries | `cpQuery()`, `cpInsert()`, `cpUpdate()` |

### Integration Loop
When a call ends, `session.ts:endCallSession()` creates a `claw.tasks` entry (type: `call_completed`), closing the loop between CallPilot and The Claw. The next briefing includes call outcomes and pending action items.

Key integration: CallPilot reads from `crm.contacts` (same contacts The Claw uses), so data from either app is immediately available in the other.

## Cost Tracking

All AI and telephony costs tracked in `claw.cost_log`:

| Service | Actions | Cost Calculation |
|---------|---------|------------------|
| `claude_haiku` | intent classification, coaching cards, briefing format | $0.80/$4 per MTok |
| `claude_sonnet` | agent runs, pre-call briefings, post-call summaries | $3/$15 per MTok |
| `twilio_sms` | SMS send/receive | ~$0.0079/segment |
| `twilio_voice` | outbound calls | ~$0.014/min |
| `deepgram` | transcription | ~$0.0043/min |
| `bland_ai` | autonomous AI calls (Phase 2) | ~$0.09/min |

Budget enforcement via `claw.budget_limits` (per-user, per-service). See `docs/ROADMAP.md` for full cost tracking architecture.

## Security

- **RLS on every table** — all 170 tables have RLS enabled
- **Service role key server-only** — only in openclaw-server, never in client code
- **Threat scanning** on all inbound webhook messages (prompt injection, SQL injection, XSS, etc.)
- **Rate limiting** per user per channel (10/min burst, 100/hr channel)
- **Circuit breakers** in `ai.openclaw_circuit_breakers` (global, per-user, per-channel)
- **Twilio signature validation** on SMS webhooks
- **Prompt injection delimiters** — agent context wrapped in `<user_message>` tags
- **Tool error sanitization** — don't leak schema/table names to AI on tool failure
- **UUID validation** on phone→user mapping (defense against config injection)

## Cross-System Dependencies

### What Each Piece Owns

| App | Reads | Writes |
|-----|-------|--------|
| **Doughy** | auth.*, crm.*, investor.*, landlord.*, claw.tasks | auth.*, crm.*, investor.*, landlord.* |
| **CallPilot** | crm.*, investor.*, landlord.*, callpilot.* | callpilot.* |
| **The Claw** | claw.*, callpilot.calls | claw.trust_config, claw.connections |
| **Server** | Everything (service_role) | Everything (service_role) |

### Data Flow for Key Operations

- **Morning briefing:** Server reads crm + investor + landlord + callpilot -> generates briefing -> broadcasts to SMS/Discord
- **Draft follow-up:** Server reads lead data -> Claude generates draft -> stored in claw.approvals -> user reviews in Claw app
- **Incoming SMS:** Twilio -> Server classifies intent -> routes to handler -> stores in claw.messages
- **AI call:** Server -> Bland API -> call happens -> webhook -> Server stores in callpilot.calls -> broadcasts result
- **Pre-call briefing:** CallPilot -> Server /api/calls/pre-brief -> reads lead data -> Claude generates -> returns to CallPilot
- **Vendor dispatch:** Maintenance request -> Server matches contractor -> drafts message -> trust check -> sends

### Doughy's Responsibilities
- Source of truth for CRM data (crm.contacts, crm.leads)
- Source of truth for investor data (deals_pipeline, properties, follow_ups)
- Source of truth for landlord data (bookings, maintenance, vendors)
- Design system source of truth (tokens, colors, components) — CallPilot and The Claw match these
