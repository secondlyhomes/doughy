# Architectural Decisions

> Last verified: 2026-02-16 by reading source code and querying Supabase staging.

## Decision Log

### 1. Multi-Agent vs. Single Agent

**Decision:** Multi-agent with specialist roles.

**Alternatives considered:**
- Single monolithic agent with all tools
- Single agent with dynamic tool loading

**Why multi-agent:**
- **Cost control** — Master Controller uses Haiku ($0.80/MTok input) for fast intent classification. Only complex tasks escalate to Sonnet ($3/MTok input). Single-agent would use Sonnet for everything.
- **Separation of concerns** — Lead Ops has read-only tools, Draft Specialist has write tools. Single agent with all tools increases risk of unintended writes.
- **Approval gates** — Only `draft-specialist` has `requires_approval: true`. This is enforced at the profile level, not ad-hoc.
- **Auditability** — Each agent run is a separate row in `claw.agent_runs` with its own token/cost tracking.

**Trade-off:** Multi-turn conversations between agents add latency. A briefing is 1 agent call. Draft follow-ups is 2 sequential agent calls (Lead Ops → Draft Specialist).

### 2. Haiku for Classification, Sonnet for Reasoning

**Decision:** Intent classification uses Claude Haiku; data analysis and drafting use Claude Sonnet.

| Task | Model | Max Tokens | Why |
|------|-------|-----------|-----|
| Intent classification | Haiku 4.5 | 20 | Single word output, ~200ms, $0.80/MTok |
| Briefing formatting | Haiku 4.5 | 400 | Simple text formatting from structured data |
| Lead analysis | Sonnet 4.5 | — | Complex reasoning about deal pipeline + contacts |
| SMS drafting | Sonnet 4.5 | — | Personalized messages require nuance |

**Key insight:** Classification only needs 20 max_tokens (one word). Haiku returns in ~200ms. Sonnet would take ~800ms for the same task at 4x the cost with no quality benefit.

### 3. Service Role REST API (not Supabase JS Client)

**Decision:** OpenClaw Server uses raw `fetch()` against Supabase REST API with service role key. Does NOT use `@supabase/supabase-js`.

**Why:**
- **Schema control** — PostgREST `Accept-Profile` and `Content-Profile` headers let the server query any schema (claw, investor, crm, etc.). The JS client defaults to `public` and requires `supabase.schema('name')` which creates a new client per schema.
- **Simpler deployment** — No dependency on `@supabase/supabase-js`. Just `fetch()`.
- **Explicit auth** — Every request explicitly passes service role key in headers. No hidden client-side auth state.
- **RLS bypass** — Service role key bypasses RLS. Server-side code always filters by `user_id` explicitly in query params.

**Trade-off:** More verbose code. Every query is a URL string instead of a fluent API. Schema names must be passed manually.

**Contrast:** The Doughy mobile app DOES use `@supabase/supabase-js` with anon key + RLS. This is the correct pattern for client-side code.

### 4. Approval Gates (Human-in-the-Loop)

**Decision:** All outbound actions (SMS, email) require human approval before execution.

**Implementation:**
- Agent profiles have `requires_approval: boolean`
- `draft-specialist` has `requires_approval: true`
- `lead-ops` has `requires_approval: false` (read-only tools)
- Approvals are rows in `claw.approvals` with 24-hour expiry
- User reviews in The Claw app, approves/rejects/edits
- On approve: `executeSmsApproval()` calls `twilio-sms` edge function

**Why:**
- **Trust building** — Users need to see what the AI is doing before trusting autonomous mode
- **Liability** — Sending wrong messages to leads/contacts has real business consequences
- **Iteration** — Users can edit drafts before sending, improving AI quality over time
- **Audit trail** — Every approval decision is logged with timestamp, edited content, execution status

**Future:** The guard level system (fortress → autonomous) will eventually allow trusted users to skip approval for high-confidence, low-risk actions.

### 5. "OpenClaw" Naming

**Decision:** Renamed from "MoltBot" to "OpenClaw" for the server, keeping "The Claw" for the mobile app.

**Why:**
- "MoltBot" was a placeholder name from early development
- "OpenClaw" is more descriptive (open-source claw/agent system)
- "The Claw" (mobile app) evokes the arcade game metaphor — reaching in, grabbing tasks, deciding what to do with them
- Shared prefix "claw" ties the server and app together

**Status:** Rename in progress. Database tables renamed (`ai.moltbot_*` → `ai.openclaw_*`). Deploy scripts still reference `moltbot`. Edge function `openclaw-bridge` deployed as replacement for `moltbot-bridge`.

### 6. Six Schemas (Data Ownership Principle)

**Decision:** Database organized into 7 schemas by data ownership domain.

