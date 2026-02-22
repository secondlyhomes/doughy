# Schema Map

Every table in the Secondly Homes system. Updated whenever tables are created or modified.

## auth (Supabase Auth)

| Table | Description | Read By | Write By |
|-------|-------------|---------|----------|
| `auth.users` | User accounts | All apps | Supabase Auth |

## crm (CRM Data - Source of Truth)

| Table | Description | Read By | Write By |
|-------|-------------|---------|----------|
| `crm.contacts` | Contacts with `module` and `contact_type` columns | CallPilot, Server, Claw | Doughy |
| `crm.leads` | Leads/prospects with `module` column | Server, Doughy | Doughy |
| `crm.messages` | Message history (SMS, email, WhatsApp) | CallPilot | Server (via Twilio) |

## investor (Investor Module)

| Table | Description | Read By | Write By |
|-------|-------------|---------|----------|
| `investor.deals_pipeline` | Deal tracking and stages | Doughy, Server | Doughy |
| `investor.properties` | Properties for analysis | Doughy, Server | Doughy |
| `investor.follow_ups` | Follow-up tasks | Doughy, Server | Doughy, Server |

## landlord (Landlord Module)

| Table | Description | Read By | Write By |
|-------|-------------|---------|----------|
| `landlord.bookings` | Rental bookings | Doughy, Server | Doughy |
| `landlord.maintenance_requests` | Maintenance requests | All apps | Doughy, Server |
| `landlord.property_inventory` | Appliances/supplies tracking | Doughy | Doughy |
| `landlord.vendor_jobs` | Contractor dispatch log | Doughy | Server |

## claw (The Claw AI System)

| Table | Description | Read By | Write By |
|-------|-------------|---------|----------|
| `claw.agent_profiles` | AI agent configs + kill switch | Server | Claw App |
| `claw.agent_runs` | AI action log | Claw App | Server |
| `claw.approvals` | Pending approval queue | Claw App | Server |
| `claw.tasks` | Tasks created by AI | Doughy | Server |
| `claw.cost_log` | Cost tracking (in cents) | Claw App | Server |
| `claw.action_queue` | Guarded mode queue | Claw App, Server | Server |
| `claw.connections` | Connected services config | Server | Claw App |
| `claw.trust_config` | Trust levels and limits | Server | Claw App |
| `claw.draft_suggestions` | AI-drafted messages | CallPilot, Claw App | Server |

## callpilot (CallPilot App)

| Table | Description | Read By | Write By |
|-------|-------------|---------|----------|
| `callpilot.calls` | Call records (duration, outcome, etc.) | CallPilot, Claw App | Server |
| `callpilot.call_summaries` | Post-call AI summaries | All apps | Server |
| `callpilot.coaching_cards` | Real-time coaching hints during calls | CallPilot | Server |
| `callpilot.transcript_chunks` | Call transcripts (never shown to user) | Server | Server |
| `callpilot.user_profiles` | Caller profile/bio | CallPilot, Server | CallPilot |
| `callpilot.script_templates` | Call scripts with `module` column | CallPilot, Server | CallPilot |
| `callpilot.question_tracking` | Required questions per call | CallPilot | Server |
| `callpilot.action_items` | Post-call action items | CallPilot | Server |
| `callpilot.suggested_updates` | Post-call profile update suggestions | CallPilot | Server |
