# ZONE D: Dashboard, Leads, Conversations & Layout - Stage 2

**Instance 4 Assignment - Full Implementation**

## Overview

Fully implement dashboard, leads management, AI conversations, and layout components.

**Source Directories:**
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/dashboard/` (7 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/leads/` (95 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/conversations/` (39 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/layout/` (16 files)

**Target Directory:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/features/`

---

## Current Status (Stage 1 Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| DashboardScreen | Basic | Needs full stats, charts |
| LeadsListScreen | Basic | Needs full implementation |
| AssistantScreen | Basic | Needs full chat functionality |
| BottomTabs | Done | Navigation working |

---

## Phase 1: Dashboard (Priority: HIGH)

### 1.1 Main Dashboard

**Web Files to Convert:**
- `src/features/dashboard/components/DashboardStats.tsx`
- `src/features/dashboard/components/DashboardCharts.tsx`
- `src/features/dashboard/components/RecentActivity.tsx`
- `src/features/dashboard/pages/Dashboard.tsx`

**Mobile Implementation:**
```
src/features/dashboard/screens/
├── DashboardScreen.tsx             [ ] - Main dashboard
├── components/
│   ├── DashboardHeader.tsx         [ ] - Welcome message + date
│   ├── StatCard.tsx                [ ] - Single metric card
│   ├── StatsRow.tsx                [ ] - Row of stat cards
│   ├── QuickActions.tsx            [ ] - Quick action buttons
│   ├── RecentLeadsCard.tsx         [ ] - Recent leads preview
│   ├── RecentPropertiesCard.tsx    [ ] - Recent properties preview
│   ├── ActivityFeed.tsx            [ ] - Recent activity list
│   ├── ActivityItem.tsx            [ ] - Single activity
│   ├── LeadsChart.tsx              [ ] - Leads over time chart
│   ├── ConversionsChart.tsx        [ ] - Conversion funnel
│   └── PerformanceMetrics.tsx      [ ] - Key metrics display
```

### 1.2 Dashboard Stats

**Data to Display:**
- Total Leads (with trend)
- Total Properties
- Active Deals
- Monthly Revenue
- Conversion Rate
- Response Time

```tsx
// src/features/dashboard/hooks/useDashboardStats.ts
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      // Fetch from Supabase
      const { data } = await supabase.rpc('get_dashboard_stats');
      return data;
    },
  });
}
```

---

## Phase 2: Leads Management (Priority: CRITICAL)

### 2.1 Leads List

**Web Files to Convert:**
- `src/features/leads/pages/LeadsPage.tsx`
- `src/features/leads/components/LeadsList.tsx`
- `src/features/leads/components/LeadCard.tsx`
- `src/features/leads/components/LeadsFilters.tsx`
- `src/features/leads/components/LeadsSort.tsx`

**Mobile Implementation:**
```
src/features/leads/screens/
├── LeadsListScreen.tsx             [ ] - Main leads list
├── components/
│   ├── LeadCard.tsx                [ ] - Lead list item
│   ├── LeadCardActions.tsx         [ ] - Swipe actions
│   ├── LeadsHeader.tsx             [ ] - Search + filter button
│   ├── LeadsFiltersSheet.tsx       [ ] - Filter bottom sheet
│   ├── LeadsSortSheet.tsx          [ ] - Sort options
│   ├── LeadsEmptyState.tsx         [ ] - No leads view
│   ├── LeadStatusBadge.tsx         [ ] - Status indicator
│   └── LeadPriorityBadge.tsx       [ ] - Priority indicator
```

### 2.2 Lead Detail

**Web Files to Convert:**
- `src/features/leads/pages/LeadDetailPage.tsx`
- `src/features/leads/components/LeadDetail*.tsx`
- `src/features/leads/components/LeadTabs.tsx`

**Mobile Implementation:**
```
src/features/leads/screens/
├── LeadDetailScreen.tsx            [ ] - Full lead detail
├── components/
│   ├── LeadHeader.tsx              [ ] - Name, status, actions
│   ├── LeadContactInfo.tsx         [ ] - Phone, email, address
│   ├── LeadTabs.tsx                [ ] - Tab navigation
│   ├── LeadOverviewTab.tsx         [ ] - Overview content
│   ├── LeadActivityTab.tsx         [ ] - Activity timeline
│   ├── LeadPropertiesTab.tsx       [ ] - Associated properties
│   ├── LeadNotesTab.tsx            [ ] - Notes section
│   ├── LeadCallButton.tsx          [ ] - Quick call
│   ├── LeadMessageButton.tsx       [ ] - Quick message
│   └── LeadMoreMenu.tsx            [ ] - Actions menu
```

### 2.3 Add/Edit Lead

**Web Files to Convert:**
- `src/features/leads/components/LeadForm.tsx`
- `src/features/leads/components/AddLeadModal.tsx`
- `src/features/leads/components/EditLeadModal.tsx`

**Mobile Implementation:**
```
src/features/leads/screens/
├── AddLeadScreen.tsx               [ ] - Add new lead
├── EditLeadScreen.tsx              [ ] - Edit existing lead
├── components/
│   ├── LeadFormBasic.tsx           [ ] - Name, email, phone
│   ├── LeadFormDetails.tsx         [ ] - Source, status, priority
│   ├── LeadFormProperty.tsx        [ ] - Property interest
│   ├── LeadFormNotes.tsx           [ ] - Initial notes
│   ├── LeadSourcePicker.tsx        [ ] - Source selection
│   ├── LeadStatusPicker.tsx        [ ] - Status selection
│   └── LeadPriorityPicker.tsx      [ ] - Priority selection
```

### 2.4 Lead Actions

**Mobile Implementation:**
```
src/features/leads/components/
├── LeadQuickActions.tsx            [ ] - Call/Text/Email
├── LeadStatusSheet.tsx             [ ] - Change status
├── LeadAssignSheet.tsx             [ ] - Assign to team member
├── LeadArchiveConfirm.tsx          [ ] - Archive/delete confirm
└── LeadShareSheet.tsx              [ ] - Share lead info
```

### 2.5 Lead Activity & Timeline

**Web Files to Convert:**
- `src/features/leads/components/LeadActivity*.tsx`
- `src/features/leads/components/LeadTimeline.tsx`

**Mobile Implementation:**
```
src/features/leads/components/
├── LeadTimeline.tsx                [ ] - Full activity timeline
├── TimelineItem.tsx                [ ] - Single activity
├── TimelineCall.tsx                [ ] - Call activity
├── TimelineEmail.tsx               [ ] - Email activity
├── TimelineNote.tsx                [ ] - Note activity
├── TimelineStatusChange.tsx        [ ] - Status change
├── AddActivitySheet.tsx            [ ] - Log new activity
└── ActivityTypePicker.tsx          [ ] - Activity type selection
```

---

## Phase 3: AI Conversations (Priority: HIGH)

### 3.1 Conversation List

**Web Files to Convert:**
- `src/features/conversations/pages/ConversationsPage.tsx`
- `src/features/conversations/components/ConversationList.tsx`
- `src/features/conversations/components/ConversationCard.tsx`

**Mobile Implementation:**
```
src/features/conversations/screens/
├── ConversationsListScreen.tsx     [ ] - All conversations
├── components/
│   ├── ConversationCard.tsx        [ ] - Conversation preview
│   ├── ConversationPreview.tsx     [ ] - Last message preview
│   ├── ConversationBadge.tsx       [ ] - Unread count
│   └── ConversationsEmpty.tsx      [ ] - No conversations
```

### 3.2 Chat Interface

**Web Files to Convert:**
- `src/features/conversations/components/ChatInterface.tsx`
- `src/features/conversations/components/MessageBubble.tsx`
- `src/features/conversations/components/MessageInput.tsx`
- `src/features/conversations/components/SuggestionChips.tsx`

**Mobile Implementation:**
```
src/features/conversations/screens/
├── ChatScreen.tsx                  [ ] - Full chat interface
├── components/
│   ├── MessageList.tsx             [ ] - Inverted FlatList
│   ├── MessageBubble.tsx           [ ] - Single message
│   ├── UserMessage.tsx             [ ] - User message style
│   ├── AssistantMessage.tsx        [ ] - AI message style
│   ├── MessageInput.tsx            [ ] - Text input + send
│   ├── MessageInputBar.tsx         [ ] - Input container
│   ├── SendButton.tsx              [ ] - Send message
│   ├── AttachButton.tsx            [ ] - Attach files
│   ├── VoiceButton.tsx             [ ] - Voice input
│   ├── SuggestionChips.tsx         [ ] - Quick replies
│   ├── TypingIndicator.tsx         [ ] - AI typing...
│   ├── MessageActions.tsx          [ ] - Copy, regenerate
│   └── ChatHeader.tsx              [ ] - Title, back, menu
```

### 3.3 AI Integration

**Mobile Implementation:**
```
src/features/conversations/services/
├── chatService.ts                  [ ] - Send/receive messages
├── aiService.ts                    [ ] - AI API integration
└── conversationService.ts          [ ] - CRUD operations

