# Schema Map

Every table in the ecosystem. Updated whenever tables are created or modified.

## auth schema (Supabase built-in)

| Table | Purpose | Read by | Written by |
|-------|---------|---------|------------|
| `auth.users` | User accounts | All apps | Supabase Auth |

## crm schema (Doughy's data)

| Table | Purpose | Read by | Written by |
|-------|---------|---------|------------|
| `crm.leads` | Leads/prospects [has module column] | All apps, Server | Doughy |
| `crm.contacts` | Contacts [has module, contact_type] | All apps, Server | Doughy |
| `crm.messages` | Message history | CallPilot, Server | Server |

## investor schema

| Table | Purpose | Read by | Written by |
|-------|---------|---------|------------|
| `investor.deals_pipeline` | Deal tracking | Server, Doughy | Doughy |
| `investor.properties` | Properties for analysis | Server, Doughy | Doughy |
| `investor.follow_ups` | Follow-up tasks | Server, Doughy | Doughy, Server |

## landlord schema

| Table | Purpose | Read by | Written by |
|-------|---------|---------|------------|
| `landlord.bookings` | Rental bookings | Server, Doughy | Doughy |
| `landlord.maintenance_requests` | Maintenance tickets | All apps | Doughy, Server |
| `landlord.property_inventory` | Appliances/supplies tracking | Doughy | Doughy |
| `landlord.vendor_jobs` | Contractor dispatch log | Doughy | Server |

## claw schema (The Claw's data)

| Table | Purpose | Read by | Written by |
|-------|---------|---------|------------|
| `claw.trust_config` | Trust level, countdown, limits, overrides | Server, Claw App | Claw App |
| `claw.connections` | Connected services and permissions | Server, Claw App | Claw App |
| `claw.action_queue` | Guarded mode queue (Realtime enabled) | Claw App, Server | Server |
| `claw.cost_log` | Per-action cost tracking | Claw App | Server |
| `claw.agent_profiles` | AI agent configs, kill switch | Server, Claw App | Server, Claw App (kill switch) |
| `claw.agent_runs` | AI action audit log | Claw App | Server |
| `claw.approvals` | Pending approval requests | Claw App | Server |
| `claw.tasks` | Tasks created by AI | Doughy | Server |
| `claw.draft_suggestions` | AI draft messages | CallPilot, Claw App | Server |
| `claw.transcript_extractions` | Call transcript extracted data | Claw App, Doughy | Server |

## callpilot schema

| Table | Purpose | Read by | Written by |
|-------|---------|---------|------------|
| `callpilot.calls` | Call records | CallPilot, Claw App | Server |
| `callpilot.call_summaries` | Post-call summaries | All apps | Server |
| `callpilot.coaching_cards` | Real-time coaching hints | CallPilot | Server |
| `callpilot.transcript_chunks` | Call transcripts (internal) | Server | Server |
| `callpilot.user_profiles` | Caller profile/bio | Server | CallPilot |
| `callpilot.script_templates` | Call scripts [has module column] | Server | CallPilot |
| `callpilot.question_tracking` | Required questions per call | CallPilot | Server |
| `callpilot.action_items` | Post-call action items | CallPilot | Server |
| `callpilot.suggested_updates` | Post-call profile updates | CallPilot | Server |

## Tables created in this repo (migrations)

These migrations live in `supabase/migrations/`:

```
20260216000001_trust_config.sql    → claw.trust_config
20260216000002_connections.sql     → claw.connections
20260216000003_action_queue.sql    → claw.action_queue (+ Realtime publication)
20260216000004_cost_log.sql        → claw.cost_log
20260217000001_seed_defaults.sql   → Seed data for Dino's account
20260217000002_transcript_extractions.sql → claw.transcript_extractions
```

All tables have RLS enabled with `auth.uid() = user_id` policies.
