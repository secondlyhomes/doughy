# Zone G: UX Improvements & Workflow Streamlining

**Owner:** Frontend UI/UX Developer
**Timeline:** Weeks 6-9
**Dependencies:** Zone F must complete (frontend code updated)
**Risk Level:** MEDIUM (new features, but non-breaking)

---

## Mission

Streamline the creative finance deal pipeline UX with progressive disclosure, enhanced navigation, conversation tracking, and contextual NBA suggestions.

---

## Design Philosophy: Wide-Angle → Pin-Point

User journey progression:
1. **Wide-angle** (Leads) → See all opportunities
2. **Focusing** (Deal analysis) → Narrow down to specifics
3. **Pin-point** (Offer/close) → Execute with precision

At each stage, show ONLY what's relevant. Progressive disclosure reveals details on demand.

---

## Week 6: Progressive Disclosure UI

### Goal
Make numbers less overwhelming by showing key metrics by default, detailed breakdowns on tap.

### 6.1 Build `MetricCard` Component

**File:** `src/components/deals/MetricCard.tsx` (NEW)

**Features:**
- Default state: Shows single metric value (e.g., "MAO: $180K")
- Tap state: Expands to show calculation breakdown
- Three states: Collapsed → Expanded → Actionable (deep dive)

**Component API:**
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  breakdown?: {
    formula: string;
    items: Array<{ label: string; value: string | number }>;
  };
  actions?: Array<{
    label: string;
    onPress: () => void;
  }>;
  confidence?: 'high' | 'medium' | 'low';
}

<MetricCard
  label="MAO"
  value="$180,000"
  icon={<DollarSign />}
  confidence="high"
  breakdown={{
    formula: "70% ARV - Repairs - Costs",
    items: [
      { label: "ARV (5 comps)", value: "$300,000" },
      { label: "× 70% Rule", value: "$210,000" },
      { label: "- Repairs", value: "-$45,000" },
      { label: "- Holding (90 days)", value: "-$3,000" },
      { label: "- Closing costs", value: "-$9,000" },
    ],
  }}
  actions={[
    { label: "Override", onPress: () => {} },
    { label: "View Comps", onPress: () => {} },
    { label: "Change Rule to 65%", onPress: () => {} },
  ]}
/>
```

**Design:**
- Use React Native Reanimated for smooth expand/collapse
- Haptic feedback on tap
- Color coding: Green (high confidence), Yellow (medium), Red (low)

---

### 6.2 Build `EvidenceTrailModal` Component

**File:** `src/components/deals/EvidenceTrailModal.tsx` (NEW)

**Purpose:** Show WHERE each number came from (comps, walkthrough, user input, AI estimate)

**Features:**
- Lists all evidence sources for a metric
- Shows confidence level for each source
- Allows user to override with their own value
- Tracks changes over time

**Example:**
```
ARV: $300,000 (High Confidence)
───────────────────────────────
Evidence sources:
✓ 5 comparable sales (Zillow)     $295K-$305K
✓ Appraisal estimate (AI)         $298K
✓ MLS data                        $302K
✓ User override (Jan 15)          $300K ← Active

[Override Value] [View Comps] [Export]
```

---

### 6.3 Update `DealCockpitScreen`

**File:** `src/features/deals/screens/DealCockpitScreen.tsx`

**Changes:**

**Add Breadcrumbs:**
```tsx
<Breadcrumb path={['Deals', deal.property_address, deal.stage]} />
```

**Add Tabbed Interface:**
```tsx
<Tabs>
  <Tab title="Overview">
    <OverviewTab deal={deal} />
  </Tab>
  <Tab title="Underwrite">
    <UnderwriteTab deal={deal} />
  </Tab>
  <Tab title="Offers">
    <OffersTab deal={deal} />
  </Tab>
  <Tab title="Conversations">
    <ConversationsTab deal={deal} />
  </Tab>
  <Tab title="Docs">
    <DocsTab deal={deal} />
  </Tab>
</Tabs>
```

**Replace Static Metrics with MetricCards:**
```tsx
// BEFORE
<Text>MAO: ${mao}</Text>
<Text>Profit: ${profit}</Text>

// AFTER
<MetricCard
  label="MAO"
  value={`$${mao}`}
  breakdown={maoBreakdown}
  actions={maoActions}
/>

