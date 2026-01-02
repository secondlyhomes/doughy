# ZONE D: Dashboard, Leads, Conversations & Analytics - Stage 3

**Instance 4 Assignment | Priority: HIGH**

---

## Before You Begin

### Required Reading
1. Read `EXPO_UNIVERSAL_MASTER_PLAN.md` first
2. Read this document completely
3. Check Zone A progress for UI component availability

### Your Mission
Implement dashboard, leads management, AI conversations, and analytics features from the web app.

### Dependencies
- **Zone A:** Button, Input, Select, Card, Dialog, Tabs, Chart components
- **Zone B:** useAuth, usePermissions hooks
- **Zone C:** Property components for cross-linking

**Start with hooks/services while waiting for UI components.**

---

## Source Files Reference

| Feature | Web Source | File Count |
|---------|------------|------------|
| Dashboard | `/Users/dinosaur/Documents/doughy-ai-vite-old/src/features/dashboard/` | 7 files |
| Leads | `/Users/dinosaur/Documents/doughy-ai-vite-old/src/features/leads/` | 95 files |
| Conversations | `/Users/dinosaur/Documents/doughy-ai-vite-old/src/features/conversations/` | 39 files |
| Analytics | `/Users/dinosaur/Documents/doughy-ai-vite-old/src/features/analytics/` | 23 files |
| Assistant | `/Users/dinosaur/Documents/doughy-ai-vite-old/src/features/assistant/` | 81 files |
| Layout | `/Users/dinosaur/Documents/doughy-ai-vite-old/src/features/layout/` | 16 files |

---

## Current Status

### Already Completed (Stage 1-2)
- [x] DashboardScreen - placeholder
- [x] LeadsListScreen - placeholder
- [x] LeadDetailScreen - placeholder
- [x] AssistantScreen - basic chat
- [x] MessageBubble - basic component
- [x] SuggestionChips - basic component
- [x] useChat hook - basic implementation
- [x] useLeads hook - basic implementation
- [x] BottomTabs - navigation

### Needs Full Implementation
- [ ] Full dashboard with stats/charts
- [ ] Complete leads management
- [ ] Full AI chat interface
- [ ] Analytics charts
- [ ] Activity timelines
- [ ] Global search

---

## Phase 1: Dashboard (Priority: HIGH)

### 1.1 Dashboard Home

**Web Files:**
- `src/features/dashboard/pages/Dashboard.tsx`
- `src/features/dashboard/components/DashboardStats.tsx`
- `src/features/dashboard/components/DashboardCharts.tsx`
- `src/features/dashboard/components/RecentActivity.tsx`

**Create:**
```
src/features/dashboard/
├── screens/
│   └── DashboardScreen.tsx         [ ] - Full dashboard
├── components/
│   ├── DashboardHeader.tsx         [ ] - Welcome + date
│   ├── StatCard.tsx                [ ] - Single metric
│   ├── StatsRow.tsx                [ ] - Row of stats
│   ├── QuickActions.tsx            [ ] - Action buttons
│   ├── RecentLeadsCard.tsx         [ ] - Recent leads preview
│   ├── RecentPropertiesCard.tsx    [ ] - Recent properties
│   ├── ActivityFeed.tsx            [ ] - Activity list
│   ├── ActivityItem.tsx            [ ] - Single activity
│   ├── LeadsChart.tsx              [ ] - Leads over time
│   ├── ConversionsChart.tsx        [ ] - Conversion funnel
│   └── PerformanceMetrics.tsx      [ ] - Key metrics
├── hooks/
│   ├── useDashboardStats.ts        [ ] - Stats data
│   └── useRecentActivity.ts        [ ] - Activity feed
```

**DashboardScreen Requirements:**
- Welcome message with user name
- Stats overview (Total Leads, Properties, Deals, Revenue)
- Quick action buttons (Add Lead, Add Property, Start Chat)
- Recent leads preview (3-5 items)
- Recent properties preview (3-5 items)
- Activity feed
- Charts (leads trend, conversions)

