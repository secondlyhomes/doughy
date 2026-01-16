# Zone H: Code Cleanup & Deprecation Analysis

**Owner:** Senior Developer / Tech Lead
**Timeline:** Week 5
**Dependencies:** None (can run in parallel with other zones)
**Risk Level:** LOW (conservative approach, document only)

---

## Mission

Analyze codebase for unused code, deprecated migrations, and duplicate logic. Document findings conservatively. **DO NOT DELETE** anything unless 100% confident. Create GitHub issues for manual review.

---

## Guiding Principle: Be Conservative

**Rule:** When in doubt, KEEP IT and document for review.

**Why?**
- Code might be reusable utility functions
- Components might be used in future features
- Better to have extra code than to delete something useful

**Approach:**
1. Run automated analysis
2. Document ALL findings in `docs/DEPRECATED_CODE.md`
3. Create GitHub issues for each flagged item
4. Team reviews issues before any deletion
5. Only archive (don't delete) deprecated migrations

---

## Step 1: Deprecated Migration Files

### 1.1 Find All ROLLBACK Migrations

```bash
# Find all _ROLLBACK.sql files
find supabase/migrations -name "*_ROLLBACK.sql"

# List all files in rollbacks/ folder
ls -la supabase/migrations/rollbacks/
```

**Expected findings:**
- `20260116_add_rls_api_keys_ROLLBACK.sql`
- `20260116_add_rls_profiles_ROLLBACK.sql`
- `20260116_add_rls_user_plans_ROLLBACK.sql`
- `20260116_create_core_tables_ROLLBACK.sql`
- And ~15 more...

### 1.2 Archive (Don't Delete)

**Create archive folder:**
```bash
mkdir -p supabase/migrations/_archived
```

**Move rollback files:**
```bash
# Move ROLLBACK files
mv supabase/migrations/*_ROLLBACK.sql supabase/migrations/_archived/

# Move rollbacks folder contents
mv supabase/migrations/rollbacks/* supabase/migrations/_archived/
rmdir supabase/migrations/rollbacks
```

**Create README:**

**File:** `supabase/migrations/_archived/README.md`
```markdown
# Archived Migrations

This folder contains rollback migrations and historical migrations that are no longer executed but kept for reference.

## Contents
- `*_ROLLBACK.sql` - Rollback scripts for migrations (not executed, historical reference)
- Legacy test migrations
- Deprecated table creations

## Why Archive Instead of Delete?
- Historical reference for understanding schema evolution
- Rollback capability if needed (though not recommended for old migrations)
- Audit trail for compliance

## Note
These files are **NOT executed** by Supabase. They are archived for reference only.

Last archived: 2026-01-23
```

**Deliverable:**
- [ ] All ROLLBACK migrations moved to `_archived/`
- [ ] `_archived/README.md` created
- [ ] Verified Supabase still runs migrations correctly

---

## Step 2: Unused Code Analysis

### 2.1 Find Hooks with No References

**Script:** `scripts/find-unused-hooks.sh` (NEW)

```bash
#!/bin/bash

# Find all hook exports
echo "Searching for unused hooks..."
echo "=========================="

for hook_file in $(find src/features -name "use*.ts" -o -name "use*.tsx"); do
  # Extract hook name from file
  hook_name=$(basename "$hook_file" | sed 's/\.tsx\?$//')

  # Count references (excluding the definition file itself)
  ref_count=$(grep -r "import.*${hook_name}" src --include="*.ts" --include="*.tsx" | grep -v "$hook_file" | wc -l)

  if [ "$ref_count" -eq 0 ]; then
    echo "⚠️  ${hook_name} (${hook_file}) - 0 references"
  fi
done
```

**Run:**
```bash
chmod +x scripts/find-unused-hooks.sh
./scripts/find-unused-hooks.sh > analysis/unused-hooks.txt
```

**Expected output:**
```
⚠️  usePropertyFilters (src/features/real-estate/hooks/usePropertyFilters.ts) - 0 references
⚠️  useLeadScoring (src/features/leads/hooks/useLeadScoring.ts) - 0 references
...
```

---

### 2.2 Find Components with No References

**Script:** `scripts/find-unused-components.sh` (NEW)

```bash
#!/bin/bash

echo "Searching for unused components..."
echo "================================="

for component_file in $(find src/features -name "*Screen.tsx" -o -name "*Card.tsx" -o -name "*Button.tsx" -o -name "*Modal.tsx"); do
  component_name=$(basename "$component_file" | sed 's/\.tsx$//')

  # Count references
  ref_count=$(grep -r "import.*${component_name}" src --include="*.ts" --include="*.tsx" | grep -v "$component_file" | wc -l)

  if [ "$ref_count" -eq 0 ]; then
    echo "⚠️  ${component_name} (${component_file}) - 0 references"
  fi
done
```

---

### 2.3 Find Duplicate Code

**Example: MAO Calculators**

```bash
# Search for MAO calculation logic
grep -r "calculateMAO\|maxAllowableOffer\|maximum.*allowable" src --include="*.ts" --include="*.tsx"

# Search for ARV calculation logic
grep -r "calculateARV\|after.*repair.*value" src --include="*.ts" --include="*.tsx"

# Search for cash flow calculations
grep -r "calculateCashFlow\|monthly.*cash.*flow" src --include="*.ts" --include="*.tsx"
```

**If duplicates found:**
1. Identify the most comprehensive implementation
2. Consolidate to shared utility: `src/lib/calculations/`
3. Update all references
4. Add deprecation comments to old locations

**Example consolidation:**

**File:** `src/lib/calculations/maoCalculator.ts` (NEW)
```typescript
/**
 * Maximum Allowable Offer (MAO) Calculator
 *
 * Consolidated from multiple implementations:
 * - src/features/deals/utils/maoCalc.ts (deprecated)
 * - src/features/real-estate/calculations/mao.ts (deprecated)
 *
 * This is now the SINGLE SOURCE OF TRUTH for MAO calculations.
 */

export interface MAOInput {
  arv: number;
  repairCost: number;
  holdingCosts?: number;
  closingCosts?: number;
  profitMargin?: number; // Default: 0.70 (70% rule)
}

export interface MAOResult {
  mao: number;
  breakdown: {
    arv: number;
    targetPrice: number;
    repairs: number;
    holding: number;
    closing: number;
  };
  profitMargin: number;
}

export function calculateMAO(input: MAOInput): MAOResult {
  const profitMargin = input.profitMargin || 0.70;
  const targetPrice = input.arv * profitMargin;
  const holding = input.holdingCosts || 0;
  const closing = input.closingCosts || input.arv * 0.03; // Default 3%

  const mao = targetPrice - input.repairCost - holding - closing;

  return {
    mao,
    breakdown: {
      arv: input.arv,
      targetPrice,
      repairs: input.repairCost,
      holding,
      closing,
    },
    profitMargin,
  };
}
```

**Deprecated files:**
Add comment to old implementations:
```typescript
/**
 * @deprecated Use src/lib/calculations/maoCalculator.ts instead
 * This file is kept for backward compatibility only.
 * Will be removed in v2.0.0
 */
```

---

## Step 3: Document Findings

### 3.1 Create Documentation File

**File:** `docs/DEPRECATED_CODE.md` (NEW)

```markdown
# Deprecated & Potentially Unused Code

**Last Updated:** 2026-01-23
**Status:** Analysis complete, awaiting team review

---

## Analysis Process

1. ✅ Automated search for unused exports
2. ✅ Manual review for reusability
3. ⏳ Community review via GitHub issues (pending)
4. ⏳ Decision: KEEP, DEPRECATE, or DELETE (pending)

---

## Findings

### Hooks with No Direct References

| Hook | Location | Status | Decision | Reason |
|------|----------|--------|----------|--------|
| usePropertyFilters | src/features/real-estate/hooks/usePropertyFilters.ts | No refs | ⏳ REVIEW | May be reusable utility hook |
| useLeadScoring | src/features/leads/hooks/useLeadScoring.ts | No refs | ⏳ REVIEW | Scoring logic might be used later |
| useDealFilters | src/features/deals/hooks/useDealFilters.ts | No refs | ⏳ REVIEW | Similar to usePropertyFilters |

**GitHub Issues:**
- #123: Review usePropertyFilters hook
- #124: Review useLeadScoring hook
- #125: Review useDealFilters hook

---

### Components with No Direct References

| Component | Location | Status | Decision | Reason |
|-----------|----------|--------|----------|--------|
| LegacyPropertyCard | src/features/real-estate/components/LegacyPropertyCard.tsx | No refs | ⏳ REVIEW | Might be used in exports/reports |
| OldDealCockpit | src/features/deals/screens/OldDealCockpit.tsx | No refs | ⏳ DELETE | Replaced by new DealCockpitScreen |

**GitHub Issues:**
- #126: Review LegacyPropertyCard component
- #127: Delete OldDealCockpit (confirmed replaced)

---

### Consolidated Code

| Original Locations | New Location | Date | Notes |
|-------------------|--------------|------|-------|
| 3 MAO calculators:<br>- src/features/deals/utils/maoCalc.ts<br>- src/features/real-estate/calculations/mao.ts<br>- src/lib/calculations/mao.ts | src/lib/calculations/maoCalculator.ts | 2026-01-23 | Single source of truth |
| 2 ARV calculators | src/lib/calculations/arvCalculator.ts | 2026-01-23 | Consolidated from deals + re features |

**GitHub Issues:**
- #128: Update all MAO calculator references
- #129: Update all ARV calculator references

---

## Archived Migrations

**Location:** `supabase/migrations/_archived/`

**Count:** 24 files

**Contents:**
- All `*_ROLLBACK.sql` files
- Legacy test migrations
- See `supabase/migrations/_archived/README.md` for details

**Decision:** ✅ ARCHIVED (not deleted, kept for historical reference)

---

## Next Steps

1. ⏳ Team reviews GitHub issues
2. ⏳ Make decisions on each flagged item (KEEP, DEPRECATE, DELETE)
3. ⏳ Update this document with final decisions
4. ⏳ Execute approved changes
5. ⏳ Close GitHub issues

---

## Guidelines for Reviewers

**KEEP if:**
- Utility hook/component that might be reused
- Part of exported API (even if not used internally)
- Needed for backward compatibility
- Unsure! (when in doubt, keep it)

**DEPRECATE if:**
- Replaced by better implementation
- Still used but should be migrated away
- Add `@deprecated` JSDoc comment

**DELETE if:**
- 100% confirmed unused
- Replaced and ALL references updated
- Test file for removed feature
- Temporary/debugging code

---

## Manual Review Required

The following items require manual review because automated analysis is insufficient:

1. **usePropertyFilters** - May be utility hook for future features
2. **LegacyPropertyCard** - Might be used in PDF exports (check PDF generation code)
3. **Old calculation utilities** - Verify all references updated to new consolidated version

---

## Consolidated Code Benefits

**Before consolidation:**
- 3 different MAO calculation implementations
- Inconsistent formulas (70% vs 65% vs 75% rules)
- Hard to maintain (bug fix in one, miss others)

**After consolidation:**
- 1 single source of truth
- Consistent formulas with configurable margins
- Easy to maintain and test
- Clear deprecation path for old code

---

## Questions?

Ping @tech-lead in #engineering Slack for clarification.
```

---

### 3.2 Create GitHub Issues Template

**For each flagged item, create GitHub issue:**

**Title:** `[Code Cleanup] Review usePropertyFilters hook`

**Body:**
```markdown
## Overview
The `usePropertyFilters` hook in `src/features/real-estate/hooks/usePropertyFilters.ts` has no direct references in the codebase.

## Analysis
- **Location:** src/features/real-estate/hooks/usePropertyFilters.ts
- **Type:** Custom React hook
- **Direct references:** 0
- **Exports:** Yes (exported from hooks/index.ts)

## Questions
1. Is this a utility hook intended for future use?
2. Is it part of the public API?
3. Should it be kept for backward compatibility?

## Options
- [ ] KEEP - It's a reusable utility (add JSDoc comment to clarify)
- [ ] DEPRECATE - Mark as deprecated, migrate users
- [ ] DELETE - Confirmed unused and not needed

## Decision
⏳ Awaiting team review

## Next Steps
- [ ] Team member reviews
- [ ] Decision made
- [ ] Changes implemented (if any)
- [ ] Issue closed

**Labels:** `code-cleanup`, `needs-review`
```

---

## Step 4: Consolidate Duplicate Code

### 4.1 MAO Calculators

**Find all implementations:**
```bash
grep -r "function calculateMAO\|export.*calculateMAO" src
```

**Consolidate to:** `src/lib/calculations/maoCalculator.ts`

**Update references:**
```bash
# Find all imports of old MAO calculators
grep -r "import.*maoCalc\|import.*calculateMAO" src --include="*.ts" --include="*.tsx"

# Replace with new import
# BEFORE: import { calculateMAO } from '../utils/maoCalc';
# AFTER:  import { calculateMAO } from '@/lib/calculations/maoCalculator';
```

**Add deprecation comment to old files:**
```typescript
/**
 * @deprecated Use @/lib/calculations/maoCalculator instead
 * This file is kept for backward compatibility only.
 * Will be removed in v2.0.0
 *
 * Migration guide:
 * import { calculateMAO } from '@/lib/calculations/maoCalculator';
 */
```

---

### 4.2 ARV Calculators

Same process as MAO calculators.

---

### 4.3 Cash Flow Calculators

Same process as MAO calculators.

---

## Deliverables

- [ ] `scripts/find-unused-hooks.sh` created and run
- [ ] `scripts/find-unused-components.sh` created and run
- [ ] `analysis/unused-hooks.txt` generated
- [ ] `analysis/unused-components.txt` generated
- [ ] `docs/DEPRECATED_CODE.md` created with ALL findings
- [ ] Deprecated migrations moved to `_archived/`
- [ ] `_archived/README.md` created
- [ ] GitHub issues created for each flagged item (~10-15 issues)
- [ ] Duplicate code consolidated (MAO, ARV, cash flow calculators)
- [ ] Old implementations marked with `@deprecated` JSDoc

---

## Testing Checklist

- [ ] Migrations still run correctly after archiving ROLLBACKs
- [ ] Consolidated MAO calculator produces same results as old implementations
- [ ] All references to old calculators updated
- [ ] No broken imports after consolidation
- [ ] App builds and runs without errors

---

## Coordination with Other Zones

**Independent:** Can run in parallel with all other zones

**Synergy with Zone F:** If unused code is in files that Zone F updates, coordinate to avoid conflicts

**Communication:** Post analysis results in #engineering Slack for team review
