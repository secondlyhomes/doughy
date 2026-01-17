# Phase 2 Implementation Plan: AI Assistant + Deal Timeline

**Last Updated:** 2026-01-13
**Related Documentation:** [AI_ASSISTANT.md](./AI_ASSISTANT.md) - Zone A implementation complete, [ZONES_ARCHIVE.md](./ZONES_ARCHIVE.md) - Historical zone integration archive

## Zone A/Zone B Parallel Development

This plan is split for two developers to work simultaneously without conflicts.

- **Zone A (Claude):** Assistant UI, Context System, PatchSet, Actions ✅ **Complete**
- **Zone B (Other Dev):** Database, Timeline, Events, Focus Mode

---

## CRITICAL: What Already Exists (DO NOT REMAKE)

### Assistant Foundation (Reuse)
- `src/features/public/components/SimpleAssistant.tsx` - Draggable floating bubble with OpenAI
- `src/components/ui/BottomSheet.tsx` - Snap points, glass effects, keyboard handling
- `src/lib/openai.ts` - OpenAI integration with auth tokens
- `src/features/assistant/hooks/useChat.ts` - Message state management
- `src/features/assistant/components/MessageBubble.tsx` - Chat bubbles
- `src/features/assistant/components/SuggestionChips.tsx` - Quick action chips

### Deal Infrastructure (Reuse)
- `src/features/deals/screens/DealCockpitScreen.tsx` - Stage, next action, metrics cards
- `src/features/deals/hooks/useNextAction.ts` - Rule-based NBA engine
- `src/features/deals/hooks/useDeals.ts` - CRUD for deals
- `src/features/deals/types/index.ts` - Deal types, DealEvidence interface

### Property Underwriting (Reuse for Deals)
- `src/features/real-estate/hooks/useDealAnalysis.ts` - MAO, profit, ROI, cap rate
- `src/features/real-estate/hooks/useFinancingScenarios.ts` - Multi-scenario management
- `src/features/real-estate/hooks/useRepairEstimate.ts` - Repair tracking
- `src/features/real-estate/hooks/useComps.ts` - ARV calculation
- `src/features/real-estate/components/CashFlowAnalysis.tsx` - Rental analysis UI
- `src/features/real-estate/components/ARVCalculator.tsx` - Visual ARV component

### Timeline Template (Copy Pattern)
- `src/features/leads/components/LeadTimeline.tsx` - Event rendering with icons/timestamps
- `src/features/leads/components/AddActivitySheet.tsx` - Activity logging form

### Utilities (Reuse)
- `src/utils/format.ts` - formatCurrency, formatRelativeTime, formatPercentage
- `src/utils/colors.ts` - getStatusColor, getActivityColor
- `src/utils/eventEmitter.ts` - SimpleEventEmitter for broadcasting
- `src/features/real-estate/hooks/useFinancingForm.ts` - Form state pattern

---

## Shared Contracts (AGREE FIRST)

Before starting, both zones need these interfaces finalized. Create these type files first:

### `src/features/deals/types/events.ts`
```typescript
export type DealEventType =
  | 'stage_change'
  | 'next_action_set'
  | 'offer_created'
  | 'offer_sent'
  | 'offer_countered'
  | 'walkthrough_started'
  | 'walkthrough_completed'
  | 'assumption_updated'
  | 'seller_report_generated'
  | 'document_uploaded'
  | 'document_signed'
  | 'risk_score_changed'
  | 'note'
  | 'ai_action_applied'
  | 'ai_job_completed';

export interface DealEvent {
  id: string;
  deal_id: string;
  event_type: DealEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  source: 'system' | 'user' | 'ai';
  created_by?: string;
  created_at: string;
}
```

### `src/features/assistant/types/context.ts`
```typescript
export interface AssistantContextSnapshot {
  app: { version: string; platform: 'ios' | 'android' | 'web' };
  user: { id: string; plan: 'starter' | 'pro' | 'elite'; timezone: string };
  screen: { name: string; route: string };
  permissions: { canWrite: boolean; canSendForESign: boolean };
  focusMode: boolean;
  selection: { dealId?: string; leadId?: string; propertyId?: string };
  summary: { oneLiner: string; lastUpdated: string };
  payload: Record<string, unknown>;
}
```

