# Session Log

## 2026-02-21 — Post-Demo Refactoring (Monorepo Structure)

**Phase 1: ARCHITECTURE.md** updated with current tab structure, CallPilot separation strategy, monorepo layout.

**Phase 2: Shared Design Tokens**
- Created `packages/design-tokens/` (`@secondly/design-tokens`) — colors, spacing, effects
- Added npm workspaces (`packages/*`), wired Metro configs for all 3 apps
- Each app re-exports core tokens and adds app-specific extensions

**Phase 3: File-Level Refactoring**
- Priority 1 (satellite >300): 6 files split (supabaseAdapter 751→100, contactsService 418→13, MessageBubble 362→52, etc.)
- Priority 2 (Doughy >500): 16 files split (RentalPropertyFormWizard 686→284, rental-conversations/store 674→76, etc.)
- Priority 3 (Doughy 400-500): 13 files split (IntegrationsScreen 507→164, RentalPropertyForm 506→72, etc.)
- Total: ~197 files changed, ~130 new focused modules created from 35 oversized files

**Commits:**
- `e42f89b` — Phase 1+2+3 P1+P2 (121 files, +10,434/-8,720)
- `1b927c8` — Phase 3 P3 (76 files, +4,996/-3,795)

---

## 2026-02-20 — doughy-tasks.md Completion (25/25 tasks)

**All 25 tasks from `doughy-tasks.md` completed across 5 groups.**

**Group A (Demo Readiness):**
- Mock call system rebuilt in CallPilot (active call → summary → CRM push)
- Marcus/Mike reconciliation verified (separate investor/landlord personas)
- Sarah Martinez pipe-break flow confirmed working (dispatch handler dual-action)
- Bookings seeded with Sarah + James, linked to properties

**Group B (UI/UX — 10 tasks):**
- Back button overlay, menu oval→circle, safe area violations (6 screens)
- Header race condition, empty state centering, property tabs overflow
- CallPilot: BottomSheet (new), SearchBar aligned, name flash fixed, phone formatting

**Group C (Messaging):**
- SMS fixed: `SERVER_URL` was missing from production `.env` → Twilio sig validation always failed
- PostgREST `callpilot` schema cache reloaded
- Deep linking with Expo Go fallback
- A2P assessment documented

**Group D (Data/Schema):**
- Removed `due_diligence` deal stage, removed AI from deals, fixed repairs route

**Group E (Claw AI):**
- Conversation context increased from 4-8 to 10 messages across all handlers

**Server:**
- Added `POST /api/calls/:id/push-extractions` endpoint (CallPilot→Claw extraction flow)
- Deployed all changes to production droplet
- Added `SERVER_URL=https://openclaw.doughy.app` to production env

**Documentation:**
- `docs/TROUBLESHOOTING.md` — added server production issues section
- `docs/DEPLOYMENT.md` — updated deploy commands (rsync, --update-env)
- `docs/DECISIONS.md` — added decisions #16 (context window) and #17 (SERVER_URL)
- `openclaw-server/CLAUDE.md` — added SERVER_URL and Discord env vars

---

## 2026-02-17 — UI Reorganization & Polish

**Tab Structure:**
- Changed from 3 to 4 tabs per mode: Investor (Inbox | Pipeline | Contacts | Settings), Landlord (Inbox | Properties | Contacts | Settings)
- Removed `conversations` hidden tab from navigation
- Elevated Contacts to a visible shared tab

**ADHD-Friendly UX:**
- Added `InvestorNeedsAttention` component + `useInvestorAttention` hook to Pipeline screen
- Added `LandlordNeedsAttention` component + `useLandlordAttention` hook to Properties screen
- Color-coded urgency (red/yellow/blue), max 3 items, "+N more" overflow

**Liquid Glass Design:**
- `useNativeHeader` now defaults to `glass: true` — adds `headerBlurEffect: 'systemChromeMaterial'` on iOS
- All detail screens (Property, Contact, SmartHome) use native glass headers
- Settings screen converted to `Card variant="glass"` for all sections
- PropertyHubGrid expanded to 6 hubs (added Inventory, Smart Home) with glass variant
- Financials and Listings cards on property detail use glass variant

