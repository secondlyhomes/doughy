# Doughy Chat Implementation Reference

Reference document for rebuilding CallPilot's Messages tab from Doughy's inbox patterns.

## Architecture Overview

Doughy has **three inbox systems**:

| System | Module | Route | Feature Dir |
|--------|--------|-------|-------------|
| Rental Inbox | Landlord | `/(tabs)/landlord-inbox/` | `src/features/rental-inbox/` |
| Lead Inbox | Investor | `/(tabs)/investor-inbox/` | `src/features/lead-inbox/` |
| Conversations | AI Assistant | `/(tabs)/conversations/` | `src/features/conversations/` |

## Message Bubble Colors

### Unified MessageBubble (`src/components/ui/MessageBubble.tsx`)

| Sender | Background | Text Color | Alignment |
|--------|-----------|------------|-----------|
| User outbound | `colors.primary` (sage green) | `colors.primaryForeground` (white) | Right |
| AI outbound | `withOpacity(colors.info, 'strong')` (blue) | `colors.primaryForeground` (white) | Right |
| Inbound (contact) | `colors.muted` (gray) | `colors.foreground` (default) | Left |

### LeadMessageBubble (investor inbox)

| Sender | Background | Text Color |
|--------|-----------|------------|
| User outbound | `colors.primary` | `colors.primaryForeground` |
| AI outbound | `withOpacity(colors.info, 'medium')` | `colors.foreground` |
| Lead inbound | `colors.muted` | `colors.foreground` |

### Bubble Shape

```
borderTopLeftRadius: BORDER_RADIUS.xl (16)
borderTopRightRadius: BORDER_RADIUS.xl (16)
borderBottomRightRadius: outbound ? BORDER_RADIUS.sm (6) : BORDER_RADIUS.xl (16)
borderBottomLeftRadius: outbound ? BORDER_RADIUS.xl (16) : BORDER_RADIUS.sm (6)
```

Padding: `SPACING.md` horizontal, `SPACING.sm` vertical. Max width: 85% (unified) or 75% (lead).

### AI Indicator Badge

Small pill inside bubble top-left: Bot icon + "AI" text.
- Background: `withOpacity(colors.background, 'medium')`
- Text: `colors.primaryForeground`
- Font: `FONT_SIZES['2xs']`, weight 600

### Sender Label + Timestamp

Below the bubble:
- Timestamp: `FONT_SIZES.xs`, `colors.mutedForeground`
- Sender label: `FONT_SIZES.xs`, italic, `colors.mutedForeground`
- Outbound: "You" or "AI Assistant", right-aligned
- Inbound: contact name, left-aligned

## Keyboard Handling

### Approach: `KeyboardAvoidingView` with calculated offset

**Hook:** `src/hooks/useKeyboardAvoidance.ts`

```typescript
behavior: Platform.OS === 'ios' ? 'padding' : 'height'
keyboardVerticalOffset: Platform.OS === 'ios' ? calculatedOffset : 0
```

Offset calculation:
- `+TAB_BAR_HEIGHT` if tab bar visible
- `+insets.bottom` if tab bar visible (home indicator)
- `+44` (NAVIGATION_BAR_HEIGHT) if native nav header
- `+customOffset` for additional adjustment

**Lead Inbox uses hardcoded:** `keyboardVerticalOffset={90}` on `KeyboardAvoidingView`.

### FlatList Config

```typescript
<FlatList
  inverted                    // newest at bottom
  keyboardDismissMode="interactive"  // (CallPilot uses this)
  keyboardShouldPersistTaps="handled"
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## Compose Bar

Inline in the conversation screen (not a separate component in lead-inbox):

```
┌─────────────────────────────────────┐
│ [muted bg input field     ] [Send] │
│  multiline, maxHeight: 100         │
└─────────────────────────────────────┘
```

- Input container: `backgroundColor: colors.muted`, `borderRadius: BORDER_RADIUS.lg`
- Send button: 44x44 circle, `colors.primary` when active, `colors.muted` when disabled
- Send icon: `Send` from lucide, 20px
- Border top: 1px `colors.border`
- Padding bottom: `insets.bottom + SPACING.sm`

## Data Layer

### Tables
- `landlord.conversations` / `investor.conversations`
- `landlord.messages` / `investor.messages`
- `landlord.ai_queue_items` / `investor.ai_queue_items`

### Queries
- Messages fetched with `.order('created_at', { ascending: false })`
- Stored in Zustand: `messages: Record<conversationId, Message[]>`

### Realtime
- `createRealtimeSubscription` with retry logic (2s/4s/8s backoff, max 3)
- Subscribes to conversations + ai_queue_items tables
- Per-conversation message subscription on INSERT

## Send Flow

1. User taps Send → clear text, call `send(content)`
2. Insert to `messages` table: `{ conversation_id, direction: 'outbound', content, sent_by: 'user' }`
3. On failure: restore text in UI

### AI Approval Flow
1. Review `AIReviewCard` → optionally edit → tap Approve
2. Update `ai_queue_items` status to `'approved'`
3. Insert outbound message with `sent_by: 'ai'`
4. 5-second delayed send with undo capability
5. After delay: call `lead-response-sender` Edge Function

## Landlord Inbox Tabs

`InboxModeControl.tsx` — animated segmented control:
- `['leads', 'residents']` with icons + descriptions
- Animated pill slider using `Animated.spring` (tension: 300, friction: 30)
- Client-side filter on `contact_types` array
- Haptic feedback on toggle

## Navigation

- Conversation detail: `fullScreenModal` presentation, `slide_from_bottom` animation
- List → Detail: `slide_from_right`
