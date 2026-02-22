# Demo Readiness — Feb 20 Target

> **Last updated:** 2026-02-18 (repos synced from GitHub, code verified)
> This is the source of truth for current state. Reference this before building.

---

## System Overview

Three apps + one server, all in this monorepo, sharing one Supabase backend (staging).

| Component | Location | Data Source | Status |
|-----------|----------|-------------|--------|
| **Doughy** (main app) | `src/`, `app/` | Supabase direct (RPC layer) | All screens LIVE |
| **The Claw** | `apps/the-claw-app/` | Supabase + OpenClaw server API | All sections LIVE, mock adapter deleted |
| **CallPilot** | `apps/callpilot/` | Supabase + server API (when env vars set) + mock fallback | Services wired, message send stubbed |
| **OpenClaw Server** | `openclaw-server/` | Supabase (secret key) + external APIs | Deployed to `openclaw.doughy.app` |

**Supabase Staging:** `lqmbyobweeaigrwmvizo` (us-east-1) — 170 tables, 7 schemas, 62 edge functions, RLS on all tables.

**Repos synced:** Both `apps/the-claw-app` and `apps/callpilot` pulled from GitHub latest (2026-02-18). The Claw at `f7a9425`, CallPilot at `13c7716`.

---

## Doughy (Main App) — FULLY LIVE

All screens query real Supabase staging via the RPC layer (`src/lib/rpc/`). No mocks in use.

### Tab Structure
- **Investor Mode:** Leads | Properties | Deals | Settings
- **Landlord Mode:** People (Contacts) | Properties | Bookings | Settings

### What's Wired (Real DB)

| Screen | Data Source | Hook/Query |
|--------|------------|------------|
| Leads list + detail | `crm.leads` filtered `module='investor'` | `useLeads()`, `useLeadsWithProperties()` |
| Properties (investor) | `investor.properties` via RPC | `getPropertyDeals()`, `getPropertiesWithLead()` |
| Deals list + detail | `investor.deals_pipeline` | `useDeals()`, `fetchDealsPaginated()` |
| Contacts (landlord) | `crm.contacts` filtered `module='landlord'` | Direct query |
| Properties (landlord) | `landlord.properties` | `useRentalProperties()` |
| Bookings | `landlord.bookings` via RPC | `getBookingsWithContact()` + Zustand store |
| Conversations | `investor.conversations` via RPC | `getConversationsWithLead()` |
| Settings | User prefs | Live |

### Auth
- Supabase auth with ExpoSecureStoreAdapter
- Dev credentials in `.env`: `admin@doughy.app` / `testdev123!`

### Demo Data Seeding
- **In-app (admin):** DevToolsSection on AdminDashboardScreen — seeds 40 test users (`__DEV__` mode only)
- **CLI script:** `node scripts/demo-seed.js create` — seeds ~300+ records (leads, contacts, properties, deals, vendors, calls, transcripts, conversations, messages, draft suggestions, cost log, email rules, Claw connections). Tracked via `public.demo_seed_log`.
- **Server endpoint:** `POST /api/demo/seed-data/*` — requires `DEMO_SEED_ENABLED=true`

---

## The Claw — FULLY LIVE (Control Panel)

The Claw is a **monitoring and control panel**. Users interact with the AI agent via SMS/Discord/WhatsApp/email — The Claw monitors what agents do and lets users approve/deny/kill.

**Mock adapter deleted.** Only `SupabaseGatewayAdapter` exists.

### Features (all LIVE)

| Feature | Data Source | Notes |
|---------|------------|-------|
| Queue (approve/deny) | `claw.action_queue` + Realtime | Server API with DB fallback |
| Connections | `claw.connections` | Auto-initializes defaults for new users |
| Activity log | Server `/activity` endpoint | Falls back to `claw.cost_log` direct |
| Cost monitoring | `claw.cost_log` direct | Monthly breakdown + stats |
| Trust levels | `claw.trust_config` | 4 levels + per-action overrides |
| Kill switch | Server API + DB fallback | Confirmation dialog, haptic feedback |
| Gmail OAuth | Connection detail screen | Opens server OAuth flow |
| Push notifications | `claw.push_tokens` | Full lifecycle: register, store, deactivate |

