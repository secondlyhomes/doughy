# Zone G: UX Improvements - Code Review Document

**Author:** Claude
**Date:** January 16, 2026
**Scope:** Weeks 6-9 (Full Zone G)
**Status:** Ready for Review

---

## Executive Summary

Zone G implements comprehensive UX improvements across 4 areas:
- **Week 6:** Progressive Disclosure UI (MetricCard, EvidenceTrailModal)
- **Week 7:** Navigation Improvements (StageStepper, SmartBackButton, Tab badges)
- **Week 8:** Conversation Tracking (unified timeline, voice memos, call logging, AI analysis)
- **Week 9:** NBA Enhancements (contextual suggestions, notifications)

**Total Changes:**
- 18 new files created
- 7 existing files modified
- 1 database migration

---

## Files Changed

### New Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/deals/MetricCard.tsx` | 3-state progressive disclosure card with breakdowns | ~250 |
| `src/components/deals/EvidenceTrailModal.tsx` | Shows evidence sources with override capability | ~200 |
| `src/components/deals/index.ts` | Barrel export | ~5 |
| `src/features/deals/components/StageStepper.tsx` | Visual pipeline progress indicator | ~300 |
| `src/features/deals/components/SuggestionCard.tsx` | AI suggestion cards with actions | ~350 |
| `src/components/navigation/SmartBackButton.tsx` | Context-aware back button | ~150 |
| `src/components/navigation/index.ts` | Barrel export | ~3 |
| `src/features/conversations/components/ConversationsView.tsx` | Unified conversation timeline | ~490 |
| `src/features/conversations/components/VoiceMemoRecorder.tsx` | Audio recording with transcription | ~470 |
| `src/features/conversations/components/CallLogger.tsx` | Post-call logging sheet | ~430 |
| `src/features/conversations/components/index.ts` | Barrel export | ~5 |
| `src/features/conversations/services/conversationAnalysis.ts` | AI sentiment/phrase extraction | ~240 |
| `src/features/conversations/services/index.ts` | Barrel export | ~12 |
| `src/features/conversations/hooks/useDealConversations.ts` | Fetch conversations for a deal | ~90 |
| `src/features/conversations/hooks/index.ts` | Barrel export | ~4 |
| `src/features/deals/services/aiSuggestions.ts` | AI-powered deal suggestions | ~350 |
| `src/features/deals/services/dealNotificationService.ts` | Push notification management | ~320 |
| `supabase/migrations/20260116_create_conversation_tracking.sql` | conversation_items table | ~310 |
| `supabase/migrations/20260119_conversation_enums_and_backfill.sql` | ENUMs + SMS backfill | ~110 |
| `src/config/conversations.ts` | Configurable constants | ~70 |
| `supabase/tests/database/05_conversation_items_test.sql` | Database constraint & RLS tests | ~180 |

### Modified Files

| File | Changes |
|------|---------|
| `src/features/deals/screens/DealCockpitScreen.tsx` | Added tabs, breadcrumbs, MetricCards, StageStepper, ConversationsView, AI suggestions, SmartBackButton |
| `src/features/deals/screens/QuickUnderwriteScreen.tsx` | Added sticky header with scroll-based visibility, SmartBackButton |
| `src/features/deals/hooks/useNextAction.ts` | Added ActionContext with walkthrough progress, contact recency, photo buckets |
| `src/features/layout/hooks/useUnreadCounts.tsx` | Added `overdueDeals` to counts |
| `app/(tabs)/_layout.tsx` | Added deals tab badge showing overdue count |
| `supabase/functions/sms-webhook/index.ts` | Added conversation_items insert (sync) + combined AI extraction/analysis (async background, non-blocking) |

---

## Database Changes

### New Table: `conversation_items`

```sql
CREATE TABLE conversation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES re_pipeline(id) ON DELETE SET NULL,

  -- Conversation type
  type TEXT NOT NULL CHECK (type IN ('sms', 'call', 'voice_memo', 'email', 'note')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),

  -- Content
  content TEXT,
  transcript TEXT,
  subject TEXT,
  duration_seconds INTEGER,
  phone_number TEXT,
  email_address TEXT,

  -- AI analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  key_phrases TEXT[],
  action_items TEXT[],
  ai_summary TEXT,

  -- External refs
  twilio_message_sid TEXT,
  sms_inbox_id UUID REFERENCES sms_inbox(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);
```

**Indexes Created:**
- `idx_conversation_items_lead` - Query by lead
- `idx_conversation_items_pipeline` - Query by deal
- `idx_conversation_items_user` - Query by user
- `idx_conversation_items_type` - Filter by type
- `idx_conversation_items_recent` - Recent items
- `idx_conversation_items_needs_analysis` - Items needing AI processing
- `idx_conversation_items_content_gin` - Full text search
- `idx_conversation_items_twilio_sid` - Deduplication (unique)

**Constraints:**
- `conversation_items_parent_check` - Ensures at least one parent (lead or deal)