**Stats to Display:**
- Total Leads (with trend arrow)
- Active Properties
- Deals in Progress
- Monthly Revenue
- Conversion Rate
- Average Response Time

**Checklist:**
- [ ] Stats load and display
- [ ] Charts render correctly
- [ ] Quick actions work
- [ ] Recent items show
- [ ] Activity feed loads
- [ ] Pull to refresh works

### 1.2 Dashboard Charts

**Create:**
```
src/features/dashboard/
├── components/
│   ├── LeadsOverTimeChart.tsx      [ ] - Line chart
│   ├── LeadSourceChart.tsx         [ ] - Pie/bar chart
│   ├── ConversionFunnelChart.tsx   [ ] - Funnel chart
│   └── RevenueChart.tsx            [ ] - Bar chart
```

**Use `react-native-chart-kit` or `victory-native` for charts.**

**Checklist:**
- [ ] Line chart renders
- [ ] Bar chart renders
- [ ] Pie chart renders
- [ ] Charts are responsive
- [ ] Legend displays

---

## Phase 2: Leads Management (Priority: CRITICAL)

### 2.1 Leads List

**Web Files:**
- `src/features/leads/pages/LeadsPage.tsx`
- `src/features/leads/components/LeadsList.tsx`
- `src/features/leads/components/LeadCard.tsx`
- `src/features/leads/components/LeadsFilters.tsx`

**Create:**
```
src/features/leads/
├── screens/
│   └── LeadsListScreen.tsx         [ ] - Full leads list
├── components/
│   ├── LeadCard.tsx                [ ] - Lead list item
│   ├── LeadCardActions.tsx         [ ] - Swipe actions
│   ├── LeadsHeader.tsx             [ ] - Search + filters
│   ├── LeadsFiltersSheet.tsx       [ ] - Filter bottom sheet
│   ├── LeadsSortSheet.tsx          [ ] - Sort options
│   ├── LeadsEmptyState.tsx         [ ] - No leads view
│   ├── LeadStatusBadge.tsx         [ ] - Status indicator
│   ├── LeadPriorityBadge.tsx       [ ] - Priority indicator
│   └── LeadQuickActions.tsx        [ ] - Call/Text/Email
├── hooks/
│   ├── useLeads.ts                 [ ] Enhance
│   ├── useLead.ts                  [ ] Single lead
│   ├── useLeadFilters.ts           [ ] Filter state
│   └── useLeadSearch.ts            [ ] Search hook
```

**LeadsListScreen Requirements:**
- FlatList with pull to refresh
- Search bar in header
- Filter button opens bottom sheet
- Sort options
- Swipeable actions (call, text, archive)
- Infinite scroll pagination
- FAB to add new lead

**Filter Options:**
- Status (New, Contacted, Qualified, Proposal, Negotiation, Won, Lost)
- Priority (Low, Medium, High, Urgent)
- Source (Website, Referral, Social, etc.)
- Date Range
- Assigned To

**Checklist:**
- [ ] List loads with data
- [ ] Search works
- [ ] Filters work
- [ ] Sort works
- [ ] Swipe actions work
- [ ] Pagination works
- [ ] Add button navigates

### 2.2 Lead Detail

**Web Files:**
- `src/features/leads/pages/LeadDetailPage.tsx`
- `src/features/leads/components/LeadDetail*.tsx`

**Create:**
```
src/features/leads/
├── screens/
│   └── LeadDetailScreen.tsx        [ ] - Full lead detail
├── components/
│   ├── LeadHeader.tsx              [ ] - Name + status + actions
│   ├── LeadContactInfo.tsx         [ ] - Phone, email, address
│   ├── LeadDetailTabs.tsx          [ ] - Tab navigation
│   ├── LeadOverviewTab.tsx         [ ] - Overview content
│   ├── LeadActivityTab.tsx         [ ] - Activity timeline
│   ├── LeadPropertiesTab.tsx       [ ] - Associated properties
│   ├── LeadNotesTab.tsx            [ ] - Notes section
│   ├── LeadCallButton.tsx          [ ] - Quick call
│   ├── LeadMessageButton.tsx       [ ] - Quick message
│   └── LeadMoreMenu.tsx            [ ] - Actions menu
```

