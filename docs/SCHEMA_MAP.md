# Schema Map

> Last verified: 2026-02-16 by querying Supabase staging (`lqmbyobweeaigrwmvizo`) directly.
> All data below is from `information_schema` and `pg_policies` queries, NOT from local files.

## Summary

| Schema | Tables | Purpose | RLS |
|--------|--------|---------|-----|
| `claw` | 11 | Agent orchestration: profiles, tasks, runs, approvals, messages, notifications, budgets | All enabled |
| `callpilot` | 10 | Call coaching: calls, transcripts, coaching cards, summaries, action items, scripts | All enabled |
| `ai` | 25 | AI infrastructure: security, memory, knowledge, circuit breakers | All enabled |
| `investor` | 34 | Real estate investing: deals, properties, campaigns, portfolio | All enabled |
| `landlord` | 19 | Rental management: properties, rooms, bookings, vendors | All enabled |
| `crm` | 5 | Customer relationships: contacts, leads, skip trace, opt-outs | All enabled |
| `integrations` | 9 | Third-party: Gmail, Seam locks, Meta DMs, Postgrid mail | All enabled |
| `public` | 57 | Shared: users, workspaces, billing, comms, system, analytics | 55/57 enabled |
| **Total** | **170** | | **168/170 RLS** |

**RLS exceptions:** `public.spatial_ref_sys` (PostGIS system table), `public.wrappers_fdw_stats` (Supabase FDW stats).

## Custom Enums (107 total)

### claw schema (11 enums)
| Enum | Values |
|------|--------|
| `task_type` | pending, running, awaiting_approval, done, failed, cancelled |
| `task_status` | briefing, draft_followups, query, custom |
| `run_status` | running, completed, failed, cancelled |
| `approval_status` | pending, approved, rejected, expired, executed |
| `approval_action_type` | send_sms, send_email, create_task, update_record, custom |
| `message_channel` | sms, app, push, system, whatsapp, discord, email |
| `message_role` | user, assistant, system |
| `notification_event_type` | approval_needed, agent_error, daily_summary, budget_alert, kill_switch_activated, task_completed |
| `notification_channel` | push, sms, email, discord |
| `budget_limit_type` | daily_cost, daily_tokens, monthly_cost, monthly_tokens |
| `kill_switch_action` | activate_global, deactivate_global, activate_agent, deactivate_agent, auto_pause_budget, auto_pause_error_rate, auto_pause_stuck, auto_pause_connection, auto_pause_api_errors |

### public schema (100 enums)
Key enums used across the system — see full list in generated types. Notable ones:
- `user_role`: admin, standard, user, support, beta
- `user_platform`: investor, landlord
- `ai_mode`: training, assisted, autonomous
- `ai_queue_status`: pending, approved, edited, rejected, expired, sent
- `rental_booking_status`: inquiry, pending, confirmed, active, completed, cancelled
- `investor_deal_stage`: lead, prospect, appointment_set, offer_made, under_contract, due_diligence, closed, dead
- `lead_status`: active, inactive, do_not_contact, new, follow-up
- `drip_channel`: sms, email, direct_mail, meta_dm, phone_reminder

---

## `claw` Schema (11 tables) — Agent Orchestration

### claw.agent_profiles (16 cols)
Agent templates defining model, tools, and behavior.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | YES | | NULL = system template |
| name | text | NO | | |
| slug | text | NO | | Unique identifier |
| description | text | YES | | |
| system_prompt | text | YES | | |
| model | text | NO | 'claude-sonnet-4-5-20250929' | |
| temperature | numeric | YES | 0.7 | |
| max_tokens | int4 | YES | 4096 | |
| tools | jsonb | YES | '[]' | Tool list |
| requires_approval | bool | YES | true | |
| is_active | bool | YES | true | |
| metadata | jsonb | YES | '{}' | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| deleted_at | timestamptz | YES | | Soft delete |

**RLS (3 policies):** Service role full access (ALL), Users can manage own (ALL), Users can view own + system (SELECT)
**Seeded data:** master-controller (Haiku), lead-ops (Sonnet), draft-specialist (Sonnet)

### claw.tasks (14 cols)
Work items created by the controller.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| parent_task_id | uuid | YES | FK → tasks.id |
| type | task_type | NO | |
| status | task_status | NO | 'pending' |
| title | text | YES | |
| input | jsonb | YES | '{}' |
| output | jsonb | YES | |
| error | text | YES | |
| metadata | jsonb | YES | '{}' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| completed_at | timestamptz | YES | |
| deleted_at | timestamptz | YES | |