<MetricCard
  label="Profit / Cash Flow"
  value={`$${profit}/mo`}
  breakdown={profitBreakdown}
/>
```

---

### 6.4 Update `QuickUnderwriteScreen`

**File:** `src/features/deals/screens/QuickUnderwriteScreen.tsx`

**Add Sticky Metrics Header:**
```tsx
<StickyHeader>
  <MetricCard label="MAO" value={mao} compact />
  <MetricCard label="Profit" value={profit} compact />
  <MetricCard label="Risk" value={riskScore} compact />
</StickyHeader>

<ScrollView>
  {/* Detailed analysis below */}
</ScrollView>
```

**Add Scenario Comparison:**
```tsx
<ScenarioComparison
  scenarios={[
    { name: "Current Offer", price: 170000, ... },
    { name: "What if $165K?", price: 165000, ... },
    { name: "What if $175K?", price: 175000, ... },
  ]}
/>
```

---

## Week 7: Navigation Improvements

### Goal
Make it crystal clear where user is in the app at all times.

### 7.1 Build `Breadcrumb` Component

**File:** `src/components/navigation/Breadcrumb.tsx` (NEW)

**Features:**
- Shows hierarchical path: `Leads > John Smith > Deal > Analyzing`
- Each segment tappable to navigate back
- Truncates middle segments on small screens: `Leads > ... > Analyzing`

**Component API:**
```typescript
<Breadcrumb path={['Deals', '123 Main St', 'Analyzing']} />
```

---

### 7.2 Build `StageStepper` Component

**File:** `src/features/deals/components/StageStepper.tsx` (NEW)

**Purpose:** Visual pipeline progress indicator

**Design:**
```
[New] → [Contacted] → [Analyzing] → [Offer] → [Contract] → [Closed]
  ✓         ✓            ●             ○          ○           ○
```

- ● = Current (highlighted, filled circle)
- ✓ = Completed (green checkmark)
- ○ = Future (gray, outlined circle)
- Tap stage → See definition + avg time in stage

---

### 7.3 Build `SmartBackButton` Component

**File:** `src/components/navigation/SmartBackButton.tsx` (NEW)

**Purpose:** Label back button with WHERE it goes

**Examples:**
- `[← Cockpit]` when in Underwrite tab
- `[← Deals]` when in Cockpit
- `[← Lead: John]` when in Deal accessed from Lead

---

### 7.4 Tab Bar Contextual Badges

**Update:** `app/(tabs)/_layout.tsx`

**Add badge counts:**
```tsx
<Tabs.Screen
  name="leads"
  options={{
    title: 'Leads',
    tabBarBadge: hotLeadsCount > 0 ? hotLeadsCount : undefined,
  }}
/>

<Tabs.Screen
  name="deals"
  options={{
    title: 'Deals',
    tabBarBadge: overdueActionsCount > 0 ? overdueActionsCount : undefined,
  }}
/>
```

---

## Week 8: Conversation Tracking

### Goal
Unified view of ALL communications (SMS + calls + voice transcripts). NO audio storage.

### 8.1 Create `conversation_items` Table Migration

**File:** `supabase/migrations/20260124_create_conversation_tracking.sql`

```sql
CREATE TABLE conversation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lead_id UUID REFERENCES crm_leads(id),
  pipeline_id UUID REFERENCES re_pipeline(id),

  type TEXT CHECK (type IN ('sms', 'call', 'voice_memo', 'email', 'note')) NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),

  content TEXT,
  transcript TEXT, -- AI-generated from voice, NO audio files
  duration_seconds INTEGER,

  phone_number TEXT,
  email_address TEXT,

  -- AI insights
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  key_phrases TEXT[],
  action_items TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_items_lead_id ON conversation_items(lead_id);
CREATE INDEX idx_conversation_items_pipeline_id ON conversation_items(pipeline_id);
CREATE INDEX idx_conversation_items_occurred_at ON conversation_items(occurred_at DESC);
CREATE INDEX idx_conversation_items_user_lead ON conversation_items(user_id, lead_id, occurred_at DESC);

-- RLS
ALTER TABLE conversation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversation_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their conversations"
  ON conversation_items FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

---

### 8.2 Build `ConversationsView` Component

**File:** `src/features/conversations/components/ConversationsView.tsx` (NEW)