**LeadDetailScreen Requirements:**
- Header with name, status, priority
- Contact info (tap to call/email)
- Tabs: Overview, Activity, Properties, Notes
- Quick action buttons (Call, Text, Email)
- Edit/Archive/Delete in menu

**Contact Actions:**
- Tap phone → native dialer
- Tap email → native email app
- Tap address → native maps

**Checklist:**
- [ ] Detail loads correctly
- [ ] Tabs work
- [ ] Call button works
- [ ] Email button works
- [ ] Edit navigates correctly
- [ ] Actions menu works

### 2.3 Add/Edit Lead

**Web Files:**
- `src/features/leads/components/LeadForm.tsx`
- `src/features/leads/components/AddLeadModal.tsx`

**Create:**
```
src/features/leads/
├── screens/
│   ├── AddLeadScreen.tsx           [ ] - Add lead form
│   └── EditLeadScreen.tsx          [ ] - Edit lead form
├── components/
│   ├── LeadForm.tsx                [ ] - Reusable form
│   ├── LeadFormBasic.tsx           [ ] - Name, email, phone
│   ├── LeadFormDetails.tsx         [ ] - Source, status
│   ├── LeadFormProperty.tsx        [ ] - Property interest
│   ├── LeadFormNotes.tsx           [ ] - Notes
│   ├── LeadSourcePicker.tsx        [ ] - Source selection
│   ├── LeadStatusPicker.tsx        [ ] - Status selection
│   └── LeadPriorityPicker.tsx      [ ] - Priority selection
```

**Lead Form Fields:**
- **Basic Info:**
  - First Name (required)
  - Last Name
  - Email
  - Phone (required)
  - Address, City, State, ZIP

- **Lead Details:**
  - Source
  - Status
  - Priority
  - Assigned To

- **Property Interest:**
  - Budget Min/Max
  - Property Type Preferences
  - Associated Properties

- **Notes:**
  - Initial notes
  - Tags

**Checklist:**
- [ ] Form validates
- [ ] Submit creates/updates
- [ ] Picker components work
- [ ] Property linking works

### 2.4 Lead Activity Timeline

**Web Files:**
- `src/features/leads/components/LeadActivity*.tsx`
- `src/features/leads/components/LeadTimeline.tsx`

**Create:**
```
src/features/leads/
├── components/
│   ├── LeadTimeline.tsx            [ ] - Activity timeline
│   ├── TimelineItem.tsx            [ ] - Single activity
│   ├── TimelineCall.tsx            [ ] - Call activity
│   ├── TimelineEmail.tsx           [ ] - Email activity
│   ├── TimelineNote.tsx            [ ] - Note activity
│   ├── TimelineStatusChange.tsx    [ ] - Status change
│   ├── AddActivitySheet.tsx        [ ] - Log activity
│   └── ActivityTypePicker.tsx      [ ] - Type selection
├── hooks/
│   └── useLeadActivity.ts          [ ] - Activity data
```

**Activity Types:**
- Call (log call outcome)
- Email (log email sent)
- Text/SMS
- Meeting
- Note
- Status Change
- Property Shown

**Checklist:**
- [ ] Timeline displays
- [ ] Different types styled
- [ ] Add activity works
- [ ] Chronological order

---

## Phase 3: AI Conversations (Priority: HIGH)

### 3.1 Conversations List

**Web Files:**
- `src/features/conversations/pages/ConversationsPage.tsx`
- `src/features/conversations/components/ConversationList.tsx`

**Create:**
```
src/features/conversations/
├── screens/
│   └── ConversationsListScreen.tsx [ ] - All conversations
├── components/
│   ├── ConversationCard.tsx        [ ] - Conversation preview
│   ├── ConversationPreview.tsx     [ ] - Last message
│   ├── ConversationBadge.tsx       [ ] - Unread count
│   ├── ConversationsEmpty.tsx      [ ] - No conversations
│   └── NewConversationButton.tsx   [ ] - Start new chat
├── hooks/
│   └── useConversations.ts         [ ] - Conversations list
```