**FKs:** parent_task_id → claw.tasks(id)
**RLS (4 policies):** Service role (ALL), Users create own (INSERT), Users update own (UPDATE), Users view own (SELECT)

### claw.agent_runs (18 cols)
Execution records for agent tool-use loops.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| task_id | uuid | NO | FK → tasks.id |
| agent_profile_id | uuid | NO | FK → agent_profiles.id |
| status | run_status | NO | 'running' |
| model | text | YES | |
| input_tokens | int4 | YES | 0 |
| output_tokens | int4 | YES | 0 |
| cost_cents | numeric | YES | 0 |
| duration_ms | int4 | YES | |
| tool_calls | jsonb | YES | '[]' |
| result | jsonb | YES | |
| error | text | YES | |
| metadata | jsonb | YES | '{}' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| completed_at | timestamptz | YES | |
| deleted_at | timestamptz | YES | |

**FKs:** task_id → claw.tasks(id), agent_profile_id → claw.agent_profiles(id)
**RLS (2 policies):** Service role (ALL), Users view own (SELECT)

### claw.approvals (21 cols)
Pending human approval items for agent-drafted actions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| task_id | uuid | NO | FK → tasks.id |
| agent_run_id | uuid | YES | FK → agent_runs.id |
| status | approval_status | NO | 'pending' |
| action_type | approval_action_type | NO | |
| title | text | NO | |
| description | text | YES | |
| draft_content | text | YES | Draft SMS/email body |
| recipient_name | text | YES | |
| recipient_phone | text | YES | |
| recipient_email | text | YES | |
| action_payload | jsonb | YES | '{}' |
| decided_at | timestamptz | YES | |
| executed_at | timestamptz | YES | |
| execution_result | jsonb | YES | |
| expires_at | timestamptz | YES | now() + 24h |
| metadata | jsonb | YES | '{}' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| deleted_at | timestamptz | YES | |

**FKs:** task_id → claw.tasks(id), agent_run_id → claw.agent_runs(id)
**RLS (3 policies):** Service role (ALL), Users update own (UPDATE), Users view own (SELECT)

### claw.messages (9 cols)
Conversation history between user and The Claw.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| channel | message_channel | NO | 'sms' |
| role | message_role | NO | |
| content | text | NO | |
| task_id | uuid | YES | FK → tasks.id |
| metadata | jsonb | YES | '{}' |
| created_at | timestamptz | NO | now() |
| deleted_at | timestamptz | YES | |

**FKs:** task_id → claw.tasks(id)
**RLS (3 policies):** Service role (ALL), Users insert own (INSERT), Users view own (SELECT)

### claw.channel_preferences (8 cols)
Per-user channel configuration for multi-channel messaging.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | FK → auth.users |
| channel | text | NO | |
| is_enabled | bool | YES | false |
| is_primary | bool | YES | false |
| channel_config | jsonb | YES | '{}' |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS:** Service role + user CRUD

### claw.notification_preferences (7 cols)
Per-user notification routing (which events go to which channels).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | FK → auth.users |
| event_type | notification_event_type | NO | |
| channel | notification_channel | NO | |
| is_enabled | bool | NO | true |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### claw.notification_settings (10 cols)
Global notification settings per user (quiet hours, budget thresholds).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | UNIQUE, FK → auth.users |
| budget_alert_threshold_cents | int4 | YES | 500 |
| quiet_hours_enabled | bool | NO | false |
| quiet_hours_start | time | YES | 22:00:00 |
| quiet_hours_end | time | YES | 07:00:00 |
| quiet_hours_timezone | text | YES | 'America/New_York' |
| quiet_hours_allow_approvals | bool | NO | true |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### claw.notification_log (13 cols)
Delivery log for all notifications sent.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | FK → auth.users |
| event_type | notification_event_type | NO | |
| channel | notification_channel | NO | |
| subject | text | YES | |
| body | text | NO | |
| related_task_id | uuid | YES | FK → tasks.id |
| related_approval_id | uuid | YES | FK → approvals.id |
| related_agent_run_id | uuid | YES | FK → agent_runs.id |
| delivered | bool | YES | false |
| delivery_error | text | YES | |
| metadata | jsonb | YES | '{}' |
| created_at | timestamptz | NO | now() |