### `src/features/assistant/types/patchset.ts`
```typescript
import { DealEventType } from '../../deals/types/events';

export interface PatchSet {
  patchSetId: string;
  summary: string;
  confidence: 'high' | 'med' | 'low';
  ops: PatchOperation[];
  willCreateTimelineEvents: { type: DealEventType; title: string }[];
}

export interface PatchOperation {
  op: 'create' | 'update' | 'delete';
  entity: string;  // 'DealAssumption', 'DealOffer', etc.
  id?: string;
  before?: Record<string, unknown>;
  after: Record<string, unknown>;
  rationale: string;
  source?: string;  // Link to evidence (event ID, doc ID)
}
```

### `src/features/assistant/types/jobs.ts`
```typescript
export interface AIJob {
  id: string;
  deal_id: string;
  job_type: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress: number;
  input_json?: Record<string, unknown>;
  result_json?: Record<string, unknown>;
  result_artifact_ids?: string[];
  error_message?: string;
  created_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}
```

---

## ZONE A (Claude) - Assistant & AI System

### Files to Create/Modify

```
ZONE A OWNERSHIP:
├── src/features/assistant/
│   ├── types/
│   │   ├── context.ts          (NEW)
│   │   ├── patchset.ts         (NEW)
│   │   └── jobs.ts             (NEW)
│   ├── hooks/
│   │   ├── useAssistantContext.ts  (NEW)
│   │   ├── useApplyPatchSet.ts     (NEW)
│   │   └── useAIJobs.ts            (NEW - frontend only)
│   ├── components/
│   │   ├── ActionsTab.tsx      (NEW)
│   │   ├── AskTab.tsx          (NEW)
│   │   ├── JobsTab.tsx         (NEW)
│   │   └── PatchSetPreview.tsx (NEW)
│   ├── actions/
│   │   ├── catalog.ts          (NEW)
│   │   └── handlers/           (NEW - 12 action handlers)
│   └── context/
│       └── payloads/           (NEW - per-screen payload generators)
└── src/features/public/components/
    └── SimpleAssistant.tsx     (MODIFY - major refactor)
```

### Task A1: Assistant Context System

**Goal:** Provide structured context to AI without HTML scraping.

1. Create `src/features/assistant/types/context.ts` with interfaces
2. Create `src/features/assistant/hooks/useAssistantContext.ts`:
   - Read current route via expo-router's `usePathname()` and `useLocalSearchParams()`
   - Pull deal/property/lead from existing hooks based on route params
   - Call screen-specific payload function
   - Return complete snapshot
3. Create payload generators in `src/features/assistant/context/payloads/`:
   - `dealCockpitPayload.ts` - stage, nextAction, numbers (MAO/Profit/Risk), missingInfo, recentEvents
   - `underwritePayload.ts` - assumptions, scenario outputs, deltas since last run
   - `offerBuilderPayload.ts` - current terms, last offer, seller pain points, strategy
   - `fieldModePayload.ts` - capture progress, last transcript snippet, missing shots
   - `propertyDetailPayload.ts` - property data, analysis metrics, financing scenarios

**Reuse:** `useNextAction`, `useDealAnalysis`, existing deal/property hooks

### Task A2: Enhanced Assistant UI

**Goal:** Transform SimpleAssistant into 3-tab interface.

1. Refactor `SimpleAssistant.tsx`:
   - Keep floating bubble + drag behavior (existing code)
   - Replace single chat view with tabbed BottomSheet
   - Add tab state: `'actions' | 'ask' | 'jobs'`
   - Badge count from AIJobs hook (pending jobs)

2. Create `ActionsTab.tsx`:
   - Fetch recommended actions from `useNextAction` + AI suggestions
   - Each action shows: label, rationale, confidence badge
   - Tap → PatchSetPreview modal
   - Quick action buttons for common operations

3. Create `AskTab.tsx`:
   - Chat interface (reuse existing MessageBubble, input from AssistantScreen)
   - Pass context snapshot with each message to OpenAI
   - Short responses + structured cards (not long text dumps)

4. Create `JobsTab.tsx`:
   - List AIJobs for current deal from `useAIJobs`
   - Status indicators: queued (gray), running (blue pulse), succeeded (green), failed (red)
   - Progress bar animation for running jobs
   - Tap completed job → view results/artifacts

**Reuse:** `BottomSheet`, `MessageBubble`, `SuggestionChips`, `useChat`

### Task A3: PatchSet System

**Goal:** AI proposes changes, user previews and approves.