src/features/conversations/hooks/
├── useChat.ts                      [ ] - Chat state management
├── useMessages.ts                  [ ] - Messages list
├── useConversations.ts             [ ] - Conversations list
└── useAIResponse.ts                [ ] - AI streaming response
```

### 3.4 Property Assistant

**Web Files to Convert:**
- `src/features/conversations/components/PropertyContext.tsx`
- `src/features/conversations/components/ContextCards.tsx`

**Mobile Implementation:**
```
src/features/conversations/components/
├── PropertyContextCard.tsx         [ ] - Show property in chat
├── LeadContextCard.tsx             [ ] - Show lead in chat
├── AnalysisCard.tsx                [ ] - Show analysis result
├── ActionCard.tsx                  [ ] - Suggested action
└── RichResponseCard.tsx            [ ] - Formatted AI response
```

---

## Phase 4: Layout & Navigation (Priority: MEDIUM)

### 4.1 App Layout

**Web Files to Convert:**
- `src/features/layout/components/MainLayout.tsx`
- `src/features/layout/components/Header.tsx`
- `src/features/layout/components/Sidebar.tsx`

**Mobile Implementation:**
```
src/features/layout/components/
├── BottomTabs.tsx                  [x] Done - enhance
├── AppHeader.tsx                   [ ] - Custom header
├── TabBar.tsx                      [ ] - Custom tab bar
├── TabBarIcon.tsx                  [ ] - Tab icon component
├── TabBarBadge.tsx                 [ ] - Notification badge
└── FloatingActionButton.tsx        [ ] - FAB for quick add
```

### 4.2 Search

**Web Files to Convert:**
- `src/features/layout/components/SearchBar.tsx`
- `src/features/layout/components/GlobalSearch.tsx`

**Mobile Implementation:**
```
src/features/layout/components/
├── GlobalSearchBar.tsx             [ ] - Universal search
├── SearchResults.tsx               [ ] - Combined results
├── SearchResultItem.tsx            [ ] - Single result
└── SearchHistory.tsx               [ ] - Recent searches
```

### 4.3 Notifications

**Mobile Implementation:**
```
src/features/layout/components/
├── NotificationBell.tsx            [ ] - Bell icon + badge
├── NotificationsSheet.tsx          [ ] - Notifications list
├── NotificationItem.tsx            [ ] - Single notification
└── NotificationActions.tsx         [ ] - Mark read, dismiss
```

---

## Hooks to Implement

```
src/features/dashboard/hooks/
├── useDashboardStats.ts            [ ] - Dashboard metrics
├── useRecentActivity.ts            [ ] - Activity feed
└── useQuickActions.ts              [ ] - Quick action handlers