### claw.budget_limits (11 cols)
Per-user or per-agent cost/token limits with auto-pause.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | FK → auth.users |
| agent_profile_id | uuid | YES | FK → agent_profiles.id |
| limit_type | budget_limit_type | NO | |
| limit_value | numeric | NO | |
| current_value | numeric | NO | 0 |
| period_start | timestamptz | NO | date_trunc('day', now()) |
| is_exceeded | bool | NO | false |
| last_reset_at | timestamptz | YES | now() |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### claw.kill_switch_log (9 cols)
Audit trail for agent kill switch activations.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | FK → auth.users |
| action | kill_switch_action | NO | |
| agent_profile_id | uuid | YES | FK → agent_profiles.id |
| reason | text | NO | |
| agents_affected | int4 | YES | 0 |
| tasks_paused | int4 | YES | 0 |
| metadata | jsonb | YES | '{}' |
| created_at | timestamptz | NO | now() |

---

## `callpilot` Schema (10 tables) — Call Coaching

### callpilot.calls (19 cols)
Call records with Twilio integration and status tracking.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | | FK → auth.users |
| lead_id | uuid | YES | | Convention FK → crm |
| contact_id | uuid | YES | | Convention FK → crm |
| deal_id | uuid | YES | | Convention FK → investor |
| direction | text | NO | | CHECK: inbound, outbound |
| phone_number | text | NO | | |
| twilio_call_sid | text | YES | | |
| status | text | NO | 'initiated' | CHECK: initiated, ringing, in_progress, completed, failed, missed, voicemail |
| started_at | timestamptz | YES | | |
| ended_at | timestamptz | YES | | |
| duration_seconds | int4 | YES | | |
| recording_url | text | YES | | |
| recording_sid | text | YES | | |
| script_template_id | uuid | YES | | FK → script_templates.id |
| metadata | jsonb | NO | '{}' | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| deleted_at | timestamptz | YES | | Soft delete |

**RLS:** All enabled, user-scoped

### callpilot.transcript_chunks (7 cols)
Real-time speech-to-text chunks during a call.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | FK → calls.id |
| speaker | text | NO | |
| content | text | NO | |
| confidence | numeric | YES | |
| timestamp_ms | int4 | NO | |
| created_at | timestamptz | NO | now() |

### callpilot.coaching_cards (10 cols)
AI-generated coaching tips shown during active calls.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | FK → calls.id |
| card_type | text | NO | |
| content | text | NO | |
| priority | text | NO | 'normal' (CHECK: low, normal, high, urgent) |
| phase | text | YES | |
| context | text | YES | |
| was_dismissed | bool | NO | false |
| timestamp_ms | int4 | YES | |
| created_at | timestamptz | NO | now() |

### callpilot.question_tracking (11 cols)
Required questions from script templates, tracks if answered.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | FK → calls.id |
| question | text | NO | |
| category | text | YES | |
| is_answered | bool | NO | false |
| answered_at | timestamptz | YES | |
| answer_summary | text | YES | |
| source_hint | text | YES | |
| display_order | int4 | YES | |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### callpilot.call_summaries (10 cols)
AI-generated post-call summaries with sentiment and recommendations.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | UNIQUE, FK → calls.id |
| user_id | uuid | NO | FK → auth.users |
| summary | text | YES | |
| sentiment | text | YES | CHECK: positive, neutral, negative, mixed |
| key_points | jsonb | NO | '[]' |
| lead_temperature | text | YES | CHECK: hot, warm, cold, dead |
| closing_recommendation | text | YES | |
| unanswered_questions | jsonb | NO | '[]' |
| created_at | timestamptz | NO | now() |

### callpilot.action_items (13 cols)
Post-call action items generated by AI, requiring user approval.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | FK → calls.id |
| user_id | uuid | NO | FK → auth.users |
| description | text | NO | |
| category | text | YES | |
| due_date | date | YES | |
| status | text | NO | 'pending' (CHECK: pending, approved, completed, dismissed) |
| approved_at | timestamptz | YES | |
| completed_at | timestamptz | YES | |
| metadata | jsonb | NO | '{}' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| deleted_at | timestamptz | YES | |

### callpilot.pre_call_briefings (8 cols)
AI-generated pre-call context from CRM data.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | FK → calls.id |
| user_id | uuid | NO | FK → auth.users |
| lead_id | uuid | YES | |
| briefing_content | jsonb | NO | '{}' |
| was_viewed | bool | NO | false |
| was_skipped | bool | NO | false |
| created_at | timestamptz | NO | now() |