1. Create `src/features/assistant/types/patchset.ts` (see shared contracts above)

2. Create `PatchSetPreview.tsx`:
   - Modal showing "What will change" (before/after diff)
   - "Why" section (rationale from PatchOperation)
   - "Source" section (link to timeline event or doc that justifies change)
   - Buttons: Apply (green), Edit (blue), Cancel (gray)
   - Uses BottomSheet with snap points

3. Create `useApplyPatchSet.ts`:
   - Takes approved PatchSet
   - Executes mutations via Supabase (maps entity names to tables)
   - Calls Zone B's `logEvent()` for audit trail with `source: 'ai'`
   - Returns updated entities

**Reuse:** `useFinancingForm` pattern for form state management

### Task A4: Action Catalog (12 Actions)

**Goal:** Define high-value actions AI can propose.

Create `src/features/assistant/actions/catalog.ts`:
```typescript
export type ActionId =
  | 'update_stage' | 'set_next_action' | 'create_task' | 'add_note'
  | 'summarize_event' | 'extract_facts' | 'run_underwrite_check'
  | 'update_assumption' | 'generate_seller_report' | 'generate_offer_packet'
  | 'draft_counter_text' | 'prepare_esign_envelope';

export interface ActionDefinition {
  id: ActionId;
  label: string;
  description: string;
  category: 'deal' | 'underwrite' | 'offer' | 'docs';
  requiresConfirmation: boolean;
  isLongRunning: boolean;  // Creates AIJob instead of immediate PatchSet
}

export const ACTION_CATALOG: Record<ActionId, ActionDefinition> = {
  // Deal-level
  update_stage: { id: 'update_stage', label: 'Update Stage', ... },
  set_next_action: { id: 'set_next_action', label: 'Set Next Action', ... },
  create_task: { id: 'create_task', label: 'Create Task', ... },
  add_note: { id: 'add_note', label: 'Add Note', ... },
  summarize_event: { id: 'summarize_event', label: 'Summarize Event', ... },
  extract_facts: { id: 'extract_facts', label: 'Extract Facts', ... },

  // Underwrite/Offer
  run_underwrite_check: { id: 'run_underwrite_check', label: 'Run Underwrite Check', ... },
  update_assumption: { id: 'update_assumption', label: 'Update Assumption', ... },
  generate_seller_report: { id: 'generate_seller_report', label: 'Generate Seller Report', isLongRunning: true, ... },
  generate_offer_packet: { id: 'generate_offer_packet', label: 'Generate Offer Packet', isLongRunning: true, ... },
  draft_counter_text: { id: 'draft_counter_text', label: 'Draft Counter', ... },

  // Docs/Closing
  prepare_esign_envelope: { id: 'prepare_esign_envelope', label: 'Prepare E-Sign', isLongRunning: true, ... },
};
```

Create handlers in `src/features/assistant/actions/handlers/`:
- `updateStageHandler.ts` - Returns PatchSet to change deal.stage
- `updateAssumptionHandler.ts` - Returns PatchSet to change assumption values
- `generateSellerReportHandler.ts` - Creates AIJob, returns job ID
- etc.

### Task A5: AI Jobs Frontend

**Goal:** Show job status in assistant UI.

1. Create `src/features/assistant/types/jobs.ts` (see shared contracts)

2. Create `useAIJobs.ts`:
   ```typescript
   export function useAIJobs(dealId?: string) {
     const { data: jobs } = useQuery({
       queryKey: ['ai-jobs', dealId],
       queryFn: () => supabase.from('ai_jobs').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }),
       enabled: !!dealId,
       refetchInterval: 5000,  // Poll for updates (or use realtime)
     });

     const createJob = useMutation({
       mutationFn: (job: Omit<AIJob, 'id' | 'created_at'>) =>
         supabase.from('ai_jobs').insert(job).select().single(),
       onSuccess: () => queryClient.invalidateQueries(['ai-jobs', dealId]),
     });

     const pendingCount = jobs?.filter(j => j.status === 'queued' || j.status === 'running').length || 0;

     return { jobs, createJob, pendingCount };
   }
   ```

3. Integrate into JobsTab.tsx (from Task A2)

**Dependency:** Zone B must create `ai_jobs` table first (Task B1)

---

## ZONE B (Other Dev) - Data Layer & Timeline

### Files to Create/Modify

