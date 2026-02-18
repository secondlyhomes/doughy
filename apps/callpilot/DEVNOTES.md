# CallPilot - Dev Notes (Session: Feb 10, 2026)

## What Was Built

Phase 0 POC - complete UI with mock data, zero external dependencies (no Supabase, no APIs, no AI).

### Files Created

**Types** (`src/types/`)
- `contact.ts` - Contact, ContactSource, ContactStatus
- `call.ts` - Call, CallOutcome
- `preBrief.ts` - PreCallBrief, BriefSection, RelationshipStrength
- `voiceMemo.ts` - VoiceMemo, ActionItem, KeyMoment, CallSentiment
- `callSummary.ts` - CallSummary (reuses ActionItem/KeyMoment from voiceMemo)
- `coachingInsight.ts` - WeeklyStats, TopObjection, CoachingInsight
- `userProfile.ts` - UserProfile with plan tier, usage tracking
- `index.ts` - barrel export

**Mock Data** (`src/mocks/`)
- `contacts.ts` - 8 insurance contacts with realistic data
- `calls.ts` - 15 call records tied to contacts by ID
- `preBriefs.ts` - 5 pre-call briefs with sections
- `voiceMemos.ts` - 5 memos with transcripts + analysis
- `callSummaries.ts` - 5 summaries with action items
- `coachingInsights.ts` - analytics data (weekly stats, objections, insights)
- `userProfile.ts` - Dino Garcia, Pro plan, 47/200 calls used
- `index.ts` - barrel export

**Theme Extension** (`src/theme/`)
- `callpilotColors.ts` - semantic color mappings (brief, attention, outcome, sentiment, relationship, moment) all mapped to existing token colors

**Shared Components** (`src/components/`)
- `Card/` - copied from `.examples/`, elevated/outlined/filled variants
- `SectionHeader.tsx` - title + optional "See All" action
- `StatusBadge.tsx` - color-coded badges for outcomes/sentiments/relationships/sources
- `EmptyState.tsx` - centered empty state with emoji, title, description, CTA

**Feature Components** (`src/components/`)
- `contacts/ContactCard.tsx` - contact card with status, follow-up warning
- `calls/CallHistoryCard.tsx` - call card with outcome badge, duration
- `briefs/BriefSection.tsx` + `KeyInsightBadge.tsx` - brief sections with colored borders
- `memos/VoiceMemoRecorder.tsx` - fake recorder with animated waveform (30 bars), pulse, timer
- `summaries/ActionItemCard.tsx` + `SentimentBadge.tsx` - toggleable checkboxes, sentiment indicator
- `analytics/MetricCard.tsx` - metric with value + change indicator

**Hooks** (`src/hooks/`)
- `useMockContacts.ts` - search, filter by status, sort by follow-up
- `useMockCalls.ts` - filter chips, getCallsForContact, recentCalls
- `useMockBriefs.ts` - getBriefForContact
- `useMockMemos.ts` - getMemoForCall, getSummaryForCall, recording state
- `useMockAnalytics.ts` - returns mock CoachingInsight
- `useMockProfile.ts` - profile + time-of-day greeting

**Screens** (`app/`)
- `(tabs)/_layout.tsx` - tab navigator (Home, Calls, Contacts, Settings)
- `(tabs)/index.tsx` - home dashboard with greeting, 3 MetricCards, follow-ups, recent calls
- `(tabs)/calls.tsx` - call history with filter chips (All, This Week, Won, Needs Follow-up)
- `(tabs)/contacts.tsx` - searchable contact list
- `(tabs)/settings.tsx` - profile, CRM connection, usage meter, plan info
- `contact/[id].tsx` - contact detail with call history, key facts, objections
- `pre-call/[contactId].tsx` - scannable 30-second brief with sections
- `record-memo/[callId].tsx` - voice memo recorder wrapper
- `call-summary/[callId].tsx` - AI summary, sentiment, action items, CRM sync
- `onboarding/welcome.tsx` - value prop screen
- `onboarding/profile-setup.tsx` - name, role, selling style form
- `onboarding/connect-crm.tsx` - mock HubSpot OAuth
- `onboarding/first-call.tsx` - guided walkthrough CTA
- `index.tsx` - root redirect to `/(tabs)`