### callpilot.user_profiles (12 cols)
CallPilot-specific user preferences (talk tracks, buying criteria).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | UNIQUE, FK → auth.users |
| display_name | text | YES | |
| company_name | text | YES | |
| role | text | YES | |
| bio | text | YES | |
| interests | jsonb | NO | '[]' |
| location | text | YES | |
| buying_criteria | jsonb | NO | '{}' |
| talk_tracks | jsonb | NO | '[]' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### callpilot.script_templates (14 cols)
Customizable call scripts with questions and sections.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | FK → auth.users |
| name | text | NO | |
| description | text | YES | |
| category | text | YES | |
| opening_script | text | YES | |
| starter_questions | jsonb | NO | '[]' |
| required_questions | jsonb | NO | '[]' |
| closing_scripts | jsonb | NO | '{}' |
| script_sections | jsonb | NO | '[]' |
| is_default | bool | NO | false |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| deleted_at | timestamptz | YES | |

**Seeded templates:** Cold Call, Follow-up, Motivated Seller, Default

### callpilot.suggested_updates (14 cols)
AI-suggested CRM updates from call analysis (e.g., update deal stage).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| call_id | uuid | NO | FK → calls.id |
| user_id | uuid | NO | FK → auth.users |
| target_table | text | NO | |
| target_record_id | uuid | NO | |
| field_name | text | NO | |
| current_value | text | YES | |
| suggested_value | text | NO | |
| confidence | text | YES | CHECK: low, medium, high |
| source_quote | text | YES | |
| status | text | NO | 'pending' (CHECK: pending, approved, rejected, applied) |
| approved_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |
| deleted_at | timestamptz | YES | |

---

## `ai` Schema (25 tables) — AI Infrastructure

### Core Tables
| Table | Cols | Purpose | RLS Policies |
|-------|------|---------|-------------|
| jobs | 14 | AI assistant job queue (deal analysis, property eval) | 4 (CRUD by user) |
| sessions | 6 | AI conversation sessions | 4 (CRUD by user) |
| auto_send_rules | 14 | Automated message sending triggers | 4 (CRUD by user) |
| capture_items | 26 | Voice/photo/text capture for triage | 4 (CRUD by user) |
| confidence_adjustments | 13 | Per-user AI confidence calibration | 1 (SELECT own) |
| response_outcomes | 22 | AI response tracking (approved/edited/rejected) | 2 (INSERT + SELECT own) |
| security_audit_log | 13 | Immutable security audit trail | 2 (admin SELECT, service INSERT) |

### OpenClaw Security (7 tables)
| Table | Cols | Purpose | RLS Policies |
|-------|------|---------|-------------|
| openclaw_blocked_ips | 10 | IP-based blocking | 1 (service_only) |
| openclaw_blocked_patterns | 15 | Regex threat patterns | 4 (admin + service + user) |
| openclaw_circuit_breakers | 10 | Global/per-user/per-channel breakers | 1 (admin SELECT) |
| openclaw_security_logs | 19 | Security event logging | 4 (CRUD by user) |
| openclaw_security_patterns_cache | 6 | Cached pattern compilation | 1 (admin SELECT) |
| openclaw_user_threat_scores | 12 | Per-user threat scoring | 1 (admin SELECT) |
| openclaw_rate_limits | 7 | Per-user per-channel rate limits | 4 (CRUD by user) |

### OpenClaw Memory & Knowledge (8 tables)
| Table | Cols | Purpose | RLS Policies |
|-------|------|---------|-------------|
| openclaw_user_memories | 18 | Per-user preferences, writing style, rules | 4 (CRUD by user) |
| openclaw_episodic_memories | 17 | Interaction summaries, relationship notes | 4 (CRUD by user) |
| openclaw_global_knowledge | 15 | Platform-wide knowledge base | 1 (public SELECT) |
| openclaw_knowledge_sources | 16 | External knowledge sources (Fibery, Notion, etc.) | 4 (CRUD by user) |
| openclaw_knowledge_chunks | 19 | Chunked content with embeddings (vector) | 4 (CRUD by user) |
| openclaw_knowledge_tags | 8 | Tag taxonomy | 1 (SELECT own) |
| openclaw_knowledge_chunk_tags | 3 | M:N junction table | 1 (service_only) |
| openclaw_sync_records | 13 | Knowledge source sync history | 1 (SELECT own) |

### OpenClaw Other (3 tables)
| Table | Cols | Purpose | RLS Policies |
|-------|------|---------|-------------|
| openclaw_email_analyses | 11 | Email pattern analysis results | 1 (SELECT own) |
| openclaw_response_examples | 18 | Curated response templates | 1 (SELECT own) |
| openclaw_learning_queue_items | 14 | Queue for extracting learnings from outcomes | 1 (service_only) |

