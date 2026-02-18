# Roadmap

## Phase 1 — MVP/Demo (Current)

### Done
- [x] 3-tab layout (Contacts, Messages, Settings)
- [x] Module-aware contacts (Investor/Landlord) with type discrimination
- [x] Temperature-based filtering (Hot/Warm/Cold) with full/compact views
- [x] Module filter chips on Contacts and Messages screens
- [x] Contact detail with module-specific info sections (deal, lease, contractor)
- [x] Quick action bar (Call, Text, Email) with haptic feedback
- [x] iMessage-style conversation thread
- [x] Claw suggestion cards (AI draft replies) in messages
- [x] Full Settings: Profile, CRM connection, Script Templates, Claw Integration, Calling, Notifications, Theme
- [x] Skeleton shimmer loading on all screens (no spinners)
- [x] Pre-call briefing screen (module-aware)
- [x] iOS Liquid Glass design system (3-tier rendering)
- [x] Dark mode + light mode support
- [x] Haptic feedback on Send, Call, Approve, Cancel
- [x] Delete unused tabs/screens (Overview, Timeline, Dashboard)
- [x] Mock data layer for both modules

### Remaining
- [ ] Connect to live Supabase data (replace mock layer)
- [ ] Supabase Realtime subscription for Claw draft suggestions
- [ ] Active call coaching screen (currently stub)
- [ ] Post-call summary with AI-generated action items
- [ ] Voice memo recording and transcription
- [ ] Search across contacts and messages
- [ ] Onboarding flow completion
- [ ] Physical device testing and polish

## Phase 2 — Post-Demo

- [ ] Bland AI full integration (BYOT, pathways, auto-answer)
- [ ] WhatsApp voice notes
- [ ] Live Deepgram transcription during calls
- [ ] Call coaching with real-time cards from Server
- [ ] Full dynamic skills system (`claw.skills` table)
- [ ] Email ingestion (Gmail API → auto-create leads)
- [ ] Lead scoring based on engagement
- [ ] Script template editor (CRUD in-app)
- [ ] Push notifications for new messages and Claw suggestions
- [ ] Contact search with Supabase full-text search
- [ ] Message read receipts and delivery status

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
- [ ] Web admin dashboard (`/admin/*`)

## Phase 4 — Scale

- [ ] Vertical expansion (insurance, solar, recruiting skins)
- [ ] Standalone product packaging (The Claw for [CRM], CallPilot for [CRM])
- [ ] Enterprise tier with custom pricing
- [ ] White-label option
- [ ] Analytics dashboard with call performance metrics
- [ ] A/B testing for script templates