**ConversationsListScreen Requirements:**
- List of past conversations
- Preview of last message
- Timestamp
- Unread indicator
- Tap to open chat
- FAB to start new conversation

**Checklist:**
- [ ] Conversations list loads
- [ ] Preview shows
- [ ] Unread badge shows
- [ ] New conversation works
- [ ] Navigate to chat works

### 3.2 Chat Interface

**Web Files:**
- `src/features/conversations/components/ChatInterface.tsx`
- `src/features/conversations/components/MessageBubble.tsx`
- `src/features/conversations/components/MessageInput.tsx`

**Create:**
```
src/features/conversations/
├── screens/
│   └── ChatScreen.tsx              [ ] - Full chat interface
├── components/
│   ├── MessageList.tsx             [ ] - Inverted FlatList
│   ├── MessageBubble.tsx           [ ] Enhance
│   ├── UserMessage.tsx             [ ] - User message style
│   ├── AssistantMessage.tsx        [ ] - AI message style
│   ├── SystemMessage.tsx           [ ] - System message
│   ├── MessageInput.tsx            [ ] - Input + send
│   ├── MessageInputBar.tsx         [ ] - Input container
│   ├── SendButton.tsx              [ ] - Send button
│   ├── AttachButton.tsx            [ ] - Attach files
│   ├── VoiceButton.tsx             [ ] - Voice input
│   ├── SuggestionChips.tsx         [ ] Enhance
│   ├── TypingIndicator.tsx         [ ] - AI typing...
│   ├── MessageActions.tsx          [ ] - Copy, regenerate
│   ├── ChatHeader.tsx              [ ] - Title, back, menu
│   └── ChatEmptyState.tsx          [ ] - Start conversation
├── hooks/
│   ├── useChat.ts                  [ ] Enhance
│   ├── useMessages.ts              [ ] - Messages list
│   └── useAIResponse.ts            [ ] - AI streaming
├── services/
│   ├── chatService.ts              [ ] - Chat operations
│   └── aiService.ts                [ ] - AI API calls
```

**ChatScreen Requirements:**
- Inverted FlatList (newest at bottom)
- Message input with send button
- User/AI message styling
- Typing indicator while AI responds
- Suggestion chips for quick replies
- Keyboard avoiding view
- Auto-scroll on new message

**Message Input Features:**
- Multi-line input (grows)
- Send button (disabled when empty)
- Attach button (files/images)
- Voice button (speech-to-text)

**AI Integration:**
- Send user message to backend
- Display streaming response (if supported)
- Handle errors gracefully
- Retry option on failure

**Checklist:**
- [ ] Messages display correctly
- [ ] User messages on right
- [ ] AI messages on left
- [ ] Input works
- [ ] Send works
- [ ] Typing indicator shows
- [ ] Suggestions work
- [ ] Keyboard avoidance works

### 3.3 Context Cards

**Web Files:**
- `src/features/conversations/components/PropertyContext.tsx`
- `src/features/conversations/components/ContextCards.tsx`

**Create:**
```
src/features/conversations/
├── components/
│   ├── PropertyContextCard.tsx     [ ] - Property in chat
│   ├── LeadContextCard.tsx         [ ] - Lead in chat
│   ├── AnalysisCard.tsx            [ ] - Analysis result
│   ├── ActionCard.tsx              [ ] - Suggested action
│   └── RichResponseCard.tsx        [ ] - Formatted response
```

**Context Cards:**
- Display inline with messages
- Property card (image, address, price)
- Lead card (name, contact, status)
- Analysis card (metrics summary)
- Action card (suggested next step)

**Checklist:**
- [ ] Property card renders
- [ ] Lead card renders
- [ ] Tap opens detail
- [ ] Styled correctly

---

