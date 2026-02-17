# Roadmap

> Product vision, architecture decisions, and phased build plan.

## Product Vision

Three complementary products sharing one Supabase backend:

| Product | Role | Analogy |
|---------|------|---------|
| **Doughy** | Source of truth — all data lives here | The brain |
| **The Claw** | Nervous system — AI control plane for automation | The nervous system |
| **CallPilot** | Communication companion — human and AI-powered calling | The voice |

**Design philosophy:** ADHD-friendly. One screen, three answers. Three taps or less. Cards over tables. Progressive disclosure — show what matters now, hide the rest behind a tap.

---

## Current State (Feb 2026)

### Deployed and Working
- The Claw SMS/Discord agent — intent classification, briefings, data queries, draft follow-ups, approval workflow
- OpenClaw server — Express gateway on DigitalOcean droplet (`openclaw.doughy.app`)
- Module separation — `investor`/`landlord` tags on crm.contacts, crm.leads, callpilot.script_templates
- CallPilot CRM bridge — real contacts from Supabase, pre-call briefings via AI
- Kill switch + agent profile management endpoints
- Voice integration (Twilio outbound), transcription (Deepgram), coaching session manager
- Post-call summary + Claw integration loop (call completes -> claw.tasks entry)

### Demo-Ready (Feb 20)
- "Brief me" -> Overdue follow-ups, deals needing action, upcoming bookings (module-separated, no score noise)
- "Help" -> Structured capability categories (BRIEFING / DATA / ACTIONS / ADVICE)
- CallPilot -> Real CRM contacts, AI-generated pre-call briefings
- The Claw app -> Activity feed, approval queue, chat with The Claw

### Not Yet Built
- Bland AI autonomous calling
- Cost tracking dashboard
- Lead temperature auto-prioritization
- UI standardization across all 3 apps (liquid glass)
- Admin module in Doughy Settings
- Web admin panel

---

## Doughy Modules

Users subscribe to one or many business modules:

| Module | Who You Are | Your Contacts Are | Key Data |
|--------|------------|-------------------|----------|
| **Real Estate (Investor)** | Property buyer | Sellers, deal leads, agents | deals_pipeline, follow_ups, campaigns, comps |
| **Landlord** | Property owner | Tenants, guests, vendors | bookings, maintenance, rooms, vendors |
| **Relationship** (future) | Networker | Friends, mentors, clients | touchpoints, gifts, milestones, reminders |

Module tag on `crm.contacts.module`, `crm.leads.module`, `callpilot.script_templates.module`. All queries filter by module. Briefings separate output by module.

---

## Lead Temperature System

Prioritize spend based on engagement signals. Hot leads get human attention; cold leads get AI automation.

| Temperature | Signal | Action | Tool |
|-------------|--------|--------|------|
| **Hot** | Replied recently, active deal, high score | Human calls via CallPilot | CallPilot + coaching |
| **Warm** | No reply in 3-7 days, had prior engagement | AI re-engagement call | Bland AI |
| **Cold** | No reply in 7-14 days, low/no engagement | AI voicemail drop or text | Bland AI |
| **Dead** | No response after 3+ attempts | Stop spending, archive | The Claw auto-archive |

**Auto-escalation:** Cold -> Warm -> Hot as leads respond. The Claw monitors responses and adjusts temperature automatically.

**Cost control:** Never spend more than $X/lead/month. Hot leads can cost more. Dead leads cost $0. Budget limits per module, per lead temperature tier.

---

## Cost Tracking

Track all AI/telephony costs in one place for visibility and budget enforcement.

### Schema: `claw.cost_log`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK to auth.users |
| `service` | TEXT | `claude_haiku`, `claude_sonnet`, `twilio_sms`, `twilio_voice`, `deepgram`, `bland_ai` |
| `action` | TEXT | `briefing`, `agent_run`, `sms_send`, `voice_call`, `transcription`, `ai_call` |
| `input_tokens` | INT | For LLM calls |
| `output_tokens` | INT | For LLM calls |
| `duration_seconds` | INT | For voice/transcription |
| `cost_cents` | INT | Cost in cents (avoids float precision) |
| `metadata` | JSONB | call_id, agent_run_id, model, etc. |
| `created_at` | TIMESTAMPTZ | When the cost was incurred |