**FKs within ai schema:**
- openclaw_knowledge_chunk_tags.chunk_id → openclaw_knowledge_chunks.id
- openclaw_knowledge_chunk_tags.tag_id → openclaw_knowledge_tags.id
- openclaw_knowledge_chunks.source_id → openclaw_knowledge_sources.id
- openclaw_sync_records.source_id → openclaw_knowledge_sources.id

---

## `investor` Schema (34 tables) — Real Estate Investment

### Core Pipeline (6 tables)
| Table | Cols | Purpose | FKs |
|-------|------|---------|-----|
| properties | 32 | Investment properties | lead_id, profile_id |
| deals_pipeline | 16 | Active deals with stages | lead_id → crm, property_id |
| deal_events | 11 | Deal timeline events | deal_id |
| follow_ups | 20 | Scheduled follow-ups | deal_id, contact_id, agent_id, campaign_id |
| lead_properties | 9 | Lead-property M:N junction | lead_id, property_id |
| agents | 23 | Real estate agents/contacts | contact_id |

### Campaigns & Outreach (6 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| campaigns | 38 | Marketing campaigns (drip + manual) |
| drip_campaign_steps | 22 | Step definitions for drip sequences |
| drip_enrollments | 27 | Lead enrollment tracking |
| drip_touch_logs | 29 | Delivery tracking per touch |
| outreach_templates | 16 | Message templates by channel |
| buying_criteria | 16 | User's deal evaluation criteria |

### Conversations & AI (6 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| conversations | 18 | Investor conversation threads |
| messages | 16 | Individual messages in conversations |
| ai_queue_items | 16 | AI-generated responses awaiting review |
| ai_response_outcomes | 16 | Outcome tracking for AI responses |
| ai_confidence_settings | 10 | Per-situation confidence thresholds |
| ai_patterns | 9 | Learned AI behavior patterns |

### Portfolio (5 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| portfolio_entries | 19 | Owned properties with financials |
| portfolio_groups | 7 | Property groupings |
| portfolio_monthly_records | 9 | Monthly rent/expense tracking |
| portfolio_mortgages | 16 | Mortgage details per entry |
| portfolio_valuations | 9 | Property value estimates over time |

### Property Details (7 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| comps | 26 | Comparable sales |
| property_analyses | 11 | AI property analyses |
| property_documents | 14 | Uploaded documents |
| property_images | 10 | Property photos |
| property_mortgages | 17 | Mortgage records |
| property_debts | 11 | Liens and debt info |
| repair_estimates | 12 | Repair cost estimates |

### Documents (4 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| documents | 12 | General deal/property documents |
| document_embeddings | 7 | Vector embeddings for RAG |
| document_queue_items | 7 | Processing queue for docs |
| financing_scenarios | 13 | What-if financing calculations |

**RLS:** All 34 tables have policies (varies 1-8 per table). Most use `auth.uid() = user_id` pattern, some add workspace-based policies.

---

## `landlord` Schema (19 tables) — Rental Management

### Properties & Bookings (5 tables)
| Table | Cols | Purpose | Key FKs |
|-------|------|---------|---------|
| properties | 29 | Rental properties | — |
| rooms | 17 | Individual rooms in properties | property_id, current_booking_id |
| bookings | 27 | Guest reservations (start_date/end_date NOT check_in/check_out) | property_id, room_id, contact_id |
| booking_charges | 22 | Damage/cleaning charges | booking_id, maintenance_id |
| deposit_settlements | 20 | Security deposit returns | booking_id |

### Conversations & Messages (5 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| conversations | 22 | Guest/tenant conversation threads |
| messages | 26 | Individual messages |
| guest_messages | 25 | Scheduled/automated guest communications |
| guest_templates | 18 | Message templates (check-in, rules, etc.) |
| ai_queue_items | 20 | AI responses awaiting review |

### Maintenance & Operations (5 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| maintenance_records | 34 | Work orders and repairs |
| inventory_items | 22 | Property inventory tracking |
| turnovers | 34 | Guest checkout/checkin turnover management |
| turnover_templates | 11 | Turnover checklists |
| templates | 14 | General message templates |

### Vendors & Integrations (4 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| vendors | 27 | Service providers (cleaners, plumbers, etc.) |
| vendor_messages | 22 | Communications with vendors |
| integrations | 19 | Platform connections (Airbnb, FF, etc.) |
| email_connections | 19 | Gmail/Outlook integrations |

**RLS:** All 19 tables have policies (4-8 per table).

---

## `crm` Schema (5 tables) — Customer Relationships

### crm.contacts (32 cols)
Master contact record with multi-channel opt status.

