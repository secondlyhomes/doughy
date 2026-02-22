# OpenClaw Platform

> Last updated: 2026-02-22

Replaces `docs/OPENCLAW_SERVER.md`. The custom Express server is archived in `legacy/custom-claw/`. This doc covers the official OpenClaw multi-agent platform.

## Overview

OpenClaw is the AI brain for the Doughy ecosystem. It runs on a DigitalOcean droplet behind Tailscale VPN, managing 6 specialized agents that handle investor/landlord operations.

**Architecture:** Hub-and-spoke. OpenClaw gateway is the hub. Every integration (Supabase, Telegram, Twilio, etc.) connects as a standardized spoke.

**Why hub-and-spoke:** With 10+ integrations planned, each spoke is independently deployable, testable, and replaceable. Adding QuickBooks is just registering a new MCP server -- zero changes to the hub or other spokes.

---

## Gateway Configuration (`openclaw.json`)

The main config file uses JSON5 format. Key sections:

| Section | Purpose |
|---------|---------|
| `gateway` | Port, bind address, auth mode, Tailscale config |
| `channels` | Telegram, SMS (via webhook bridge), email routing |
| `agents` | Agent list with models, tools, workspaces |
| `bindings` | Which channel routes to which agent |
| `models` | Provider API keys (or LiteLLM proxy URL) |
| `mcpServers` | MCP server connections (stdio transport) |
| `session` | DM scope, idle reset, context limits |
| `cron` | Scheduled jobs (briefings, follow-up checks) |

**Location:** `server/openclaw/openclaw.json`

---

## Workspace Conventions

Each agent has a workspace directory with:

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality, boundaries, responsibilities, tone |
| `AGENTS.md` | (Dispatch only) Available specialists and routing rules |
| `MEMORY.md` | Persistent memory across conversations |
| `memory/` | Auto-managed memory files |
| `skills/` | Custom skills (SKILL.md with YAML frontmatter) |

**SOUL.md** defines what the agent IS, what it CAN do, and what it MUST NEVER do. This is the primary control mechanism for agent behavior.

---

## Agent Roster (6 Agents)

| Agent | Role | Model | Channel |
|-------|------|-------|---------|
| **Dispatch** | Router/coordinator -- never does direct work | Sonnet 4.5 | Telegram (receives all inbound) |
| **Assistant** | Personal: calendar, briefings, email triage, reminders | Sonnet 4.5 / Haiku 4.5 | Telegram DM |
| **Leasing** | Tenant leads, screening, maintenance, rent tracking | Sonnet 4.5 / Haiku 4.5 | Via Dispatch |
| **Bookkeeper** | Invoices, expenses, P&L, QuickBooks | Haiku 4.5 / Sonnet 4.5 | Via Dispatch |
| **Acquisitions** | Deals, comps, underwriting, FSBO leads | Sonnet 4.5 / Perplexity | Via Dispatch |
| **Marketing** | Content, newsletters, social media, campaigns | Sonnet 4.5 | Via Dispatch |

### Agent Permission Matrix

```
+--------------+-------+------+-------+-------+--------+----------+--------+---------+--------------+
| Agent        | exec  | read | write | email |calendar|quickbooks| twilio | browser | agentToAgent |
+--------------+-------+------+-------+-------+--------+----------+--------+---------+--------------+
| Dispatch     |  NO   | YES  |  NO   |  NO   |   NO   |    NO    |   NO   |   NO    | YES (ALL)    |
| Assistant    | GATE  | YES  | YES   | YES   |  YES   |    NO    |  YES   |  YES    | YES (L, B)   |
| Leasing      | GATE  | YES  | YES   | YES   |  YES   |    NO    |  YES   |  YES    | NO           |
| Bookkeeper   |  NO   | YES  | YES   |  NO   |   NO   |   YES    |   NO   |   NO    | NO           |
| Acquisitions | GATE  | YES  | YES   | YES   |   NO   |    NO    |   NO   |  YES    | NO           |
| Marketing    |  NO   | YES  | YES   |  NO   |   NO   |    NO    |   NO   |   NO    | NO           |
+--------------+-------+------+-------+-------+--------+----------+--------+---------+--------------+

Legend: YES = Allowed, NO = Blocked, GATE = Requires human approval per invocation
```

### Agent-to-Agent Communication

```
Dispatch --> All specialists     YES
Assistant --> Leasing            YES
Assistant --> Bookkeeper         YES
All others --> Dispatch only     YES (escalation/status updates)
Direct cross-talk                NO (prevents circular delegation loops)
```

### Data Isolation

- **Bookkeeper** CANNOT access: tenant PII, screening reports, email inboxes
- **Marketing** CANNOT access: QuickBooks, tenant applications, screening data, lease details
- **Leasing** CANNOT access: QuickBooks entries, deal analysis
- **Acquisitions** CANNOT access: tenant PII, QuickBooks, lease documents
- **Dispatch** CANNOT access: any tool directly (routing only)

---

## MCP Server Integration (Spokes)

Spokes connect via the `mcpServers` section in `openclaw.json`. Each MCP server uses stdio transport.