**Dark Mode Fixes:**
- VoIP in-call styles: removed hardcoded colors from stylesheet, applied via inline styles
- Vendors FAB: fixed hardcoded `"white"` → `colors.primaryForeground`
- ContactAvatar: fixed hardcoded `"#FFFFFF"` → `colors.primaryForeground`

**DB Migrations (staging):**
- `landlord.vendor_jobs` — new table for job dispatch tracking
- `landlord.inventory_items` — added manufacturer support fields
- `crm.leads` — added source, auto_created, review_status columns
- `investor.properties` — added mortgage_info JSONB

**Documentation:**
- Created README.md at project root
- Created `docs/CHAT_UI_REFERENCE.md` (CallPilot reference for chat patterns)
- Updated ARCHITECTURE.md with cross-system dependencies
- Updated ROADMAP.md with completed UI items
- Updated DECISIONS.md with decisions #13-15
- Updated docs/ROADMAP.md with Phase 1.5 (Email Ingestion) and Phase 1.6 (Smart Home)

**Files Created:**
- `README.md`
- `docs/CHAT_UI_REFERENCE.md`
- `src/features/rental-properties/components/LandlordNeedsAttention.tsx`
- `src/features/rental-properties/hooks/useLandlordAttention.ts`
- `src/features/pipeline/components/InvestorNeedsAttention.tsx`
- `src/features/pipeline/hooks/useInvestorAttention.ts`

---

## 2026-02-17 — Restructure & Module Isolation

**DB Migrations (staging):**
- CHECK constraints on `crm.contacts.module` and `crm.leads.module` (investor/landlord only)
- `crm.lead_links` — junction table for linking related leads (spouse, co-owner, etc.)
- `investor.deal_leads` — many-to-many deals-to-leads junction table
- `claw.transcript_extractions` — CallPilot→Claw→Doughy extraction flow
- `callpilot.calls` — added `transcript_retention` and `transcript_expires_at` columns
- `public.crm_contact_source` enum — added investor sources: driving_for_dollars, direct_mail, cold_call, probate, wholesaler, mls
- Types regenerated from staging

**Module Data Isolation:**
- Contacts queries now filter by `module='landlord'`, leads filter by `module='investor'`
- `createContact()` sets `module: 'landlord'`, `createLead()` sets `module: 'investor'`
- Query keys updated to include module for proper cache isolation
- `module` field added to Contact and InvestorLead type interfaces

**Points/Score Removal:**
- Removed score display from ContactCard, LeadCard, ContactDetailScreen, LeadDetailScreen
- Removed 'Score' / 'Lead Score' from sort options in both contacts and leads list screens
- Removed 'score' from sortBy union types in filter types
- Score field kept in DB and types (valid data, just hidden from UI)

**The Claw Security Fixes (openclaw-server):**
- `drafts.ts`: Added `user_id` filter to phone lookups (IDOR fix)
- `briefing.ts`: Added `user_id` filter to contact/lead name lookups
- `router.ts`: `createDraftLead()` now accepts `module` parameter (default: 'investor')
- `tools.ts`: Added ownership verification to `updateLead()` and `updateDealStage()`
- `email-capture.ts`: `createContactFromEmail()` now sets `module: 'investor'`

**Tab Restructure:**
- Investor Mode: Leads → Properties → Deals → Settings (was Inbox → Pipeline → Contacts → Settings)
- Landlord Mode: People → Properties → Bookings → Settings (was Inbox → Properties → Contacts → Settings)
- Inbox tabs hidden (moving to CallPilot), Pipeline/Portfolio hidden
- Default route: Leads (investor) or People (landlord)

**New UI Components:**
- `FilterSearchBar` — SearchBar wrapper with dismissible active filter pills
- `CallPilotActions` — Call/Message buttons with deep linking to CallPilot app
- `CommunicationHistory` — Read-only communication timeline for detail screens

**Dark Mode Fixes:**
- `FormField` — added `keyboardAppearance` tied to theme (affects ALL form fields app-wide)
- `LoginScreen` — added `keyboardAppearance` to both email and password inputs