### Adapter Methods Without UI (available but no screen built)
- `sendMessage()`, `getMessages()`, `getBriefing()`, `getAgentProfiles()`, `toggleAgentProfile()`

### Migrations (9 files in `apps/the-claw-app/supabase/migrations/`)
- trust_config, connections, action_queue, cost_log, seed_defaults
- transcript_extractions, draft_suggestions, seed_demo_data, push_tokens

---

## CallPilot — Services Wired, Send Stubbed

CallPilot's CLAUDE.md says "All data is mock" but this is **OUTDATED**. The actual code has conditional wiring — when `EXPO_PUBLIC_SUPABASE_URL` + anon key are set, it connects to real Supabase. When missing, falls back to mock mode.

### Service Layer Truth

| Service | Real DB? | Details |
|---------|----------|---------|
| `contactsService.ts` | **YES** (when env set) | Queries `crm.contacts` with full CRUD, temperature calculation, module filtering |
| `callsService.ts` | **YES** (when env set) | Calls server `GET /api/calls` via `callsFetch()` with JWT |
| `briefsService.ts` | **YES** (when env set) | Checks `callpilot.pre_call_briefings` cache, generates via server API |
| `useClawSuggestions.ts` | **YES** (when env set) | Queries `claw.draft_suggestions` + Realtime INSERT subscription |
| `communicationsService.ts` | **NO** | Returns hardcoded `mockCommunications` — no DB wiring |
| `memosService.ts` | **NO** | Returns hardcoded `mockVoiceMemos` |

### What's Still Stubbed

| Feature | Current Behavior | Server Endpoint Available? |
|---------|-----------------|---------------------------|
| **Message send** | `Alert.alert('Coming Soon')` | YES: `POST /api/messages/send` |
| **Claw suggestion send** | `Alert.alert('Not Yet Available')` | YES: approve updates DB, but no send chain |
| **Communications timeline** | Mock data only | YES: `GET /api/calls/messages/:leadId` |
| **Call transcripts** | Hardcoded mock | YES: `GET /api/calls/:id/transcript` |
| **CRM push approval** | Alert only | YES: `POST /api/calls/:id/approve-all` |
| **Contact create/update** | Throws in mock mode | Supabase direct (service ready) |
| **Active call coaching** | Placeholder screen | YES: `GET/POST /api/calls/:id/coaching` |
| **Voice memos** | Mock data | NOT YET: needs Deepgram + upload |

### "Coming Soon" Alerts (8 instances)
- `app/messages/[contactId].tsx:82` — messaging
- `app/messages/[contactId].tsx:87` — AI reply send
- `app/messages/[contactId].tsx:144` — blocking
- `app/contact/[id].tsx` — editing, deleting contacts (4 alerts)
- `app/call-summary/[callId].tsx` — CRM push (3 alerts)

---

## OpenClaw Server — Deployed

Express.js AI gateway at `openclaw.doughy.app`.

### Channel Routing (How SMS Works)

**Phone-to-user mapping:** `CLAW_PHONE_USER_MAP` env var (JSON: `{"+17575551234": "user-uuid"}`)

**3-step routing in `src/claw/router.ts`:**

```
Step 0: Demo prefix? (LEAD: / TENANT: / VENDOR:)
  → Route as that persona (for testing multiple personas from one phone)

Step 1: Known Claw user? (phone in CLAW_PHONE_USER_MAP)
  → handleClawMessage() → intent classification → agent response → auto-reply

Step 2: Known lead/contact? (phone in crm.contacts or crm.leads)
  → Store in crm.messages → push notification → auto-generate draft reply suggestion
  → Does NOT auto-send — creates claw.draft_suggestions for user review

Step 3: Unknown sender?
  → Auto-create draft lead (auto_created: true, review_status: pending_review)
  → Push notification + Discord broadcast
```

### Demo Scenarios (tested via SMS)

**Scenario: "Plumbing service texts 757 number"**
- Text to Twilio number: `VENDOR: Hi, I can come fix the toilet at 2pm tomorrow`
- Router detects `VENDOR:` prefix → routes as vendor persona
- Server: stores message, creates draft reply approval for owner
- The Claw app: shows pending approval in queue