## Phase 4: Analytics (Priority: MEDIUM)

### 4.1 Analytics Dashboard

**Web Files:**
- `src/features/analytics/pages/UsageStatisticsPage.tsx`
- `src/features/analytics/components/*.tsx`

**Create:**
```
src/features/analytics/
├── screens/
│   └── AnalyticsScreen.tsx         [ ] - Analytics dashboard
├── components/
│   ├── AnalyticsHeader.tsx         [ ] - Title + date range
│   ├── DateRangePicker.tsx         [ ] - Date selection
│   ├── MetricCard.tsx              [ ] - Single metric
│   ├── MetricsGrid.tsx             [ ] - Grid of metrics
│   ├── LeadsAnalyticsCard.tsx      [ ] - Leads chart
│   ├── ConversionsCard.tsx         [ ] - Conversions chart
│   ├── SourceBreakdownCard.tsx     [ ] - Lead sources
│   ├── ActivityHeatmap.tsx         [ ] - Activity by day
│   └── PerformanceCard.tsx         [ ] - Performance metrics
├── hooks/
│   ├── useAnalytics.ts             [ ] - Analytics data
│   └── useDateRange.ts             [ ] - Date range state
```

**Analytics Metrics:**
- Total Leads (period)
- New Leads (period)
- Qualified Leads
- Conversion Rate
- Average Response Time
- Revenue (if applicable)

**Charts:**
- Leads over time (line)
- Lead sources (pie)
- Conversion funnel (funnel/bar)
- Activity by day (heatmap or bar)

**Checklist:**
- [ ] Metrics load
- [ ] Charts render
- [ ] Date range works
- [ ] Data updates on range change

---

## Phase 5: Layout Components

### 5.1 App Layout

**Create:**
```
src/features/layout/
├── components/
│   ├── BottomTabs.tsx              [x] Enhance
│   ├── AppHeader.tsx               [ ] - Custom header
│   ├── TabBar.tsx                  [ ] - Custom tab bar
│   ├── TabBarIcon.tsx              [ ] - Tab icon
│   ├── TabBarBadge.tsx             [ ] - Badge on tab
│   ├── FloatingActionButton.tsx    [ ] - FAB
│   └── GlobalSearchBar.tsx         [ ] - Universal search
```

**BottomTabs Enhancements:**
- Badge for unread conversations
- Badge for new leads
- Active tab indicator
- Custom icons

**FloatingActionButton:**
- Quick add menu (Lead, Property, Chat)
- Expandable options
- Positioned bottom-right

**Checklist:**
- [ ] Tab badges work
- [ ] FAB renders
- [ ] FAB menu works

### 5.2 Global Search

**Create:**
```
src/features/layout/
├── screens/
│   └── GlobalSearchScreen.tsx      [ ] - Search all
├── components/
│   ├── SearchResults.tsx           [ ] - Combined results
│   ├── SearchResultItem.tsx        [ ] - Single result
│   ├── SearchHistory.tsx           [ ] - Recent searches
│   └── SearchFilters.tsx           [ ] - Filter by type
├── hooks/
│   └── useGlobalSearch.ts          [ ] - Search hook
```

**GlobalSearchScreen Requirements:**
- Search across leads, properties, conversations
- Results grouped by type
- Recent searches
- Filter by type

**Checklist:**
- [ ] Search works
- [ ] Results grouped
- [ ] Navigate to result
- [ ] Recent searches saved

---

## Phase 6: Notifications

### 6.1 In-App Notifications

**Create:**
```
src/features/notifications/
├── components/
│   ├── NotificationBell.tsx        [ ] - Bell icon + badge
│   ├── NotificationsSheet.tsx      [ ] - Notifications list
│   ├── NotificationItem.tsx        [ ] - Single notification
│   └── NotificationActions.tsx     [ ] - Mark read, dismiss
├── hooks/
│   └── useNotifications.ts         [ ] - Notifications data
├── services/
│   └── notificationService.ts      [ ] - API + push
```

