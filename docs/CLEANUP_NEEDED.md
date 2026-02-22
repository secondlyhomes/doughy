# Cleanup Needed

> Last verified: 2026-02-16 by querying Supabase staging (`lqmbyobweeaigrwmvizo`) and grepping codebase.

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Blocking deployment or demo |
| P1 | Should fix before production |
| P2 | Technical debt, fix when convenient |
| P3 | Nice to have, low impact |

---

## ~~P0: Deploy Script Rename (moltbot → openclaw)~~ ✅ DONE

Deploy scripts already reference `openclaw` — no `moltbot` references remain.

---

## ~~P1: Dead `db.*` Helpers in supabase.ts~~ ✅ DONE

The `db.investor.*` and `db.landlord.*` helpers were already removed. `supabase.ts` is now 154 lines containing only the client, storage adapter, and exports. Also removed dead `vendors-store.ts` (278 lines, 0 imports — replaced by React Query hooks).

---

## P1: 18 `ai.openclaw_*` Tables (Admin-Only)

These 18 tables in the `ai` schema support the admin security dashboard and AI infrastructure. They're production-ready but only used by admin screens that are behind feature flags:

| Table | Purpose | Used By |
|-------|---------|---------|
| `openclaw_user_memories` | User memory for AI personalization | memory-manager edge function |
| `openclaw_knowledge_entries` | Knowledge base entries | admin dashboard |
| `openclaw_security_events` | Security event log | admin AI Security Dashboard |
| `openclaw_threat_patterns` | Custom threat detection patterns | admin Pattern Editor |
| `openclaw_circuit_breakers` | Rate limit/circuit breaker state | security middleware |
| `openclaw_rate_limit_config` | Rate limit configuration | security middleware |
| `openclaw_blocked_content` | Blocked content log | admin dashboard |
| `openclaw_security_metrics` | Security metrics aggregation | admin dashboard |
| `openclaw_response_templates` | AI response templates | admin dashboard |
| `openclaw_model_configs` | AI model configurations | admin dashboard |
| `openclaw_prompt_templates` | Prompt templates | admin dashboard |
| `openclaw_sessions` | AI chat sessions | admin dashboard |
| `openclaw_session_messages` | Session messages | admin dashboard |
| `openclaw_feedback` | User feedback on AI responses | admin dashboard |
| `openclaw_ab_tests` | A/B test configurations | admin dashboard |
| `openclaw_ab_test_variants` | A/B test variant definitions | admin dashboard |
| `openclaw_ab_test_results` | A/B test results | admin dashboard |
| `openclaw_cost_tracking` | AI API cost tracking | admin dashboard |

**Action:** Keep all 18 tables. They're well-structured with RLS. Just be aware they exist and are admin-only. No cleanup needed, but document as admin infrastructure.

---

## P2: ~11 Orphaned Tables in Public Schema

These `public` schema tables appear to be leftover from before the schema separation and have no code references in `src/`:

| Table | Columns | Likely Replaced By |
|-------|---------|-------------------|
| `investor_properties` | 16 | `investor.properties` |
| `investor_portfolio` | 9 | `investor.portfolio_entries` |
| `investor_documents` | 11 | `investor.documents` |
| `investor_comparables` | 11 | `investor.comparables` |
| `campaigns` | 11 | `investor.campaigns` |
| `campaign_contacts` | 5 | `investor.campaign_contacts` |
| `templates` | 6 | `investor.templates` |
| `template_variables` | 5 | `investor.template_variables` |
| `touch_sequences` | 7 | `investor.touch_sequences` |
| `sequence_steps` | 8 | `investor.sequence_steps` |
| `landing_pages` | 8 | No equivalent (unused feature) |

**Action:** Verify these have no data or only test data, then DROP them. Run `SELECT count(*) FROM public.<table>` for each before dropping.

**Risk:** Low. These are shadows of schema-separated tables.

---

## P2: Naming Overlaps Across Schemas

Three table names exist in multiple schemas with different structures:

### `messages`
| Schema | Table | Purpose |
|--------|-------|---------|
| `claw` | `messages` | Claw conversation messages (user_id, channel, role, content) |
| `investor` | No `messages` table, but `investor.conversations` + `investor.conversation_messages` |
| `landlord` | `conversations` with embedded messages via `landlord.conversation_messages` |
| `public` | `comms_messages` | Cross-cutting communication messages |