**Scenario: "Tenant texts 703 number about maintenance"**
- Text: `TENANT: The kitchen sink is leaking badly, can someone come look at it?`
- Router detects `TENANT:` prefix → routes as tenant persona
- Server: stores in `crm.messages`, generates draft suggestion
- CallPilot: Claw suggestion card appears (Realtime subscription)

**Scenario: "Owner texts for briefing"**
- Text from mapped phone: `Brief me`
- Router: Step 1 match → `handleClawMessage()` → intent: "briefing"
- Server: queries 5 tables, formats via Sonnet, auto-replies via SMS

**Scenario: "Dispatch plumber"**
- Owner texts: `Dispatch plumber to Oak property for broken toilet`
- Intent: "dispatch" → extracts category, issue, property
- Server: creates `landlord.maintenance_records`, finds vendor, creates 2 draft SMSes:
  - To contractor: "Hi Mike, plumbing issue at Oak property..."
  - To tenant: "Hi Sarah, I've contacted Mike's Plumbing..."
- Both require approval before sending

### Email Capture (Gmail OAuth)

**Platform detection** (by email domain):
- Landlord: `airbnb.com`, `furnishedfinder.com`, `turbotenant.com`, `zillow.com`, `apartments.com`, `hotpads.com`, `booking.com`, `vrbo.com`, `facebook.com`
- Investor: RE agent emails, seller inquiries

**Flow:**
```
Gmail Pub/Sub webhook → getNewMessages() → captureInboundEmail()
→ Find/create CRM contact by email → AI analysis (Haiku: sentiment, intent, urgency)
→ Create crm.touches record → Update contact score
→ If draft-worthy: draft-specialist creates reply for approval
```

**Setup required:** Gmail OAuth connected via The Claw app (connection detail → "Connect Gmail" button)

### Auto-Draft Reply Logic
- When a lead/contact replies via SMS → server auto-generates a draft reply via Haiku
- Draft pushed to `claw.draft_suggestions` table
- CallPilot's `useClawSuggestions` hook picks it up via Realtime subscription
- User reviews and manually approves (no auto-send for safety)

### API Endpoints (full list)

**Claw API** (`/api/claw/*`, 18 endpoints, JWT-authed)
**CallPilot API** (`/api/calls/*`, 20+ endpoints, JWT-authed)
**Messages API** (`/api/messages/send`, JWT-authed)
**Webhooks** (`/webhooks/sms|gmail|whatsapp|telegram|voice`)
**OAuth** (`/oauth/gmail/start|callback`, `/oauth/disconnect`)
**Cron** (`/cron/morning-briefing|follow-up-nudges|renew-watches`)
**Demo** (`/api/demo/simulate-email|simulate-sms|seed-data/*`)
**Health** (`/health`, `/status`)

See previous version of this doc for full endpoint details.

### Required Server Env Vars
```
SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CLOUD_PROJECT_ID
CLAW_PHONE_USER_MAP='{"<your-phone>": "<your-user-uuid>"}'
```

---

## Cross-App Data Flow

```
Doughy ─── Supabase (direct, RLS) ──── investor.*, landlord.*, crm.*
                                          │
The Claw ── OpenClaw Server API ─────── claw.*, callpilot.*
            └─ Fallback: Supabase direct  │
                                          │
CallPilot ── OpenClaw Server API ─────── crm.contacts, callpilot.*, claw.draft_suggestions
             └─ Supabase direct (contacts, suggestions)
```

Doughy NEVER calls the server — only Supabase. The Claw and CallPilot consume the server API.

---

## Friday Demo Next Steps

### PRIORITY 1: Verify Infrastructure (Before Any Code)
- [ ] Confirm OpenClaw server health: `curl https://openclaw.doughy.app/health`
- [ ] Confirm `CLAW_PHONE_USER_MAP` has your phone number → your user UUID
- [ ] Confirm Twilio webhook URL points to `https://openclaw.doughy.app/webhooks/sms`
- [ ] Confirm demo data is seeded: `node scripts/demo-seed.js verify` → `create` if needed
- [ ] Confirm all 3 apps have `.env` with staging Supabase URL + anon key + server URL
- [ ] Test SMS: text "Brief me" from your mapped phone → should get a briefing back
- [ ] Test demo prefix: text "TENANT: The sink is leaking" from any phone → should create draft