**Notification Types:**
- New lead assigned
- Lead status change
- Property update
- Conversation message
- System alerts

**Checklist:**
- [ ] Bell shows count
- [ ] Sheet opens
- [ ] Notifications list
- [ ] Mark read works
- [ ] Navigate to source

---

## Hooks Summary

```
src/features/dashboard/hooks/
├── useDashboardStats.ts            [ ] Dashboard metrics
├── useRecentActivity.ts            [ ] Activity feed

src/features/leads/hooks/
├── useLeads.ts                     [x] Enhance
├── useLead.ts                      [ ] Single lead
├── useLeadFilters.ts               [ ] Filter state
├── useLeadSearch.ts                [ ] Search
├── useLeadActivity.ts              [ ] Activity timeline
├── useLeadMutations.ts             [ ] CRUD operations

src/features/conversations/hooks/
├── useConversations.ts             [ ] Conversations list
├── useConversation.ts              [ ] Single conversation
├── useMessages.ts                  [ ] Messages in chat
├── useChat.ts                      [x] Enhance
├── useAIResponse.ts                [ ] AI streaming

src/features/analytics/hooks/
├── useAnalytics.ts                 [ ] Analytics data
├── useDateRange.ts                 [ ] Date range state

src/features/layout/hooks/
├── useGlobalSearch.ts              [ ] Search hook

src/features/notifications/hooks/
├── useNotifications.ts             [ ] Notifications
```

---

## Services Summary

```
src/features/leads/services/
├── leadService.ts                  [ ] Lead CRUD
├── leadActivityService.ts          [ ] Activity logging

src/features/conversations/services/
├── conversationService.ts          [ ] Conversation CRUD
├── messageService.ts               [ ] Message operations
├── aiService.ts                    [ ] AI API calls

src/features/analytics/services/
├── analyticsService.ts             [ ] Analytics API

src/features/notifications/services/
├── notificationService.ts          [ ] Notification API
```

---

## Types

```typescript
// Lead
interface Lead {
  id: string;
  workspace_id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to?: string;
  interested_properties?: string[];
  budget_min?: number;
  budget_max?: number;
  last_contacted_at?: string;
  next_follow_up?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

type LeadSource = 'website' | 'referral' | 'social_media' | 'cold_call' | 'direct_mail' | 'paid_ad' | 'other';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

// Activity
interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

type ActivityType = 'call' | 'email' | 'text' | 'meeting' | 'note' | 'status_change' | 'property_shown';

// Conversation
interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  context?: ConversationContext;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: MessageMetadata;
  created_at: string;
}
```

---

## Navigation Structure

```tsx
// Dashboard (tab)
<Stack.Screen name="Dashboard" component={DashboardScreen} />

// Leads Navigator
<Stack.Screen name="LeadsList" component={LeadsListScreen} />
<Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
<Stack.Screen name="AddLead" component={AddLeadScreen} />
<Stack.Screen name="EditLead" component={EditLeadScreen} />

// Conversations Navigator
<Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
<Stack.Screen name="Chat" component={ChatScreen} />

// Analytics
<Stack.Screen name="Analytics" component={AnalyticsScreen} />

// Search
<Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} />
```

---

## Dependencies

```bash
# Charts
npx expo install react-native-chart-kit
# or
npx expo install victory-native

# Gesture handler (for swipeable)
npx expo install react-native-gesture-handler

# For rich chat (optional)
npx expo install react-native-gifted-chat
```

---

## UI Patterns

### Swipeable List Items

```tsx
import { Swipeable } from 'react-native-gesture-handler';

<Swipeable
  renderRightActions={() => (
    <View className="flex-row">
      <Pressable className="bg-blue-500 justify-center px-4" onPress={handleCall}>
        <Phone color="white" size={20} />
      </Pressable>
      <Pressable className="bg-green-500 justify-center px-4" onPress={handleText}>
        <MessageCircle color="white" size={20} />
      </Pressable>
      <Pressable className="bg-red-500 justify-center px-4" onPress={handleArchive}>
        <Archive color="white" size={20} />
      </Pressable>
    </View>
  )}
>
  <LeadCard lead={lead} />
</Swipeable>
```