```
ZONE B OWNERSHIP:
├── supabase/migrations/
│   ├── 20260113_create_deal_events.sql   (NEW)
│   └── 20260113_create_ai_jobs.sql       (NEW)
├── src/features/deals/
│   ├── types/
│   │   └── events.ts                (NEW - shared contract)
│   ├── hooks/
│   │   ├── useDealEvents.ts         (NEW)
│   │   └── useDeals.ts              (MODIFY - add auto-event triggers)
│   └── components/
│       ├── DealTimeline.tsx         (NEW)
│       └── AddDealEventSheet.tsx    (NEW)
├── src/features/deals/screens/
│   └── DealCockpitScreen.tsx        (MODIFY - add Timeline + Focus Mode)
└── src/features/settings/screens/
    └── SettingsScreen.tsx           (MODIFY - Focus Mode preference)
```

### Task B1: Database Migrations (DO THIS FIRST)

**Goal:** Create tables for events and jobs. This unblocks Zone A Task A5.

1. Create `supabase/migrations/20260113_create_deal_events.sql`:
```sql
-- Deal Events table for timeline
create table if not exists deal_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  metadata jsonb default '{}',
  source text not null default 'system' check (source in ('system', 'user', 'ai')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_deal_events_deal_id on deal_events(deal_id);
create index if not exists idx_deal_events_created_at on deal_events(created_at desc);
create index if not exists idx_deal_events_type on deal_events(event_type);

-- RLS policies
alter table deal_events enable row level security;

create policy "Users can view events for deals they own"
  on deal_events for select
  using (
    exists (
      select 1 from deals
      where deals.id = deal_events.deal_id
      and deals.user_id = auth.uid()
    )
  );

create policy "Users can insert events for deals they own"
  on deal_events for insert
  with check (
    exists (
      select 1 from deals
      where deals.id = deal_events.deal_id
      and deals.user_id = auth.uid()
    )
  );
```

2. Create `supabase/migrations/20260113_create_ai_jobs.sql`:
```sql
-- AI Jobs table for background processing
create table if not exists ai_jobs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  input_json jsonb default '{}',
  result_json jsonb default '{}',
  result_artifact_ids text[] default '{}',
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Indexes
create index if not exists idx_ai_jobs_deal_id on ai_jobs(deal_id);
create index if not exists idx_ai_jobs_status on ai_jobs(status);
create index if not exists idx_ai_jobs_created_at on ai_jobs(created_at desc);

-- RLS policies
alter table ai_jobs enable row level security;

create policy "Users can view jobs for deals they own"
  on ai_jobs for select
  using (
    deal_id is null or exists (
      select 1 from deals
      where deals.id = ai_jobs.deal_id
      and deals.user_id = auth.uid()
    )
  );

create policy "Users can insert jobs for deals they own"
  on ai_jobs for insert
  with check (
    deal_id is null or exists (
      select 1 from deals
      where deals.id = ai_jobs.deal_id
      and deals.user_id = auth.uid()
    )
  );

create policy "Users can update jobs for deals they own"
  on ai_jobs for update
  using (
    deal_id is null or exists (
      select 1 from deals
      where deals.id = ai_jobs.deal_id
      and deals.user_id = auth.uid()
    )
  );
```

3. Run migrations:
```bash
npx supabase db push
# or
npx supabase migration up
```

4. Regenerate types:
```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Task B2: Deal Events Hook

**Goal:** CRUD + auto-logging for timeline events.

Create `src/features/deals/hooks/useDealEvents.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DealEvent, DealEventType } from '../types/events';

