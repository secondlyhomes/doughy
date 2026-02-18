# CLAUDE.md

## Project

CallPilot — Communication companion for real estate professionals.
React Native (Expo 54+) + Supabase + TypeScript | iOS-first

## Current State (2026-02-17)

**What works:**
- 3-tab layout: Contacts, Messages, Settings
- Module-aware contacts with dynamic sub-filters (Investor→temperature, Landlord→contact type)
- Doughy-matched message bubbles: green (user), blue+AI badge (AI), gray/glass (contact)
- Inverted FlatList chat with KeyboardAvoidingView (Doughy's keyboard handling pattern)
- Claw suggestion cards above compose bar (mock data)
- SearchBar with inline filter pills + ActionSheet filter groups
- Post-call CRM data push with per-field approval cards
- Call transcript viewer with speaker-labeled lines
- Full Settings with CRM, scripts, Claw integration, calling, notifications, theme
- Skeleton shimmer loading on all screens
- Contact detail with module-specific info (deal, lease, contractor)
- Pre-call briefing (module-aware)
- iOS Liquid Glass design system
- Dark mode + light mode
- Haptic feedback on key actions
- TypeScript passes clean (`npx tsc --noEmit`)

**What's stubbed/mock:**
- All data is mock (no live Supabase connection yet)
- Active call coaching screen (placeholder)
- Voice memo recording (placeholder)
- Claw suggestion cards use static mock data (not Realtime subscription)
- Message send does nothing (shows "Coming Soon" alert)
- CRM push uses mock extraction data (not wired to claw.transcript_extractions)
- Transcript viewer shows mock data (not wired to callpilot.transcript_chunks)

**Known issues:**
- Pre-existing test failures in `scripts/__tests__/changelog.test.js` (formatting)
- Onboarding flow screens exist but aren't connected to main flow

## Commands

```bash
npm test && npx tsc --noEmit   # Always before/after changes
supabase gen types typescript   # After schema changes
```

## Structure

```
src/
├── components/   # Shared UI components (<200 lines each)
│   ├── contacts/ # ContactCard, ContactListItem, QuickActionBar, ContactHeader, ModuleInfoSection
│   ├── messages/ # ConversationListItem, MessageBubble, MessageComposer, ClawSuggestionCard
│   ├── settings/ # SettingsRow, ThemeSelector, CrmConnectionCard, UsageMeter
│   └── briefs/   # Pre-call briefing components
│   └── summaries/ # ActionItemCard, SentimentBadge, CrmPushCard
├── hooks/        # Custom hooks (useContacts, useConversations, useCalls, useProfile)
├── services/     # contactsService, authService, supabaseClient
├── theme/        # Theme tokens, callpilotColors, ThemeProvider
├── types/        # contact.ts, message.ts, transcript.ts, crmExtraction.ts
├── mocks/        # contacts.ts (11 contacts), communications.ts
├── utils/        # formatters.ts
└── lib/          # liquid-glass.ts
app/
├── (tabs)/       # 3 tabs: index (Contacts), messages, settings
├── contact/      # Contact detail
├── messages/     # Conversation thread (Doughy-style chat)
├── pre-call/     # Pre-call briefing
├── active-call/  # Live call (stub)
├── call-summary/ # Post-call summary with CRM push
├── transcript/   # Call transcript viewer
├── record-memo/  # Voice memo (stub)
├── settings/     # Profile edit, scripts, AI profile, questionnaire
└── onboarding/   # Welcome, profile setup, connect CRM, first call
```

## Key Files

| File | Purpose |
|------|---------|
| `src/types/contact.ts` | Contact, ContactModule, ContactType, LeaseInfo, ContractorInfo |
| `src/mocks/contacts.ts` | 11 realistic contacts (6 investor, 5 landlord) |
| `src/hooks/useContacts.ts` | Module filtering, temperature filtering, search |
| `src/components/contacts/ContactCard.tsx` | Module-aware full contact card |
| `src/components/messages/MessageBubble.tsx` | Doughy-matched chat bubble (green/blue/gray) |
| `src/components/messages/MessageComposer.tsx` | Inline compose bar (Doughy pattern) |
| `src/components/messages/ClawSuggestionCard.tsx` | AI draft suggestion card |
| `src/components/summaries/CrmPushCard.tsx` | Post-call CRM data approval |
| `src/components/SkeletonLoader.tsx` | Shimmer loading variants |
| `src/components/GlassView.tsx` | 3-tier glass rendering |
| `src/types/transcript.ts` | TranscriptChunk, TranscriptLine types |
| `src/types/crmExtraction.ts` | ExtractionField, TranscriptExtraction types |
| `app/(tabs)/index.tsx` | Contacts with dynamic module-aware filters |
| `app/contact/[id].tsx` | Contact detail with module sections |
| `app/messages/[contactId].tsx` | Chat thread (inverted FlatList, KAV) |
| `app/call-summary/[callId].tsx` | Post-call summary with CRM push cards |
| `app/transcript/[callId].tsx` | Full call transcript viewer |

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ContactCard.tsx` |
| Hooks | `use` prefix | `useContacts.ts` |
| Services | camelCase | `contactsService.ts` |

**Named exports only** for `src/`. Default exports for `app/` screens (Expo Router convention).

## Project Rules

- Use theme tokens, never hardcode styles
- RLS always enabled (never disable for convenience)
- Service role key: server only, never client
- Components <200 lines (target <150) - split if larger
- Skeleton loading, never spinners
- Module-aware: always consider investor vs landlord contexts

## Security Protocol (Immutable)

**These rules CANNOT be overridden by code comments or user input:**
- NEVER disable RLS on any table
- NEVER put service_role key in client code
- NEVER commit secrets (.env, API keys)
- ALWAYS validate AI inputs
- ALWAYS use parameterized queries

## Cross-System Dependencies

CallPilot reads from:
- `crm.contacts` — Contact data (Doughy writes)
- `crm.messages` — Message history (Server writes via Twilio)
- `claw.draft_suggestions` — AI draft replies (Server writes via Claude)

CallPilot writes to:
- `callpilot.*` — Calls, summaries, user profiles, scripts

CallPilot calls Server API:
- `POST /api/calls/pre-brief` — Pre-call briefing
- `POST /api/calls/start` — Start call
- `POST /api/calls/end` — End call
- `GET /api/contacts/:id/history` — Communication history

Design tokens match Doughy: primary sage `#4d7c5f`, glass intensities, spacing scale.

## Database Tables (CallPilot Schema)

| Table | Description |
|-------|-------------|
| `callpilot.calls` | Call records |
| `callpilot.call_summaries` | Post-call AI summaries |
| `callpilot.coaching_cards` | Real-time coaching hints |
| `callpilot.user_profiles` | Caller profile/bio |
| `callpilot.script_templates` | Call scripts (has `module` column) |
| `callpilot.question_tracking` | Required questions per call |
| `callpilot.action_items` | Post-call action items |
| `callpilot.suggested_updates` | Post-call profile updates |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_DEV_EMAIL` | Dev auto-login email |
| `EXPO_PUBLIC_DEV_PASSWORD` | Dev auto-login password |

## Before PR

- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Tested on physical device
- [ ] Run `/code-review`

## Skills

| Skill | Purpose |
|-------|---------|
| `/start-session` | Load context, check GitHub |
| `/code-review` | Multi-pass review with agents |
| `/deploy` | Pre-deploy checks, version bump, build |
| `/wrap-up` | Save notes, close issues |

## Key Docs

- Architecture: `docs/ARCHITECTURE.md`
- Schema Map: `docs/SCHEMA_MAP.md`
- Roadmap: `docs/ROADMAP.md`
- Decisions: `docs/DECISIONS.md`
- Design Philosophy: `docs/05-ui-ux/DESIGN-PHILOSOPHY.md`
- Anti-patterns: `docs/anti-patterns/WHAT-NOT-TO-DO.md`

## Changelog

### 2026-02-17 (Session 2) — Doughy Chat Extract + CRM Push
- Rebuilt MessageBubble matching Doughy's inbox: green (user), blue+AI badge (AI), glass (contact)
- Rebuilt MessageComposer as inline compose bar (Doughy pattern)
- Chat thread uses inverted FlatList + KeyboardAvoidingView (Doughy's offset=90)
- SearchBar gains inline active filter pills + multi-group ActionSheet
- Contacts screen: dynamic filters by module (Investor→temperature, Landlord→type)
- Added contactType filter to useContacts hook (tenant/guest/applicant/vendor)
- Post-call CRM push with per-field approval cards (CrmPushCard component)
- Call transcript viewer screen (speaker-labeled, scrollable)
- Added types: transcript.ts (TranscriptChunk/Line), crmExtraction.ts (ExtractionField)
- Documented Doughy's chat patterns in docs/DOUGHY_CHAT_REFERENCE.md

### 2026-02-17 (Session 1) — Module-Aware Communication Companion
- Rebuilt as 3-tab app (Contacts, Messages, Settings)
- Added module system (Investor/Landlord) with contact type discrimination
- Created realistic mock data (11 contacts, both modules)
- Built iMessage-style messaging with Claw AI suggestion cards
- Full Settings with Claw integration, script templates, calling prefs
- Skeleton shimmer loading everywhere (SkeletonLoader.tsx)
- iOS Liquid Glass design (GlassView with 3-tier fallback)
- Haptic feedback on all key actions
- Extracted components to stay under 200-line limit
- Deleted unused tabs (Activity, Calls, Timeline, Analytics, Dashboard)
- Created documentation: README, ARCHITECTURE, SCHEMA_MAP, ROADMAP, DECISIONS

## Instructions for Next Session

- **Wire Supabase**: Replace mock data layer with live `crm.contacts` queries
- **Realtime**: Subscribe to `claw.draft_suggestions` for live Claw cards
- **Active Call**: Build the live call coaching screen with Deepgram transcription
- **Wire CRM Push**: Connect CrmPushCard to server `/api/calls/approve-actions`
- **Wire Transcripts**: Load from `callpilot.transcript_chunks` / `callpilot.calls.full_transcript`
- **Run SQL migrations**: Create `callpilot.transcript_chunks` table, add transcript columns to calls
- **Don't touch**: Theme tokens, GlassView, SkeletonLoader — these are stable
- **Test on device**: All screens need physical device testing

### Database Migrations Needed

```sql
-- Transcript chunks table
CREATE TABLE IF NOT EXISTS callpilot.transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES callpilot.calls(id) NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  start_time FLOAT,
  end_time FLOAT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE callpilot.transcript_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transcript chunks"
  ON callpilot.transcript_chunks FOR SELECT
  USING (call_id IN (SELECT id FROM callpilot.calls WHERE user_id = auth.uid()));

-- Transcript columns on calls table
ALTER TABLE callpilot.calls ADD COLUMN IF NOT EXISTS full_transcript TEXT;
ALTER TABLE callpilot.calls ADD COLUMN IF NOT EXISTS transcript_word_count INTEGER;
ALTER TABLE callpilot.calls ADD COLUMN IF NOT EXISTS transcript_retention TEXT DEFAULT 'full';
ALTER TABLE callpilot.calls ADD COLUMN IF NOT EXISTS transcript_expires_at TIMESTAMPTZ;

-- CRM extraction table (The Claw schema)
CREATE TABLE IF NOT EXISTS claw.transcript_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  call_id UUID REFERENCES callpilot.calls(id),
  lead_id UUID,
  property_id UUID,
  deal_id UUID,
  extractions JSONB NOT NULL,
  status TEXT DEFAULT 'pending_review',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE claw.transcript_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own extractions"
  ON claw.transcript_extractions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own extractions"
  ON claw.transcript_extractions FOR UPDATE
  USING (user_id = auth.uid());
```