Key columns: id, user_id, first_name, last_name, email, phone, emails (jsonb[]), phones (jsonb[]), address (jsonb), contact_types (crm_contact_type[]), source, status, score, tags, sms_opt_status, is_do_not_contact, campaign_status, workspace_id

**FKs:** None inbound. Referenced by crm.opt_outs, crm.skip_trace_results.
**RLS (7 policies):** CRUD by user + workspace-scoped delete

### crm.leads (30 cols)
Investment leads with multi-channel opt tracking.

Key columns: id, user_id, name, email, phone, status (lead_status), score, opt_status, text_opt_status, email_opt_status, phone_opt_status, emails (jsonb), phones (jsonb), city, state, zip, import_id, is_conversation_started

**FKs:** Referenced by crm.touches, crm.skip_trace_results, investor.deals_pipeline, investor.conversations
**RLS (8 policies):** CRUD by user + workspace-scoped CRUD

### crm.skip_trace_results (24 cols)
Property owner lookup results from Tracerfy.

**FKs:** contact_id → crm.contacts, lead_id → crm.leads
**RLS (4 policies):** CRUD by user

### crm.opt_outs (14 cols)
Channel-specific opt-out records.

**FKs:** contact_id → crm.contacts
**RLS (4 policies):** CRUD by user

### crm.touches (13 cols)
Contact interaction log (calls, texts, mail).

**FKs:** lead_id → crm.leads
**RLS (4 policies):** CRUD by user

---

## `integrations` Schema (9 tables) — Third-Party Services

| Table | Cols | Purpose | RLS |
|-------|------|---------|-----|
| gmail_tokens | 9 | OAuth tokens for Gmail integration | 4 |
| mail_credit_transactions | 17 | Postgrid direct mail credit ledger | 4 |
| meta_dm_credentials | 19 | Facebook/Instagram DM integration | 4 |
| postgrid_credentials | 15 | Postgrid API config + return address | 4 |
| seam_access_codes | 19 | Smart lock access codes | 4 |
| seam_connected_devices | 14 | Connected smart lock devices | 4 |
| seam_lock_events | 10 | Lock/unlock event log | 4 |
| seam_workspaces | 9 | Seam API workspace connections | 4 |
| user_integrations | 11 | General integration registry | 4 |

**FKs within integrations:**
- mail_credit_transactions.original_transaction_id → self (refunds)
- seam_access_codes.device_id → seam_connected_devices.id
- seam_lock_events.device_id → seam_connected_devices.id
- seam_lock_events.access_code_id → seam_access_codes.id

---

## `public` Schema (57 tables) — Shared Infrastructure

### User Management (13 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| user_profiles | 18 | Core user profile (email, role, name) |
| user_platform_settings | 9 | Investor/landlord platform toggle + AI settings (JSONB) |
| user_plans | 8 | Subscription tier + token cap |
| user_subscriptions | 12 | Stripe subscription details |
| user_email_preferences | 12 | Email notification toggles |
| user_notifications | 10 | In-app notification feed |
| user_import_mappings | 6 | CSV import column mappings |
| user_mail_credits | 10 | Direct mail credit balance |
| user_onboarding_statuses | 10 | Onboarding progress |
| user_onboarding_steps | 8 | Step completion tracking |
| user_onboarding_surveys | 19 | Onboarding survey responses |
| user_reminder_logs | 8 | Reminder delivery history |
| user_reminder_states | 8 | Reminder scheduling state |

### Security (7 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| security_api_keys | 12 | Encrypted third-party API keys |
| security_oauth_tokens | 10 | OAuth token storage |
| security_reset_tokens | 11 | Password reset tokens |
| security_email_change_history | 8 | Email change audit trail |
| security_event_logs | 12 | Security event logging |
| user_mfa_settings | 8 | MFA configuration |
| user_mfa_recovery_codes | 7 | MFA backup codes |
| user_mfa_pending_setups | 7 | In-progress MFA setup |

### Communications (8 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| comms_messages | 20 | Unified message log (SMS + email) |
| comms_scheduled_messages | 10 | Scheduled outbound messages |
| comms_conversation_items | 22 | Unified conversation timeline |
| comms_email_logs | 13 | Email delivery tracking |
| comms_call_logs | 8 | Call records |
| comms_call_transcripts | 20 | Call transcript storage |
| comms_call_transcript_segments | 9 | Individual transcript segments |
| calls | 13 | Twilio call records |

### Call AI (3 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| call_ai_suggestions | 8 | Real-time AI suggestions during calls |
| call_summaries | 10 | AI-generated call summaries |
| call_transcript_segments | 7 | Transcript segments for calls |