src/features/leads/hooks/
├── useLeads.ts                     [x] Basic - enhance
├── useLead.ts                      [ ] - Single lead
├── useLeadFilters.ts               [ ] - Filter state
├── useLeadSearch.ts                [ ] - Search functionality
├── useLeadActions.ts               [ ] - CRUD operations
├── useLeadActivity.ts              [ ] - Activity timeline
└── useLeadProperties.ts            [ ] - Associated properties

src/features/conversations/hooks/
├── useConversations.ts             [ ] - Conversations list
├── useConversation.ts              [ ] - Single conversation
├── useMessages.ts                  [ ] - Messages in chat
├── useChat.ts                      [ ] - Chat operations
└── useAIStreaming.ts               [ ] - Streaming responses
```

---

## Services to Implement

```
src/features/leads/services/
├── leadService.ts                  [ ] - Lead CRUD
├── leadActivityService.ts          [ ] - Activity logging
└── leadExportService.ts            [ ] - Export leads

src/features/conversations/services/
├── conversationService.ts          [ ] - Conversation CRUD
├── messageService.ts               [ ] - Message operations
└── aiService.ts                    [ ] - AI API calls
```

---

## Types to Define

```tsx
// src/features/leads/types/index.ts

export interface Lead {
  id: string;
  workspace_id: string;
  user_id: string;

