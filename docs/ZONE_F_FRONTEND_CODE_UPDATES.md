# Zone F: Frontend Code Updates for Table Renames

**Owner:** Frontend Developer
**Timeline:** Weeks 3-4
**Dependencies:** Zone E must complete first (database migration)
**Risk Level:** HIGH (touches ~150-200 files)

---

## Mission

Update all TypeScript code to reference renamed database tables, regenerate types, update React Query cache keys, and ensure zero breaking changes to application functionality.

---

## Prerequisites

✅ Zone E completed (all 22 tables renamed in database)
✅ Staging Supabase project updated with new schema
✅ Can access staging to regenerate types

---

## Step 1: Regenerate Supabase Types

```bash
# Connect to staging project
npx supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts

# Verify new types exist
grep "re_pipeline" src/integrations/supabase/types.ts
grep "crm_leads" src/integrations/supabase/types.ts
grep "user_profiles" src/integrations/supabase/types.ts
```

**Deliverable:** `src/integrations/supabase/types.ts` updated with all 22 new table names

---

## Step 2: Search & Replace Strategy

### Table Rename Impact Analysis

| Table Rename | Estimated Files | Priority |
|--------------|----------------|----------|
| `deals` → `re_pipeline` | ~50 files | HIGH |
| `leads` → `crm_leads` | ~30 files | HIGH |
| `profiles` → `user_profiles` | ~15 files | MEDIUM |
| `transcripts` → `call_transcripts` | ~10 files | MEDIUM |
| `messages` → `comms_messages` | ~8 files | LOW |
| All others | ~2-5 files each | LOW |

**Total:** ~150-200 files

---

## Step 3: Update PRIMARY Table: `deals` → `re_pipeline`

### 3.1 Find All References

```bash
# Search for .from('deals')
grep -r "\.from('deals')" src --include="*.ts" --include="*.tsx"

# Search for .from(\"deals\")
grep -r '\.from("deals")' src --include="*.ts" --include="*.tsx"

# Search for .from(`deals`)
grep -r '\.from(`deals`)' src --include="*.ts" --include="*.tsx"

# Save results
grep -r "\.from.*deals" src --include="*.ts" --include="*.tsx" > /tmp/deals_references.txt
```

### 3.2 Files to Update

**Hooks** (`src/features/deals/hooks/`):
- [ ] `useDeals.ts`
- [ ] `useDealEvents.ts`
- [ ] `useNextAction.ts`
- [ ] `usePropertyDeals.ts`
- [ ] `useDealProperties.ts` (NEW - create this)

**Update Pattern:**
```typescript
// BEFORE
const { data } = await supabase.from('deals').select('*');
const { data } = await supabase.from('deal_events').select('*');

// AFTER
const { data } = await supabase.from('re_pipeline').select('*');
const { data } = await supabase.from('re_pipeline_events').select('*');
```

### 3.3 React Query Keys Decision

**Option A:** Update all query keys (breaking change)
```typescript
// BEFORE
queryKey: ['deals']
queryKey: ['deal', dealId]

// AFTER
queryKey: ['re_pipeline']
queryKey: ['re_pipeline', pipelineId]
```

**Option B:** Keep semantic query keys (RECOMMENDED)
```typescript
// Keep existing query keys for semantics
queryKey: ['deals']
queryKey: ['deal', dealId]

// But update .from() calls
.from('re_pipeline')
```

**Decision:** Go with Option B to minimize breaking changes

### 3.4 New Hook: `usePipelineProperties`

Create: `src/features/deals/hooks/usePipelineProperties.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePipelineProperties(pipelineId: string) {
  return useQuery({
    queryKey: ['pipeline-properties', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_pipeline_properties')
        .select(`
          *,
          property:re_properties(*)
        `)
        .eq('pipeline_id', pipelineId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!pipelineId,
  });
}

export function useAddPropertyToPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pipelineId,
      propertyId,
      isPrimary = false,
      displayOrder = 0,
    }: {
      pipelineId: string;
      propertyId: string;
      isPrimary?: boolean;
      displayOrder?: number;
    }) => {
      const { data, error } = await supabase
        .from('re_pipeline_properties')
        .insert({
          pipeline_id: pipelineId,
          property_id: propertyId,
          is_primary: isPrimary,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-properties', variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useRemovePropertyFromPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pipelineId,
      propertyId,
    }: {
      pipelineId: string;
      propertyId: string;
    }) => {
      const { error } = await supabase
        .from('re_pipeline_properties')
        .delete()
        .eq('pipeline_id', pipelineId)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-properties', variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useSetPrimaryProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pipelineId,
      propertyId,
    }: {
      pipelineId: string;
      propertyId: string;
    }) => {
      // First, unset all primary flags
      await supabase
        .from('re_pipeline_properties')
        .update({ is_primary: false })
        .eq('pipeline_id', pipelineId);

      // Then set new primary
      const { error } = await supabase
        .from('re_pipeline_properties')
        .update({ is_primary: true })
        .eq('pipeline_id', pipelineId)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-properties', variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.pipelineId] });
    },
  });
}
```

---

## Step 4: Update CRM Tables (leads, contacts, calls, etc.)

### 4.1 `leads` → `crm_leads`

