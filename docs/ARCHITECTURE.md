# Architecture Overview

> Last updated: 2026-02-22

## Four-Product Ecosystem

| Product | Role | Analogy | Stack | Location |
|---------|------|---------|-------|----------|
| **Doughy** | Source of truth -- all data lives here | The brain | Expo 54 + RN + Supabase + TypeScript | `apps/doughy/` |
| **Bouncer** | Human control plane -- agent toggles, kill switch, approvals | The control room | Expo 54 + RN + Zustand + custom theme | `apps/bouncer/` |
| **CallPilot** | Communication companion -- calling + coaching | The voice | Expo 54 + RN + hooks+Context | `apps/callpilot/` |
| **OpenClaw Platform** | AI brain -- 6 specialized agents | The nervous system | OpenClaw + LiteLLM + MCP servers | `server/openclaw/` |

All apps share **one Supabase instance** (staging: `lqmbyobweeaigrwmvizo`). Auth is shared via Supabase Auth. Schemas are separated by data ownership.

**Design philosophy:** ADHD-friendly. One screen, three answers. Three taps or less. Cards over tables. Progressive disclosure.

## Monorepo Structure

```
doughy/                                # Clean monorepo root
├── apps/
│   ├── doughy/                        # Main mobile app (CRM)
│   │   ├── src/                       # Components, features, hooks, services, lib
│   │   ├── app/                       # Expo Router screens
│   │   ├── assets/                    # App assets
│   │   └── __mocks__/                 # Test mocks
│   ├── bouncer/                       # Control plane UI (renamed from the-claw-app)
│   └── callpilot/                     # Messaging/calling companion
├── server/
│   ├── openclaw/                      # OpenClaw config + 6 agent workspaces
│   │   ├── openclaw.json              # Main config (agents, channels, bindings)
│   │   ├── skills/                    # 9 prompt-based AI skills
│   │   └── workspaces/               # SOUL.md, MEMORY.md per agent
│   ├── webhook-bridge/                # Ingress spoke (validates webhooks, forwards to OpenClaw)
│   ├── tools/                         # Data spoke (Supabase MCP server)
│   └── queue-processor/               # Guarded-mode action executor
├── legacy/
│   └── custom-claw/                   # Archived Express server (reference only)
├── openclaw-server/                   # Custom server (still deployed, removed after migration)
├── packages/
│   └── design-tokens/                 # @secondly/design-tokens -- shared colors, spacing, glass
├── supabase/                          # Migrations and edge functions
├── scripts/                           # Build, deploy, seed scripts
└── docs/                              # Documentation
```

**Separation strategy:**
- **Doughy** = main CRM, source of truth for all investor/landlord data. Lives in `apps/doughy/`.
- **Bouncer** = human control plane for OpenClaw agents. Tightly coupled to OpenClaw API + Supabase `claw` schema.
- **CallPilot** = standalone product under the Secondly brand. CRM-agnostic communication companion.
- **OpenClaw** = AI brain. Hub-and-spoke architecture with MCP servers as data spokes.
- **Shared code** lives in `packages/` -- currently just design tokens.

## Hub-and-Spoke Architecture

```
                            ┌─────────────────────┐
                            │    BOUNCER UI        │
                            │  (Control Spoke)     │
                            └──────────┬──────────┘
                                       │
┌──────────────┐    ┌──────────────────┼──────────────────┐    ┌──────────────┐
│  Webhook     │    │                                      │    │   Squid      │
│  Bridge      ├───>│       OPENCLAW GATEWAY (HUB)         ├───>│   Proxy      │
│  (Ingress)   │    │       127.0.0.1:18789                │    │   (Egress)   │
└──────────────┘    │       Tailscale-only                  │    └──────────────┘
                    │                                      │
                    │   ┌──────────┐  ┌──────────┐         │
                    │   │ DISPATCH │  │ASSISTANT │         │
                    │   │ (router) │  │(personal)│         │
                    │   └──────────┘  └──────────┘         │
                    │   ┌──────────┐  ┌──────────┐         │
                    │   │ LEASING  │  │BOOKKEEP  │         │
                    │   │(tenants) │  │(finance) │         │
                    │   └──────────┘  └──────────┘         │
                    │   ┌──────────┐  ┌──────────┐         │
                    │   │ ACQUISI- │  │MARKETING │         │
                    │   │ TIONS    │  │(content) │         │
                    │   └──────────┘  └──────────┘         │
                    │                                      │
                    └──────────┬───────────────┬───────────┘
                               │               │
                    ┌──────────┴──┐   ┌────────┴────────┐
                    │  Supabase   │   │    LiteLLM      │
                    │  MCP Server │   │    Proxy         │
                    │  (Data)     │   │    (Models)      │
                    └─────────────┘   └─────────────────┘
```