### Billing (5 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| billing_stripe_customers | 7 | Stripe customer mapping |
| billing_stripe_products | 12 | Product/price catalog |
| billing_subscription_events | 7 | Subscription lifecycle events |
| billing_subscription_notifications | 11 | Payment notifications |
| user_retention_records | 6 | Cohort retention data |

### Workspaces (2 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| workspaces | 9 | Team workspaces |
| workspace_members | 7 | Workspace membership |

### System (7 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| system_logs | 17 | Application logging |
| system_logs_settings | 9 | Log retention config |
| system_settings | 6 | Global key-value settings |
| system_feature_flags | 5 | Feature flag registry |
| system_rate_limits | 7 | API rate limiting |
| system_scheduled_deletions | 10 | Account deletion queue |
| system_usage_logs | 7 | AI token/cost tracking |

### Analytics & Surveys (5 tables)
| Table | Cols | Purpose |
|-------|------|---------|
| analytics_feature_usage_stats | 5 | Feature usage metrics |
| analytics_metrics | 6 | General analytics |
| survey_analytics | 5 | Survey response aggregates |
| survey_interactions | 6 | Survey interaction tracking |
| survey_step_views | 5 | Survey step view counts |

### Legacy / Views / Cross-Schema (7 tables)
| Table | Cols | Purpose | Status |
|-------|------|---------|--------|
| investor_deals | 38 | Legacy deals table (pre-schema-separation) | **ORPHAN CANDIDATE** |
| crm_lead_contacts | 7 | Lead-contact junction table | Active |
| crm_lead_notes | 6 | Lead notes | Active |
| crm_skip_trace_results | 24 | Legacy skip trace view | **ORPHAN CANDIDATE** |
| contacts | 32 | Legacy CRM contacts view | **ORPHAN CANDIDATE** |
| secure_spatial_ref_sys | 5 | PostGIS (read-only view) | System |
| spatial_ref_sys | 5 | PostGIS reference | System (RLS disabled) |
| wrappers_fdw_stats | 9 | Supabase FDW stats | System (RLS disabled) |
| geometry_columns | 6 | PostGIS view | System |
| geography_columns | 7 | PostGIS view | System |

**Additional legacy views in public (mapped from schema tables):**
- `investor_comps` → duplicate of investor.comps
- `investor_deal_events` → duplicate of investor.deal_events
- `investor_outreach_templates` → duplicate of investor.outreach_templates
- `landlord_guest_templates` → duplicate of landlord.guest_templates
- `landlord_maintenance_records` → duplicate of landlord.maintenance_records
- `ai_auto_send_rules` → duplicate of ai.auto_send_rules
- `ai_capture_items` → duplicate of ai.capture_items
- `ai_sessions` → duplicate of ai.sessions

---

## Cross-Schema Foreign Keys

| From | Column | To |
|------|--------|----|
| claw.agent_runs | task_id | claw.tasks |
| claw.agent_runs | agent_profile_id | claw.agent_profiles |
| claw.approvals | task_id | claw.tasks |
| claw.approvals | agent_run_id | claw.agent_runs |
| claw.messages | task_id | claw.tasks |
| claw.tasks | parent_task_id | claw.tasks |
| claw.notification_log | related_task_id | claw.tasks |
| claw.notification_log | related_approval_id | claw.approvals |
| claw.notification_log | related_agent_run_id | claw.agent_runs |
| claw.budget_limits | agent_profile_id | claw.agent_profiles |
| claw.kill_switch_log | agent_profile_id | claw.agent_profiles |
| callpilot.calls | script_template_id | callpilot.script_templates |
| callpilot.transcript_chunks | call_id | callpilot.calls |
| callpilot.coaching_cards | call_id | callpilot.calls |
| callpilot.question_tracking | call_id | callpilot.calls |
| callpilot.call_summaries | call_id | callpilot.calls |
| callpilot.action_items | call_id | callpilot.calls |
| callpilot.pre_call_briefings | call_id | callpilot.calls |
| callpilot.suggested_updates | call_id | callpilot.calls |
| investor.conversations | deal_id | investor.deals_pipeline |
| investor.conversations | property_id | investor.properties |
| investor.deals_pipeline | property_id | investor.properties |
| investor.portfolio_entries | deal_id | investor.deals_pipeline |
| investor.portfolio_entries | property_id | investor.properties |
| investor.portfolio_entries | group_id | investor.portfolio_groups |
| landlord.bookings | property_id | landlord.properties |
| landlord.bookings | room_id | landlord.rooms |
| landlord.turnovers | property_id | landlord.properties |
| landlord.turnovers | checkout_booking_id | landlord.bookings |
| landlord.turnovers | checkin_booking_id | landlord.bookings |
| landlord.maintenance_records | property_id | landlord.properties |
| landlord.maintenance_records | vendor_id | landlord.vendors |
| landlord.maintenance_records | booking_id | landlord.bookings |
| crm.opt_outs | contact_id | crm.contacts |
| crm.skip_trace_results | contact_id | crm.contacts |
| crm.skip_trace_results | lead_id | crm.leads |
| crm.touches | lead_id | crm.leads |