### Chat Input

```tsx
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <View className="flex-row items-end p-2 border-t border-border">
    <Pressable className="p-2">
      <Paperclip size={24} color="#666" />
    </Pressable>
    <TextInput
      className="flex-1 max-h-24 bg-muted rounded-2xl px-4 py-2 mx-2"
      placeholder="Type a message..."
      multiline
      value={message}
      onChangeText={setMessage}
    />
    <Pressable
      className="p-2"
      onPress={handleSend}
      disabled={!message.trim()}
    >
      <Send size={24} color={message.trim() ? '#3b82f6' : '#ccc'} />
    </Pressable>
  </View>
</KeyboardAvoidingView>
```

---

## Progress Tracking

### Phase 1: Dashboard
| Task | Status | Notes |
|------|--------|-------|
| DashboardScreen | [ ] | |
| StatCard | [ ] | |
| QuickActions | [ ] | |
| RecentLeadsCard | [ ] | |
| ActivityFeed | [ ] | |
| LeadsChart | [ ] | |
| useDashboardStats | [ ] | |

### Phase 2: Leads Management
| Task | Status | Notes |
|------|--------|-------|
| LeadsListScreen (enhance) | [ ] | |
| LeadCard (enhance) | [ ] | |
| LeadsFiltersSheet | [ ] | |
| LeadDetailScreen | [ ] | |
| LeadDetailTabs | [ ] | |
| AddLeadScreen | [ ] | |
| LeadTimeline | [ ] | |
| useLeads (enhance) | [ ] | |

### Phase 3: AI Conversations
| Task | Status | Notes |
|------|--------|-------|
| ConversationsListScreen | [ ] | |
| ChatScreen | [ ] | |
| MessageList | [ ] | |
| MessageInput | [ ] | |
| TypingIndicator | [ ] | |
| SuggestionChips (enhance) | [ ] | |
| PropertyContextCard | [ ] | |
| useChat (enhance) | [ ] | |
| aiService | [ ] | |

### Phase 4: Analytics
| Task | Status | Notes |
|------|--------|-------|
| AnalyticsScreen | [ ] | |
| MetricsGrid | [ ] | |
| Charts (all) | [ ] | |
| DateRangePicker | [ ] | |
| useAnalytics | [ ] | |

### Phase 5: Layout
| Task | Status | Notes |
|------|--------|-------|
| BottomTabs (enhance) | [ ] | |
| FloatingActionButton | [ ] | |
| GlobalSearchScreen | [ ] | |
| TabBarBadge | [ ] | |

### Phase 6: Notifications
| Task | Status | Notes |
|------|--------|-------|
| NotificationBell | [ ] | |
| NotificationsSheet | [ ] | |
| NotificationItem | [ ] | |
| useNotifications | [ ] | |

---

## Testing Checklist

### Dashboard
- [ ] Dashboard loads with real stats
- [ ] Charts display correctly
- [ ] Quick actions work
- [ ] Recent items show
- [ ] Activity feed loads

### Leads
- [ ] Leads list with pagination
- [ ] Search and filters work
- [ ] Add lead saves correctly
- [ ] Edit lead updates correctly
- [ ] Lead detail shows all info
- [ ] Call/text/email actions work
- [ ] Activity timeline displays
- [ ] Swipe actions work

### Conversations
- [ ] Conversations list loads
- [ ] Chat messages display
- [ ] Send message works
- [ ] AI responses work
- [ ] Typing indicator shows
- [ ] Context cards display
- [ ] Suggestions work

### Analytics
- [ ] Analytics data loads
- [ ] Charts render correctly
- [ ] Date range changes data
- [ ] All metrics accurate

### Search
- [ ] Global search works
- [ ] Results show from all types
- [ ] Navigate to result works

---

## Blockers & Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| (Add issues here) | | |

---

*Last Updated: [Update this when you make progress]*
*Status: IN PROGRESS*