export function useDealEvents(dealId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch events for a deal
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['deal-events', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from('deal_events')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DealEvent[];
    },
    enabled: !!dealId,
  });

  // Log a new event
  const logEvent = useMutation({
    mutationFn: async (event: {
      deal_id: string;
      event_type: DealEventType;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
      source?: 'system' | 'user' | 'ai';
    }) => {
      const { data, error } = await supabase
        .from('deal_events')
        .insert({
          ...event,
          source: event.source || 'system',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
    },
  });

  // Filter for key events only (for Focus Mode)
  const keyEvents = events?.filter(e =>
    ['stage_change', 'offer_sent', 'offer_countered', 'walkthrough_completed', 'seller_report_generated', 'document_signed'].includes(e.event_type)
  );

  return {
    events,
    keyEvents,
    isLoading,
    error,
    logEvent
  };
}
```

**Reuse:** Pattern from `useLeads.ts`, `useDeals.ts`

### Task B3: Auto-Event Triggers

**Goal:** Auto-log events when deal state changes.

Modify `src/features/deals/hooks/useDeals.ts` to wrap mutations:

```typescript
// Add import
import { useDealEvents } from './useDealEvents';

// Inside useDeals hook or as a separate wrapper hook
export function useDealsWithEvents() {
  const deals = useDeals();

  const updateDealWithEvents = async (
    dealId: string,
    updates: Partial<Deal>,
    oldDeal: Deal
  ) => {
    // Perform the actual update
    const result = await deals.updateDeal.mutateAsync({ id: dealId, ...updates });

    // Auto-log stage change
    if (updates.stage && updates.stage !== oldDeal.stage) {
      await supabase.from('deal_events').insert({
        deal_id: dealId,
        event_type: 'stage_change',
        title: `Stage changed to ${DEAL_STAGE_CONFIG[updates.stage].label}`,
        metadata: {
          from: oldDeal.stage,
          to: updates.stage,
          from_label: DEAL_STAGE_CONFIG[oldDeal.stage].label,
          to_label: DEAL_STAGE_CONFIG[updates.stage].label,
        },
        source: 'system',
      });
    }

    // Auto-log next action change
    if (updates.next_action && updates.next_action !== oldDeal.next_action) {
      await supabase.from('deal_events').insert({
        deal_id: dealId,
        event_type: 'next_action_set',
        title: updates.next_action,
        metadata: { previous: oldDeal.next_action },
        source: 'user',
      });
    }

    // Auto-log risk score change
    if (updates.risk_score !== undefined && updates.risk_score !== oldDeal.risk_score) {
      await supabase.from('deal_events').insert({
        deal_id: dealId,
        event_type: 'risk_score_changed',
        title: `Risk score updated to ${updates.risk_score}`,
        metadata: { from: oldDeal.risk_score, to: updates.risk_score },
        source: 'system',
      });
    }

    return result;
  };

  return {
    ...deals,
    updateDealWithEvents,
  };
}
```

Also add triggers for:
- `createOffer()` → logs `offer_created`
- `sendOffer()` → logs `offer_sent`
- `startWalkthrough()` → logs `walkthrough_started`
- `completeWalkthrough()` → logs `walkthrough_completed`
- `generateSellerReport()` → logs `seller_report_generated`
- `uploadDocument()` → logs `document_uploaded`

### Task B4: DealTimeline Component

**Goal:** Visual timeline in Deal Cockpit.

Create `src/features/deals/components/DealTimeline.tsx`:
```typescript
// Copy pattern from src/features/leads/components/LeadTimeline.tsx
// Key adaptations:
// 1. Use DealEvent instead of LeadActivity
// 2. Map DealEventType to icons (use Lucide icons)
// 3. Use formatRelativeTime from utils/format.ts
// 4. Add "keyEventsOnly" prop for Focus Mode filtering
// 5. Add "Add note" button that opens AddDealEventSheet

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useDealEvents } from '../hooks/useDealEvents';
import { formatRelativeTime } from '@/utils/format';
import { getActivityColor } from '@/utils/colors';
import { useThemeColors } from '@/context/ThemeContext';
// ... icon imports

interface DealTimelineProps {
  dealId: string;
  keyEventsOnly?: boolean;
  maxEvents?: number;
}

export function DealTimeline({ dealId, keyEventsOnly = false, maxEvents }: DealTimelineProps) {
  const colors = useThemeColors();
  const { events, keyEvents, isLoading } = useDealEvents(dealId);

  const displayEvents = keyEventsOnly ? keyEvents : events;
  const limitedEvents = maxEvents ? displayEvents?.slice(0, maxEvents) : displayEvents;

  // ... render timeline UI similar to LeadTimeline
}
```

Create `src/features/deals/components/AddDealEventSheet.tsx`:
```typescript
// Copy pattern from src/features/leads/components/AddActivitySheet.tsx
// Adapt for DealEventType (note, call, email, meeting)
```

**Reuse:** `LeadTimeline.tsx`, `AddActivitySheet.tsx`, `formatRelativeTime`, `getActivityColor`

### Task B5: Focus Mode

**Goal:** Reduce cognitive load toggle.

1. Add to `DealCockpitScreen.tsx`:
```typescript
// Add state
const [focusMode, setFocusMode] = useState(false);