### Supabase CRM Spoke (`server/tools/`)

Primary data spoke. Provides read/write access to the `claw` schema (19 tables) and cross-schema reads for briefings.

**Read tools (12):** `read_deals`, `read_leads`, `read_bookings`, `read_follow_ups`, `read_maintenance`, `read_vendors`, `read_contacts_detail`, `read_portfolio`, `read_documents`, `read_comps`, `read_campaigns`, `read_conversations`

**Write tools (9):** `draft_sms`, `create_approval`, `create_lead`, `update_lead`, `update_deal_stage`, `mark_followup_complete`, `send_whatsapp`, `send_email`, `add_note`

**Briefing tool:** `generate_briefing` -- 9 parallel queries across 5 schemas via `Promise.allSettled()`

**DB access pattern:** Raw `fetch()` with service role key + `Accept-Profile`/`Content-Profile` headers. NOT `@supabase/supabase-js`. See `docs/DECISIONS.md` #3.

**Logging:** Always `console.error()`, never `console.log()` (stdout corrupts stdio JSON-RPC).

### Adding New Spokes

1. Create MCP server (or use existing: `@perplexity-ai/mcp-server`, etc.)
2. Add to `mcpServers` in `openclaw.json`
3. Add tool permissions to relevant agents
4. No changes to hub or other spokes

---

## Custom Skills

Skills are prompt-based capabilities loaded from `server/openclaw/skills/`. Each skill has a `SKILL.md` with YAML frontmatter defining triggers and parameters.

**Existing skills (9):** `doughy-booking`, `doughy-core`, `doughy-guest`, `doughy-investor-core`, `doughy-lead`, `doughy-platform`, `doughy-room`, `doughy-seam-locks`, `doughy-webhook`

---

## Security Model (3 Tiers)

### Tier 1 -- Minimum Viable (Day 1)

- Tailscale VPN-only access (gateway on 127.0.0.1:18789, never 0.0.0.0)
- UFW: deny all incoming, allow tailscale0 only
- Device auth + DM pairing allowlist
- File permissions: 600 credentials, 700 workspaces
- Filesystem sandbox: agents only read/write within their workspace
- **OpenClaw >= 2026.1.29** required (CVE-2026-25253)

### Tier 2 -- Standard Protection (Week 1)

- Per-agent tool allowlisting (default deny)
- Elevated tool approval via Telegram
- MCP server version pinning (never "latest")
- OAuth scope minimization
- Weekly security audit cron

### Tier 3 -- Defense in Depth (Week 3-4)

- **LiteLLM proxy:** Credential broker, budget caps, model routing. OpenClaw never sees real API keys.
- **Squid proxy:** Deny-by-default egress filtering. Only allowlisted domains pass.
- **Hard-blocked domains:** All Chinese AI endpoints (DeepSeek, Qwen, Kimi, GLM, Doubao, Ernie, MiniMax, Baichuan, Yi, MiMo)

---

## Infrastructure Spokes

| Spoke | Purpose | Port | Status |
|-------|---------|------|--------|
| OpenClaw Gateway | AI brain, agent orchestration | 18789 | Phase 2 |
| Webhook Bridge | Ingress: validate webhooks, forward to OpenClaw | 3000 | Phase 4 |
| Supabase MCP | Data spoke: CRM tools for agents | stdio | Phase 3 |
| LiteLLM Proxy | Model spoke: credential broker, budget caps | 4000 | Phase 5 |
| Squid Proxy | Egress spoke: outbound traffic filtering | 3128 | Phase 5 |
| Queue Processor | Guarded-mode action executor | -- | Phase 6 |

---

## Claw Schema (19 Tables)

| Table | Purpose | MCP Access |
|-------|---------|------------|
| `agent_profiles` | Agent config (3 rows) | read |
| `tasks` | Workflow tracking | read, create |
| `agent_runs` | Execution logs | read |
| `approvals` | Pending actions | read, create, claim |
| `messages` | Conversation history | read, create |
| `cost_log` | Cost tracking | read |
| `trust_config` | Trust levels per user | read |
| `action_queue` | Guarded-mode queue | read, create |
| `kill_switch_log` | Kill switch events | read |
| `channel_preferences` | Enabled channels | read |
| `connections` | Service status | read |
| `budget_limits` | Per-agent budgets | read |
| `draft_suggestions` | AI drafts | read, create |
| `notification_preferences` | Per-user notification config | read |
| `notification_settings` | Global notification config | read |
| `notification_log` | Notification delivery log | read |
| `push_tokens` | Mobile push tokens | read |
| `transcript_extractions` | Call transcript parsing | read |
| `email_rules` | Email routing rules | read |

---

## Deployment

See `docs/DEPLOYMENT.md` for full deployment instructions.

**Quick reference:**
- Droplet: DigitalOcean 4GB/2vCPU, Ubuntu 24.04
- Access: Tailscale VPN only (no public ports)
- Domain: `openclaw.doughy.app`
- Supabase: Staging (`lqmbyobweeaigrwmvizo`)