### PRIORITY 2: Wire CallPilot Message Send (Server Endpoint Exists)
**Files to change:**
- `apps/callpilot/app/messages/[contactId].tsx` — replace "Coming Soon" alert with API call
- `apps/callpilot/src/services/communicationsService.ts` — add `sendMessage()` using `POST /api/messages/send`
- Wire Claw suggestion approve → send chain (approve draft → call send endpoint)

**Server already handles:** `POST /api/messages/send` accepts `{leadId?, contactId?, channel: "sms"|"email", body, conversationId?}` and sends via Twilio.

### PRIORITY 3: Wire CallPilot Communications Timeline (Server Endpoint Exists)
**Files to change:**
- `apps/callpilot/src/services/communicationsService.ts` — replace `mockCommunications` with `GET /api/calls/messages/:leadId`
- `apps/callpilot/src/hooks/useConversations.ts` — update to use real data

### PRIORITY 4: Gmail OAuth Test
- Open The Claw app → Connections → Gmail → "Connect Gmail"
- Complete OAuth flow → confirm tokens saved
- Send test email from a @furnishedfinder.com or @airbnb.com address
- Verify: CRM contact created, touch record logged, draft reply generated

### PRIORITY 5: Wire CallPilot Transcripts + CRM Push
**Files to change:**
- `apps/callpilot/app/transcript/[callId].tsx` — replace mock data with `GET /api/calls/:id/transcript`
- `apps/callpilot/app/call-summary/[callId].tsx` — replace alerts with `POST /api/calls/:id/approve-all`

### POST-DEMO (Not for Friday)
- Active call coaching screen (WebRTC + Deepgram)
- Voice memo recording
- Contact create/update from CallPilot
- Monorepo workspace config (`docs/MONOREPO_TODO.md`)
- CI for sub-apps

---

## User TODOs (Not Code)
- **Pay for real Twilio number** — current CallPilot number is trial. Can use Discord/WhatsApp for now.
- **Verify server `.env`** — especially `CLAW_PHONE_USER_MAP` with 757/703 numbers mapped

---

## Key File Paths

### Doughy
- Supabase client: `src/lib/supabase.ts`
- RPC layer: `src/lib/rpc/` (investor.ts, landlord.ts, crm.ts)
- Demo seeder: `scripts/demo-seed.js`
- Tab layout: `app/(tabs)/_layout.tsx`

### The Claw
- Gateway adapter: `apps/the-claw-app/src/services/gateway/supabaseAdapter.ts`
- Main screen: `apps/the-claw-app/app/(main)/index.tsx`
- Notifications: `apps/the-claw-app/src/lib/notifications.ts`
- Connection detail (Gmail OAuth): `apps/the-claw-app/app/(main)/connection-detail.tsx`

### CallPilot
- Contacts service: `apps/callpilot/src/services/contactsService.ts` (WIRED)
- Calls service: `apps/callpilot/src/services/callsService.ts` (WIRED)
- Briefs service: `apps/callpilot/src/services/briefsService.ts` (WIRED)
- Communications service: `apps/callpilot/src/services/communicationsService.ts` (MOCK — wire this)
- Claw suggestions: `apps/callpilot/src/hooks/useClawSuggestions.ts` (WIRED + Realtime)
- Conversation screen: `apps/callpilot/app/messages/[contactId].tsx` (send STUBBED — wire this)
- API wrapper: `apps/callpilot/src/services/callpilotApi.ts`

### OpenClaw Server
- Entry point: `openclaw-server/src/server.ts`
- Router (SMS routing logic): `openclaw-server/src/claw/router.ts`
- Controller (intent + agents): `openclaw-server/src/claw/controller.ts`
- CallPilot routes: `openclaw-server/src/callpilot/routes.ts`
- Messages routes: `openclaw-server/src/messages/routes.ts`
- Config (phone map): `openclaw-server/src/config.ts`
- Email capture: `openclaw-server/src/services/email-capture.ts`
- Channel adapters: `openclaw-server/src/channels/`