### Budget Enforcement
- `claw.budget_limits` table already exists — per-user, per-service limits
- Server checks budget before expensive operations (agent runs, voice calls)
- Weekly cost summary in Monday morning briefing

---

## Bland AI Integration (Phase 2)

Autonomous AI calling for warm/cold leads. Bland handles the call; results flow back to The Claw.

### How It Works
1. The Claw identifies leads needing follow-up (warm/cold temperature)
2. Creates Bland AI call via REST API with script + lead context
3. Bland calls the lead autonomously (BYOT — uses our Twilio number)
4. Call completes -> Bland webhook -> openclaw-server
5. Results stored: transcript, outcome, next_step
6. The Claw updates lead temperature and creates follow-up tasks

### Architecture
```
The Claw (scheduler)
  -> POST bland.ai/v1/calls (with script + context)
  -> Bland makes call via BYOT Twilio
  -> POST /webhooks/bland/completed (webhook)
  -> openclaw-server processes results
  -> callpilot.calls (caller_type: 'ai_bland')
  -> claw.tasks (outcome + next steps)
  -> claw.cost_log (Bland + Twilio costs)
```

### Call Types
- **Warm re-engagement:** "Hi {name}, this is {agent} from {company}. I wanted to follow up on {deal/property}..."
- **Cold voicemail drop:** Pre-recorded message left on voicemail
- **Missed inbound callback:** Auto-callback within 5 minutes of missed call

### DB Changes
- `callpilot.calls.caller_type`: `human` (default) | `ai_bland`
- `callpilot.calls.bland_call_id`: Bland's call UUID
- `claw.cost_log`: Track Bland AI costs per call

### Config
- `BLAND_API_KEY` in server .env
- `BLAND_WEBHOOK_SECRET` for webhook validation
- Scripts stored in `callpilot.script_templates` with `caller_type = 'ai_bland'`

---

## Admin Module

**NOT a separate app.** Accessible from Doughy Settings for mobile, and at `/admin/*` for web.

### Mobile Admin (in Doughy Settings)
Quick toggles and monitoring — the "control room" accessible anywhere:

| Screen | What It Shows |
|--------|--------------|
| **AI Overview** | Cost today/week/month, active agents, recent actions |
| **Kill Switch** | Big red button to pause all AI activity |
| **Agent Toggles** | Enable/disable each agent (master-controller, lead-ops, draft-specialist) |
| **Budget** | Per-service spending, limits, alerts |
| **Activity** | Recent agent runs, tool calls, approvals |

### Web Admin (Phase 3 — Next.js)
Full management panel for desktop:

#### `/admin/dashboard` — Overview
- Investor: deal pipeline funnel, lead counts, follow-up status
- Landlord: occupancy rates, revenue, maintenance queue
- The Claw: agent activity, approval stats, cost tracking
- CallPilot: call volume, outcomes, coaching effectiveness

#### `/admin/ai-assistant` — The Claw Management
- Skills management: view capabilities, enable/disable, configure
- Agent config: model selection, prompt editing, tool permissions
- Integration management: connected apps, API keys, status
- Permission matrix: per-agent read/write permissions, per module
- Activity log: full audit trail, filters, CSV export
- Budget/limits: per-agent token caps, cost ceilings, alerts
- Kill switch: global and per-agent

#### `/admin/callpilot` — CallPilot Management
- Script templates: CRUD, assign to modules, assign to caller_type (human/AI)
- Coaching settings: aggressiveness, required questions per script
- Call analytics: duration, lead temperature, conversion tracking
- Transcription settings: service, language, confidence thresholds
- Bland AI: call scripts, outcomes, auto-escalation rules

#### `/admin/modules` — Module Configuration
- Investor module: pipeline stages, deal fields, scoring criteria
- Landlord module: booking types, maintenance categories, vendors
- Relationship module: touchpoint types, reminder frequency
- Toggle modules on/off per account (future multi-tenant SaaS)

