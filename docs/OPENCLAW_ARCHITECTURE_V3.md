# OpenClaw VA Replacement Architecture v3
## Doughy CRM Ecosystem — Secondly Homes LLC

**Owner:** Dino Garcia
**Date:** February 21, 2026
**Status:** DEPLOYED — v2026.2.21-2 live on DigitalOcean
**Budget Target:** $186–285/month (vs. $530/month VA)

---

## Current Deployment State (as of Feb 22, 2026)

**Server:** DigitalOcean 1GB RAM / 2vCPU (not 4GB as originally spec'd — tight but stable at ~760MB used)
**Gateway:** v2026.2.21-2, systemd, port 18789 (loopback), auth=none, PID 13148
**Model:** Claude Sonnet 4.6 via LiteLLM proxy (port 4000), Haiku 4.5 for Dispatch routing
**Telegram:** @doughy_assistant_bot, allowlist mode, user 8212940595
**Agents:** 6 deployed (dispatch, assistant, leasing, bookkeeper, acquisitions, marketing)
**Routing:** Dispatch uses `sessions_spawn` with `agentId` (NOT `agentToAgent` — disabled due to bug #5813)
**Cron:** Morning briefing 7am ET, afternoon followups 2pm ET, both deliver to Telegram

**Key lessons learned:**
- `agentToAgent.enabled: true` BREAKS `sessions_spawn` (bug #5813, subagents freeze)
- `subagents.allowAgents` must be explicitly set on Dispatch for cross-agent spawning
- `sessions_send` targets sessions by KEY not agent ID — wrong for delegation
- Telegram `allowlist` mode survives restarts; `pairing` mode does NOT

**What's working:** Telegram end-to-end, Dispatch routing to all 6 specialists, morning briefing cron, MCP tools (23 Supabase tools), kill switch fail-closed

**What's NOT working:** Email (Google Workspace not set up), WhatsApp (needs QR scan), Quo/Twilio phone (not set up), QuickBooks (not set up), PropStream (not set up), Bouncer UI (not wired to OpenClaw API)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Agent Roster (6 Agents)](#3-agent-roster-6-agents)
4. [Agent Permission Matrix](#4-agent-permission-matrix)
5. [Agent-to-Agent Communication Rules](#5-agent-to-agent-communication-rules)
6. [Email Domain Strategy](#6-email-domain-strategy)
7. [Phone & Voice Strategy](#7-phone--voice-strategy)
8. [Integration Map](#8-integration-map)
9. [Security Architecture (3 Tiers)](#9-security-architecture-3-tiers)
10. [AI Model Strategy](#10-ai-model-strategy)
11. [Cost Controls & Monthly Budget](#11-cost-controls--monthly-budget)
12. [Rate Limits](#12-rate-limits)
13. [Bouncer Control Dashboard](#13-bouncer-control-dashboard)
14. [Deployment Phases (30 Days)](#14-deployment-phases-30-days)
15. [Success Metrics](#15-success-metrics)
16. [Claude Code Deployment Prompt](#16-claude-code-deployment-prompt)
17. [Technical References](#17-technical-references)

---

## 1. Architecture Overview

### System Diagram

~~~
+------------------------------------------------------------------+
|                     BOUNCER (Control Plane UI)                    |
|  React dashboard - agent toggles - kill switch - cost metrics     |
|  approve/reject queue - SOUL.md editor - audit logs               |
|  Talks to OpenClaw API + LiteLLM API + ClawWatcher               |
|  AUTH: Tailscale-only access (never public internet)              |
+---------------+------------------------------------+--------------+
                | OpenClaw API                       | LiteLLM API
                v                                    v
+------------------------------------------------------------------+
|                     OPENCLAW (AI Brain)                           |
|  DigitalOcean Droplet - 1GB/2vCPU - NYC1 - $12/mo               |
|  Gateway: 127.0.0.1:18789 (Tailscale VPN only)                  |
|                                                                   |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|  | DISPATCH  |>| ASSISTANT | | LEASING   | | BOOKKEEPER|         |
|  | (router)  |>| (personal)| | (tenants) | | (finances)|         |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|  +-----------+ +-----------+                                      |
|  | ACQUISI-  | | MARKETING |                                      |
|  | TIONS     | | (content +|                                      |
|  | (deals)   | | campaigns)|                                      |
|  +-----------+ +-----------+                                      |
|                                                                   |
|  LiteLLM Proxy (credential broker, budget caps, model routing)   |
|  Squid Proxy (egress filtering, deny-by-default allowlist)       |
|  Tailscale Aperture (API key gateway, identity logging)          |
|  ClawWatcher (cost monitoring, auto-pause)                       |
+---------+--------------+--------------+--------------------------+
          |              |              |
          v              v              v
+-------------+ +--------------+ +----------------------+
|  DOUGHY     | |  CALLPILOT   | |  EXTERNAL SERVICES   |
|  (CRM)      | |  (messaging/ | |                      |
|             | |   calling)   | |  - Google Workspace   |
|  Leads      | |              | |  - QuickBooks (MCP)   |
|  Contacts   | |  Syncs with  | |  - PropStream         |
|  Deals      | |  Doughy      | |  - Quo (Sona voice)   |
|  Properties | |              | |  - Twilio (SMS/voice) |
|  Tenants    | |  Call logs   | |  - Perplexity         |
|             | |  Messages    | |  - Whitepages Pro     |
|             | |  Transcripts | |  - Mailchimp/Brevo    |
+-------------+ +--------------+ +----------------------+
~~~

### Key Architectural Decisions

**Bouncer is NOT an OpenClaw agent.** It is a separate React app in the monorepo that serves as the human control plane. It talks to OpenClaw's API for monitoring and control. It does not do AI reasoning.

**OpenClaw is the AI brain.** It replaced the custom claw implementation. The custom claw has been archived to legacy/custom-claw/ and the real OpenClaw installed from the official project.

**Data flow:**
- OLD: Doughy <-> Bouncer/Claw (AI + bridge + UI) <-> Callpilot
- NEW: Doughy <-> OpenClaw (AI brain) <-> Callpilot, with Bouncer as human control UI on top
- Bridge logic moved from Bouncer's custom claw into OpenClaw's native capabilities

**Scope:** Real estate investors, agents, and landlords. Supporting roles (contractors, inspectors, title companies, lenders, brokers) exist as contacts/entities within the CRM, not standalone user types.

---

## 2. Monorepo Structure

~~~
/
+-- apps/
|   +-- doughy/              -- CRM for RE investors, agents, landlords
|   +-- callpilot/           -- Messaging/calling app (syncs with Doughy)
|   +-- bouncer/             -- Control plane UI (monitoring, kill switch, audit)
+-- server/
|   +-- openclaw/
|       +-- openclaw.json              -- Main config (agents, bindings, channels)
|       +-- .env / .env.example
|       +-- deploy.sh
|       +-- workspaces/
|       |   +-- dispatch/              -- Router/coordinator agent
|       |   |   +-- SOUL.md
|       |   |   +-- AGENTS.md
|       |   |   +-- MEMORY.md
|       |   |   +-- memory/
|       |   +-- assistant/             -- Personal assistant
|       |   |   +-- SOUL.md
|       |   |   +-- MEMORY.md
|       |   |   +-- memory/
|       |   +-- leasing/               -- Tenants, leads, screening
|       |   |   +-- SOUL.md
|       |   |   +-- MEMORY.md
|       |   |   +-- memory/
|       |   +-- bookkeeper/            -- QuickBooks, invoices, P&L
|       |   |   +-- SOUL.md
|       |   |   +-- MEMORY.md
|       |   |   +-- memory/
|       |   +-- acquisitions/          -- Deals, comps, underwriting
|       |   |   +-- SOUL.md
|       |   |   +-- MEMORY.md
|       |   |   +-- memory/
|       |   +-- marketing/             -- Content, campaigns, newsletters, ads
|       |       +-- SOUL.md
|       |       +-- MEMORY.md
|       |       +-- memory/
|       +-- skills/                    -- Custom shared skills
+-- legacy/
    +-- custom-claw/                   -- Archived custom implementation (DO NOT DELETE)
~~~

---

## 3. Agent Roster (6 Agents)

### 3.1 Dispatch (Coordinator/Router)

**Purpose:** Routes incoming tasks to the correct specialist agent. Pure orchestration — never does direct work.

**Model:** Claude Haiku 4.5 (lightweight routing — saves ~75% vs Sonnet)
**Channel:** Main Telegram bot (receives all inbound)
**Email:** None
**Tools:** sessions (sessions_spawn delegation to specialists), read (context only)

**Responsibilities:**
- Analyze incoming messages and determine which specialist handles them
- Delegate via agent-to-agent messaging with context
- Handle ambiguous requests by asking clarifying questions before routing
- Monitor for tasks that need multiple agents (e.g., new tenant lead needs Leasing + Bookkeeper)
- Escalate to human (Telegram DM to Dino) when confidence is low

**SOUL.md directives:**
- Never draft emails, never touch data, never make decisions
- If unsure which agent, ask the human
- Always pass full context when delegating (don't summarize away details)
- Log every routing decision with reasoning

---

### 3.2 Assistant (Personal/General)

**Purpose:** Personal assistant handling calendar, Drive, email triage, daily briefings, reminders, and general task management. Primary human interaction point.

**Model:** Claude Sonnet 4.6 (planning), Claude Haiku 4.5 (triage/sorting, fallback)
**Channel:** Telegram DM
**Email:** assistant@doughy.app (general inbox)
**Phone:** Quo API access (read call summaries, send SMS from business number)

**Responsibilities:**
- Calendar management (Google Calendar via GOG skill): scheduling, blocking, conflict detection
- Google Drive organization (restricted shared folder only)
- Daily briefing delivery (7:00 AM ET via Telegram): overnight emails, upcoming deadlines, rent status, lead pipeline
- Email triage: sort assistant@doughy.app inbox, flag urgent, draft responses, route to specialists
- Process Quo call summaries: log to briefing, update contact memory, draft follow-up, create calendar event
- Reminders and follow-ups: chase outstanding items, nudge on deadlines
- Time management: block focus time, protect calendar from overcommitment
- Route specialist requests to Dispatch when they come through general channels

**SOUL.md directives:**
- Briefing format: bullet summary, action items, calendar preview, flagged items
- Tone: professional, concise, proactive
- Never make financial decisions or approve expenses
- If a task belongs to another agent, route through Dispatch (don't handle directly)
- Calendar: always check for conflicts before booking, respect blocked focus time

---

### 3.3 Leasing Agent

**Purpose:** Manages all tenant-facing operations: lead response, screening, lease documents, rent tracking, tenant communications, and property maintenance coordination.

**Model:** Claude Sonnet 4.6 (drafting, screening analysis), Claude Haiku 4.5 (triage, sorting, fallback)
**Channel:** Telegram (via Dispatch)
**Email:** assistant@secondlyhomes.com (tenant-facing), inspections@doughy.app, contractors@doughy.app
**Phone:** Quo API (tenant-related SMS), Twilio (automated maintenance reminders)

**Responsibilities:**
- Tenant lead response (priority order: FurnishedFinder > TurboTenant > direct website > Airbnb last)
- Tenant screening pipeline:
  1. Receive application PDF via email
  2. Parse PDF for name, SSN last 4, DOB, employer, income, references
  3. Whitepages Pro API lookup ($0.20-0.28/query): identity verification, address history, phone validation
  4. Perplexity Sonar research: employer verification, social media check, news/court records
  5. Generate screening recommendation with risk score and reasoning
  6. ALWAYS flag for human review before approval/denial (Fair Housing, FCRA compliance)
- Lease document generation and population (templates from Google Drive)
- Tenant communications: move-in instructions, maintenance updates, policy reminders
- Rent tracking: flag Day 2 (no payment), draft reminder Day 5, escalation Day 10
- Lease renewal reminders: 90-day, 60-day, 30-day notices
- Late notices and legal notice generation (Virginia-compliant)
- Inspector scheduling and report intake (via inspections@doughy.app)
- Contractor sourcing and bid management (via contractors@doughy.app)

**SOUL.md directives:**
- NEVER auto-approve or auto-deny a tenant. ALWAYS human review.
- Fair Housing compliance: never reference protected classes in screening notes
- FCRA compliance: adverse action notices required if screening data used in denial
- Virginia landlord-tenant law: 5-day pay-or-quit, 30-day lease termination, security deposit rules
- Respond to leads within 30 minutes during business hours (8 AM - 8 PM ET)
- Tone: warm, professional, helpful but firm on policies

---

### 3.4 Bookkeeper

**Purpose:** Manages all financial operations through QuickBooks: invoice processing, expense categorization, rent roll tracking, P&L reporting, and tax document preparation.

**Model:** Claude Haiku 4.5 (categorization, data entry), Claude Sonnet 4.5 (reports, analysis)
**Channel:** Telegram (via Dispatch)
**Email:** None (receives forwarded invoices/receipts from Assistant)
**Phone:** None

**Responsibilities:**
- QuickBooks integration (via Intuit official MCP server or Klavis AI):
  - Create invoices for rent charges
  - Log expenses with proper categorization (by property, type, vendor)
  - Track accounts payable/receivable
  - Generate balance sheet data
- Invoice processing pipeline:
  1. Receive forwarded invoice/receipt PDF from assistant@doughy.app
  2. Extract: vendor name, amount, date, line items, category
  3. Match to property and expense category
  4. Draft QuickBooks entry
  5. Send summary to Telegram for approval
  6. Post to QuickBooks after human approval
- Expense categorization (per property): repairs, maintenance, utilities, insurance, mortgage, property management, professional services, supplies
- Receipt capture: forward receipts to assistant@doughy.app, auto-parsed and categorized
- Monthly P&L draft: generated by 3rd of each month, per property and aggregate
- Rent roll tracking: expected vs. received, flag Day 2 (no payment), alert Day 5
- Tax document preparation: organize 1099s, mortgage interest statements, insurance docs, repair receipts by property and tax year
- Reconciliation alerts: flag discrepancies between expected and actual

**SOUL.md directives:**
- NEVER modify or delete existing QuickBooks entries without human approval
- NEVER create entries over $500 without human approval
- Always categorize by property first, then expense type
- Double-entry bookkeeping principles: every debit has a credit
- Flag unusual expenses (>2x historical average for that category)
- P&L format: income section (rent, fees, other), expense section (by category), net operating income, per-property breakdown

**QuickBooks Access Level:**
- READ: accounts, customers, vendors, employees, reports, transactions — ALLOWED
- CREATE: invoices, expenses, journal entries — ALLOWED (with limits)
- MODIFY: existing entries — REQUIRES HUMAN APPROVAL (every time)
- DELETE: any record — REQUIRES HUMAN APPROVAL (every time)

---

### 3.5 Acquisitions Agent

**Purpose:** Deal analysis, property underwriting, comp research, FSBO/distressed lead sourcing, and seller outreach campaigns.

**Model:** Claude Sonnet 4.6 (analysis, underwriting), Perplexity Sonar/Sonar Pro (research)
**Channel:** Telegram (via Dispatch)
**Email:** sell@georgetoben.com (acquisition campaigns, seller outreach)
**Phone:** None (campaigns are email/mail only)

**Responsibilities:**
- Deal analysis and underwriting:
  - Purchase price, rehab estimate, ARV (after repair value)
  - Cash-on-cash return, DSCR (debt service coverage ratio)
  - Rent-to-price ratio, expense ratios
  - Creative finance modeling: subject-to, seller finance amortization, lease-option structuring
  - Generate deal analysis spreadsheet with go/no-go recommendation
- Property comps via PropStream ($97/mo Pro plan):
  - 160M+ properties, MLS + public records (updated multiple times per day)
  - Foreclosure risk scoring, property condition AI assessment
  - Integration: browser automation or manual export + AI processing
- FSBO/distressed lead sourcing:
  - Pre-foreclosure, tax delinquent, vacant, liens (PropStream 20 pre-built lead lists)
  - Skip tracing via PropStream (free with Pro): 4 phone numbers + 4 emails per property, DNC scrubbing
  - Browser automation + web search for FSBO listings
- Campaign management:
  - Outbound emails from sell@georgetoben.com
  - Campaign messaging: "Make your money go further" positioning
  - Direct mail postcard campaign coordination (via PostcardMania, Yellow Letters, or similar)
  - Track campaign performance (opens, replies, conversions)
- Contractor sourcing for rehab estimates

**SOUL.md directives:**
- Never make offers or commit to purchases — analysis and recommendation only
- Underwriting criteria: minimum 8% cash-on-cash, minimum 1.25 DSCR, max 75% LTV
- Conservative rehab estimates (add 20% contingency)
- ARV based on minimum 3 comparable sales within 0.5 miles and 6 months
- Campaign compliance: CAN-SPAM for email, do-not-mail lists for postcards
- sell@georgetoben.com domain reputation is critical — never spam, max 30 cold emails/day

**PropStream Access:**
- Pro plan ($97/mo): 160M+ properties, comps, skip tracing, lead lists, rehab calculator
- No public API — use browser automation or manual export workflows
- Max 50 property lookups/day (avoid detection/throttling)

---

### 3.6 Marketing Agent (formerly Content)

**Purpose:** Handles all marketing operations: social media content, blog posts, listing descriptions, email newsletters, postcard/direct mail campaigns, ad creation, and brand management across all channels.

**Model:** Claude Sonnet 4.6
**Channel:** Telegram (via Dispatch)
**Email:** None (uses Mailchimp/Brevo API for newsletters, not direct email)
**Phone:** None

**Responsibilities:**

**Content Creation:**
- Social media drafts (X, Facebook, Instagram) — via approved APIs only
- Blog posts for secondlyhomes.com and georgetoben.com
- Property listing descriptions (optimized for FurnishedFinder, TurboTenant, etc.)
- Video scripts and captions
- Brand voice maintenance across all channels

**Email Marketing & Newsletters:**
- Monthly investor newsletter (market insights, portfolio updates, deal flow)
- Tenant newsletter (community updates, maintenance reminders, local events)
- Drip campaigns for leads (nurture sequences)
- Integration: Mailchimp or Brevo (Sendinblue) API for sends and tracking
- Subscriber list management (separate from tenant PII — marketing opt-in only)
- A/B testing subject lines and content

**Direct Mail & Postcards:**
- Postcard design briefs (copy + layout direction for print services)
- Campaign list preparation from PropStream skip trace data (via Acquisitions handoff)
- Coordinate with print/mail services (PostcardMania, Yellow Letters Complete, REIPrintMail)
- "We Buy Houses" and "Make Your Money Go Further" campaign variations
- Seasonal campaigns (tax season, year-end, spring market)
- Track response rates and ROI per campaign

**Ad Creation:**
- Facebook/Instagram ad copy and targeting suggestions
- Google Ads copy (search and display)
- Ad performance tracking and optimization recommendations
- Budget allocation suggestions based on historical performance

**Analytics & Reporting:**
- Weekly content performance report (engagement, reach, clicks)
- Monthly marketing dashboard (all channels: social, email, direct mail, ads)
- Campaign attribution tracking (which channel drives leads)
- Content calendar management (plan 2-4 weeks ahead)

**SOUL.md directives:**
- NO access to tenant PII (names, SSNs, financial info, lease details)
- NO access to QuickBooks or financial data
- NO access to screening reports or tenant applications
- Content review queue: all content is DRAFT until human-approved
- Brand voice: professional, trustworthy, community-focused for Secondly Homes; bold, investor-savvy for George Toben brand
- Social media: never auto-post without approval (first 60 days minimum)
- Newsletter: subscriber consent required (double opt-in), unsubscribe in every email
- Direct mail: respect do-not-mail lists, include return address
- Ad spend: NEVER auto-spend on ads — recommendations only, human executes
- CAN-SPAM and TCPA compliance for all marketing communications

**Marketing Tool Access:**
- Mailchimp/Brevo API: create campaigns, manage lists, send emails, pull analytics — ALLOWED
- Social media APIs (X, Facebook, Instagram): draft posts, schedule (with approval) — ALLOWED
- Canva API (if available): template-based design generation — ALLOWED
- PostcardMania/direct mail service API: create orders — REQUIRES HUMAN APPROVAL
- Ad platforms (Facebook Ads, Google Ads): read analytics — ALLOWED; create/modify campaigns — REQUIRES HUMAN APPROVAL

---

## 4. Agent Permission Matrix

~~~
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

Legend:
  YES   = Allowed
  NO    = Blocked
  GATE  = Requires human approval per invocation
  L     = Leasing
  B     = Bookkeeper
~~~

### Additional Tool Access (per agent)

**Assistant:** Google Calendar (GOG), Google Drive (restricted folder), Quo API (read summaries + send SMS), Perplexity (general research)

**Leasing:** Whitepages Pro API, Perplexity Sonar (screening research), Google Drive (lease templates)

**Bookkeeper:** QuickBooks MCP (read + create; modify/delete = approval), receipt parser

**Acquisitions:** PropStream (browser automation), Perplexity Sonar Pro (market research), Google Drive (deal templates)

**Marketing:** Mailchimp/Brevo API, social media APIs (X, Facebook, Instagram), Canva API (if available)

### Data Isolation Rules

- **Bookkeeper** can NEVER access: tenant PII, screening reports, email inboxes, social media
- **Marketing** can NEVER access: QuickBooks, tenant applications, screening data, lease details, SSNs, financial records
- **Leasing** can NEVER access: QuickBooks entries, deal analysis, acquisition campaigns
- **Acquisitions** can NEVER access: tenant PII, QuickBooks, lease documents
- **Dispatch** can NEVER access: any tool directly (routing only, reads context to make decisions)

---

## 5. Agent-to-Agent Communication Rules

~~~
Dispatch --> Assistant       YES (general tasks, briefing requests)
Dispatch --> Leasing         YES (tenant leads, screening requests)
Dispatch --> Bookkeeper      YES (invoice processing, financial queries)
Dispatch --> Acquisitions    YES (deal analysis, comp requests)
Dispatch --> Marketing       YES (content requests, campaign briefs)

Assistant --> Leasing        YES (scheduling related to properties)
Assistant --> Bookkeeper     YES (forwarding invoices/receipts)

Leasing --> ANY              NO  (responds to Dispatch only)
Bookkeeper --> ANY           NO  (responds to Dispatch only)
Acquisitions --> ANY         NO  (responds to Dispatch only)
Marketing --> ANY            NO  (responds to Dispatch only)

ALL --> Dispatch             YES (escalation, status updates, completion reports)
~~~

**Why this matters:** Prevents circular delegation loops. If Leasing needs Bookkeeper to log a rent payment, it tells Dispatch, which routes to Bookkeeper. No agent can get stuck in an infinite loop with another agent.

**Cross-agent data handoff patterns:**
- Acquisitions generates skip trace data --> hands to Marketing (via Dispatch) for direct mail campaigns
- Leasing flags late rent --> notifies Bookkeeper (via Dispatch) to update ledger
- Assistant processes Quo call summary --> routes to Leasing if tenant-related, Acquisitions if seller-related
- Marketing needs property photos/details --> requests from Leasing (via Dispatch)

---

## 6. Email Domain Strategy

### Three-Domain Architecture

**doughy.app** (Property Management + Operations)

| Address | Purpose | Agent |
|---------|---------|-------|
| assistant@doughy.app | Primary hub, general inbox, receipt forwarding | Assistant |
| inspections@doughy.app | Inspector coordination, scheduling, report intake | Leasing |
| contractors@doughy.app | Contractor sourcing, bids, scheduling, payments | Leasing |

All addresses on one Google Workspace account ($6/mo). inspections@ and contractors@ are aliases.

**secondlyhomes.com** (Tenant-Facing Professional)

| Address | Purpose | Agent |
|---------|---------|-------|
| assistant@secondlyhomes.com | Tenant communications, lease docs, lead response | Leasing |

Separate Google Workspace account ($6/mo) or alias on doughy.app.

**georgetoben.com** (Acquisition Campaigns)

| Address | Purpose | Agent |
|---------|---------|-------|
| sell@georgetoben.com | FSBO outreach, seller campaigns, investor marketing | Acquisitions |

Separate domain protects property management reputation from cold outreach deliverability impact. Google Workspace account ($6/mo) or alias.

### DNS Configuration (ALL three domains)

~~~
# SPF (add to each domain's DNS TXT record)
v=spf1 include:_spf.google.com ~all

# DKIM (configure in Google Admin Console)
2048-bit key, selector: google

# DMARC (add to each domain's DNS TXT record)
v=DMARC1; p=none; rua=mailto:dino@secondlyhomes.com

# DMARC escalation timeline:
# Week 1-4:  p=none        (monitor only, collect reports)
# Week 5-8:  p=quarantine  (flag suspicious, review reports)
# Week 9+:   p=reject      (full enforcement)
~~~

**Subdomain strategy for automated sends:**
- Consider bot@mail.doughy.app for high-volume automated emails
- Protects main domain reputation if automation triggers spam filters
- Only needed if daily automated email volume exceeds 20+

### Total Email Cost: $6-18/month

---

## 7. Phone & Voice Strategy

### Quo (Primary Business Phone System)

**Purpose:** Professional phone system replacing personal number. Sona AI answers calls 24/7, captures lead info, answers FAQs, transfers when needed.

**Plan:** Starter ($15/user/month) + Sona credits
- 10 free Sona calls/month included (1,000 credits)
- $25/month add-on for 50 calls (4,000 credits)
- Calls under 15 seconds don't count
- Overage: $0.45-$1.00/call (can disable overages to pause Sona at zero)
- Estimated volume: 20-40 Sona calls/month for 7 properties

**Quo + OpenClaw Integration:**

~~~
QUO --> OPENCLAW (Webhooks):
  - call.completed         --> Assistant logs call, updates contact memory
  - message.delivered      --> Assistant tracks message status
  - call.summary.completed --> Assistant processes AI summary:
                               * Logs to daily briefing
                               * Creates calendar event if needed
                               * Drafts follow-up if needed
                               * Routes to Leasing (tenant) or Acquisitions (seller) via Dispatch

OPENCLAW --> QUO (API):
  - Send SMS from business number (maintenance reminders, follow-ups)
  - Create/update contacts
  - Pull call history and transcripts
  - Read voicemail transcriptions
~~~

**Allowlist:** api.openphone.com in Squid proxy

### Twilio (Automated Outbound via OpenClaw)

**Purpose:** Automated outbound messages that don't need to come from the professional Quo number.

**Pricing:**
- Outbound voice: $0.014/min
- Inbound voice: $0.0085/min
- SMS: $0.0083/segment
- Phone number: $1.15/mo
- Estimated: ~200 texts + ~20 calls/month = $5-15/mo

**Use cases:**
- Automated maintenance follow-up texts
- Lease reminder SMS sequences
- Campaign follow-up texts (Acquisitions)
- Bulk notification sends

**Integration:** OpenClaw native voice-call plugin + Twilio MCP server

### Phone Number Mapping

| Number | System | Context | Agent(s) |
|--------|--------|---------|----------|
| Quo business line | Quo/Sona | Professional inbound, tenant/lead calls | Assistant, Leasing |
| Twilio number | Twilio | Automated outbound, bulk sends | Leasing, Assistant |

### Estimated Phone Cost: $20-55/month

---

## 8. Integration Map

### Tier 1 — Core (Day 1)

| Integration | Purpose | Agent(s) | MCP/API | Cost |
|-------------|---------|----------|---------|------|
| Google Workspace (GOG) | Calendar, Drive, Email | Assistant, Leasing | GOG skill | $6-18/mo |
| Telegram | Primary control channel, briefings | All (via Dispatch) | Native OpenClaw | Free |
| Anthropic API | Claude models (Sonnet, Haiku, Opus) | All | LiteLLM proxy | $35-70/mo |

### Tier 2 — Operations (Week 2)

| Integration | Purpose | Agent(s) | MCP/API | Cost |
|-------------|---------|----------|---------|------|
| QuickBooks Online | Bookkeeping, invoices, P&L | Bookkeeper | Intuit MCP or Klavis AI | QB subscription |
| Perplexity | Tenant screening, market research | Leasing, Acquisitions | @perplexity-ai/mcp-server | $2-5/mo API |
| Whitepages Pro | Identity verification for screening | Leasing | REST API | $0.20-0.28/lookup |

### Tier 3 — Growth (Week 3)

| Integration | Purpose | Agent(s) | MCP/API | Cost |
|-------------|---------|----------|---------|------|
| Quo | Business phone system + Sona AI | Assistant, Leasing | REST API + webhooks | $15-40/mo |
| Twilio | Automated SMS/voice | Leasing, Assistant | Native plugin + MCP | $5-15/mo |
| PropStream | Comps, underwriting, lead sourcing | Acquisitions | Browser automation | $97/mo |

### Tier 4 — Marketing (Week 4)

| Integration | Purpose | Agent(s) | MCP/API | Cost |
|-------------|---------|----------|---------|------|
| Mailchimp or Brevo | Email newsletters, drip campaigns | Marketing | REST API | Free tier initially |
| Social media APIs | X, Facebook, Instagram posting | Marketing | Platform APIs | Free |
| PostcardMania (or similar) | Direct mail postcards | Marketing | Manual/API | Per-campaign |

### Doughy CRM Integration (Critical Data Loop)

~~~
OPENCLAW reads from Doughy:
  GET /api/leads          -- New leads for Leasing to respond to
  GET /api/contacts       -- Contact info for all agents
  GET /api/properties     -- Property details, unit info, rent amounts
  GET /api/tenants        -- Tenant records for Leasing
  GET /api/deals          -- Deal pipeline for Acquisitions

OPENCLAW writes to Doughy:
  POST /api/leads         -- New leads from campaigns (Acquisitions)
  PUT  /api/leads/:id     -- Update lead status after response (Leasing)
  POST /api/contacts      -- New contacts from calls/emails (Assistant)
  PUT  /api/contacts/:id  -- Update contact notes/status (all agents)
  POST /api/activities    -- Log agent actions for audit trail (all agents)
  PUT  /api/deals/:id     -- Update deal analysis (Acquisitions)
~~~

### Callpilot Integration

~~~
OPENCLAW reads from Callpilot:
  GET /api/conversations  -- Recent messages for context
  GET /api/call-logs      -- Call history and outcomes

OPENCLAW writes to Callpilot:
  POST /api/messages      -- Send messages through Callpilot
  PUT  /api/conversations/:id -- Update conversation status/notes
~~~

**Note:** Doughy and Callpilot API specs may be placeholder endpoints. Define exact contracts during Phase 2 when wiring the integrations. The pattern matters more than the exact URLs.

---

## 9. Security Architecture (3 Tiers)

### CRITICAL CONSTRAINT: OpenClaw Version

OpenClaw must be version 2026.1.29 or later. Earlier versions are vulnerable to CVE-2026-25253 (gateway token validation bypass). The Claude Code deployment prompt MUST verify this before proceeding.

### Tier 1 — Minimum Viable Security (Day 1, Non-Negotiable)

~~~
 1. Tailscale VPN-only access
    - Install Tailscale on Droplet
    - NO public ports exposed (gateway never on 0.0.0.0)
    - Gateway bound to 127.0.0.1:18789 ONLY
    - Access only through Tailscale network

 2. UFW Firewall
    - Default: deny all incoming
    - Allow: tailscale0 interface only
    - SSH: Tailscale only (disable password auth, key-only)

 3. Device Authentication
    - ENABLED in openclaw.json
    - DM pairing: allowlist Dino's devices only
    - Each new device requires explicit approval

 4. File Permissions
    - 600 on all credential files (.env, API keys, tokens)
    - 700 on workspace directories
    - Non-root execution (openclaw user)

 5. Filesystem Restrictions
    - Deny access to: .ssh, /etc, /root, /var/log
    - Sandbox: agents can only read/write within their workspace

 6. Burner Accounts
    - Dedicated Gmail for OpenClaw (not personal)
    - Dedicated Telegram bot
    - Dedicated X, Instagram accounts for automation
    - NEVER use personal credentials

 7. Security Audit
    - Run: openclaw security audit --deep
    - MUST return ZERO warnings before going live
    - Any warning = fix before proceeding
~~~

### Tier 2 — Standard Protection (Week 1)

~~~
 1. Tool Allowlisting (per agent)
    - Each agent: explicit tool list in workspace config
    - Default: DENY all tools not explicitly listed
    - See Permission Matrix (Section 4) for per-agent tools

 2. Elevated Tool Approval
    - exec, apply_patch, destructive writes: require human approval EVERY invocation
    - Approval via Telegram inline buttons
    - Timeout: 30 minutes, then auto-reject

 3. MCP Server Version Pinning
    - Pin exact versions in package.json / openclaw.json
    - NEVER use "latest" or unpinned versions
    - Review changelogs before upgrading

 4. OAuth Scope Minimization
    - Google: calendar.events, drive.file (not drive.full)
    - QuickBooks: accounting.read, accounting.create (not accounting.admin)
    - Each integration: minimum scopes needed

 5. Automated Security Audit
    - Weekly cron: openclaw security audit --deep
    - Results sent to Telegram
    - Any new warning = immediate alert

 6. Credential Rotation
    - Monthly: rotate all API keys
    - Quarterly: rotate OAuth tokens
    - Immediately: rotate on any suspected compromise
~~~

### Tier 3 — Defense in Depth (Week 3-4)

~~~
 1. LiteLLM Proxy (Credential Broker)
    - OpenClaw NEVER sees real API keys
    - LiteLLM holds all provider credentials
    - OpenClaw sends requests to localhost LiteLLM endpoint
    - LiteLLM injects credentials and forwards to providers
    - Rate limiting per provider per day
    - Budget caps: $5/day initially (raise after week 1)
    - Explicit model routing (NEVER openrouter/auto)

 2. Squid Proxy (Egress Filtering)
    - Deny-by-default: ALL outbound traffic blocked unless allowlisted
    - Allowlist (ONLY these domains):

    ALLOWED:
      api.anthropic.com                  -- Anthropic (Claude)
      generativelanguage.googleapis.com  -- Google (Gemini)
      api.groq.com                       -- Groq (Llama)
      api.mistral.ai                     -- Mistral
      api.twilio.com                     -- Twilio
      api.perplexity.ai                  -- Perplexity
      gmail.googleapis.com               -- Gmail API
      calendar.googleapis.com            -- Google Calendar
      www.googleapis.com                 -- Google Drive
      proapi.whitepages.com              -- Whitepages Pro
      api.openphone.com                  -- Quo
      api.intuit.com                     -- QuickBooks
      sandbox.api.intuit.com             -- QuickBooks sandbox
      api.mailchimp.com                  -- Mailchimp (or api.brevo.com)
      graph.facebook.com                 -- Facebook/Instagram API
      api.twitter.com                    -- X (Twitter) API
      api.x.com                          -- X API v2
      github.com                         -- Updates only
      registry.npmjs.org                 -- Package installs
      api.telegram.org                   -- Telegram bot API

    BLOCKED (Chinese AI endpoints -- HARD BLOCK):
      api.deepseek.com
      dashscope.aliyuncs.com             -- Qwen/Alibaba
      api.moonshot.cn                    -- Kimi
      open.bigmodel.cn                   -- GLM/Zhipu
      api.doubao.com                     -- Doubao/ByteDance
      aip.baidubce.com                   -- Ernie/Baidu
      api.minimax.chat                   -- MiniMax
      api.baichuan-ai.com               -- Baichuan
      api.lingyiwanwu.com               -- Yi
      api.mimo.ai                        -- MiMo

    BLOCKED: Everything else not explicitly allowlisted

 3. Tailscale Aperture (Free Alpha)
    - AI governance gateway
    - Centralizes ALL API keys (alternative to LiteLLM for credential brokering)
    - Logs every LLM session with identity attached
    - Extracts MCP and local tool calls for auditing
    - S3 export for compliance records
    - Register at: https://tailscale.com/aperture

 4. ClawWatcher (Cost Monitoring)
    - Real-time spend tracking per model per agent
    - Auto-pause when budget cap hit
    - Daily cost summary to Telegram
    - Alerts at 50%, 75%, 90% of daily budget
~~~

### Chinese Model Blacklist (HARD BLOCK — Non-Negotiable)

NEVER use ANY of these models or providers, regardless of cost savings:

| Provider | Models | Reason |
|----------|--------|--------|
| DeepSeek | deepseek-chat, deepseek-coder, deepseek-v3, deepseek-r1 | PRC data laws, government access |
| Qwen/Alibaba | qwen-*, qwen2-* | Same |
| Kimi/Moonshot | moonshot-v1-* | Same |
| GLM/Zhipu | glm-4, chatglm-* | Same |
| Doubao/ByteDance | doubao-* | Same |
| Ernie/Baidu | ernie-*, ernie-bot-* | Same |
| MiniMax | minimax-*, abab-* | Same |
| Baichuan | baichuan-* | Same |
| Yi/01.AI | yi-* | Same |
| MiMo | mimo-* | Same |

**NEVER use openrouter/auto routing** — it may silently route to Chinese models.
**Squid proxy blocks ALL Chinese AI endpoints at the network level** as a second safety layer.

---

## 10. AI Model Strategy

### Model Routing Table

| Task | Model | Provider | Cost (Input/Output per MTok) |
|------|-------|----------|------------------------------|
| Heartbeats, status checks | Gemini 2.0 Flash-Lite | Google | $0.075 / $0.30 |
| Simple classification, sorting | Llama 3.1 8B | Groq | $0.05 / $0.08 |
| Sub-agent background tasks | Ministral 3B | Mistral | $0.10 / $0.10 |
| Email triage, data entry, dispatch routing | Claude Haiku 4.5 | Anthropic | $0.80 / $4.00 |
| Drafting, content, analysis | Claude Sonnet 4.6 | Anthropic | $3.00 / $15.00 |
| Complex reasoning, underwriting | Claude Opus 4.6 | Anthropic | $5.00 / $25.00 |
| Tenant research, verification | Perplexity Sonar | Perplexity | $1.00 / $1.00 |
| Deep market research | Perplexity Sonar Pro | Perplexity | $3.00 / $15.00 |

### Cost Optimization Levers

1. **Multi-model routing:** 70%+ of tasks go to models costing less than $0.50/MTok (Gemini Flash-Lite, Groq Llama, Ministral). Only complex work hits Sonnet/Opus.
2. **Batch API:** 50% discount for non-urgent work (monthly reports, content generation, bulk analysis). Queue tasks and submit as batch.
3. **Prompt caching:** 0.1x base input price for cache hits. Cache SOUL.md system prompts, common templates, property data. Reported 90% savings on repeated context.
4. **Token discipline:** Stay under 200K input tokens per request. Above this, premium "long context" rates apply. Summarize conversation history instead of passing full transcripts.
5. **Budget caps:** LiteLLM proxy hard caps per provider per day. Anthropic workspace spend limits. ClawWatcher auto-pause at threshold.

---

## 11. Cost Controls & Monthly Budget

### Budget Enforcement

| Control | Mechanism | Threshold |
|---------|-----------|-----------|
| Daily API spend | LiteLLM proxy hard cap | $5/day (Week 1), $10/day (Week 2+) |
| Per-provider cap | LiteLLM per-key limits | $3/day Anthropic, $1/day Google, $1/day others |
| Auto-pause | ClawWatcher | Pause all agents at 90% daily budget |
| Workspace limit | Anthropic dashboard | Monthly cap matching budget |
| Alert thresholds | ClawWatcher to Telegram | 50%, 75%, 90% of daily budget |

### Monthly Budget Breakdown

| Line Item | Cost | Notes |
|-----------|------|-------|
| DigitalOcean 1GB Droplet | $12 | s-2vcpu-1gb, NYC1 region |
| Google Workspace (email) | $6-18 | 1-3 accounts for 3 domains |
| Quo phone system | $15-40 | Starter $15 + Sona credits $25 |
| Twilio voice + SMS | $5-15 | ~200 texts + ~20 calls/month |
| Claude Sonnet 4.6 | $30-60 | Complex drafting, analysis, content |
| Claude Haiku 4.5 | $5-10 | Email sorting, classification, data entry |
| Gemini Flash-Lite | $1-3 | Heartbeats, simple routing |
| Groq Llama 3.1 8B | $1-3 | Background classification workers |
| Perplexity API | $2-5 | Tenant research, market analysis |
| PropStream Pro | $97 | Comps, underwriting, skip tracing, leads |
| Mailchimp/Brevo | $0 | Free tier (up to 500 subscribers) |
| Tailscale + Aperture | $0 | Free personal plan + alpha |
| ClawWatcher | $0-10 | Cost monitoring dashboard |
| **TOTAL** | **$186-285** | |

### Savings vs. Previous VA

| Comparison | Monthly Cost | Capabilities |
|---|---|---|
| Previous VA | $530 | Limited hours, inconsistent quality, no 24/7 |
| OpenClaw ecosystem | $186-285 | 24/7, 6 specialist agents, automated workflows, audit trail |
| **Savings** | **$245-344/month** | **46-65% reduction with expanded capabilities** |

---

## 12. Rate Limits

### Day 1 Limits (Tight — Open Gradually)

| Channel | Limit | Approval Required |
|---------|-------|-------------------|
| Total API spend | $5/day | Auto-enforced by LiteLLM |
| Outbound emails | 50/day max | ALL require approval (first 30 days) |
| Outbound SMS | 20/day max | ALL require approval (first 30 days) |
| Outbound voice calls | 5/day max | ALL require approval (first 30 days) |
| QuickBooks entries | 20/day max | Create: auto; Modify/Delete: always approval |
| QuickBooks entries >$500 | N/A | ALWAYS require approval |
| PropStream lookups | 50/day max | Auto (browser automation) |
| Cold emails (sell@) | 30/day max | ALL require approval (first 60 days) |
| Social media posts | 5/day max | ALL require approval (first 60 days) |
| Newsletter sends | 1/week max | ALWAYS require approval |
| Direct mail orders | N/A | ALWAYS require approval |
| Agent-to-agent messages | Dispatch only | Auto |

### Gradual Opening Timeline

| Week | Change |
|------|--------|
| Week 1 | All sends require approval. $5/day cap. Monitor patterns. |
| Week 2 | Raise API cap to $10/day. Auto-approve routine lease reminders if quality is good. |
| Week 3 | Auto-approve maintenance follow-up SMS. Auto-approve rent reminder emails. |
| Week 4 | Auto-approve standard tenant communications (templates only, not freeform). |
| Month 2 | Evaluate full automation for proven workflows. Consider raising email/SMS limits. |
| Month 3 | Auto-approve social media posts (if quality consistently good). Open cold email auto-send. |

---

## 13. Bouncer Control Dashboard

### Current State

Basic one-screen UI with:
- Audit info display
- Kill switch (emergency stop all agents)
- Cost tracking (currently inaccurate — needs OpenClaw API wiring)
- Function toggles (on/off per feature)

### Target State (After OpenClaw Deployment)

**Authentication:** Tailscale-only access. NEVER expose Bouncer to the public internet. If web-accessible, require password + 2FA minimum.

**Dashboard Features:**

| Feature | Data Source | Priority |
|---------|------------|----------|
| Agent on/off toggles | OpenClaw API | P0 (Day 1) |
| Kill switch (stop all) | OpenClaw API | P0 (Day 1) |
| Agent health / heartbeat status | OpenClaw API | P0 (Day 1) |
| Real-time activity log | OpenClaw API (session events) | P1 (Week 2) |
| Approve/reject queue | OpenClaw API (pending actions) | P1 (Week 2) |
| Cost dashboard (per agent, model, day) | LiteLLM API + ClawWatcher | P1 (Week 2) |
| SOUL.md editor (per agent) | File system / OpenClaw API | P2 (Week 3) |
| Rate limit controls | OpenClaw config | P2 (Week 3) |
| Analytics (tasks, response times, funnel) | OpenClaw logs + Doughy API | P3 (Month 2) |

### Bouncer to OpenClaw API Contract

~~~
GET  /api/agents              -- List all agents with status
POST /api/agents/:id/toggle   -- Enable/disable agent
POST /api/agents/:id/kill     -- Emergency stop agent
GET  /api/sessions            -- Active sessions across agents
GET  /api/sessions/:id/events -- Event log for specific session
GET  /api/pending             -- Actions awaiting human approval
POST /api/pending/:id/approve -- Approve pending action
POST /api/pending/:id/reject  -- Reject pending action
GET  /api/metrics/cost        -- Cost breakdown (via LiteLLM)
GET  /api/metrics/usage       -- Usage stats per agent
PUT  /api/agents/:id/soul     -- Update agent SOUL.md
GET  /api/health              -- System health check
~~~

**Tech Stack:**
- React (existing Bouncer frontend)
- Lightweight Node.js backend (proxies to OpenClaw API + LiteLLM API)
- No AI reasoning in Bouncer — pure UI/monitoring
- Lives in apps/bouncer/ in monorepo

---

## 14. Deployment Phases (30 Days)

### Phase 1: Foundation + Security (Days 1-3) -- COMPLETE

~~~
 [x]  1. Analyze existing custom claw implementation
 [x]  2. Archive custom claw to legacy/custom-claw/ (PRESERVE, do not delete)
 [x]  3. Remove custom claw from active server
 [x]  4. Create server/openclaw/ directory in monorepo
 [x]  5. Deploy DigitalOcean droplet (1GB/2vCPU, NYC1 — smaller than spec'd, stable)
 [x]  6. Install Tailscale (needs `tailscale up --ssh` for SSH access)
 [x]  7. Lock down UFW: deny all incoming, allow tailscale0 only
 [x]  8. Verify gateway bound to 127.0.0.1:18789 (NOT 0.0.0.0)
 [x]  9. Enable device authentication + DM pairing allowlist
 [x] 10. Set file permissions: 600 on credentials, 700 on workspaces
 [x] 11. Create burner accounts: Telegram bot (@doughy_assistant_bot)
 [x] 12. Set up Telegram as primary control channel
 [x] 13. Security baseline established
 [x] 14. Configure Anthropic API key via LiteLLM proxy
~~~

### Phase 2: Core Agents Live (Days 4-7) -- PARTIAL

~~~
 [x] 15. Create workspace directories for all 6 agents
 [x] 16. Write SOUL.md files for each agent
 [x] 17. Configure agent tool permissions (per Permission Matrix)
 [x] 18. Configure routing via sessions_spawn (agentToAgent disabled, bug #5813)
 [x] 19. Deploy Dispatch + Assistant agents first
 [ ] 20. Set up Google Workspace: assistant@doughy.app (NOT STARTED)
 [ ] 21. Configure SPF, DKIM (2048-bit), DMARC (p=none) for doughy.app
 [ ] 22. Connect assistant@doughy.app via IMAP/Gmail skill
 [ ] 23. Configure email triage (Haiku sorts, Sonnet drafts)
 [ ] 24. Set up Google Calendar integration (GOG skill)
 [x] 25. Set up daily morning briefing to Telegram (7 AM ET cron)
 [ ] 26. Test: send emails to assistant@doughy.app (BLOCKED on email setup)
 [ ] 27. Test: create calendar events via Telegram (BLOCKED on calendar setup)
 [ ] 28. Test: morning briefing delivery
~~~

### Phase 3: Operations Agents (Days 8-14)

~~~
29. Deploy Leasing agent
30. Set up Google Workspace: assistant@secondlyhomes.com
31. Configure SPF, DKIM, DMARC for secondlyhomes.com
32. Configure inspections@doughy.app and contractors@doughy.app aliases
33. Set up tenant screening pipeline:
    - PDF parsing for applications
    - Whitepages Pro API integration
    - Perplexity Sonar for research
    - Screening recommendation template
34. Configure lease template access (Google Drive)
35. Set up rent tracking alerts (Day 2, Day 5, Day 10)
36. Set up lease renewal reminders (90/60/30 day)
37. Deploy Bookkeeper agent
38. Install QuickBooks MCP server (Intuit official or Klavis AI)
39. Configure Bookkeeper QuickBooks access (read + create)
40. Set up invoice/receipt processing pipeline
41. Set up monthly P&L generation (3rd of month cron)
42. Configure rent roll tracking and late payment alerts
43. Test: submit fake tenant application, verify full screening pipeline
44. Test: forward invoice to assistant@doughy.app, verify QB entry draft
45. Test: rent tracking alerts fire correctly on Day 2, Day 5
~~~

### Phase 4: Growth Agents (Days 15-21)

~~~
46. Deploy Acquisitions agent
47. Set up Google Workspace: sell@georgetoben.com
48. Configure SPF, DKIM, DMARC for georgetoben.com
49. Set up PropStream account ($97/mo Pro plan)
50. Configure PropStream browser automation or export workflow
51. Build underwriting model template in SOUL.md
52. Test: run comp analysis on a known property, verify accuracy
53. Deploy Marketing agent
54. Set up Mailchimp or Brevo account (free tier)
55. Configure newsletter templates and subscriber lists
56. Configure social media API access (X, Facebook, Instagram)
57. Set up content review queue (draft, approve, publish)
58. Test: generate blog post draft, review quality
59. Test: create newsletter draft, verify formatting and links
~~~

### Phase 5: Voice + Hardening (Days 22-30) -- PARTIAL

~~~
 [ ] 60. Set up Quo account ($15/mo Starter) (NOT STARTED)
 [ ] 61. Configure Sona AI agent (knowledge base, call flows, greeting)
 [ ] 62. Set up Quo webhooks to OpenClaw
 [ ] 63. Configure OpenClaw to Quo API
 [ ] 64. Set up Twilio account + OpenClaw voice-call plugin
 [ ] 65. Configure inbound call handling
 [ ] 66. Configure SMS for maintenance follow-ups and lease reminders
 [x] 67. Install LiteLLM proxy as credential broker
 [x] 68. Configure per-provider budget caps in LiteLLM
 [x] 69. Install and configure Squid proxy with egress allowlist
 [x] 70. Verify ALL Chinese AI endpoints blocked at Squid level
 [ ] 71. Register for Tailscale Aperture alpha (NOT STARTED)
 [ ] 72. Install ClawWatcher (NOT STARTED)
 [ ] 73. Set up weekly security audit cron job (NOT STARTED)
 [x] 74. Implement multi-model routing via LiteLLM (Haiku dispatch, Sonnet specialists)
 [ ] 75. Wire Bouncer UI to OpenClaw API (NOT STARTED)
 [ ] 76. Wire Doughy CRM to OpenClaw data endpoints (NOT STARTED)
 [ ] 77. Wire Callpilot to OpenClaw data endpoints (NOT STARTED)
 [ ] 78. Fine-tune budget caps based on actual usage
 [ ] 79. Document all workflows and emergency procedures
 [ ] 80. Full end-to-end test
~~~

---

## 15. Success Metrics

### Track Monthly

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Email response time | < 30 min (business hours) | Audit draft timestamps in agent logs |
| Lead follow-up rate | 100% within 24 hours | Review follow-up logs in Doughy |
| Daily briefing delivery | 7/7 days | Telegram message log |
| Monthly API spend | < $150 | Anthropic dashboard + LiteLLM + ClawWatcher |
| Security audit score | 0 warnings | Weekly openclaw security audit --deep |
| Marketing output | 10+ pieces/week | Content queue log (social + blog + email) |
| Tenant screening turnaround | < 24 hours from application | Screening pipeline timestamps |
| Calendar accuracy | 100% (no double-bookings) | Weekly calendar review |
| Deal analysis turnaround | < 2 hours from comp request | Acquisitions agent logs |
| Newsletter open rate | > 25% | Mailchimp/Brevo analytics |
| Cold email reply rate | > 5% | sell@georgetoben.com tracking |
| Postcard response rate | > 1% | Campaign tracking codes |

---

## 16. Claude Code Deployment Prompt

Copy and paste this entire section into Claude Code to begin deployment.

~~~
# DEPLOYMENT INSTRUCTIONS FOR CLAUDE CODE

## CONSTRAINT #1 — READ THIS FIRST (NON-NEGOTIABLE)

DO NOT build a custom AI engine. DO NOT write your own "claw" or agent framework.
Your job is to install the REAL OpenClaw from the official open-source project.

BEFORE installing OpenClaw:
1. Analyze the existing custom claw implementation on the server
2. Document what it does (endpoints, integrations, features) in legacy/custom-claw/README.md
3. Copy ALL custom claw code to legacy/custom-claw/ (preserve everything)
4. Remove custom claw from the active server
5. THEN install the official OpenClaw from DigitalOcean 1-Click or the project repo
6. VERIFY the installed OpenClaw version is >= 2026.1.29 (mandatory CVE fix)

If the version is older than 2026.1.29, STOP and alert. Do not proceed.

## CONSTRAINT #2 — SECURITY IS NON-NEGOTIABLE

- Gateway MUST bind to 127.0.0.1:18789 (NEVER 0.0.0.0)
- Tailscale VPN must be installed and configured before any other step
- Device authentication MUST be enabled
- Run "openclaw security audit --deep" and fix ALL warnings before going live
- ALL credential files must be chmod 600
- ALL workspace directories must be chmod 700
- NEVER expose ANY port to the public internet

## CONSTRAINT #3 — NO CHINESE AI MODELS

NEVER configure, reference, or allow routing to ANY of these providers:
DeepSeek, Qwen, Kimi, GLM, Doubao, Ernie, MiniMax, Baichuan, Yi, MiMo

NEVER use "openrouter/auto" or any routing that could silently select Chinese models.
Only use explicit model IDs from approved providers:
Anthropic, Google, Groq, Mistral, Perplexity

## STEP 1: Server Setup

1. Provision DigitalOcean Droplet: s-2vcpu-1gb, NYC1 region, OpenClaw 1-Click image
2. SSH into Droplet, wait for setup to complete
3. Verify OpenClaw version >= 2026.1.29
4. Install Tailscale: curl -fsSL https://tailscale.com/install.sh | sh && tailscale up
5. Configure UFW:
   - ufw default deny incoming
   - ufw default allow outgoing
   - ufw allow in on tailscale0
   - ufw enable
6. Verify gateway is on 127.0.0.1:18789 (check openclaw.env or openclaw.json)
7. Enable device authentication in openclaw.json
8. Run: openclaw security audit --deep
9. Fix any warnings. Re-run until zero warnings.

## STEP 2: Monorepo Structure

Create the directory structure as defined in Section 2 of the architecture doc.
Create server/openclaw/workspaces/ with subdirectories for:
dispatch, assistant, leasing, bookkeeper, acquisitions, marketing

Each workspace gets: SOUL.md, MEMORY.md, memory/ directory

## STEP 3: Agent Configuration

Configure openclaw.json with 6 agents per Section 3:
- Dispatch: model=claude-haiku-4-5, tools=[sessions, read] (uses sessions_spawn for delegation)
- Assistant: model=claude-sonnet-4-6, tools=[read, write, exec]
- Leasing: model=claude-sonnet-4-6, tools=[read, exec]
- Bookkeeper: model=claude-haiku-4-5, tools=[read]
- Acquisitions: model=claude-sonnet-4-6, tools=[read, exec]
- Marketing: model=claude-sonnet-4-6, tools=[read]

Configure agent-to-agent messaging per Section 5 rules.
Configure per-agent sandbox and filesystem restrictions per Section 4.

## STEP 4: Email Setup

1. Configure Google Workspace for doughy.app ($6/mo)
2. Set up assistant@doughy.app as primary inbox
3. Create aliases: inspections@doughy.app, contractors@doughy.app
4. Configure SPF, DKIM (2048-bit), DMARC (p=none) for doughy.app
5. Repeat DNS setup for secondlyhomes.com and georgetoben.com
6. Connect email to Assistant agent via IMAP/Gmail skill

## STEP 5: LiteLLM Proxy

1. Install LiteLLM: pip install litellm[proxy]
2. Configure litellm_config.yaml with approved models only:
   - anthropic/claude-sonnet-4-6
   - anthropic/claude-haiku-4-5-20251001
   - anthropic/claude-opus-4-6 (reserved for complex reasoning)
   - google/gemini-2.0-flash-lite
   - groq/llama-3.1-8b-instant
   - mistral/ministral-3b-latest
   - perplexity/sonar
   - perplexity/sonar-pro
3. Set budget caps: $5/day total, $3/day Anthropic
4. Start LiteLLM: litellm --config litellm_config.yaml --port 4000
5. Point OpenClaw to http://127.0.0.1:4000 as LLM endpoint

## STEP 6: Squid Egress Proxy

1. Install Squid: apt install squid
2. Configure /etc/squid/squid.conf with deny-by-default allowlist
3. Allowlist ONLY the domains listed in Section 9, Tier 3
4. BLOCK all Chinese AI endpoints listed in Section 9
5. Configure OpenClaw to route all outbound through Squid proxy
6. Test: verify allowed domains resolve, blocked domains fail

## STEP 7: Integrations

1. Telegram: create bot via @BotFather, configure as primary channel
2. Google Calendar: GOG skill, OAuth with calendar.events scope
3. Google Drive: OAuth with drive.file scope (restricted folder only)
4. QuickBooks: install Intuit MCP server or Klavis AI, connect Bookkeeper agent
5. Perplexity: install @perplexity-ai/mcp-server, connect Leasing + Acquisitions
6. Whitepages Pro: configure API key for Leasing agent
7. Daily briefing: cron job at 7:00 AM ET to Telegram

## STEP 8: Testing Checklist

Before declaring deployment complete, verify ALL of these:

[ ] openclaw security audit --deep returns zero warnings
[ ] Gateway is on 127.0.0.1:18789 (not 0.0.0.0)
[ ] Tailscale is the only way to access the server
[ ] UFW blocks all non-Tailscale traffic
[ ] Device auth is enabled, only allowed devices can connect
[ ] All 6 agents respond to test messages via Dispatch
[ ] Email to assistant@doughy.app is triaged correctly
[ ] Calendar events can be created/read via Telegram
[ ] Daily briefing fires at 7 AM ET
[ ] QuickBooks read operations work (Bookkeeper agent)
[ ] Squid blocks a test request to api.deepseek.com
[ ] LiteLLM budget cap stops requests at threshold
[ ] Agent-to-agent messaging works (Dispatch to specialists)
[ ] Agent-to-agent messaging FAILS for unauthorized pairs
[ ] Pending approval queue works (Telegram inline buttons)
[ ] Kill switch stops all agents immediately
[ ] All credential files are chmod 600
[ ] All workspace directories are chmod 700
~~~

---

## 17. Technical References

### OpenClaw & Infrastructure

| Resource | URL |
|----------|-----|
| DigitalOcean 1-Click Deploy | https://marketplace.digitalocean.com/apps/openclaw |
| OpenClaw Security Docs | https://docs.openclaw.ai/gateway/security |
| OpenClaw Multi-Agent Routing | https://docs.openclaw.ai/concepts/multi-agent |
| OpenClaw Voice-Call Plugin | https://docs.openclaw.ai/plugins/voice-call |
| DigitalOcean Droplet Pricing | https://www.digitalocean.com/pricing/droplets |

### AI & Model Providers

| Resource | URL |
|----------|-----|
| Anthropic API Pricing | https://platform.claude.com/docs/en/about-claude/pricing |
| LiteLLM Proxy | https://github.com/BerriAI/litellm |
| Tailscale Aperture | https://tailscale.com/aperture |
| ClawWatcher | https://clawwatcher.com |

### Integrations

| Resource | URL |
|----------|-----|
| Quo Webhooks | https://support.quo.com/core-concepts/integrations/webhooks |
| Quo API | https://www.quo.com/api |
| Quo Sona Pricing | https://support.quo.com/core-concepts/ai-automations/sona/sona-pricing |
| Twilio MCP Server | https://www.twilio.com/en-us/blog/introducing-twilio-alpha-mcp-server |
| QuickBooks MCP (Intuit) | https://github.com/intuit/quickbooks-online-mcp-server |
| QuickBooks MCP (Klavis AI) | https://www.klavis.ai/use-case/connecting-ai-agents-to-quickbooks |
| QuickBooks MCP (Composio) | https://mcp.composio.dev/quickbooks |
| QuickBooks MCP (Zapier) | https://zapier.com/mcp/quickbooks |
| Perplexity MCP Server | npm: @perplexity-ai/mcp-server |
| Whitepages Pro API | https://pro.whitepages.com/developer |
| PropStream | https://www.propstream.com |
| Mailchimp API | https://mailchimp.com/developer/ |
| Brevo (Sendinblue) API | https://developers.brevo.com/ |

### Marketing Services

| Resource | URL |
|----------|-----|
| PostcardMania | https://www.postcardmania.com |
| Yellow Letters Complete | https://www.yellowletterscomplete.com |
| REIPrintMail | https://www.reiprintmail.com |
| Canva API | https://www.canva.dev/ |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-02-21 | Initial architecture from GPT/Perplexity research synthesis |
| v2 | 2026-02-21 | Added Twilio (replacing Bland.ai), Tailscale Aperture, Chinese model blacklist, Squid egress, voice integration, accounting use cases |
| v3 | 2026-02-21 | Multi-agent architecture (6 agents), monorepo integration (Doughy/Callpilot/Bouncer), Quo voice system, QuickBooks MCP, PropStream, Marketing agent (expanded from Content to include newsletters, postcards, direct mail, ad creation), per-agent permission matrix, agent-to-agent communication rules, 3-domain email strategy with DNS for all domains, Bouncer control dashboard spec, Doughy/Callpilot API integration patterns, hardening review with 7 gaps identified and resolved, CVE-2026-25253 version check, Bouncer auth requirement |