**Note:** No cross-schema FKs exist (e.g., investor.deals_pipeline.lead_id references crm.leads by convention but has no FK constraint). This is intentional — PostgreSQL FKs across schemas require careful permission management.

---

## Data Access Patterns

### Mobile App (Doughy)
```
supabase.from('table')                    # public schema
supabase.schema('investor').from('table') # investor schema
supabase.schema('landlord').from('table') # landlord schema
supabase.schema('crm').from('table')      # crm schema (via RPC layer)
supabase.schema('ai').from('table')       # ai schema
```

Active helpers in `src/lib/supabase.ts`:
- `db.investor.*` — via schema accessor, used through `src/lib/rpc/` layer
- `db.landlord.*` — via schema accessor, used through stores
- **Note:** 93 dead `db.getDeals()`-style helpers were removed in Feb 2026

### Server (openclaw-server)
```
REST API with headers:
  Accept-Profile: {schema}     # for SELECT
  Content-Profile: {schema}    # for INSERT/UPDATE
  Authorization: Bearer {service_role_key}
```

Uses `schemaQuery()`, `schemaInsert()`, `schemaUpdate()` wrappers in `src/claw/db.ts`.

### Edge Functions
Direct Supabase client with service role key.

---

## Naming Overlaps

Three schemas have `messages` tables with different schemas:
- `claw.messages` — Claw agent conversation (9 cols, simple)
- `investor.messages` — Investor lead conversations (16 cols, with AI fields)
- `landlord.messages` — Rental guest conversations (26 cols, with send_status)

Three schemas have `conversations` tables:
- `investor.conversations` — Lead threads (18 cols)
- `landlord.conversations` — Guest threads (22 cols)

Three schemas have `properties` tables:
- `investor.properties` — Investment properties (32 cols, with ARV, purchase_price)
- `landlord.properties` — Rental properties (29 cols, with rates, amenities)
- `crm.properties` (view) — Legacy view, appears in public schema queries

Two schemas have `contacts` tables:
- `crm.contacts` — Master contact record (32 cols)
- `public.contacts` — Legacy view of crm.contacts

Two schemas have `ai_queue_items` tables:
- `investor.ai_queue_items` — Investor AI response queue (16 cols)
- `landlord.ai_queue_items` — Landlord AI response queue (20 cols)

---

## Dead Code: db.* Helpers (REMOVED)

The 93 dead `db.getDeals()`-style helper functions were removed from `src/lib/supabase.ts` in Feb 2026 (commit `27b32c3`). All DB access now goes through `src/lib/rpc/` domain-specific query functions or direct `supabase.schema().from()` calls.

---

## Orphaned Tables (Candidates for Cleanup)

### Confirmed Orphans (public schema legacy views)
These exist as views in public that duplicate schema-separated tables:
1. `public.investor_deals` — pre-separation deals (38 cols, different schema than investor.deals_pipeline)
2. `public.investor_comps` — view of investor.comps
3. `public.investor_deal_events` — view of investor.deal_events
4. `public.investor_outreach_templates` — view of investor.outreach_templates
5. `public.landlord_guest_templates` — view of landlord.guest_templates
6. `public.landlord_maintenance_records` — view of landlord.maintenance_records
7. `public.ai_auto_send_rules` — view of ai.auto_send_rules
8. `public.ai_capture_items` — view of ai.capture_items
9. `public.ai_sessions` — view of ai.sessions
10. `public.crm_skip_trace_results` — view of crm.skip_trace_results
11. `public.contacts` — view of crm.contacts

### System Tables (Do Not Touch)
- `public.spatial_ref_sys` — PostGIS
- `public.secure_spatial_ref_sys` — PostGIS
- `public.geography_columns` — PostGIS view
- `public.geometry_columns` — PostGIS view
- `public.wrappers_fdw_stats` — Supabase FDW

### Needs Investigation
- `public.investor_deals` — 38 cols with `investor_deal_type`, `investor_deal_stage` enums. May still be referenced by old code or edge functions. Check before dropping.
