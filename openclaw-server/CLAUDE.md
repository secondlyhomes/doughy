# OpenClaw Server — CLAUDE.md

Express.js AI gateway that powers The Claw. Handles SMS/email/WhatsApp → AI agent processing → approval workflows.

**Full documentation:** `docs/OPENCLAW_SERVER.md` (in parent repo root)

## Quick Reference

```bash
cd openclaw-server
npm install
npm run dev          # ts-node with dotenv
npm run build        # tsc → dist/
npm start            # node dist/server.js
npm test             # jest
```

## The Claw Intelligence Layer (`src/claw/`)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `controller.ts` | Entry point — intent classification → routing | `handleClawSms()`, `handleClawMessage()` |
| `agents.ts` | Generic agent runner with tool-use loop | `runAgent()` |
| `briefing.ts` | Cross-schema data → natural language briefing | `generateBriefing()` |
| `tools.ts` | 6 agent tools (read deals/leads/bookings/follow-ups, draft SMS, create approval) | `AGENT_TOOLS` |
| `routes.ts` | Express router at `/api/claw` (8 endpoints) | `clawRouter` |
| `prompts.ts` | 4 system prompts (intent classifier, master controller, lead ops, draft specialist) | `INTENT_CLASSIFIER_PROMPT`, etc. |
| `db.ts` | Schema-aware Supabase queries via REST | `schemaQuery()`, `schemaInsert()` |
| `types.ts` | All Claw TypeScript types | `ClawIntent`, `BriefingData`, `AgentProfile` |

## Agent Profiles (seeded in `claw.agent_profiles`)

| Profile | Model | Tools | Approval | Purpose |
|---------|-------|-------|----------|---------|
| `master-controller` | Haiku 4.5 | None (orchestrator) | No | Intent classification, routing |
| `lead-ops` | Sonnet 4.5 | `read_deals`, `read_leads`, `read_bookings`, `read_follow_ups` | No | Data analysis (read-only) |
| `draft-specialist` | Sonnet 4.5 | `draft_sms`, `create_approval` | **Yes** | SMS drafting → approval creation |

## "Brief Me" Flow (end-to-end)

1. User texts "Brief me" → Twilio webhook → `POST /webhooks/sms`
2. `handleClawSms()` looks up user via `CLAW_PHONE_USER_MAP`
3. `classifyIntent()` → Haiku returns `"briefing"` (20 max_tokens, ~200ms)
4. `generateBriefing()` queries 5 tables across 3 schemas:
   - `investor.deals_pipeline` (active deals)
   - `investor.follow_ups` (overdue + upcoming)
   - `crm.contacts` (lead details)
   - `landlord.bookings` (upcoming)
   - `comms_messages` (recent comms)
5. Data → Claude Sonnet → natural language briefing
6. SMS reply sent via `twilio-sms` edge function (truncated to 1500 chars)
7. Inbound + outbound saved to `claw.messages`

## Required Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Supabase REST API base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Bypasses RLS for server queries |
| `GOOGLE_CLIENT_ID` | Yes | Gmail OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | Gmail OAuth |
| `GOOGLE_CLOUD_PROJECT_ID` | Yes | Gmail Pub/Sub topic |
| `ANTHROPIC_API_KEY` | No* | Claude API calls (*required for The Claw features) |
| `TWILIO_ACCOUNT_SID` | No* | SMS sending (*required for SMS) |
| `TWILIO_AUTH_TOKEN` | No* | Twilio auth (*required for SMS) |
| `TWILIO_PHONE_NUMBER` | No* | Outbound SMS number (*required for SMS) |
| `CLAW_PHONE_USER_MAP` | No | JSON mapping phone→user UUID |
| `CLAW_ENABLED` | No | Enable The Claw (default: `true`) |
| `CLAW_DEFAULT_MODEL` | No | Default Claude model (default: `claude-sonnet-4-5-20250929`) |

## Key Architecture Decisions

- **Service role REST API** — uses raw `fetch()` with `Accept-Profile`/`Content-Profile` headers for cross-schema queries. Does NOT use `@supabase/supabase-js`. See `docs/DECISIONS.md` #3.
- **Haiku for classification, Sonnet for reasoning** — intent classification needs 1 word, Haiku at ~200ms/$0.80/MTok. Analysis/drafting needs nuance → Sonnet.
- **Tool-use loop** — max 5 iterations per agent run, tool errors are sanitized before returning to Claude.
- **All outbound actions require approval** — `draft-specialist` has `requires_approval: true`. Creates `claw.approvals` entries with 24h expiry.
- **Prompt caching** — all system prompts use `cache_control: { type: 'ephemeral' }` for 5-minute Anthropic cache hits.

## Security

- Twilio webhook signature validation (HMAC-SHA1)
- 20+ regex threat patterns for prompt injection scanning
- In-memory rate limiting (10 burst/min, 50 channel/hr, 100 user/hr)
- Service role key NEVER exposed to client — server filters by `user_id` in all queries

## Conventions

- **No `@supabase/supabase-js`** — all DB access via REST `fetch()`
- **Schema headers** — `Accept-Profile: <schema>` for reads, `Content-Profile: <schema>` for writes
- **Edge function calls** — `callEdgeFunction()` in `src/supabase.ts` (uses service role auth header)
- **Channel adapters** — implement `ChannelAdapter` interface (`normalizeMessage`, `sendMessage`, `isConfigured`, `initialize`)