**RLS Policies (Full SQL):**
```sql
-- SELECT: Users can view items in their workspace
CREATE POLICY "Users can view workspace conversation items"
  ON conversation_items FOR SELECT
  USING (
    auth.uid() = user_id OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can insert items for their own user_id
CREATE POLICY "Users can insert own conversation items"
  ON conversation_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own items
CREATE POLICY "Users can update own conversation items"
  ON conversation_items FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Users can delete their own items
CREATE POLICY "Users can delete own conversation items"
  ON conversation_items FOR DELETE
  USING (auth.uid() = user_id);
```

**Functions Created:**
- `get_lead_conversation_timeline(lead_id, limit, offset)`
- `get_deal_conversation_timeline(pipeline_id, limit, offset)`
- `get_recent_action_items(user_id, limit)`

---

## Component Architecture

### Week 6: Progressive Disclosure

```
MetricCard
├── Collapsed state (label + value)
├── Expanded state (+ breakdown formula + items)
└── Actionable state (+ action buttons)

EvidenceTrailModal
├── Current value display
├── Sources list (with confidence indicators)
├── Override input
└── Change history
```

### Week 7: Navigation

```
StageStepper
├── Stage circles (completed ✓ / current ● / future ○)
├── Connecting lines with progress
├── Modal with stage definitions
└── Compact mode for header use

SmartBackButton
├── useSegments() for path detection
├── Contextual labels (← Deals, ← Cockpit, etc.)
└── Variants: default, minimal, ios
```

### Week 8: Conversations

```
ConversationsView
├── SearchBar
├── FilterChips (SMS, Call, Voice, Email, Note)
├── FlatList of ConversationItemCard
│   ├── Type icon + direction badge
│   ├── Content preview
│   ├── Timestamp + duration
│   └── Expandable details (transcript, key phrases, action items)
└── FAB for adding conversations

VoiceMemoRecorder
├── Recording state machine (idle → recording → recorded → transcribing)
├── Animated recording indicator
├── Playback controls
└── Transcribe + save (deletes audio file)

CallLogger
├── Contact info display
├── Direction toggle (inbound/outbound)
├── Duration picker (presets)
├── Outcome selector (answered/voicemail/no_answer/busy)
├── Notes input
└── Follow-up toggle
```

### Week 9: NBA Enhancements

```
useNextAction (enhanced)
├── calculateWalkthroughProgress() → { progress%, missingBuckets[] }
├── calculateDaysSinceLastContact()
├── checkContactRecency() → priority action if stale
├── checkWalkthroughCompleteness() → suggest next photo bucket
└── ActionContext interface for all context data

aiSuggestions service
├── generateActionItemSuggestions() - from conversation action_items
├── generateKeyPhraseSuggestions() - motivation/repair/price detection
├── generateSentimentSuggestions() - negative sentiment alerts
├── generateRecencySuggestions() - contact overdue warnings
└── generateTimeSuggestions() - offer follow-up timing

dealNotificationService
├── configureNotifications() - handler setup
├── requestNotificationPermissions()
├── scheduleDailyDigest()
├── scheduleOfferFollowup()
├── scheduleContactReminder()
├── sendMilestoneNotification()
└── scheduleNotificationsForDeal() - smart scheduling
```

---

## Key Design Decisions

### 1. Conversation Storage Architecture

**Decision:** Dual storage - keep `sms_inbox` for raw SMS, add `conversation_items` for unified timeline.

**Rationale:**
- `sms_inbox` contains AI-extracted property data specific to SMS
- `conversation_items` is type-agnostic for all conversation types
- `sms_inbox_id` foreign key links them when needed
- Allows different processing pipelines per type

### 2. Voice Memo Audio Retention

**Decision:** Give users a choice - transcript only OR keep audio for 7 days.

**Rationale:**
- User can review audio if transcription has errors
- 7-day retention balances storage costs with recourse
- Auto-delete via lifecycle policy after retention period
- Clear UX prompt explains the options

### 3. AI Analysis Timing

**Decision:** Async background processing after Twilio webhook response.

**Rationale:**
- Twilio requires response within 10 seconds
- AI extraction can take 2-5 seconds
- Background processing doesn't block acknowledgment
- Errors don't cause webhook failures

### 4. Suggestion Confidence Scoring

**Decision:** Use confidence percentages (0-100) with deduplication by category+source.

**Rationale:**
- Allows ranking suggestions objectively
- Prevents duplicate suggestions from different sources
- UI can filter by confidence threshold if needed

### 5. User Reference Pattern

**Decision:** Reference `auth.users(id)` directly (not via user_profiles).

**Rationale:**
- Consistent with established codebase pattern (15+ tables use this)
- Workspace isolation is handled via `workspace_id` + RLS policies checking `workspace_members`
- Adding user_profiles indirection would require refactoring all existing tables
- No multi-tenancy isolation issues since workspace_id provides that layer

### 6. Combined AI API Calls

