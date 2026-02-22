# Roadmap

## Phase 1 — MVP/Demo (Current)

### Done
- [x] Single-screen control panel (no tabs)
- [x] Pinned header with trust level bar + kill switch + settings gear
- [x] Queue section (trust-level-aware: locked/manual/guarded/autonomous)
- [x] Connections section with 7 services
- [x] Activity section with day-grouped entries (Today/Yesterday/This Week)
- [x] Cost summary card with monthly breakdown
- [x] Connection detail screens (Doughy modules, Bland settings, channel delivery prefs)
- [x] Trust level picker (bottom sheet with 4 levels)
- [x] Per-action trust overrides
- [x] Activity detail with audit trail
- [x] Settings screen (theme, queue, cost limits, about)
- [x] Autonomous consent modal
- [x] Kill switch with confirmation dialog, wired to gateway adapter
- [x] Supabase Realtime subscription for action_queue
- [x] Skeleton loading states
- [x] Haptic feedback on all interactive elements
- [x] Mock gateway adapter with realistic seed data
- [x] Supabase gateway adapter (connections, queue, trust, cost, activity)
- [x] Supabase auth (email/password) with demo mode fallback
- [x] Database migrations (trust_config, connections, action_queue, cost_log, seed data)
- [x] iOS 26 Liquid Glass header (with BlurView fallback)
- [x] Dark/light/system theme support
- [x] Design tokens matched to Doughy

### Remaining
- [ ] Physical device QA (dark + light mode on every screen)
- [ ] Wire real Supabase data end-to-end (replace mock as default)
- [ ] Production seed data (replace placeholder UUID after Dino signs up)
- [ ] Push notification delivery for approval requests
- [ ] Jest testing setup (jest-expo preset)

## Phase 2 — Post-Demo

- [ ] Bland AI full integration (BYOT, pathways, auto-answer)
- [ ] WhatsApp voice notes
- [ ] Web admin dashboard (/admin/*)
- [ ] Full dynamic skills system (claw.skills table)
- [ ] Email ingestion (Gmail API → auto-create leads)
- [ ] Lead scoring based on engagement
- [ ] Call coaching with live Deepgram transcription
- [ ] Undo support with real revert logic (not just UI flag)
- [ ] Batch approve/deny from queue
- [ ] Cost alerts when approaching budget limits
- [ ] Export activity history

## Phase 3 — Growth

- [ ] Relationship module (general CRM for any industry)
- [ ] CRM connectors for CallPilot (HubSpot, Salesforce, Podio)
- [ ] Data connectors for The Claw standalone
- [ ] Smart home integrations (Nest, smart locks via Seam)
- [ ] AI lease review
- [ ] Local computer agent (desktop bookkeeping, file management)
- [ ] Multi-tenant user management
- [ ] Bland Conversational Pathways builder in admin
- [ ] Voice cloning for AI calls
- [ ] Team seats and role-based access

## Phase 4 — Scale

- [ ] Vertical expansion (insurance, solar, recruiting skins)
- [ ] Standalone product packaging (The Claw for [CRM], CallPilot for [CRM])
- [ ] Enterprise tier with custom pricing
- [ ] White-label option
