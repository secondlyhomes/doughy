# Chat UI Reference (for CallPilot Messages Tab)

> This documents the Doughy app's chat/conversation UI patterns before they were removed from navigation. These patterns should be referenced when building CallPilot's Messages tab.

## File Map

### Shared UI Components (keep using these)
| File | Purpose |
|------|---------|
| `src/components/ui/MessageBubble.tsx` | Unified canonical bubble — supports direction-based (inbox) and role-based (assistant) modes |
| `src/components/ui/ConversationHeader.tsx` | Reusable header: back arrow + title + channel icon + AI sparkles badge + settings button |

### Feature: `src/features/conversations/` (AI conversation list)
| File | Purpose |
|------|---------|
| `screens/ConversationsListScreen.tsx` | List of AI chat sessions, FAB to create new, swipe-delete |
| `components/ConversationsView.tsx` | Reusable timeline view: search, filter chips, paginated FlatList |
| `hooks/useConversations.ts` | React Query wrapper (currently mock data) |

### Feature: `src/features/assistant/` (AI chat detail)
| File | Purpose |
|------|---------|
| `screens/AssistantScreen.tsx` | Main AI chat screen: FlatList + compose bar + suggestion chips |
| `components/MessageBubble.tsx` | Thin wrapper over unified MessageBubble |
| `components/SuggestionChips.tsx` | Quick-reply chips (horizontal compact or vertical card list) |
| `hooks/useChat.ts` | Chat state: local useState, 5-message history window |

### Feature: `src/features/rental-inbox/` (Landlord inbox)
| File | Purpose |
|------|---------|
| `screens/ConversationDetailScreen.tsx` | Full message thread + compose bar + AI review card |
| `components/MessageBubble.tsx` | Wrapper for unified bubble with direction + AI indicator |
| `components/ConversationCard.tsx` | Inbox list item with channel icon, badges, status highlights |
| `components/AIReviewCard.tsx` | Pending AI response review card |

### Feature: `src/features/lead-inbox/` (Investor inbox)
| File | Purpose |
|------|---------|
| `screens/LeadConversationScreen.tsx` | Full thread + compose bar + AI review |
| `components/LeadMessageBubble.tsx` | Rich bubble: avatar, sender label, AI confidence %, delivery status, feedback thumbs |
| `components/LeadConversationCard.tsx` | Inbox list item |
| `components/LeadAIReviewCard.tsx` | AI review with confidence threshold and auto-send toggle |

## UI Layouts

### AI Chat Detail (AssistantScreen)
```
SafeAreaView
  KeyboardAvoidingView (useKeyboardAvoidance, hasTabBar: true)
    FlatList (top-to-bottom, scrollToEnd on content change)
      MessageBubble (role-based, avatar, relative time)
      Empty: Sparkles icon + greeting + SuggestionChips (vertical cards)
      Footer: "Thinking..." loading bubble
    Input Bar (border-top, bg=background)
      SuggestionChips compact horizontal (when messages exist)
      Row: [TextInput rounded-2xl, max-h-32] | [Send button 44x44 rounded-full]
```

### Conversation Detail (Rental Inbox)
```
SafeAreaView
  Stack.Screen (native header: contact name + channel + AI badge)
  KeyboardAvoidingView (hasTabBar: false)
    Alert Banner (error, with retry/dismiss)
    FlatList inverted (newest at bottom)
      MessageBubble (direction-based, absolute time, AI badge)
      Empty: "No Messages Yet"
    AIReviewCard (above input, when pending response)
    Input Container (card bg, border-top, safe-area bottom)
      inputWrapper (rounded-xl border, flex-row)
        TextInput (multiline, maxLength 2000, maxHeight 120)
        Send button (36x36, rounded-full, primary when text)
```

### Conversation List (ConversationsListScreen)
```
SafeAreaView
  FlatList
    ConversationCard
      Row: [MessageCircle icon in circle] | [Title + lastMessage + time] | [Trash + Chevron]
    Empty: Sparkles icon + "No conversations yet" + "Start Chatting" button
    RefreshControl
  SimpleFAB (bottom-right, new conversation)
```

## MessageBubble Component Details

### Unified Component (`src/components/ui/MessageBubble.tsx`)

Two modes via props:

**Direction-based (inbox threads):**
- `direction: 'inbound' | 'outbound'`
- `isAI`, `showAIIndicator` — small "AI" badge inside bubble
- `timeFormat: 'absolute'` — "2:30 PM"
- No avatars