**Decision:** Single OpenAI call for property extraction AND sentiment analysis.

**Rationale:**
- Reduces API costs by ~50%
- Reduces latency (one round-trip instead of two)
- Uses gpt-4o for better quality
- Structured output ensures consistent JSON format

---

## Testing Recommendations

### Unit Tests Needed

```typescript
// useNextAction.test.ts
- calculateWalkthroughProgress with various photo sets
- calculateDaysSinceLastContact with edge cases (no date, future date)
- checkContactRecency thresholds (3 days, 7 days)
- checkWalkthroughCompleteness progress thresholds

// aiSuggestions.test.ts
- generateKeyPhraseSuggestions with motivation keywords
- generateSentimentSuggestions with negative/positive
- generateRecencySuggestions with various day counts
- deduplication logic

// conversationAnalysis.test.ts
- analyzeConversation response parsing
- validation of required fields
- error handling for API failures
```

### Integration Tests Needed

```typescript
// DealCockpitScreen.test.tsx
- Tab switching works correctly
- ConversationsView receives data from hook
- StageStepper reflects deal.stage
- AI suggestions appear when present

// sms-webhook.test.ts
- conversation_items insert succeeds
- AI analysis updates conversation_item
- Lead lookup by phone number works
- Duplicate handling (twilio_message_sid constraint)
```

### Manual Testing Checklist

- [ ] Tap MetricCard → expands with haptic feedback
- [ ] Tap expanded MetricCard → shows actions
- [ ] EvidenceTrailModal opens and closes correctly
- [ ] StageStepper shows current stage highlighted
- [ ] SmartBackButton shows contextual label
- [ ] Deals tab badge shows correct overdue count
- [ ] Conversations tab loads real data
- [ ] Voice memo records and shows recording indicator
- [ ] Call logger duration presets work
- [ ] AI suggestions appear on deal with conversations

---

## Potential Issues / Tech Debt

### 1. VoiceMemoRecorder Whisper Integration
**Status:** Mock implementation
**Location:** `VoiceMemoRecorder.tsx:260-265`
**TODO:** Replace `setTimeout` mock with actual Whisper API call

### 2. Conversation Detail Navigation
**Status:** Alert placeholder
**Location:** `DealCockpitScreen.tsx:919-922`
**TODO:** Implement conversation detail screen and navigation

### 3. Add Conversation Modal
**Status:** Alert placeholder
**Location:** `DealCockpitScreen.tsx:915-918`
**TODO:** Implement modal to add notes, voice memos, call logs

### 4. StageStepper Stage Definitions
**Status:** Hardcoded descriptions
**Location:** `StageStepper.tsx:70-140`
**TODO:** Consider making descriptions configurable or fetching from API

### 5. Notification Push Token
**Status:** Uses process.env.EXPO_PUBLIC_PROJECT_ID
**Location:** `dealNotificationService.ts:105`
**TODO:** Ensure this is set in all environments

---

## Migration Notes

### Before Deploying

1. **Run migration:**
   ```bash
   supabase db push
   # or
   supabase migration up
   ```

2. **Deploy edge function:**
   ```bash
   supabase functions deploy sms-webhook
   ```

3. **Verify indexes created:**
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'conversation_items';
   ```

### Rollback Plan

```sql
-- If needed, rollback migration:
DROP TABLE IF EXISTS conversation_items CASCADE;
DROP FUNCTION IF EXISTS get_lead_conversation_timeline;
DROP FUNCTION IF EXISTS get_deal_conversation_timeline;
DROP FUNCTION IF EXISTS get_recent_action_items;
```

---

## Dependencies Added

No new npm packages were added. Zone G uses existing dependencies:
- `react-native-reanimated` - animations
- `expo-haptics` - haptic feedback
- `expo-av` - audio recording
- `expo-notifications` - push notifications
- `@tanstack/react-query` - data fetching
- `lucide-react-native` - icons

---

## Review Checklist

- [ ] Database migration looks correct
- [ ] RLS policies are appropriate
- [ ] Component props are well-typed
- [ ] Error handling is adequate
- [ ] Accessibility labels present
- [ ] No hardcoded secrets/keys
- [ ] Console.log statements are prefixed with component name
- [ ] No unused imports
- [ ] Consistent code style

---

## Questions for Reviewer

1. **Conversation deduplication:** Is `twilio_message_sid` unique index sufficient, or should we add additional dedup logic?

2. ~~**AI analysis costs:** The SMS webhook now makes 2 OpenAI calls (property extraction + sentiment analysis). Is this acceptable cost-wise?~~
   **RESOLVED:** Combined into single API call, reducing costs by ~50%.

3. **Notification timing:** Daily digest at 9 AM - should this be user-configurable? (Config available at `src/config/conversations.ts`)

4. **StageStepper placement:** Currently below header. Should it be in the Overview tab instead?

5. **Voice memo max duration:** Currently 5 minutes. Is this appropriate? (Config available at `src/config/conversations.ts`)
