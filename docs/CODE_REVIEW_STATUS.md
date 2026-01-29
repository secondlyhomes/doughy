# Code Review Status

Last updated: 2026-01-29

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

**Additional fixes applied (pending commit):**
- aiSuggestions.ts: Removed dangerous type casting (`'conversation_items' as 'profiles'`)
- DealCockpitScreen.tsx: Fixed useEffect dependencies to include all deal properties used by getSuggestionsForDeal
- useDealEvents.ts: Added UUID validation before database query
- useLeadDocuments.ts: Cleanup orphaned storage files on DB insert failure
- useGoogleAuth.ts: Re-throw errors in connectGoogle() for proper caller handling
- useDeals.ts: Added onError handlers to all 4 mutations (useCreateDeal, useUpdateDeal, useDeleteDeal, useUpdateDealStage)

### Batch 6: Campaigns, Focus, Layout, Public
- `src/features/campaigns/` ✅
- `src/features/focus/` ✅
- `src/features/layout/` ✅
- `src/features/public/` ✅

**Fixes applied (pending commit):**
- useCampaigns.ts: Added user ownership verification to useUpdateCampaignStep and useDeleteCampaignStep (security)
- CampaignSettingsScreen.tsx: Added user_id check to disconnectMeta mutation (security)
- useNudges.ts: Changed from returning empty arrays to throwing errors for proper React Query error handling
- useNudges.ts: Added proper typing for deal data (replaced `any` with interface)
- useContactTouches.ts: Fixed wrong query key invalidation (`nudges-stale-leads` → `nudges-leads-with-touches`)
- usePropertyTimeline.ts: Added error handling for Supabase queries
- FocusScreen.tsx: Fixed empty property_id being passed to TouchLogSheet
- TouchLogSheet.tsx: Only include property_id in touch creation if valid
- DirectMailCreditsScreen.tsx: Show actual error message instead of generic

### Batch 7: Admin, Settings, Capture (deep review)
- `src/features/admin/` ✅
- `src/features/settings/` ✅
- `src/features/capture/` ✅

**Fixes applied (pending commit):**
- AdminDashboardScreen.tsx: Handle `success: false` results from getAdminStats/getSystemHealth
- NotificationsSettingsScreen.tsx: Rollback optimistic update on AsyncStorage save failure
- TriageQueue.tsx: Handle and display error state from useCaptureItems
- profileService.ts: Log storage deletion failures for orphaned file tracking
- CaptureScreen.tsx: Show actual error messages in all catch blocks

---

## Known Issues Not Yet Fixed

### From Batch 5 Reviews (Auth/Deals/Leads/Contacts)

#### ~~Critical~~ Fixed
1. ~~**aiSuggestions.ts** (lines 353-366): Dangerous type casting bypasses type safety~~ ✅ Fixed
2. ~~**DealCockpitScreen.tsx** (lines 316-344): Missing useEffect dependencies~~ ✅ Fixed

#### ~~High Priority~~ Mostly Fixed
1. **dealNotificationService.ts**: Multiple silent failures (NOT FIXED - acceptable degradation for notifications)
   - getPushToken() returns null on error
   - Scheduling functions return null on error
   - This is acceptable behavior for non-critical notification scheduling
2. ~~**useDealEvents.ts**: Missing UUID validation before DB query~~ ✅ Fixed
3. ~~**useLeadDocuments.ts**: Orphaned files in storage on partial failure~~ ✅ Fixed
4. ~~**useGoogleAuth.ts**: connectGoogle() swallows errors~~ ✅ Fixed
5. ~~**useDeals.ts** mutations: Missing onError handlers~~ ✅ Fixed

#### Type Design Issues (Architectural - Lower Priority)
1. **Deal type** has `strategy`, `risk_score` fields not in database schema
2. **LeadStatus** type mismatch between app and database enum values
3. **OfferTerms** has over-broad optional fields, needs discriminated union by strategy

### From Batch 6/7 Reviews (Architectural - not fixed)

#### Type Design (Medium Priority)
1. **CampaignStep** - Should be discriminated union by channel
2. **DripEnrollment** - Should be discriminated union by status
3. **CaptureItem** - "Bag of optionals" - should use discriminated union by type
4. **Result types** - Many use `{ success: boolean; error?: string }` instead of discriminated unions

#### Unsafe Type Assertions (Low Priority)
- `useCampaigns.ts` uses `as unknown as DripCampaign` casts throughout
- Consider using Supabase generated types or type guards

---

## How to Continue

1. ~~Run review agents on pending batches (Batch 6, 7)~~ ✅ Complete
2. ~~Fix critical issues from Known Issues section (Batch 5 issues)~~ ✅ Complete
3. Consider adding database migrations for missing Deal columns (strategy, risk_score)
4. Update type definitions to derive from database types where possible
5. Refactor types to use discriminated unions where appropriate (CampaignStep, DripEnrollment, CaptureItem)