// Add toggle in header
<TouchableOpacity onPress={() => setFocusMode(!focusMode)}>
  <Text>{focusMode ? 'Show All' : 'Focus'}</Text>
</TouchableOpacity>

// Conditionally render based on focusMode
{focusMode ? (
  // Minimal view: NextAction card + 3 numbers + Timeline (key events only)
) : (
  // Full view: all cards
)}

// Pass to timeline
<DealTimeline dealId={dealId} keyEventsOnly={focusMode} />
```

2. Add to `SettingsScreen.tsx`:
```typescript
// Add section for "Deal Preferences"
// Toggle for "Default to Focus Mode"
// Store in AsyncStorage: await AsyncStorage.setItem('focusMode', 'true')
```

3. Load preference on mount:
```typescript
useEffect(() => {
  AsyncStorage.getItem('focusMode').then(value => {
    if (value === 'true') setFocusMode(true);
  });
}, []);
```

**Reuse:** `useTheme` pattern for AsyncStorage preference

---

## Integration Points (Where Zones Connect)

| Zone A Needs | Zone B Provides |
|--------------|-----------------|
| `useAIJobs` reads from | `ai_jobs` table (Task B1) |
| `useApplyPatchSet` calls | `logEvent()` from `useDealEvents` (Task B2) |
| ActionsTab displays | NBA from `useNextAction` (existing) |
| Context payloads read | Deal events from `useDealEvents` (Task B2) |

| Zone B Needs | Zone A Provides |
|--------------|-----------------|
| Timeline shows | `ai_action_applied` events (from Zone A's `useApplyPatchSet`) |
| `ai_jobs` table populated by | Zone A's action handlers (Task A4) |

---

## Sequence & Dependencies

```
PHASE 1 - Foundation (Can Start Parallel)
├── Zone A: Task A1 (Context types + hook)
└── Zone B: Task B1 (Database migrations) ← BLOCKER for Zone A Task A5

PHASE 2 - Core Features (After Phase 1)
├── Zone A: Task A2 (Assistant UI refactor)
├── Zone A: Task A3 (PatchSet system)
├── Zone B: Task B2 (useDealEvents hook)
└── Zone B: Task B4 (DealTimeline component)

PHASE 3 - Integration (After Phase 2)
├── Zone A: Task A4 (Action catalog + handlers)
├── Zone A: Task A5 (AI Jobs frontend) ← needs B1 done
├── Zone B: Task B3 (Auto-event triggers)
└── Zone B: Task B5 (Focus Mode)

PHASE 4 - Polish
├── Both: Integration testing
└── Both: Edge case handling
```

---

## Verification Checklist

### Zone A Verification
- [ ] Open assistant on DealCockpit, verify context includes deal stage, next action, numbers
- [ ] Switch screens, verify context updates automatically
- [ ] Tap an action in ActionsTab, verify PatchSetPreview modal appears
- [ ] Apply a patch, verify entities update in database
- [ ] Verify timeline event logged with `source: 'ai'`
- [ ] Trigger a long-running action, verify job appears in JobsTab
- [ ] Verify job progress updates, completion shows results

### Zone B Verification
- [ ] Create a deal, verify `deal_created` event not needed (or add if wanted)
- [ ] Change deal stage, verify `stage_change` event in timeline
- [ ] Set next action, verify `next_action_set` event
- [ ] Manually add note via AddDealEventSheet, verify in timeline
- [ ] Toggle Focus Mode ON, verify cards collapse and timeline filters
- [ ] Toggle Focus Mode OFF, verify full view returns
- [ ] Set default Focus Mode in Settings, verify persists across app restart

### Integration Verification
- [ ] Zone A applies patch → Zone B timeline shows `ai_action_applied` event
- [ ] Zone B auto-logs event → Zone A context snapshot includes it in `recentEvents`
- [ ] Zone A creates AIJob → Zone B can see job in `ai_jobs` table
- [ ] Zone A job completes → Zone B timeline shows `ai_job_completed` event

---

## Questions / Sync Points

If either zone needs clarification, coordinate before proceeding:

1. **Event metadata schema** - What fields should each event type include in `metadata`?
2. **Focus Mode behavior** - Exact list of cards to show/hide?
3. **Job types** - Which actions create jobs vs immediate patches?
4. **Permissions** - How to check `canWrite`, `canSendForESign` in context?