**Features:**
- Chronological timeline of all communications
- Type icons: 📞 (call), 💬 (SMS), 🎤 (voice transcript), 📧 (email)
- Type filters: [All] [SMS] [Calls] [Voice] [Email]
- Search with transcript support: "Find when they mentioned 'roof'"
- AI insights displayed:
  - Sentiment emoji: 😊 (positive), 😐 (neutral), 😞 (negative)
  - Highlighted key phrases (yellow background)
  - Action items with checkboxes
- Inline actions: Reply (SMS), View full transcript, Add note

**Component API:**
```typescript
<ConversationsView
  leadId={leadId}
  pipelineId={pipelineId}
  onReply={(conversationId) => {}}
  onAddNote={() => {}}
/>
```

---

### 8.3 Build `VoiceMemoRecorder` Component

**File:** `src/features/conversations/components/VoiceMemoRecorder.tsx` (NEW)

**Features:**
- Press & hold to record
- Waveform visualization
- On release:
  1. Upload audio to temp storage
  2. Transcribe with OpenAI Whisper
  3. **DELETE audio file** (only keep transcript)
  4. Extract AI insights (sentiment, key phrases, action items)
  5. Save to `conversation_items` with type='voice_memo'

**Flow:**
```
User speaks → Record → Transcribe → Extract insights → Delete audio → Save transcript
```

**Important:** NO long-term audio storage, only transcripts

---

### 8.4 Build `CallLogger` Component

**File:** `src/features/conversations/components/CallLogger.tsx` (NEW)

**Purpose:** Post-call sheet to log call details

**Triggered by:** iOS CallKit (when outbound call to lead number detected)

**Form fields:**
- Duration (auto-populated if possible)
- Notes (textarea)
- Outcome (dropdown: Answered, Voicemail, No answer, Callback requested)
- Next action (optional)

**On submit:**
- Save to `conversation_items` with type='call'
- Optionally set deal.next_action if user specified

---

### 8.5 Update SMS Webhook

**File:** `supabase/functions/sms-webhook/index.ts`

**Add:**
```typescript
// After saving to sms_inbox, also save to conversation_items
await supabase.from('conversation_items').insert({
  user_id: userId,
  lead_id: leadId, // Lookup from phone number
  type: 'sms',
  direction: 'inbound',
  content: messageBody,
  phone_number: from,
  occurred_at: new Date().toISOString(),
});

// Run AI analysis
const analysis = await analyzeConversation(messageBody);

// Update with AI insights
await supabase
  .from('conversation_items')
  .update({
    sentiment: analysis.sentiment,
    key_phrases: analysis.keyPhrases,
    action_items: analysis.actionItems,
  })
  .eq('id', conversationItemId);
```

---

### 8.6 Build AI Analysis Service

**File:** `src/features/conversations/services/conversationAnalysis.ts` (NEW)

```typescript
export async function analyzeConversation(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract from conversation:
1. Sentiment (positive, neutral, negative)
2. Key phrases (e.g., "motivated seller", "needs quick close")
3. Action items (e.g., "Follow up next week", "Send comps")

Return JSON: { sentiment, keyPhrases: [], actionItems: [] }`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Week 9: NBA Enhancements & Notifications

### Goal
Contextual AI guidance that helps user know exactly what to do next.

### 9.1 Enhance `useNextAction` Hook

**File:** `src/features/deals/hooks/useNextAction.ts`

**Add contextual granularity:**

```typescript
// BEFORE
if (stage === 'analyzing') {
  return { action: 'Complete property walkthrough', priority: 'medium' };
}

// AFTER
if (stage === 'analyzing' && walkthrough) {
  const progress = calculateWalkthroughProgress(walkthrough);
  const missingBuckets = getMissingBuckets(walkthrough);

  return {
    action: `Walkthrough ${progress}% done - add ${missingBuckets.join(', ')} photos`,
    priority: progress > 80 ? 'low' : 'medium',
  };
}
```

---

### 9.2 Build AI Suggestions Service

**File:** `src/features/deals/services/aiSuggestions.ts` (NEW)

**Query conversations for context:**