**Role-based (AI assistant):**
- `role: 'user' | 'assistant' | 'system'`
- `showAvatar: true` — Bot icon or User icon in circle
- `timeFormat: 'relative'` — "2m ago"
- System messages: centered pill

**Bubble Geometry:**
- `maxWidth: '85%'`
- `borderTopLeftRadius: xl`, `borderTopRightRadius: xl`
- Outbound tail: `borderBottomRightRadius: sm`
- Inbound tail: `borderBottomLeftRadius: sm`

**Colors:**
- Outbound user: `colors.primary` bg, `colors.primaryForeground` text
- Outbound AI: `withOpacity(colors.info, 'strong')` bg
- Inbound: `colors.muted` bg, `colors.foreground` text

### LeadMessageBubble (richest variant)
Adds to the unified bubble:
- 28x28 circle avatars on both sides
- Sender label row with AI confidence badge (green >= 85%, yellow < 85%)
- Delivery status: Clock (pending) -> Check (delivered) -> DoubleCheck (read, green) -> "Failed" (red)
- Thumbs up/down feedback row for AI messages (one-time selection)

## Key Design Patterns

### Keyboard Avoidance
```ts
const keyboardProps = useKeyboardAvoidance({ hasTabBar: false, hasNavigationHeader: false });
<KeyboardAvoidingView
  behavior={keyboardProps.behavior}
  keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
>
```

### Inverted FlatList (standard for two-party threads)
```tsx
<FlatList inverted data={messages} />
// Newest messages at bottom, renders bottom-to-top
// No need to scrollToEnd on append
```

### Input Bar (cleanest: ConversationDetailScreen)
```tsx
<View style={[styles.inputWrapper, { backgroundColor: colors.muted, borderColor: colors.border }]}>
  <TextInput multiline maxLength={2000} maxHeight={120} style={{ flex: 1, color: colors.foreground }} />
  <TouchableOpacity
    disabled={!messageText.trim() || isSending}
    style={[styles.sendButton, {
      backgroundColor: messageText.trim() ? colors.primary : colors.muted
    }]}
  >
    <Send size={18} color={messageText.trim() ? colors.primaryForeground : colors.mutedForeground} />
  </TouchableOpacity>
</View>
// sendButton: 36x36, borderRadius: 18
// inputWrapper: borderRadius: BORDER_RADIUS.xl (16), minHeight: 48
```

### Haptic Feedback
```ts
import { haptic } from '@/lib/haptics';
haptic.light();    // on send attempt
haptic.success();  // on AI approval
haptic.error();    // on failure
```

### Message Restore on Send Failure
```ts
const result = await send(trimmedMessage);
if (!result) {
  setMessageText(trimmedMessage); // restore input if send fails
}
```

### Error Banner (non-blocking)
```tsx
{error && (
  <Alert variant="destructive" icon={<AlertCircle />}>
    <AlertDescription>{error}</AlertDescription>
    <Button size="sm" variant="outline" onPress={handleRefresh}>Try Again</Button>
    <Button size="sm" variant="ghost" onPress={clearError}>Dismiss</Button>
  </Alert>
)}
```

## Dependencies

### Icons Used (lucide-react-native)
MessageCircle, Trash2, Clock, ChevronRight, Sparkles, Send, ArrowLeft, MoreVertical, Bot, Phone, Mail, MessageSquare, AlertCircle, ThumbsUp, ThumbsDown, Check, Plus, Filter, Search, Mic, StickyNote, User, Building2

### Shared UI Components Used
MessageBubble, ConversationHeader, LoadingSpinner, SimpleFAB, TAB_BAR_SAFE_PADDING, BottomSheet, Alert, AlertDescription, Button, Badge, SearchBar, EmptyState

### Hooks
- `@/hooks/useKeyboardAvoidance`
- `@/hooks/useNativeHeader`
- `@/lib/haptics`

## Recommendations for CallPilot

1. **Use the unified `MessageBubble`** from `@/components/ui` — it handles both inbox and assistant modes
2. **Use inverted FlatList** for real-time conversation threads
3. **Copy `ConversationDetailScreen`'s compose bar** — cleanest implementation
4. **Copy `LeadMessageBubble`'s delivery status + feedback** pattern for coaching card UI
5. **Copy `ConversationHeader`** for consistent header feel across screens
6. **Use haptic feedback** on all send/approve/reject actions