**Config Changes**
- `app.json` - created with CallPilot identity, microphone permission
- `tsconfig.json` - copied from `templates/tsconfig.json` (strict mode)
- `package.json` - renamed to callpilot, removed non-existent deps (`@types/react-native`, `supabase`)

### Verification Results

- TypeScript: **0 errors** in `src/` and `app/` (51 pre-existing errors in `e2e/` and `marketing/` from blueprint)
- All components: **under 200 lines** (largest: VoiceMemoRecorder at 198, Input at 197)
- Hardcoded colors: **0** (fixed one `#FFFFFF` -> `theme.tokens.colors.white` in calls.tsx)
- Named exports in `src/`: **all confirmed**
- Default exports in `app/`: **all confirmed** (Expo Router requirement)

---

## Known Issues / Rough Edges

1. **VoiceMemoRecorder is at 198 lines** - right at the limit. If adding features, extract the waveform or processing state into sub-components.

2. **No WeeklyChart component** - the plan called for `analytics/WeeklyChart.tsx` but it wasn't built. The home dashboard uses MetricCards instead. Build this if analytics screen gets expanded.

3. **No InsightCard component** - planned in `analytics/InsightCard.tsx`, not built yet. CoachingInsight data exists in mocks.

4. **No SkeletonLoader or UsageBar** - planned shared components not built (low priority for POC since there's no loading state with mock data).

5. **Filter chips in calls.tsx are inline** - could be extracted to a reusable `FilterChips` component if used elsewhere.

6. **Onboarding not gated** - `app/index.tsx` always redirects to `/(tabs)`. The TODO to check onboarding status is noted in the file.

7. **npm install requires `--legacy-peer-deps`** - react-test-renderer@19 conflicts with react@18. Will resolve when Expo upgrades React.

8. **Pre-existing blueprint errors** - 51 TS errors in `e2e/auth.e2e.ts` (missing detox/jest types) and `marketing/` (unused variable). Not our code, not blocking.

---

## What's NOT Built (Intentionally Deferred)

Per plan, these are Phase 1+ items:
- Supabase auth, database, RLS policies
- Real audio recording (expo-av)
- Edge Functions (transcribe-memo, analyze-call, generate-brief)
- HubSpot OAuth + CRM sync
- Push notifications
- Real usage tracking / billing

---

## Next Steps (Phase 1 Prep)

### Before Phase 1
1. **Run on physical device** - test all 12 screens on iOS, check haptics, animations, navigation
2. **UX review** - walk through the full flow: Onboarding -> Home -> Contact -> Brief -> Record Memo -> Summary
3. **Refine mock data** - adjust copy, timing, realistic insurance scenarios based on device testing
4. **Fill gaps** - build WeeklyChart, InsightCard if analytics screen feels empty

### Phase 1: Foundation (Sprint 1-2)
1. Set up Supabase project + 7 tables (schema in plan file)
2. Auth flow (email/password + magic link)
3. Replace mock hooks with real Supabase queries
4. Real audio recording with expo-av + Supabase Storage
5. See full plan: `C:\Users\Dino\.claude\plans\reflective-marinating-moon.md`

---

## Key References

- **Full build plan**: `C:\Users\Dino\.claude\plans\reflective-marinating-moon.md`
- **Blueprint docs**: `docs/` (8 best-practice docs for cross-validation)
- **Example components**: `.examples/components/advanced/` (Card, EmptyState, ErrorState, LoadingState, FormField)
- **Theme tokens**: `src/theme/tokens.ts`
- **Reusable components**: Button (`src/components/Button/`), Input (`src/components/Input.tsx`), Text (`src/components/Text.tsx`)
- **Path aliases**: `@/` -> `src/`, also `@components/`, `@hooks/`, `@services/`, `@types/`, `@utils/`, `@theme/`