**Why hub-and-spoke:** Each spoke (Supabase, Telegram, Twilio, QuickBooks, etc.) is independently deployable and replaceable. Adding a new integration is just registering a new MCP server -- zero changes to the hub or other spokes.

**Migration strategy (blue-green):** Custom server stays live on port 3000 while OpenClaw + webhook bridge are tested on port 3001. Nginx switches traffic after 48 hours of stable parallel operation. Instant rollback via Nginx config.

## How Auth Works

All three apps authenticate against the **same Supabase Auth** instance:
- **Doughy (mobile):** Supabase JS client with anon key + SecureStore for tokens + RLS
- **Bouncer (mobile):** Supabase Auth + OpenClaw API (via Tailscale)
- **CallPilot (mobile):** Supabase Auth via `callsFetch` wrapper + mock mode fallback
- **OpenClaw Platform:** Service role key via raw `fetch()` (bypasses RLS for server-side operations)
- **Edge Functions:** Service role key via Supabase client

Auth flow:
1. User signs in via Supabase Auth (email/password)
2. JWT issued with `auth.uid()` claim
3. All client-side queries filter via RLS using `auth.uid() = user_id`
4. Server-side operations use service role key + explicit `user_id` filtering

## The Agent System

### Overview

OpenClaw manages **6 specialized agents** coordinated by Dispatch. Each agent has defined responsibilities, tool permissions, and data isolation rules. See `docs/OPENCLAW_PLATFORM.md` for full details.

### Agent Roster

| Agent | Model | Role | Key Tools |
|-------|-------|------|-----------|
| **Dispatch** | Sonnet 4.5 | Router/coordinator -- never does direct work | `agentToAgent`, read (context only) |
| **Assistant** | Sonnet 4.5 / Haiku 4.5 | Personal: calendar, briefings, email triage | All CRM tools, send elevated |
| **Leasing** | Sonnet 4.5 / Haiku 4.5 | Tenant leads, screening, maintenance | Lead + maintenance tools, send elevated |
| **Bookkeeper** | Haiku 4.5 / Sonnet 4.5 | Invoices, expenses, P&L | Read tools only (QuickBooks = future) |
| **Acquisitions** | Sonnet 4.5 / Perplexity | Deals, comps, underwriting | Read + deal tools |
| **Marketing** | Sonnet 4.5 | Content, newsletters, social media | Read tools only (no CRM writes) |

### Legacy Agent Profiles (still in `claw.agent_profiles`)

| Slug | Name | Model | Status |
|------|------|-------|--------|
| `master-controller` | Master Controller | Haiku 4.5 | Replaced by Dispatch |
| `lead-ops` | Lead Operations Agent | Sonnet 4.5 | Replaced by Leasing + Acquisitions |
| `draft-specialist` | Draft Specialist | Sonnet 4.5 | Capabilities absorbed into agents |

### Tool Registry (21 tools via Supabase MCP Server)

**Read Tools (12):**

| Tool | Schema | Table | Description |
|------|--------|-------|-------------|
| `read_deals` | investor | deals_pipeline | Active deals with stage, value, lead info |
| `read_leads` | crm | contacts | Contacts filtered by module (investor/landlord) |
| `read_bookings` | landlord | bookings | Upcoming bookings with property info |
| `read_follow_ups` | investor | follow_ups | Overdue and upcoming follow-ups |
| `read_properties` | investor | properties | Investment properties with details |
| `read_maintenance` | landlord | maintenance_requests | Open maintenance requests |
| `read_vendors` | landlord | vendors | Vendor list with ratings |
| `read_campaigns` | investor | campaigns | Marketing campaigns status |
| `read_comps` | investor | comps | Comparable property data |
| `read_conversations` | investor | conversations | Active deal conversations |
| `read_portfolio` | investor | portfolio_entries | Portfolio summary |
| `read_contacts_detail` | crm | contacts | Detailed contact info |