  // Contact Info
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Lead Details
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to?: string;

  // Property Interest
  interested_properties?: string[];
  budget_min?: number;
  budget_max?: number;
  property_type_preference?: string[];

  // Engagement
  last_contacted_at?: string;
  next_follow_up?: string;
  tags?: string[];
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export type LeadSource =
  | 'website'
  | 'referral'
  | 'social_media'
  | 'cold_call'
  | 'direct_mail'
  | 'paid_ad'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'text'
  | 'meeting'
  | 'note'
  | 'status_change'
  | 'property_shown';

// src/features/conversations/types/index.ts

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  context?: ConversationContext;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  property_id?: string;
  lead_id?: string;
  action_type?: string;
  context_cards?: ContextCard[];
}

export interface ConversationContext {
  property_id?: string;
  lead_id?: string;
  analysis_id?: string;
}
```

---

## Navigation Structure

```tsx
// Leads Navigator
const LeadsStack = createNativeStackNavigator();

<LeadsStack.Navigator>
  <LeadsStack.Screen name="LeadsList" component={LeadsListScreen} />
  <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreen} />
  <LeadsStack.Screen name="AddLead" component={AddLeadScreen} />
  <LeadsStack.Screen name="EditLead" component={EditLeadScreen} />
</LeadsStack.Navigator>

// Conversations Navigator
const ConversationsStack = createNativeStackNavigator();

<ConversationsStack.Navigator>
  <ConversationsStack.Screen name="ConversationsList" component={ConversationsListScreen} />
  <ConversationsStack.Screen name="Chat" component={ChatScreen} />
</ConversationsStack.Navigator>
```

---

## UI Patterns

### Swipeable List Item

```tsx
// For leads/conversations list items
import { Swipeable } from 'react-native-gesture-handler';

<Swipeable
  renderRightActions={() => (
    <View className="flex-row">
      <TouchableOpacity className="bg-blue-500 justify-center px-4">
        <Phone color="white" />
      </TouchableOpacity>
      <TouchableOpacity className="bg-red-500 justify-center px-4">
        <Trash color="white" />
      </TouchableOpacity>
    </View>
  )}
>
  <LeadCard lead={lead} />
</Swipeable>
```

### Chat Input

```tsx
// Chat input with growing height
<KeyboardAvoidingView behavior="padding">
  <View className="flex-row items-end p-2 border-t">
    <TextInput
      multiline
      className="flex-1 max-h-24 bg-muted rounded-full px-4 py-2"
      placeholder="Type a message..."
    />
    <TouchableOpacity className="ml-2 p-2">
      <Send size={24} color="#3b82f6" />
    </TouchableOpacity>
  </View>
</KeyboardAvoidingView>
```

---

## Dependencies to Install

```bash
npm install react-native-gesture-handler  # Already installed
npm install react-native-gifted-chat      # Optional: full chat UI
```

---

## Testing Checklist

- [ ] Dashboard loads with real stats
- [ ] Charts display correctly
- [ ] Leads list with pagination works
- [ ] Lead search and filters work
- [ ] Add lead saves to database
- [ ] Edit lead updates correctly
- [ ] Lead detail shows all info
- [ ] Call/text/email actions work
- [ ] Activity timeline displays
- [ ] Conversations list loads
- [ ] Chat messages send/receive
- [ ] AI responses stream correctly
- [ ] Context cards display in chat
- [ ] Global search finds leads/properties