#### `/admin/users` — User Management (future multi-tenant)
- Invite users, assign roles (admin, agent, viewer)
- Per-user module access
- API key management

---

## Build Phases

### Phase 1: Demo Polish (Feb 20 target) -- MOSTLY COMPLETE
- [x] Module separation migration + query filters
- [x] Kill score noise from briefings and agent responses
- [x] Add follow-ups + bookings to briefing engine (9 parallel queries)
- [x] Structured help response
- [x] Kill switch in controller + API endpoints
- [x] Agent profile management endpoints
- [x] CallPilot CRM bridge (real contacts from crm.contacts)
- [x] CallPilot pre-call briefing (cache + fresh generation)
- [x] Twilio Voice integration (outbound calls)
- [x] Deepgram transcription service
- [x] Call session manager with coaching intervals
- [x] Post-call -> Claw integration loop
- [x] Documentation (CALLPILOT.md, ROADMAP.md, ARCHITECTURE.md updates)
- [ ] Add `caller_type` column to `callpilot.calls`
- [ ] Create `claw.cost_log` table
- [ ] Seed compelling demo data (hot/warm/cold leads, active deal, maintenance request)
- [ ] Test end-to-end: SMS "brief me" / "help" / "draft follow ups"
- [ ] Test CallPilot: contacts -> pre-call briefing -> active call -> post-call summary

### Phase 2: Autonomous Calling + Cost Control (Mar 2026)
- [ ] Bland AI integration (REST API client + webhook handler)
- [ ] `caller_type` support in CallPilot UI (human vs AI calls tab)
- [ ] Lead temperature auto-detection (based on CRM activity signals)
- [ ] Cost logging on all AI operations (agent runs, SMS, voice, transcription)
- [ ] Budget enforcement (check limits before expensive operations)
- [ ] Weekly cost summary in Monday briefing
- [ ] Auto-callback on missed inbound calls
- [ ] Voicemail drop for cold leads
- [ ] Mobile admin section in Doughy Settings (toggles, kill switch, cost summary)
- [ ] UI standardization: copy Doughy's design tokens to CallPilot + The Claw

### Phase 3: Web Admin + Relationship Module (Apr 2026)
- [ ] Next.js admin panel at `/admin/*`
- [ ] Relationship module: touchpoints, gifts, milestones, reminders
- [ ] CRM connectors: import from Google Contacts, CSV, Zillow
- [ ] WhatsApp Business API: rich media messages, voice notes to The Claw
- [ ] Full cost dashboard with charts and export
- [ ] Multi-tenant foundations: per-user module configs, team management

### Phase 4: Production Launch
- [ ] A2P 10DLC registration for Twilio
- [ ] Production Supabase migration (staging -> prod schema alignment)
- [ ] Rate limiting hardening (Redis-backed, not in-memory)
- [ ] Error monitoring (Sentry or similar)
- [ ] Cost monitoring (Anthropic API usage alerts)
- [ ] Twilio phone number upgrade (dedicated, non-trial)
- [ ] Apple App Store submission (Doughy)
- [ ] TestFlight distribution (The Claw, CallPilot)

### Phase 5: Scale (Q3 2026+)
- [ ] Voice cloning for Bland AI (user's own voice)
- [ ] Local AI agent on device (Whisper for transcription, local LLM for coaching)
- [ ] Agent marketplace: community-contributed skills
- [ ] Multi-language support (Spanish, Mandarin for RE markets)
- [ ] Smart home integration via Seam API (lock codes for showings)

---

## Design Rules

1. **DO NOT modify Doughy's existing UI** — it's the source of truth for design
2. **Copy Doughy's design tokens** (spacing, radius, shadows, colors) when building CallPilot and The Claw screens
3. **Liquid glass** for iOS — import from `@/lib/liquid-glass`, never directly from `@callstack/liquid-glass`
4. **RLS on every table** — no exceptions, even for admin
5. **Module separation is permanent** — never flatten investor + landlord data
6. **Cost tracking from day one** — log every AI call, every SMS, every voice minute
7. **Three taps max** for any common action
8. **Cards over tables** — mobile-first, scannable, one screen three answers