**Write Tools (9):**

| Tool | Schema | Table | Description |
|------|--------|-------|-------------|
| `draft_sms` | -- | -- | Pure function: returns draft object (no DB) |
| `create_approval` | claw | approvals | Inserts pending approval entry |
| `create_lead` | crm | leads | Create new CRM lead (module-tagged) |
| `update_lead` | crm | leads | Update lead status/details |
| `update_deal_stage` | investor | deals_pipeline | Move deal to new pipeline stage |
| `mark_followup_complete` | investor | follow_ups | Mark follow-up as done |
| `send_whatsapp` | -- | -- | Send via WhatsApp Business API |
| `send_email` | -- | -- | Send via Gmail API |
| `add_note` | crm | contacts | Add note to contact record |

All CRM queries filter by `module` parameter (defaults to `investor`). The `assertModule()` validator prevents PostgREST injection.

### Approval Flow

1. Agent calls `create_approval` tool -- row inserted in `claw.approvals` (status: pending)
2. Push notification sent to user via `notification-push` edge function
3. User opens Bouncer app -- sees pending approval
4. User approves/rejects/edits
5. On approve: action executed (SMS via Twilio, email via Gmail, etc.)
6. Approval status updated: `approved` -> `executed`

## Communication Flow: "Brief Me" End-to-End

```
1. User sends "Brief me" via Telegram
2. Telegram -> OpenClaw gateway (native channel binding)
3. Dispatch agent receives, classifies as briefing request
4. Dispatch delegates to Assistant via agentToAgent
5. Assistant calls generate_briefing MCP tool
6. MCP server runs 9 parallel queries across 5 schemas:
   - crm.leads, investor.deals_pipeline, investor.portfolio_entries
   - investor.conversations, investor.ai_queue_items, investor.follow_ups
   - landlord.bookings, landlord.maintenance_records
7. Assistant formats briefing naturally (investor pipeline + landlord operations)
8. Response delivered via Telegram
```

## Communication Flow: "Draft Follow-Ups" End-to-End

```
1. User sends "Draft follow-ups" via Telegram or SMS
2. Dispatch routes to Assistant
3. Assistant calls read_follow_ups + read_leads MCP tools
4. For each overdue lead: calls draft_sms then create_approval
5. Approvals created in claw.approvals (status: pending)
6. Push notification sent to Bouncer app
7. User reviews in Bouncer -> approves -> SMS sent via Twilio
```

## LLM Strategy

| Use Case | Model | Why |
|----------|-------|-----|
| Agent routing | Sonnet 4.5 | Complex context analysis for delegation |
| Personal assistant | Sonnet 4.5 | Calendar, briefings, email triage |
| Tenant screening | Sonnet 4.5 | Complex analysis with compliance requirements |
| Intent triage | Haiku 4.5 | Fast, cheap sorting and categorization |
| Bookkeeping categorization | Haiku 4.5 | Simple pattern matching |
| Market research | Perplexity Sonar | Web search with citations |

All models routed through LiteLLM proxy (credential broker, budget caps). OpenClaw never sees real API keys.

## Database: 9 Schemas, 170 Tables

| Schema | Tables | Purpose |
|--------|--------|---------|
| `claw` | 19 | Agent orchestration: profiles, tasks, runs, approvals, messages, notifications, budgets, kill switch, cost_log, connections, email_rules |
| `callpilot` | 10 | Call coaching: calls, transcripts, coaching cards, summaries, action items, scripts, briefings |
| `ai` | 25 | AI infrastructure: security, memory, knowledge, circuit breakers |
| `investor` | 34 | Real estate investment: deals, properties, campaigns, portfolio |
| `landlord` | 19 | Rental management: properties, rooms, bookings, vendors |
| `crm` | 5 | Customer relationships: contacts, leads, skip trace, opt-outs |
| `integrations` | 9 | Third-party: Gmail, Seam locks, Meta, Postgrid |
| `callpilot` | 10 | Call coaching, transcripts, briefings |
| `public` | 57 | Shared: users, workspaces, billing, calls, system logs |

See `docs/SCHEMA_MAP.md` for complete table-by-table breakdown.

## Module Separation (Feb 2026)

The system manages two distinct business modes that must never be mixed:

| Module | Role | Contacts Are | Data Sources |
|--------|------|-------------|--------------|
| `investor` | Dino as **BUYER** | Property sellers, deal leads | deals_pipeline, follow_ups, campaigns |
| `landlord` | Dino as **OWNER** | Tenants, guests, rental contacts | bookings, maintenance, vendors |

Module tag is on: `crm.contacts.module`, `crm.leads.module`, `callpilot.script_templates.module`

All CRM queries in agent tools and briefings filter by module. The briefing engine separates output into "INVESTOR PIPELINE" and "LANDLORD OPERATIONS" sections.

## CallPilot Architecture

Unified call stream with module-aware contacts, post-call CRM extraction, and 3 AI engines. See `docs/CALLPILOT.md` for full details.

```
User -> CallPilot App -> Supabase (crm.contacts) -> Select contact
                      -> POST /api/calls/pre-call -> AI briefing (Sonnet)
                      -> POST /:id/start -> coaching session starts (25s intervals)
                      -> [Optional] POST /:id/connect -> Twilio outbound call
                      -> During call: GET /:id/coaching -> live coaching cards (Haiku)
                      -> POST /:id/end -> transcription (Deepgram) + summary (Sonnet) + Claw task
                      -> POST /:id/push-extractions -> CRM data push to claw.transcript_extractions
```

### Integration Loop
When a call ends, a `claw.tasks` entry is created (type: `call_completed`), closing the loop with OpenClaw. The next briefing includes call outcomes and pending action items.

## Cost Tracking

All AI and telephony costs tracked in `claw.cost_log`:

| Service | Actions | Cost Calculation |
|---------|---------|------------------|
| `claude_haiku` | triage, categorization, coaching cards | $0.80/$4 per MTok |
| `claude_sonnet` | agent runs, briefings, screening, drafting | $3/$15 per MTok |
| `twilio_sms` | SMS send/receive | ~$0.0079/segment |
| `twilio_voice` | outbound calls | ~$0.014/min |
| `deepgram` | transcription | ~$0.0043/min |
| `perplexity` | web research | varies |

Budget enforcement via LiteLLM proxy ($5/day initial cap) + `claw.budget_limits` (per-user, per-service).

## Security

- **RLS on every table** -- all 170 tables have RLS enabled
- **Service role key server-only** -- only in OpenClaw server, never in client code
- **Tailscale VPN** -- OpenClaw gateway accessible only through Tailscale network
- **Egress filtering** -- Squid proxy with deny-by-default allowlist
- **Credential brokering** -- LiteLLM proxy holds API keys, OpenClaw never sees them
- **Threat scanning** on all inbound webhook messages (prompt injection, SQL injection, XSS)
- **Per-agent tool isolation** -- each agent has explicit allow/deny tool lists
- **Prompt injection delimiters** -- agent context wrapped in `<user_message>` tags
- **Tool error sanitization** -- don't leak schema/table names to AI on tool failure
- **Hard-blocked domains** -- Chinese AI endpoints (DeepSeek, Qwen, etc.) blocked at proxy level

## Cross-System Dependencies

### What Each Piece Owns

| App | Reads | Writes |
|-----|-------|--------|
| **Doughy** | auth.*, crm.*, investor.*, landlord.*, claw.tasks | auth.*, crm.*, investor.*, landlord.* |
| **CallPilot** | crm.*, investor.*, landlord.*, callpilot.* | callpilot.* |
| **Bouncer** | claw.*, OpenClaw API | claw.trust_config, claw.connections |
| **OpenClaw** | Everything (service_role) | Everything (service_role) |

### Data Flow for Key Operations

- **Morning briefing:** OpenClaw cron -> Assistant reads crm + investor + landlord -> generates briefing -> Telegram
- **Draft follow-up:** Assistant reads lead data -> drafts messages -> creates approvals -> user reviews in Bouncer
- **Incoming SMS:** Twilio -> webhook bridge -> OpenClaw -> Dispatch -> specialist agent -> response
- **Vendor dispatch:** Maintenance request -> Leasing matches contractor -> drafts message -> approval gate -> sends
- **Pre-call briefing:** CallPilot -> server API -> reads lead data -> Claude generates -> returns to CallPilot