```typescript
export async function generateAISuggestions(pipelineId: string) {
  // Get recent conversations
  const { data: conversations } = await supabase
    .from('conversation_items')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .gte('occurred_at', sevenDaysAgo())
    .order('occurred_at', { ascending: false });

  // Extract insights
  const insights = conversations.map(c => ({
    type: c.type,
    sentiment: c.sentiment,
    keyPhrases: c.key_phrases,
    actionItems: c.action_items,
  }));

  // Generate suggestions
  const suggestions = [];

  // Example: If seller mentioned foundation issue
  if (insights.some(i => i.keyPhrases?.includes('foundation'))) {
    suggestions.push({
      type: 'repair_estimate',
      text: "Seller mentioned foundation issue. Consider adding $8K to repair estimate.",
      action: 'Update repairs',
    });
  }

  // Example: If no contact in 5+ days
  const lastContact = conversations[0]?.occurred_at;
  if (daysSince(lastContact) >= 5) {
    suggestions.push({
      type: 'follow_up',
      text: `You haven't contacted ${leadName} in ${daysSince(lastContact)} days. Send follow-up?`,
      action: 'Send SMS',
    });
  }

  return suggestions;
}
```

---

### 9.3 Build Deal Notification Service

**File:** `src/features/deals/services/dealNotificationService.ts` (NEW)

**Types of notifications:**

1. **Daily digest** (9am): "You have 3 deals with overdue actions"
2. **Event-based**: "Offer sent 3 days ago - time to follow up"
3. **Milestone**: "Inspection due tomorrow for 123 Main St"
4. **Social proof**: "Seller viewed your report 3x - high interest!"

**Implementation:**
```typescript
export async function sendDailyDigest(userId: string) {
  const overdueDeals = await getOverdueDeals(userId);

  if (overdueDeals.length > 0) {
    await sendNotification({
      userId,
      title: 'Daily Digest',
      body: `You have ${overdueDeals.length} deals with overdue actions`,
      data: { type: 'daily_digest', deals: overdueDeals },
    });
  }
}
```

---

### 9.4 Display AI Suggestions in UI

**Update:** `DealCockpitScreen.tsx`

**Add suggestion cards:**
```tsx
{aiSuggestions.map(suggestion => (
  <SuggestionCard
    key={suggestion.id}
    icon={suggestion.type === 'follow_up' ? <Phone /> : <AlertCircle />}
    text={suggestion.text}
    action={suggestion.action}
    onPress={() => handleSuggestionAction(suggestion)}
  />
))}
```

---

## Deliverables

**Week 6:**
- [ ] `MetricCard.tsx` component
- [ ] `EvidenceTrailModal.tsx` component
- [ ] Updated `DealCockpitScreen.tsx` with progressive disclosure
- [ ] Updated `QuickUnderwriteScreen.tsx` with sticky header

**Week 7:**
- [ ] `Breadcrumb.tsx` component
- [ ] `StageStepper.tsx` component
- [ ] `SmartBackButton.tsx` component
- [ ] Tab bar badges implemented

**Week 8:**
- [ ] `conversation_items` table migration
- [ ] `ConversationsView.tsx` component
- [ ] `VoiceMemoRecorder.tsx` component (transcripts only, no audio storage)
- [ ] `CallLogger.tsx` component
- [ ] Updated SMS webhook
- [ ] `conversationAnalysis.ts` service

**Week 9:**
- [ ] Enhanced `useNextAction.ts` with granular context
- [ ] `aiSuggestions.ts` service
- [ ] `dealNotificationService.ts`
- [ ] AI suggestion cards in UI

---

## Testing Checklist

**Progressive Disclosure:**
- [ ] Tap metric card → expands smoothly
- [ ] Evidence trail modal shows calculation sources
- [ ] Override value works and updates other metrics
- [ ] Confidence levels display correctly

**Navigation:**
- [ ] Breadcrumbs show correct path
- [ ] Tapping breadcrumb segment navigates back
- [ ] Stage stepper reflects current stage
- [ ] Smart back button labels correctly

**Conversation Tracking:**
- [ ] SMS appears in conversations view
- [ ] Voice memo records, transcribes, deletes audio, saves transcript
- [ ] Call logger captures call details
- [ ] AI sentiment displays correctly
- [ ] Key phrases highlighted
- [ ] Action items create NBA suggestions

**NBA Enhancements:**
- [ ] Contextual suggestions appear based on conversations
- [ ] Notifications sent at correct times
- [ ] Suggestion actions work (e.g., "Send SMS" opens SMS)

---

## Coordination with Other Zones

**Depends on Zone F:** Needs updated hooks and types
**Can run parallel with Zone H:** Code cleanup independent

**Communication:** Weekly demos in #product-demos Slack
