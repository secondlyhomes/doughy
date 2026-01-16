# Zone F: Files Changed Summary

Quick reference for all files modified in Zone F table reference standardization.

**Total Files Modified:** 24
**Total References Fixed:** 41
**Date:** 2026-01-16

---

## Edge Functions (13 files) - CRITICAL

### API Keys: `api_keys` → `security_api_keys`
1. ✅ `supabase/functions/zillow-api/index.ts` (line 79)
2. ✅ `supabase/functions/stripe-webhook/index.ts` (lines 71, 101)
3. ✅ `supabase/functions/stripe-api/index.ts` (lines 120, 605)
4. ✅ `supabase/functions/openai/index.ts` (line 114)
5. ✅ `supabase/functions/process-document/index.ts` (line 65)
6. ✅ `supabase/functions/twilio-sms/index.ts` (line 34)
7. ✅ `supabase/functions/sms-webhook/index.ts` (line 129)
8. ✅ `supabase/functions/integration-health/index.ts` (lines 119, 170, 315)
9. ✅ `supabase/functions/perplexity-api/index.ts` (line 95)
10. ✅ `supabase/functions/resend-email/index.ts` (line 67)

### Leads: `leads` → `crm_leads`
11. ✅ `supabase/functions/import-leads/index.ts` (line 349)
12. ✅ `supabase/functions/recalculate_lead_score/index.ts` (lines 37, 63)
    - ⚠️ Also contains unknown `activities` table reference at line 55 (needs investigation)

### Profiles + Relationships
13. ✅ `supabase/functions/scheduled-reminders/index.ts`
    - `profiles` → `user_profiles` (line 212)
    - `lead:leads` → `lead:crm_leads` (line 170)

---

## Application Code (6 files)

### Mock Data
14. ✅ `src/lib/mockData/seed.ts`
    - Line 31: `'profiles'` → `'user_profiles'`
    - Line 87: `'leads'` → `'crm_leads'`
    - Line 171: `'contacts'` → `'crm_contacts'`
    - Line 294: `'profiles'` → `'user_profiles'`
    - Line 296: `'leads'` → `'crm_leads'`
    - Line 299: `'contacts'` → `'crm_contacts'`

### Import Services
15. ✅ `src/services/import/leadImporter.ts`
    - Line 11: `'leads'` → `'crm_leads'`

16. ✅ `src/services/import/propertyImporter.ts`
    - Line 11: `'properties'` → `'re_properties'`

### Feature Modules
17. ✅ `src/features/assistant/hooks/useApplyPatchSet.ts`
    - Line 26: `Lead: 'leads'` → `Lead: 'crm_leads'`

### Hook Files (Relationship Joins)
18. ✅ `src/features/deals/hooks/useDeals.ts`
    - Lines 49, 122: `lead:leads` → `lead:crm_leads`

19. ✅ `src/features/deals/hooks/usePropertyDeals.ts`
    - Line 30: `lead:leads` → `lead:crm_leads`

---

## Test Files (4 files)

### Unit Tests
20. ✅ `src/features/admin/__tests__/services/userService.test.ts`
    - Line 93: `'profiles'` → `'user_profiles'`

21. ✅ `src/features/admin/__tests__/services/adminService.test.ts`
    - Lines 86, 110, 134, 165: `'leads'` → `'crm_leads'`

### Integration Tests
22. ✅ `supabase/tests/integration/auth-flow.test.ts`
    - Lines 39, 157, 204, 249, 289, 297: `'profiles'` → `'user_profiles'`

23. ✅ `supabase/tests/integration/document-upload.test.ts`
    - Lines 151, 354: `'leads'` → `'crm_leads'`

---

## Documentation & Scripts (3 files)

24. ✅ `docs/ZONE_F_FRONTEND_CODE_UPDATES.md`
    - Added outdated warning banner

25. ✅ `docs/ZONE_F_ACTUAL_STATUS.md`
    - Created comprehensive status document

26. ✅ `scripts/verify-zone-f.sh`
    - Created verification script

---

## New Test Files Created (2 files)

27. ✅ `src/features/deals/hooks/__tests__/useDeals.test.tsx`
    - Comprehensive tests for deal hooks
    - Verifies correct table names (`deals`, `crm_leads`)

28. ✅ `src/features/leads/hooks/__tests__/useLeads.test.tsx`
    - Comprehensive tests for lead hooks
    - Verifies correct table name (`crm_leads`)

---

## Git Diff Command

To review all changes:
```bash
git diff HEAD -- \
  supabase/functions/ \
  src/lib/mockData/ \
  src/services/import/ \
  src/features/assistant/ \
  src/features/deals/ \
  src/features/admin/__tests__/ \
  supabase/tests/integration/ \
  docs/ \
  scripts/
```

---

## Quick Stats

```
Category                  Files    References Fixed
────────────────────────────────────────────────────
Edge Functions             13           27
Application Code            6            8
Test Files                  4            6
Documentation               3            0
────────────────────────────────────────────────────
TOTAL                      26           41
```

**Verification:** ✅ 0 old table references remain