### Doughy's Responsibilities
- Source of truth for CRM data (crm.contacts, crm.leads)
- Source of truth for investor data (deals_pipeline, properties, follow_ups)
- Source of truth for landlord data (bookings, maintenance, vendors)
- Design system source of truth -- shared via `@secondly/design-tokens` package (`packages/design-tokens/`)

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ContactCard.tsx`, `FilterSheet.tsx` |
| Hooks | `use` prefix, camelCase | `useRentalProperties.ts`, `useThemeColors.ts` |
| Stores | kebab-case + `-store` | `rental-properties-store.ts`, `booking-charges-store.ts` |
| Screens (app/) | kebab-case | `sign-in.tsx`, `forgot-password.tsx` |
| Services | camelCase | `conversationDeletionService.ts`, `googleAuth.ts` |
| Features | kebab-case folders | `rental-properties/`, `skip-tracing/`, `lead-inbox/` |
| Route groups | parentheses | `(tabs)`, `(auth)`, `(modals)`, `(admin)` |
| Dynamic routes | brackets | `[userId].tsx`, `[callId].tsx` |
| Types files | kebab-case | `filter-sheet-types.ts`, `detail-types.ts` |
| Helper files | kebab-case | `call-summary-helpers.ts`, `metric-card-helpers.ts` |
| Style files | kebab-case + `-styles` | `focused-sheet-styles.ts`, `ask-tab-styles.ts` |
| Constants files | kebab-case + `-constants` | `add-lead-constants.ts`, `stage-stepper-constants.ts` |
| DB columns | snake_case | `created_at`, `user_id`, `checkout_date` |
| DB tables | snake_case | `deals_pipeline`, `agent_profiles` |
| DB schemas | lowercase | `investor`, `landlord`, `claw`, `callpilot` |

**Exports:** Named exports for shared code (`src/`). Default exports for Expo Router screens (`app/`).

**Import alias:** Always use `@/` (e.g., `import { Button } from '@/components/ui'`).

## Environment & Setup

### Supabase Projects

| Environment | Project ID | Region | URL |
|------------|-----------|--------|-----|
| Staging (dev) | `lqmbyobweeaigrwmvizo` | us-east-1 | `https://lqmbyobweeaigrwmvizo.supabase.co` |
| Production | `vpqglbaedcpeprnlnfxd` | us-west-2 | `https://vpqglbaedcpeprnlnfxd.supabase.co` |

### Environment Variables

Client-side (Expo): prefix with `EXPO_PUBLIC_`

| Variable | Where | Purpose |
|----------|-------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env` | Supabase anon key |
| `EXPO_PUBLIC_USE_MOCK_DATA` | `.env` | Set `true` for mock data mode |

Server-side (OpenClaw + webhook bridge):

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | `.env` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `.env` | Service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | `.env` | Claude API access (via LiteLLM) |
| `TWILIO_ACCOUNT_SID` | `.env` | Twilio SMS/voice |
| `TWILIO_AUTH_TOKEN` | `.env` | Twilio signature validation |
| `SERVER_URL` | `.env` | Must be `https://openclaw.doughy.app` (Twilio signature) |
| `OPENCLAW_GATEWAY_TOKEN` | `.env` | Gateway auth token |

### Setup

```bash
# Install dependencies
npm install

# Start Doughy app
cd apps/doughy && npx expo start

# Start Bouncer
cd apps/bouncer && npx expo start

# Start CallPilot
cd apps/callpilot && npx expo start

# Regenerate Supabase types (after schema changes)
npm run db:types:stage
npm run db:types:prod

# Validate before PR
cd apps/doughy && npm run validate     # lint + type-check + tests
```

## Seed Data

### Demo User

| Field | Value |
|-------|-------|
| User ID | `3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce` |
| Workspace ID | `90886395-a5ba-48c1-b72b-8cdfa07d5854` |

### Demo Contacts

| Name | Role | Phone | Module |
|------|------|-------|--------|
| Sarah Martinez | Tenant | +14095551234 | landlord |
| Mike Johnson | Plumber (Johnson Plumbing LLC) | +17574723676 | landlord |

### Running the Seed

```bash
# Create demo data
node scripts/demo-seed.js create

# Reset demo data
node scripts/demo-seed.js delete && node scripts/demo-seed.js create
```

The seed creates: demo user, workspace, contacts (Sarah + Mike), sample properties, bookings, and maintenance requests. All data is scoped to the demo workspace.