### `conversations`
| Schema | Columns | Purpose |
|--------|---------|---------|
| `investor` | 14 cols | Investor lead conversations (lead_id FK) |
| `landlord` | 14 cols | Landlord guest/tenant conversations (contact_id FK) |

### `properties`
| Schema | Columns | Purpose |
|--------|---------|---------|
| `investor` | 24 cols | Investment properties (deal analysis, comps) |
| `landlord` | 16 cols | Rental properties (rooms, bookings, rates) |

**Action:** No code fix needed — this is by design (different schemas = different domains). Document the distinction so developers don't confuse them. Already documented in SCHEMA_MAP.md.

---

## P2: 2 Skills Not in SKILL_REGISTRY

`services/router.ts` references skills like `doughy-core`, `doughy-lead`, `doughy-guest`, etc. in `SKILL_REGISTRY`. However, the actual skills in `openclaw-skills/` are:

```
openclaw-skills/
├── doughy-core.md
├── doughy-lead.md
├── doughy-platform.md
├── doughy-guest.md
├── doughy-booking.md
├── doughy-room.md
└── doughy-investor-core.md
```

Skills referenced in `SKILL_REGISTRY` but NOT in `openclaw-skills/`:
- `doughy-investor-outreach` — referenced for investor seller/agent contexts
- `doughy-personal-crm` — referenced for personal platform context

**Action:** Either create these 2 skill files or remove from `SKILL_REGISTRY`. Low priority since the platform router isn't wired into the main flow yet.

---

## P2: Connector Files (Unused)

`openclaw-server/src/connectors/` contains 4 files (~2,000 lines) for Discord, Fibery, Notion, and shared utilities. These are scaffolded but NOT integrated into any server routes or imported by `server.ts`.

| File | Lines | Status |
|------|-------|--------|
| `connectors/discord.ts` | 606 | Scaffolded, not imported |
| `connectors/fibery.ts` | 457 | Scaffolded, not imported |
| `connectors/notion.ts` | 557 | Scaffolded, not imported |
| `connectors/utils.ts` | 305 | Scaffolded, not imported |
| `connectors/index.ts` | 94 | Barrel export, not imported |

**Action:** Keep if future plans include these integrations. Otherwise delete to reduce codebase size.

---

## P2: Three Health Check Edge Functions

Three separate health check functions is redundant:

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `health` | v30 | Yes | System health (DB, services) |
| `health-check` | v27 | Yes | Additional health check |
| `api-health-check` | v28 | No | Public health check |

**Action:** Consolidate to 2: one public (no JWT, basic), one authenticated (detailed). Delete whichever is redundant.

---

## P2: Two Lead Import Edge Functions

| Function | Version | Purpose |
|----------|---------|---------|
| `import-leads` | v46 | CSV import with column mapping (primary) |
| `leads-data-import` | v16 | Bulk data import (alternative format) |

**Action:** Determine if `leads-data-import` is used anywhere. If it's a duplicate or obsolete format, deprecate it. `import-leads` at v46 is clearly the primary one.

---

## P3: Legacy `moltbot-bridge` Edge Function

`moltbot-bridge` (v7) is still deployed alongside the replacement `openclaw-bridge` (v1). Both are ACTIVE.

**Action:** After verifying `openclaw-bridge` works in production, delete `moltbot-bridge`. Keep as fallback during transition.

---

## P3: Generated Types File Size

`src/integrations/supabase/types/generated.ts` was ~6KB before the schema separation and is now ~192KB (covering 154 tables across 7 schemas).

**Action:** This is expected and correct. No fix needed. The file is auto-generated and should not be manually edited.

---

## P3: Inconsistent Edge Function Naming

Most functions use kebab-case, but some use snake_case (legacy):

| Convention | Examples |
|-----------|---------|
| kebab-case (standard) | `twilio-sms`, `drip-campaign-processor`, `ai-responder` |
| snake_case (legacy) | `recalculate_lead_score`, `alert_webhook`, `oauth_callback` |

**Action:** Rename snake_case functions to kebab-case on next major update. Low priority since function names are only used in `callEdgeFunction()` strings.

---

## Summary

| Priority | Count | Items |
|----------|-------|-------|
| P0 | 1 | Deploy scripts rename |
| P1 | 1 | Dead db.* helpers (93 functions) |
| P2 | 6 | Orphaned tables, naming overlaps, missing skills, unused connectors, health check consolidation, lead import consolidation |
| P3 | 3 | Legacy edge function, types file size (expected), naming convention |
