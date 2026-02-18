# UI/UX Guide: Tab Bar Safe Areas & Bottom Padding

## Overview

This guide explains how to correctly implement bottom padding in screens to prevent content from going under the bottom tab bar. It covers the technical details, implementation patterns, and best practices specific to our app's architecture.

**Critical:** The app uses **Expo Router's NativeTabs** (native iOS `UITabBarController`), which automatically handles scroll view content insets. This guide reflects this architecture.

---

## Table of Contents

1. [How NativeTabs Works](#how-nativetabs-works)
2. [Implementation Patterns](#implementation-patterns)
3. [Common Mistakes](#common-mistakes)
4. [Testing Checklist](#testing-checklist)
5. [Troubleshooting](#troubleshooting)
6. [Examples from Codebase](#examples-from-codebase)

---

## How NativeTabs Works

### The Magic of UITabBarController

When you use Expo Router's NativeTabs, your app uses iOS's native `UITabBarController`. This comes with **automatic content inset adjustment**:

**From Apple's Official Documentation:**
> "When set to automatic, content is always adjusted vertically when the scroll view is the content view of a view controller that is currently displayed by a navigation or tab bar controller."

**What this means:**
- iOS automatically adds padding to `ScrollView` and `FlatList` components
- The padding accounts for BOTH the tab bar height (49px) AND the device's safe area (0-34px)
- We only need to add minimal visual breathing room (16px)

### Architecture Constants

```typescript
// From src/components/ui/FloatingGlassTabBar.tsx
export const TAB_BAR_HEIGHT = 49;           // Native iOS tab bar height
export const TAB_BAR_SAFE_PADDING = 16;     // Minimal visual breathing room
```

**Important Note:** `TAB_BAR_SAFE_PADDING` is just 16px of visual breathing room. iOS handles the rest automatically via `content InsetAdjustmentBehavior.automatic`.

---

## Implementation Patterns

### Pattern 1: Simple ScrollView/FlatList Screens

**Use for:** List screens, settings screens, dashboard screens

```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export function MyListScreen() {
  const { contentPadding } = useTabBarPadding();

  return (
    <ThemedSafeAreaView edges={['top']}>
      <FlatList
        data={items}
        contentContainerStyle={{ paddingBottom: contentPadding }}
        contentInsetAdjustmentBehavior="automatic"  // Let iOS handle insets
        // Returns just 16px - iOS auto-handles tab bar + safe area
      />
    </ThemedSafeAreaView>
  );
}
```

**Alternative (without hook):**
```typescript
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
contentInsetAdjustmentBehavior="automatic"  // Let iOS handle insets
```

**Examples:**
- `ConversationsListScreen.tsx`
- `SettingsScreen.tsx`
- `PortfolioScreen.tsx`
- `DealsListScreen.tsx`

---

### Pattern 2: Screens with Absolutely Positioned Bottom Bars

**Use for:** Detail screens with fixed action bars, wizard screens

```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const BOTTOM_BAR_HEIGHT = 72;

export function MyDetailScreen() {
  const { buttonBottom } = useTabBarPadding();

  return (
    <ThemedSafeAreaView edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* ScrollView with padding to clear the fixed element */}
        <ScrollView
          contentContainerStyle={{
            paddingBottom: BOTTOM_BAR_HEIGHT + 16  // Element height + margin
          }}
          contentInsetAdjustmentBehavior="automatic"  // Let iOS handle insets
        >
          {/* content */}
        </ScrollView>

        {/* Fixed bottom bar positioned above tab bar + safe area */}
        <View
          style={{
            position: 'absolute',
            bottom: buttonBottom,  // 49px + insets.bottom
            left: 0,
            right: 0,
            height: BOTTOM_BAR_HEIGHT,
          }}
        >
          {/* action buttons */}
        </View>
      </View>
    </ThemedSafeAreaView>
  );
}
```

**Why two paddings?**
- ScrollView `paddingBottom`: Clears the fixed bottom bar itself
- Bottom bar `bottom`: Positions the bar above the tab bar + safe area

**Examples:**
- `PropertyDetailScreen.tsx`
- `OfferBuilderScreen.tsx`

---

### Pattern 3: Screens with Search Bars

**Use for:** List screens with floating search bars

```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const SEARCH_BAR_HEIGHT = 52;
const SEARCH_GAP = 16;

export function MySearchScreen() {
  const { contentPadding } = useTabBarPadding();

  return (
    <ThemedSafeAreaView edges={['top']}>
      {/* Floating search bar */}
      <View className="absolute top-0 left-0 right-0 z-10">
        <SearchBar ... />
      </View>

      <FlatList
        data={filtered}
        contentContainerStyle={{
          paddingTop: SEARCH_BAR_HEIGHT + SEARCH_GAP,  // Clear search bar
          paddingBottom: contentPadding,  // Just 16px for tab bar
        }}
        contentInsetAdjustmentBehavior="automatic"  // Let iOS handle insets
      />
    </ThemedSafeAreaView>
  );
}
```

**Examples:**
- `PropertyListScreen.tsx`
- `LeadsListScreen.tsx`
- `DealsListScreen.tsx`

---

### Pattern 4: Keyboard Form Screens

**Use for:** Forms with text input

```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export function MyFormScreen() {
  const { contentPadding } = useTabBarPadding();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ThemedSafeAreaView edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: contentPadding,
          }}
          contentInsetAdjustmentBehavior="automatic"  // Let iOS handle insets
          keyboardShouldPersistTaps="handled"
        >
          <FormField label="Name" ... />
          <FormField label="Email" ... />
        </ScrollView>
      </ThemedSafeAreaView>
    </KeyboardAvoidingView>
  );
}
```

**Note:** `KeyboardAvoidingView` works with iOS's automatic inset adjustment

**Examples:**
- `AddLeadScreen.tsx`
- `EditPropertyScreen.tsx`

---

## Common Mistakes

### ❌ Mistake 1: Adding `insets.bottom` to Content Padding

```typescript
// WRONG - Causes double-padding with NativeTabs
const insets = useSafeAreaInsets();
contentContainerStyle={{
  paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom  // ❌ 50px on iPhone 14
}}
```

**Why it's wrong:** iOS already adds ~34px for the safe area automatically. Adding it manually results in 50px of excessive white space.

**Correct:**
```typescript
// CORRECT - Let iOS handle safe area
contentContainerStyle={{
  paddingBottom: TAB_BAR_SAFE_PADDING  // ✅ Just 16px
}}
```

---

### ❌ Mistake 2: No Padding at All

```typescript
// WRONG - Content touches tab bar
<ScrollView>
  {/* content */}
</ScrollView>
```

**Why it's wrong:** While iOS handles the safe area, we still need 16px of visual breathing room.

**Correct:**
```typescript
// CORRECT - Add minimal breathing room
<ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
  {/* content */}
</ScrollView>
```

---

### ❌ Mistake 3: Using Deprecated Hooks

```typescript
// WRONG - This hook doesn't work with NativeTabs
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
const tabBarHeight = useBottomTabBarHeight();
```

**Why it's wrong:** `useBottomTabBarHeight` is for React Navigation's custom tab bar, not NativeTabs (UITabBarController).

**Correct:**
```typescript
// CORRECT - Use our centralized hook
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
const { contentPadding, buttonBottom } = useTabBarPadding();
```

---

### ❌ Mistake 4: Hardcoded Values

```typescript
// WRONG - Magic number, doesn't update if constants change
contentContainerStyle={{ paddingBottom: 16 }}
```

**Why it's wrong:** If we change `TAB_BAR_SAFE_PADDING`, this won't update.

**Correct:**
```typescript
// CORRECT - Use constant or hook
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
```

---

## Testing Checklist

When implementing or verifying bottom padding:

### Device Testing Matrix
Test on at least 2 devices:
- ✅ **iPhone SE** (no home indicator, safe area bottom = 0px)
- ✅ **iPhone 14 Pro** (home indicator, safe area bottom ≈ 34px)

### Per-Screen Checklist
1. ✅ Open screen
2. ✅ Scroll to absolute bottom
3. ✅ Verify ~16px gap between last content and tab bar
4. ✅ No content cut off or hidden
5. ✅ No excessive white space (>50px = double-padding bug)
6. ✅ If screen has bottom bar: Bar appears above tab bar with clear gap
7. ✅ If keyboard screen: Type in input, verify keyboard doesn't hide tab bar

### Visual Verification
**What it should look like:**
- Content ends with ~16px of white space above tab bar
- Tab bar is clearly visible, not obscured
- Last item is fully visible (no cutting off mid-item)
- Consistent spacing with other screens (Settings, Conversations, Portfolio)

**Red flags:**
- 🚫 Last item is partially hidden
- 🚫 Content touches tab bar with no gap
- 🚫 Huge amount of white space (>50px) at bottom
- 🚫 Different spacing than other screens

---

## Troubleshooting

### Problem: Glass/Blur Effects Don't Render on Initial Load

**Symptoms:** Search bars or other `GlassView`/`LiquidGlassView` components don't show the glass effect on first render. They may appear as plain views or only render correctly after navigating away and back.

**Root Cause:** Missing Stack navigator layout. When a screen is rendered directly in NativeTabs without a Stack buffer, LiquidGlassView has timing issues calculating its bounds on initial mount.

**Architecture Comparison:**
| Tab Structure | Glass Works? |
|---------------|--------------|
| `NativeTabs → Stack → Screen` (folder with `_layout.tsx`) | ✅ YES |
| `NativeTabs → Screen` (direct route file) | ❌ NO |

**Example of the Problem:**
```
app/(admin)/
├── _layout.tsx          # NativeTabs
├── users/               # ✅ Works - has Stack layout
│   ├── _layout.tsx      # Stack navigator
│   └── index.tsx        # Screen
├── logs.tsx             # ❌ Broken - direct file, no Stack
└── integrations.tsx     # ❌ Broken - direct file, no Stack
```

**The Solution:**

Convert direct route files to folder-based routes with Stack layouts:

```
app/(admin)/
├── _layout.tsx          # NativeTabs
├── users/               # ✅ Has Stack
│   ├── _layout.tsx
│   └── index.tsx
├── logs/                # ✅ Now has Stack
│   ├── _layout.tsx      # Stack navigator
│   └── index.tsx        # Screen (moved from logs.tsx)
└── integrations/        # ✅ Now has Stack
    ├── _layout.tsx      # Stack navigator
    └── index.tsx        # Screen (moved from integrations.tsx)
```

**Stack Layout Template:**
```tsx
// app/(admin)/logs/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminLogsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
```

**Screen File (moved to index.tsx):**
```tsx
// app/(admin)/logs/index.tsx
export { SystemLogsScreen as default } from '@/features/admin/screens/SystemLogsScreen';
```

**After making changes:** Clear Metro cache and restart:
```bash
npx expo start -c
```

**Why This Works:**
The Stack navigator provides a layout buffer that gives LiquidGlassView time to properly calculate its bounds before rendering. Without it, the glass effect layer doesn't initialize correctly on the first frame.

---

### Problem: Content goes under tab bar

**Symptoms:** Last items in list are cut off, buttons not clickable

**Diagnosis:**
```bash
# Check if screen is missing paddingBottom
rg "contentContainerStyle" src/features/*/screens/YourScreen.tsx

# Look for the screen's ScrollView/FlatList
# Verify it has paddingBottom set
```

**Solution:**
Add `contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}`

---

### Problem: Too much white space at bottom

**Symptoms:** 50px+ of empty space between content and tab bar

**Diagnosis:**
```bash
# Check if screen is adding insets.bottom incorrectly
rg "paddingBottom.*insets\.bottom" src/features/*/screens/YourScreen.tsx
```

**Solution:**
Remove `+ insets.bottom` from the padding calculation

---

### Problem: Absolutely positioned button goes under tab bar

**Symptoms:** Fixed action bar is partially hidden

**Diagnosis:**
Check if the absolutely positioned element uses `buttonBottom`:
```typescript
// Look for bottom: TAB_BAR_HEIGHT + insets.bottom (WRONG)
// Should be: bottom: buttonBottom (CORRECT)
```

**Solution:**
```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
const { buttonBottom } = useTabBarPadding();

<View style={{ position: 'absolute', bottom: buttonBottom }} />
```

---

### Problem: Screen works on iPhone SE but not iPhone 14

**Symptoms:** Perfect on older devices, broken on devices with home indicator

**Diagnosis:**
Likely using hardcoded values instead of safe area calculations

**Solution:**
Use `useTabBarPadding()` hook which accounts for device differences

---

### Problem: App Background Color Shows at Keyboard Corners (iOS)

**Symptoms:** When the keyboard opens, small triangular "slices" of the app's background color appear at the top-left and top-right corners of the keyboard area, making the keyboard look rectangular instead of having rounded edges.

**Root Cause:** The `KeyboardAvoidingView` doesn't have a background color set. When the keyboard animates up on iOS, it pushes content by adjusting the view's padding/height. During this animation, the transparent corners of the KeyboardAvoidingView reveal whatever is behind it (the window's default background).

**Diagnosis:**
```bash
# Check if KeyboardAvoidingView has a background color
rg "KeyboardAvoidingView" src/features/*/screens/YourScreen.tsx -A 5
```

Look for `KeyboardAvoidingView` without a `style={{ backgroundColor: ... }}` prop.

**Solution:**
```typescript
import { useThemeColors } from '@/context/ThemeContext';

function MyScreen() {
  const colors = useThemeColors();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}  // ← Add this
    >
      {/* content */}
    </KeyboardAvoidingView>
  );
}
```

**Why It Works:**
Setting `backgroundColor: colors.background` on the KeyboardAvoidingView ensures the entire view, including its corners during keyboard animation, matches your app's background - eliminating the visual artifacts.

**Example Fix (IntegrationsScreen):**
```typescript
// Before - corner artifacts visible
<KeyboardAvoidingView
  behavior={keyboardProps.behavior}
  keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
  className="flex-1"
>

// After - no artifacts
<KeyboardAvoidingView
  behavior={keyboardProps.behavior}
  keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
  className="flex-1"
  style={{ backgroundColor: colors.background }}
>
```

---

## Examples from Codebase

### Example 1: Simple List (Conversations)
**File:** `src/features/conversations/screens/ConversationsListScreen.tsx:207`

```typescript
<FlatList
  data={conversations}
  contentContainerStyle={{
    padding: 16,
    paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px
  }}
/>
```

**Why it works:** iOS handles tab bar + safe area automatically, we just add visual breathing room.

---

### Example 2: Detail with Bottom Bar (Property)
**File:** `src/features/real-estate/screens/PropertyDetailScreen.tsx:132,198`

```typescript
const { buttonBottom } = useTabBarPadding();
const BOTTOM_BAR_HEIGHT = 72;

<View style={{ flex: 1 }}>
  <ScrollView
    contentContainerStyle={{
      paddingBottom: BOTTOM_BAR_HEIGHT + 16  // Clear the fixed bar
    }}
  >
    {/* content */}
  </ScrollView>

  <View
    style={{
      position: 'absolute',
      bottom: buttonBottom,  // Above tab bar
      // ...
    }}
  >
    {/* Edit, Delete buttons */}
  </View>
</View>
```

**Why it works:**
- ScrollView padding clears the fixed bottom bar
- Bottom bar uses `buttonBottom` to position above tab bar + safe area

---

### Example 3: Search Bar (Properties List)
**File:** `src/features/real-estate/screens/PropertyListScreen.tsx:112`

```typescript
<FlatList
  data={properties}
  contentContainerStyle={{
    paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
    paddingHorizontal: 16,
    paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px
  }}
/>
```

**Why it works:**
- `paddingTop` clears the floating search bar
- `paddingBottom` provides tab bar breathing room
- iOS handles the actual tab bar clearance

---

## Key Takeaways

1. ✅ **Use `useTabBarPadding()` hook** for all tab bar spacing needs
2. ✅ **Never add `insets.bottom`** to content padding with NativeTabs
3. ✅ **Only add 16px breathing room** for scrollable content
4. ✅ **Absolutely positioned elements** need manual positioning with `buttonBottom`
5. ✅ **Test on both iPhone SE and iPhone 14 Pro** to verify correct behavior

---

## Additional Resources

### Official Documentation
- [Apple UIScrollView ContentInsetAdjustmentBehavior](https://developer.apple.com/documentation/uikit/uiscrollview/2902261-contentinsetadjustmentbehavior)
- [Apple automatic behavior](https://developer.apple.com/documentation/uikit/uiscrollview/contentinsetadjustmentbehavior/automatic)
- [Expo Router Native Tabs](https://docs.expo.dev/versions/latest/sdk/router-native-tabs/)
- [React Navigation Safe Areas](https://reactnavigation.org/docs/handling-safe-area/)

### Internal Documentation
- [DESIGN_SYSTEM.md - Tab Bar Section](./DESIGN_SYSTEM.md#tab-bar-spacing--bottom-padding)
- [TROUBLESHOOTING.md - Content Going Under Tab Bar](./TROUBLESHOOTING.md#content-going-under-tab-bar)
- [useTabBarPadding Hook](../src/hooks/useTabBarPadding.ts)

---

## Questions?

If you're unsure which pattern to use:
1. Does your screen have scrollable content? → Use Pattern 1
2. Does it have a fixed bottom bar? → Use Pattern 2
3. Does it have a floating search bar? → Use Pattern 3
4. Is it a form with keyboard input? → Use Pattern 4

When in doubt, look at working examples: `ConversationsListScreen`, `SettingsScreen`, or `PortfolioScreen`.