```bash
# Find references
grep -r "\.from.*leads" src/features/leads --include="*.ts" --include="*.tsx"
```

**Files to update:**
- [ ] `src/features/leads/hooks/useLeads.ts`
- [ ] `src/features/leads/hooks/useLeadMutations.ts`
- [ ] `src/features/leads/hooks/useLeadDocuments.ts`
- [ ] Any other lead-related hooks

**Update pattern:**
```typescript
// BEFORE
.from('leads')
.from('lead_contacts')
.from('lead_notes')

// AFTER
.from('crm_leads')
.from('crm_lead_contacts')
.from('crm_lead_notes')
```

### 4.2 `contacts` → `crm_contacts`

```bash
grep -r "\.from.*contacts" src --include="*.ts" --include="*.tsx"
```

### 4.3 `calls` → `call_logs`

```bash
grep -r "\.from.*calls" src --include="*.ts" --include="*.tsx"
```

---

## Step 5: Update Other Tables (Low Impact)

### 5.1 `profiles` → `user_profiles`

```bash
grep -r "\.from.*profiles" src --include="*.ts" --include="*.tsx"
```

**Common locations:**
- Auth hooks
- Profile screen
- User settings

### 5.2 `transcripts` → `call_transcripts`

```bash
grep -r "\.from.*transcripts" src --include="*.ts" --include="*.tsx"
```

### 5.3 `messages` → `comms_messages`

```bash
grep -r "\.from.*messages" src --include="*.ts" --include="*.tsx"
```

### 5.4 `ai_jobs` → `assistant_jobs`

```bash
grep -r "\.from.*ai_jobs" src --include="*.ts" --include="*.tsx"
```

---

## Step 6: Update Type Imports

### 6.1 Deal Types

**File:** `src/features/deals/types/index.ts`

```typescript
// Add helper functions
export const getPrimaryProperty = (deal: Deal): Property | undefined => {
  if (deal.properties && deal.properties.length > 0) {
    return deal.properties.find((p: any) => p.is_primary) || deal.properties[0];
  }
  return deal.property; // Fallback to legacy
};

export const getAllProperties = (deal: Deal): Property[] => {
  if (deal.properties && deal.properties.length > 0) {
    return deal.properties;
  }
  return deal.property ? [deal.property] : [];
};

// Add new interface for junction table
export interface PipelineProperty {
  pipeline_id: string;
  property_id: string;
  is_primary: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  property?: Property;
}
```

---

## Step 7: Testing Strategy

### 7.1 Unit Tests

Create/update tests for all hooks:

```typescript
// src/features/deals/hooks/__tests__/usePipelineProperties.test.ts
describe('usePipelineProperties', () => {
  test('fetches all properties for a pipeline', async () => {
    // Test implementation
  });

  test('adds property to pipeline', async () => {
    // Test implementation
  });

  test('sets primary property', async () => {
    // Test implementation
  });

  test('enforces only one primary property', async () => {
    // Test implementation
  });
});
```

### 7.2 Integration Tests

Test actual database queries:

```typescript
test('pipeline query uses correct table name', async () => {
  const { data } = await supabase.from('re_pipeline').select('*').limit(1);
  expect(data).toBeDefined();
});

test('junction table query works', async () => {
  const { data } = await supabase
    .from('re_pipeline_properties')
    .select('*, property:re_properties(*)')
    .limit(1);
  expect(data).toBeDefined();
});
```

---

## Step 8: Manual Testing Checklist

Test in staging environment:

- [ ] View deals list (queries re_pipeline)
- [ ] View single deal (queries re_pipeline)
- [ ] Create new deal (inserts to re_pipeline)
- [ ] Update deal (updates re_pipeline)
- [ ] Delete deal (deletes from re_pipeline)
- [ ] View leads list (queries crm_leads)
- [ ] Create new lead (inserts to crm_leads)
- [ ] View profile (queries user_profiles)
- [ ] View transcripts (queries call_transcripts)
- [ ] View messages (queries comms_messages)
- [ ] **Package deal:** Add multiple properties to deal (re_pipeline_properties)
- [ ] **Package deal:** Set primary property
- [ ] **Package deal:** Remove property from deal
- [ ] **Package deal:** View all properties for deal

---

## Deliverables

- [ ] All `.from()` calls updated for 22 tables
- [ ] New hook: `usePipelineProperties.ts`
- [ ] Updated `useDeals.ts` to fetch from junction table
- [ ] Regenerated TypeScript types
- [ ] Unit tests passing for all updated hooks
- [ ] Integration tests passing
- [ ] Manual testing checklist completed
- [ ] No console errors in app
- [ ] No breaking changes to existing functionality

---

## Rollback Strategy

If issues found:

1. Revert all code changes (git revert)
2. Zone E can keep database migration (code will fall back to legacy fields)
3. Junction table remains but unused (harmless)
4. Investigate issues in local environment
5. Re-deploy after fixes

---

## Coordination with Other Zones

**Depends on Zone E:** Can't start until database migration complete
**Blocks Zone G:** UX improvements depend on new hooks working
**Parallel with Zone H:** Code cleanup can happen in parallel

**Communication:** Post progress updates in #engineering Slack
