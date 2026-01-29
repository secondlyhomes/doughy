# Code Review Status

Last updated: 2026-01-28

## Review Process

Using 3 specialized agents in parallel:
1. **code-reviewer** - Bugs, logic errors, security vulnerabilities, project conventions
2. **silent-failure-hunter** - Catch blocks that swallow errors, missing user feedback
3. **type-design-analyzer** - Type safety, database alignment, invariant enforcement

## Completed Reviews

### Batch 1: Rental Features
- `src/features/rental-inbox/` ✅
- `src/features/rental-properties/` ✅
- `src/features/rental-bookings/` ✅

### Batch 2: Assistant, Billing, Conversations
- `src/features/assistant/` ✅
- `src/features/billing/` ✅
- `src/features/conversations/` ✅
- `src/features/real-estate/` ✅

**Fixes committed:** 2e99a11
- useAIJobs.ts: Fixed wrong table name in realtime subscription (`ai_jobs` → `assistant_jobs`)
- JobsTab.tsx: Added error feedback for job cancellation
- ActionsTab.tsx: Added error feedback for job creation/action execution
- SubscriptionScreen.tsx: Added error state with retry button

### Batch 3: Portfolio, Field-mode, Capture, Integrations
- `src/features/portfolio/` ✅
- `src/features/field-mode/` ✅
- `src/features/capture/` ✅
- `src/features/integrations/` ✅

**Fixes committed:** 0460838
- PhotoBucketCard.tsx: Added Alert for camera/gallery errors
- useVoiceRecording.ts: Added setError for cancel/stop failures
- usePortfolioPerformance.ts: Added error logging for queries

### Batch 4: Dashboard, Analytics, Docs, Teams
- `src/features/dashboard/` ✅
- `src/features/analytics/` ✅
- `src/features/docs/` ✅
- `src/features/teams/` ✅

**Fixes committed:** a400385
- TeamSettingsScreen.tsx: Added error state with retry button for load failures
- useNotifications.ts: Added rollback on dismiss failure, fixed useEffect dependency
- DashboardScreen.tsx: Added user feedback for non-abort refresh errors

### Batch 5: Auth, Deals, Leads, Contacts
- `src/features/auth/` ✅
- `src/features/deals/` ✅
- `src/features/leads/` ✅
- `src/features/contacts/` ✅

**Fixes committed:** c301f63
- MFASetupScreen.tsx: Exit loading state on enrollment failure
- mfaService.ts: Changed isMFAEnabled to return result object (security fix)
- AuthProvider.tsx: Added try-catch to onAuthStateChange
- emailVerificationService.ts: Fixed race condition in polling
- SecurityScreen.tsx: Updated to use new isMFAEnabled return type

---

## Pending Reviews

### Batch 6: Campaigns, Focus, Layout, Public
- `src/features/campaigns/` ❌
- `src/features/focus/` ❌
- `src/features/layout/` ❌
- `src/features/public/` ❌

### Batch 7: Admin, Settings, Capture (deep review)
- `src/features/admin/` ❌ (partial review done earlier)
- `src/features/settings/` ❌
- `src/features/capture/` ❌ (deeper review needed)

---

## Known Issues Not Yet Fixed

### From Batch 5 Reviews (Auth/Deals/Leads/Contacts)

#### Critical
1. **aiSuggestions.ts** (lines 353-366): Dangerous type casting bypasses type safety
   - `'conversation_items' as 'profiles'` cast
   - Needs proper table type definitions

2. **DealCockpitScreen.tsx** (lines 316-344): Missing useEffect dependencies
   - `getSuggestionsForDeal(deal)` passes full deal but deps only have `deal?.id, deal?.stage`

#### High Priority
1. **dealNotificationService.ts**: Multiple silent failures
   - getPushToken() returns null on error (lines 118-121)
   - All scheduling functions fail silently (lines 161-164, 198-201, 232-235, 275-278)
   - Immediate notifications fail silently (lines 306-308, 339-341)

2. **useDealEvents.ts** (lines 13-39): Missing UUID validation before DB query

3. **useLeadDocuments.ts** (lines 133-234): Orphaned files in storage on partial failure
   - File uploads to storage, then DB insert fails, file is orphaned

4. **useGoogleAuth.ts** (lines 66-74): connectGoogle() swallows errors, returns false

5. **useDeals.ts** mutations: Missing onError handlers for user feedback

#### Type Design Issues
1. **Deal type** has `strategy`, `risk_score` fields not in database schema
2. **LeadStatus** type mismatch between app and database enum values
3. **OfferTerms** has over-broad optional fields, needs discriminated union by strategy

---

## How to Continue

1. Run review agents on pending batches (Batch 6, 7)
2. Fix critical issues from Known Issues section
3. Consider adding database migrations for missing Deal columns
4. Update type definitions to derive from database types where possible