| Schema | Owner | Purpose |
|--------|-------|---------|
| `claw` | The Claw agent system | Agent orchestration, tasks, approvals |
| `ai` | AI infrastructure | Security, memory, knowledge, circuit breakers |
| `investor` | Investor platform | Deals, properties, campaigns, portfolio |
| `landlord` | Landlord platform | Rentals, bookings, vendors, maintenance |
| `crm` | Contact management | Contacts, leads, skip trace, opt-outs |
| `integrations` | Third-party services | Gmail, Seam, Meta, Postgrid |
| `public` | Shared/system | Users, workspaces, billing, system logs |

**Why:**
- **RLS simplification** — Each schema has consistent RLS patterns. `user_id = auth.uid()` works the same everywhere.
- **Access control** — Mobile app only needs `investor`, `landlord`, `crm`, `public`. Server needs all schemas.
- **Migration safety** — Changes to investor schema don't risk breaking landlord tables.
- **Naming clarity** — `investor.properties` vs `landlord.properties` are different tables with different columns. In a flat `public` schema, these would need prefixes.

**Trade-off:** Cross-schema foreign keys exist (e.g., `investor.deals_pipeline.lead_id` → `crm.contacts.id`). PostgREST handles these but the mobile app can't do cross-schema joins in a single query — needs RPC functions or multiple queries.

### 7. Prompt Caching

**Decision:** All system prompts use `cache_control: { type: 'ephemeral' }`.

**Why:** Anthropic caches prompts for 5 minutes. Within that window, repeated calls with the same system prompt get a cache hit, reducing input token costs significantly. The Claw's system prompts don't change between calls, so every second+ call within 5 minutes benefits.

**Impact:** For a user who sends 3 messages in 5 minutes (e.g., "brief me", "draft follow ups", "check bookings"), the 2nd and 3rd classification calls reuse the cached intent classifier prompt.

### 8. SMS-First UX

**Decision:** Primary Claw interface is SMS (Twilio), with the mobile app as the approval/monitoring layer.

**Why:**
- **Zero friction** — User texts from their existing SMS app. No app install required for basic interaction.
- **Always accessible** — Works without internet (SMS is cellular), works on any phone
- **Natural for brief interactions** — "Brief me", "Draft follow ups" are natural SMS commands
- **App for complex tasks** — Approvals, editing drafts, activity feed need rich UI → mobile app

**Trade-off:** SMS has a 1600-character limit. Briefings are truncated to 1500 chars with "[Open the app for full details.]" footer. WhatsApp messages aren't truncated.

### 9. Immediate TwiML Response + Async Processing

**Decision:** SMS webhook responds immediately with empty `<Response></Response>` TwiML, then processes the message asynchronously and sends reply via Twilio REST API.

**Why:**
- Twilio expects a response within 15 seconds or it retries
- AI processing (intent classification + briefing generation) can take 5-15 seconds
- Sending empty TwiML acknowledges receipt immediately
- Reply is sent separately via Twilio Messages API with a 10-second timeout

**Alternative rejected:** Inline TwiML `<Message>` response. This would require completing all processing within the webhook timeout, which is unreliable with multiple AI calls.

### 10. In-Memory Rate Limiting

**Decision:** Rate limiter uses an in-memory `Map` instead of Redis or database.

**Why:**
- **Single instance** — OpenClaw server runs as 1 PM2 instance. No need for distributed rate limiting.
- **No extra dependency** — No Redis to provision, connect, or pay for.
- **Fast** — In-memory lookup is O(1), no network round-trip.
- **Good enough** — Resets on server restart, but that's fine for webhook rate limiting.

**Trade-off:** Rate limit state is lost on restart. If the server crashes and restarts, rate limits reset. This is acceptable — it only means a brief window where rate limits are relaxed.

### 11. Channel Adapter Pattern

**Decision:** All messaging channels implement a `ChannelAdapter` interface with `normalizeMessage()`, `sendMessage()`, `isConfigured()`, `initialize()`.

**Why:**
- **Extensibility** — Adding a new channel means implementing 4 methods
- **Unified processing** — `messageToEmail()` converts any `IncomingMessage` to the legacy `IncomingEmail` format, maintaining compatibility with existing edge functions
- **Progressive deployment** — Channels can be registered but unconfigured. Only configured channels are initialized.

**Currently implemented:** Gmail (full), SMS (full), WhatsApp (partial), Telegram (partial), PostGrid (full), Meta DM (full)
**Stubbed/future:** iMessage (BlueBubbles), Discord, Signal

### 12. Guard Level ↔ AI Mode Mapping

**Decision:** The Claw app's guard levels map to the server's AI modes:

| Guard Level (app) | AI Mode (server) | Behavior |
|-------------------|------------------|----------|
| Fortress | off | No AI processing |
| Strict | training | AI drafts, all require review |
| Balanced | assisted | Auto-send if confidence >= threshold |
| Relaxed | assisted (high) | Lower confidence threshold |
| Autonomous | autonomous | Auto-send everything |

**Why:** The Claw uses a 5-tier "guard level" metaphor (fortress → autonomous) that maps to the existing `ai_mode` field in `user_platform_settings`. This reuses existing infrastructure without adding new database columns.
