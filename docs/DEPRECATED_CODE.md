# Deprecated & Potentially Unused Code

**Last Updated:** 2026-01-16
**Status:** REVIEW COMPLETE
**Zone:** H - Code Cleanup & Deprecation Analysis

---

## Analysis Process

1. Automated search for unused exports
2. Manual review for reusability
3. Interactive review with team lead
4. Decisions made and executed

---

## Archived Migrations

**Location:** `supabase/migrations/_archived/`

**Count:** 21 files

**Contents:**
- All `*_ROLLBACK.sql` files (rollback scripts for migrations)
- Database standardization rollbacks (Phase 1 & 2)
- RLS policy rollbacks
- Schema enhancement rollbacks
- Index and constraint rollbacks

**Decision:** ARCHIVED (not deleted, kept for historical reference)

See `supabase/migrations/_archived/README.md` for details.

---

## Hooks Analysis - REVIEWED

**Script:** `scripts/find-unused-hooks.sh`
**Output:** `analysis/unused-hooks.txt`

### Summary

| Metric | Count |
|--------|-------|
| Total hooks scanned | 34 |
| Hooks with 0 direct references | 34 |

### Review Finding

All 34 hooks show 0 direct import references because they are imported via **barrel exports** (index.ts files). This is a standard React pattern.

### Final Decision: ALL KEEP

| Feature | Hooks | Decision |
|---------|-------|----------|
| Assistant | useApplyPatchSet, useChat, useAssistantContext, useJobWatcher, useAIJobs | KEEP |
| Auth | useAuth, useGoogleAuth, usePermissions | KEEP |
| Layout | useUnreadCounts | KEEP (used for badge counts) |
| Leads | useLeads, useLeadDocuments | KEEP |
| Real Estate | useProperties, usePropertyActions, useFinancingScenarios, useComps, usePropertyDocuments, usePropertyListSearch, usePropertyFilters, usePhotoExtract, useVoiceCapture, useFinancingForm, useRepairEstimate, useDealAnalysis | KEEP |
| Deals | useCreativeFinance, usePropertyDeals, useNextAction, useDeals, useDealEvents | KEEP |
| Field Mode | useWalkthrough, useVoiceRecording | KEEP |
| Dashboard | useNotifications | KEEP |
| Conversations | useConversations | KEEP |
| Portfolio | usePortfolio | KEEP |
| Admin | userService | KEEP (powers admin screens) |

---

## Components Analysis - REVIEWED

**Script:** `scripts/find-unused-components.sh`
**Output:** `analysis/unused-components.txt`

### Summary

| Type | Original Count | After Cleanup |
|------|----------------|---------------|
| Screen components | 56 | 54 |
| Card components | 13 | 13 |
| Modal components | 1 | 1 |

### Review Finding

- **51 screens** are connected to Expo Router routes
- **4 screens** were orphaned (not connected to any route)

### Orphaned Screen Decisions

| Screen | Decision | Reason |
|--------|----------|--------|
| `AdminUsersScreen.tsx` | **DELETED** | Empty file (0 bytes) |
| `NotificationSettingsScreen.tsx` | **DELETED** | Duplicate of `NotificationsSettingsScreen` |
| `TeamSettingsScreen.tsx` | KEEP | Future team feature |
| `SubscriptionScreen.tsx` | KEEP | Future billing feature |

### Cleanup Actions Taken

1. Deleted `src/features/admin/screens/AdminUsersScreen.tsx` (empty file)
2. Deleted `src/features/notifications/screens/NotificationSettingsScreen.tsx` (duplicate)
3. Deleted empty `src/features/notifications/` folder (was only exporting deleted screen)

---

## Future Features (Kept for Later)

The following orphaned screens are complete implementations kept for future use:

| Screen | Location | Purpose |
|--------|----------|---------|
| TeamSettingsScreen | `src/features/teams/screens/` | Team settings and member management |
| SubscriptionScreen | `src/features/billing/screens/` | Subscription and billing management |

---

## Consolidated Code Status

### Financial Calculations

**Status:** ALREADY CONSOLIDATED

**Location:** `src/lib/financial-calculations.ts`

**Decision:** NO ACTION NEEDED - Already consolidated

---

## Analysis Scripts

| Script | Purpose |
|--------|---------|
| `scripts/find-unused-hooks.sh` | Find hooks with no import references |
| `scripts/find-unused-components.sh` | Find components with no import references |

---

## Review Complete

Zone H code cleanup review completed on 2026-01-16.

**Actions Taken:**
- Archived 21 ROLLBACK migration files
- Reviewed all 34 hooks - ALL KEEP
- Reviewed all 56 screens - 54 KEEP, 2 DELETED
- Removed empty `src/features/notifications/` folder

**Files Deleted:**
- `src/features/admin/screens/AdminUsersScreen.tsx`
- `src/features/notifications/screens/NotificationSettingsScreen.tsx`
- `src/features/notifications/screens/index.ts`
- `src/features/notifications/index.ts`
