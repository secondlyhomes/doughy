# Troubleshooting Guide

This document captures solutions to complex issues encountered during development.

---

## Navigation Context Error with NativeWind

### The Error

```
ERROR [Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?]
```

This error appears at app startup, typically pointing to components in `app/_layout.tsx`.

### Root Cause

**NativeWind's `CssInterop.View` wrapper** causes this error when using `className` prop on components that render **outside** the NavigationContainer (which Expo Router provides via `<Slot />`).

When you use `className` on any View, NativeWind wraps it with `CssInterop.View`. In development mode, this wrapper's `printUpgradeWarning` function tries to JSON.stringify React elements, which recursively accesses navigation context - even though the component itself doesn't use navigation.

**Stack trace signature:**
```
at get getKey (navigation context access)
at stringify (native)
at printUpgradeWarning
at renderComponent
at interop
at CssInterop.View  ← NativeWind's wrapper
```

### The Fix

**Don't use `className` in root layout components.** Use `style` prop instead for any components that render before `<Slot />`.

---

## NativeWind Dark Mode Catch-22

### The Problem

NativeWind has a fundamental limitation with programmatic dark mode ([GitHub Issue #587](https://github.com/marklawlor/nativewind/issues/587), [#1489](https://github.com/nativewind/nativewind/issues/1489)):

| Setting | Manual Toggle | System Detection | Works? |
|---------|---------------|------------------|--------|
| `darkMode: 'media'` | NO - `colorScheme.set()` doesn't work | YES | NO - needs manual toggle |
| `darkMode: 'class'` | YES - but needs `.dark` class | YES | NO - triggers CssInterop bug |

**This is a catch-22.** The app needs manual toggle support but can't safely use `.dark` class in root layouts.

### The Solution: Inline Styles with `useThemeColors()`

**Use inline styles for ALL colors in React Native components.**

This is the industry-standard approach used by:
- React Native Paper
- Tamagui
- shadcn-rn
- Expo's theming guide

### How It Works

```tsx
import { useThemeColors } from '@/context/ThemeContext';

function MyComponent() {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-xl p-4 flex-row items-center"  // Layout only
      style={{ backgroundColor: colors.card, borderColor: colors.border }}  // Colors via hook
    >
      <Text style={{ color: colors.foreground }}>Hello</Text>
    </View>
  );
}
```

### Pattern Summary

**DO:**
```tsx
// Use Tailwind for layout
className="rounded-xl p-4 flex-row items-center"

// Use inline styles for colors
style={{ backgroundColor: colors.card }}
style={{ color: colors.foreground }}
style={{ borderColor: colors.border }}
```

**DON'T:**
```tsx
// Don't use Tailwind for colors - they won't update reliably in dark mode
className="bg-card text-foreground border-border"
```

### Color Conversions

| Tailwind Class | Inline Style |
|----------------|--------------|
| `bg-card` | `style={{ backgroundColor: colors.card }}` |
| `bg-muted` | `style={{ backgroundColor: colors.muted }}` |
| `bg-primary` | `style={{ backgroundColor: colors.primary }}` |
| `text-foreground` | `style={{ color: colors.foreground }}` |
| `text-muted-foreground` | `style={{ color: colors.mutedForeground }}` |
| `text-primary` | `style={{ color: colors.primary }}` |
| `text-success` | `style={{ color: colors.success }}` |
| `text-destructive` | `style={{ color: colors.destructive }}` |
| `border-border` | `style={{ borderColor: colors.border }}` |
| `bg-primary/10` | `style={{ backgroundColor: \`${colors.primary}15\` }}` |

### Icon Colors

For lucide-react-native icons, pass colors directly:

```tsx
// Don't use className
<Home size={18} className="text-primary" />  // Won't work reliably

// Do use color prop
<Home size={18} color={colors.primary} />    // Always works
```

---

## Theme Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Theme System                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User toggles theme                                          │
│         ↓                                                    │
│  ThemeContext.setMode('dark')                               │
│         ↓                                                    │
│  AsyncStorage.setItem() - persist preference                │
│         ↓                                                    │
│  isDark computed (mode + systemColorScheme)                 │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Appearance.setColorScheme('dark')  → RN system      │   │
│  │ colorScheme.set('dark')            → NativeWind     │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ useThemeColors() returns correct color palette      │   │
│  │ based on isDark state from React context            │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Components re-render with new colors via:           │   │
│  │ • style={{ backgroundColor: colors.card }}          │   │
│  │ • style={{ color: colors.foreground }}              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout - ThemeSync uses `style` only, no className |
| `src/context/ThemeContext.tsx` | Theme state + `useThemeColors()` hook |
| `global.css` | CSS variables (backup for layout classes) |
| `tailwind.config.js` | `darkMode: 'class'` (doesn't matter since colors are inline) |

---

## Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  // Note: We use inline styles with useThemeColors() for colors, not Tailwind color classes.
  // This is because NativeWind has limitations with programmatic dark mode switching.
  darkMode: 'class',
  // ...
}
```

The `darkMode` setting doesn't affect our color handling since we use inline styles. We keep it as `'class'` for any edge cases.

---

## Future Migration Plan

### When NativeWind Fixes This

Track these issues for updates:
- [NativeWind Issue #587](https://github.com/marklawlor/nativewind/issues/587) - Manual toggle with `darkMode: 'class'`
- [NativeWind Issue #1489](https://github.com/nativewind/nativewind/issues/1489) - `colorScheme.set()` with `darkMode: 'media'`

### Migration Strategy (When Fixed)

Simple find-replace conversion:
```tsx
// Current workaround
style={{ backgroundColor: colors.card }}

// Future (when NativeWind supports it)
className="bg-card"
```

### Why Migration Will Be Easy

1. **Color names match Tailwind** - `card`, `foreground`, `primary` are the same
2. **ThemeColors interface is Tailwind-compatible** - No custom color names
3. **Pattern is isolated** - Just change inline styles to className
4. **Could create migration script** - regex replace patterns

---

## Complete Dark Mode Migration (January 2026)

### Background

This documents a **complete, app-wide migration** from Tailwind color classes to inline styles using `useThemeColors()`. This was a breaking change that touched every single component in the codebase.

### Why This Was Necessary

As documented above in "NativeWind Dark Mode Catch-22", NativeWind has fundamental limitations with programmatic dark mode switching. The only reliable solution is to use inline styles with a React context hook for ALL color values.

### Migration Scope

**Total files modified: 150+**

This migration converted EVERY Tailwind color class in the entire codebase to inline styles.

#### Files Fixed by Category:

**UI Components (30 files):**
- All components in `src/components/ui/` including: AlertDialog, Accordion, Progress, Skeleton, Button, Badge, BottomSheet, Calendar, DatePicker, DropdownMenu, EmptyState, FileUpload, LoadingSpinner, OTPInput, RadioGroup, Select, Table, Tabs, Toast, and more

**Real Estate Feature (40+ files):**
- PropertyLocationMap.tsx, PropertyMap.tsx, EditPropertyScreen.tsx
- PropertyMapScreen.tsx, PropertyDocsTab.tsx, PropertyFormWizard.tsx
- AddressAutocomplete.tsx, FinancingPreview.tsx
- PropertyLocationMap.web.tsx, PropertyMap.web.tsx
- All property form steps, analytics, comps, repairs tabs
- ARV calculators, cash flow analysis, financing comparison tables

**Auth System (12 files):**
- All auth guards: AuthGuard, AdminGuard, OnboardingGuard, EmailVerifiedGuard
- All auth screens: Login, Signup, MFA Setup/Verify, Reset Password, Verify Email, Onboarding
- PasswordStrengthIndicator component

**Admin Feature (8 files):**
- UserRoleButton, UserInfoRow, UserProfileHeader
- AdminDashboardScreen, IntegrationsScreen, SystemLogsScreen
- UserDetailScreen, UserManagementScreen

**Deals Feature (13 files):**
- WeHandleToggles, AddDealEventSheet, DealTimeline
- OfferPreview, OfferTermsForm, SellerReportPreview, ShareReportSheet
- DealCockpitScreen, DealDocsScreen, DealsListScreen
- OfferBuilderScreen, QuickUnderwriteScreen, SellerReportBuilderScreen

**Leads Feature (13 files):**
- LeadCard, LeadContactInfo, LeadNotesSection, LeadQuickActions, LeadTimeline
- AddActivitySheet, LeadsFiltersSheet
- AddLeadScreen, EditLeadScreen, LeadDetailScreen, LeadsListScreen

**Public/Marketing Site (13 files):**
- Navbar, Footer, PublicLayout
- LandingScreen, AboutScreen, PricingScreen, ContactScreen
- TermsScreen, PrivacyScreen
- ROIScreen, AIAgentsScreen, LeadManagementScreen, RealEstateScreen

**Other Features:**
- Analytics: LeadsChart, AnalyticsScreen
- Assistant: MessageBubble, SuggestionChips, AssistantScreen
- Field Mode: PhotoBucketCard, VoiceMemoRecorder, WalkthroughSummary, FieldModeScreen
- Documentation: DocumentationScreen, AskDoughyModal
- Dashboard, Conversations, Billing, Notifications, Settings, Teams screens
- Layout components: ErrorBoundary, FloatingActionButton

**Core Files:**
- app/_layout.tsx, app/index.tsx, app/(tabs)/_layout.tsx
- global.css, tailwind.config.js
- src/config/index.ts
- src/context/ThemeContext.tsx

### The Pattern Applied

Every color-related Tailwind class was converted following this pattern:

#### Background Colors
```tsx
// Before
className="bg-card"
className="bg-muted"
className="bg-primary"

// After
style={{ backgroundColor: colors.card }}
style={{ backgroundColor: colors.muted }}
style={{ backgroundColor: colors.primary }}
```

#### Text Colors
```tsx
// Before
className="text-foreground"
className="text-muted-foreground"
className="text-primary"
className="text-destructive"

// After
style={{ color: colors.foreground }}
style={{ color: colors.mutedForeground }}
style={{ color: colors.primary }}
style={{ color: colors.destructive }}
```

#### Border Colors
```tsx
// Before
className="border-border"
className="border-primary"

// After
style={{ borderColor: colors.border }}
style={{ borderColor: colors.primary }}
```

#### Icon Colors
```tsx
// Before
<Home size={18} className="text-primary" />

// After
<Home size={18} color={colors.primary} />
```

#### Opacity Colors
```tsx
// Before
className="bg-primary/10"

// After
style={{ backgroundColor: `${colors.primary}15` }}
// Note: 15 hex = ~8% opacity, 1A hex = ~10% opacity, 33 hex = ~20% opacity
```

### Testing Instructions

After this migration, the app must be thoroughly tested:

```bash
# 1. Clear Metro bundler cache (CRITICAL)
npx expo start -c

# 2. Test theme switching
# - Go to Settings → Appearance
# - Toggle between Light / Dark / System modes
# - Verify all colors change correctly on EVERY screen

# 3. Test on both platforms
# - iOS simulator/device
# - Android emulator/device
# - Web browser

# 4. Check all major screens
# - Dashboard
# - Properties list and detail
# - Deals list and detail
# - Leads list and detail
# - All public marketing pages
# - All admin screens
# - Analytics
# - AI Assistant
# - Field mode
# - Settings
```

### What This Fixes

✅ Dark mode now works reliably across entire app
✅ Theme toggle in Settings → Appearance works instantly
✅ System theme detection works
✅ No more stale colors after theme switch
✅ No more navigation context errors
✅ Colors update in real-time without app restart

### What Still Uses Tailwind

Layout and spacing classes still use Tailwind (as they should):

```tsx
// These still work perfectly with Tailwind
className="rounded-xl p-4 flex-row items-center gap-2 shadow-sm"
className="w-full h-12 px-4 justify-center"
className="absolute top-4 right-4"
```

**Only colors use inline styles.** Everything else uses Tailwind.

### Common Mistakes to Avoid

❌ **Don't mix color classes with inline styles:**
```tsx
// BAD - mixing approaches
<View className="bg-card rounded-xl" style={{ borderColor: colors.border }} />
```

✅ **DO separate layout from colors:**
```tsx
// GOOD - Tailwind for layout, inline for colors
<View className="rounded-xl" style={{ backgroundColor: colors.card, borderColor: colors.border }} />
```

❌ **Don't forget to import the hook:**
```tsx
// BAD - using colors without hook
style={{ backgroundColor: colors.card }}  // colors is undefined!
```

✅ **DO import and call useThemeColors:**
```tsx
// GOOD
import { useThemeColors } from '@/context/ThemeContext';

function MyComponent() {
  const colors = useThemeColors();
  return <View style={{ backgroundColor: colors.card }} />;
}
```

### Adding New Components

When creating new components, follow this pattern:

```tsx
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

export function NewComponent() {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-xl p-4 flex-row items-center"  // Layout only
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1
      }}
    >
      <Text style={{ color: colors.foreground }}>
        Content here
      </Text>
    </View>
  );
}
```

### Future Considerations

When NativeWind eventually fixes their programmatic dark mode support (track [Issue #587](https://github.com/marklawlor/nativewind/issues/587) and [#1489](https://github.com/nativewind/nativewind/issues/1489)), we can migrate back to Tailwind classes.

The migration will be straightforward since our color names match Tailwind's semantic tokens:
```tsx
// Current
style={{ backgroundColor: colors.card }}

// Future (when NativeWind is fixed)
className="bg-card"
```

A regex-based migration script could automate this conversion.

### Key Takeaway for Future Developers

**If dark mode stops working or colors don't update when switching themes:**

1. Check if someone added Tailwind color classes (bg-, text-, border-)
2. Convert them to inline styles with `useThemeColors()`
3. See the pattern examples above
4. Remember: Layout = Tailwind, Colors = Inline styles

This was a painful but necessary migration. The app now has bulletproof dark mode support that works reliably across all platforms.

---

## Content Going Under Tab Bar

### Symptoms

- Buttons, text, or content hidden behind bottom tab bar
- Last items in scrollable lists are partially cut off
- Action buttons not clickable at bottom of screen
- Excessive white space (50px+) between content and tab bar on newer devices
- Inconsistent spacing across different screens

### Root Cause

**The App Uses NativeTabs (UITabBarController)**

The app uses Expo Router's **NativeTabs**, which is iOS's native `UITabBarController`. This automatically handles scroll view content insets for the tab bar and safe area.

**Key Constants:**
```typescript
// From src/components/ui/FloatingGlassTabBar.tsx
export const TAB_BAR_HEIGHT = 49;           // Native iOS tab bar height
export const TAB_BAR_SAFE_PADDING = 16;     // Minimal visual breathing room ONLY
```

**IMPORTANT:** `TAB_BAR_SAFE_PADDING` is just 16px of visual breathing room. iOS handles the actual tab bar clearance automatically via `contentInsetAdjustmentBehavior.automatic`.

### Common Causes

**1. Missing `paddingBottom` entirely:**
```typescript
// ❌ WRONG - Content will touch tab bar
<ScrollView>
  {/* content */}
</ScrollView>
```

**2. Adding `insets.bottom` incorrectly (double-padding):**
```typescript
// ❌ WRONG - iOS already handles this, causes 50px+ white space
const insets = useSafeAreaInsets();
contentContainerStyle={{
  paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom  // Double-padding!
}}
```

**3. Using deprecated hooks:**
```typescript
// ❌ WRONG - This hook doesn't work with NativeTabs
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
const tabBarHeight = useBottomTabBarHeight();
```

### The Solution

**For ScrollView/FlatList content:**
```typescript
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

<ScrollView
  contentContainerStyle={{
    paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px - iOS handles the rest
  }}
>
```

**Or use the hook (recommended):**
```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const { contentPadding } = useTabBarPadding();

<ScrollView contentContainerStyle={{ paddingBottom: contentPadding }}>
```

**For absolutely positioned bottom elements:**
```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const { buttonBottom } = useTabBarPadding();

<View
  style={{
    position: 'absolute',
    bottom: buttonBottom,  // 49px + insets.bottom
    left: 0,
    right: 0,
  }}
>
  {/* action buttons */}
</View>
```

### Troubleshooting Steps

#### Problem: Content still goes under tab bar

**Diagnosis:**
```bash
# Check if screen is missing paddingBottom
rg "contentContainerStyle" src/features/*/screens/YourScreen.tsx

# Look for the screen's ScrollView/FlatList
# Verify it has paddingBottom set
```

**Solution:**
Add `contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}`

#### Problem: Too much white space at bottom (50px+)

**Symptoms:** Excessive empty space between content and tab bar

**Diagnosis:**
```bash
# Check if screen is adding insets.bottom incorrectly
rg "paddingBottom.*insets\.bottom" src/features/*/screens/YourScreen.tsx
```

**Solution:**
Remove `+ insets.bottom` from the padding calculation. With NativeTabs, iOS handles this automatically.

#### Problem: Absolutely positioned button goes under tab bar

**Symptoms:** Fixed action bar is partially hidden behind tab bar

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

#### Problem: Works on iPhone SE but not iPhone 14

**Symptoms:** Perfect on older devices, broken on devices with home indicator

**Diagnosis:**
Likely using hardcoded values instead of safe area calculations

**Solution:**
Use `useTabBarPadding()` hook which accounts for device differences

### Quick Reference

**✅ CORRECT - ScrollView/FlatList:**
```typescript
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

<ScrollView
  contentContainerStyle={{
    paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px
  }}
/>
```

**❌ WRONG - Adding insets.bottom:**
```typescript
// DO NOT DO THIS with NativeTabs!
const insets = useSafeAreaInsets();
contentContainerStyle={{
  paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom  // Double-padding!
}}
```

**✅ CORRECT - Absolutely Positioned Elements:**
```typescript
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const { buttonBottom } = useTabBarPadding();

<View
  style={{
    position: 'absolute',
    bottom: buttonBottom,  // 49px + insets.bottom
  }}
/>
```

**❌ WRONG - Hardcoded bottom: 0:**
```typescript
// Button will go under tab bar
<View style={{ position: 'absolute', bottom: 0 }} />
```

### Why It Works

**From Apple's Official Documentation:**
> "When set to automatic, content is always adjusted vertically when the scroll view is the content view of a view controller that is currently displayed by a navigation or tab bar controller."

**Source:** [UIScrollView.ContentInsetAdjustmentBehavior.automatic](https://developer.apple.com/documentation/uikit/uiscrollview/contentinsetadjustmentbehavior/automatic)

**What This Means:**
- Expo Router's NativeTabs uses iOS's native `UITabBarController`
- iOS automatically adds padding to `ScrollView` and `FlatList` components
- The padding accounts for BOTH the tab bar height (49px) AND the device's safe area (0-34px)
- We only need to add minimal visual breathing room (16px)

### Related Documentation

- **Complete UI/UX Guide:** [UI_UX_TAB_BAR_SAFE_AREAS.md](./UI_UX_TAB_BAR_SAFE_AREAS.md) - Comprehensive patterns and examples
- **Design System:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#tab-bar-spacing--bottom-padding) - Tab bar spacing patterns
- **Hook Source:** `src/hooks/useTabBarPadding.ts` - Implementation details
- **Apple Documentation:** [UIScrollView ContentInsetAdjustmentBehavior](https://developer.apple.com/documentation/uikit/uiscrollview/2902261-contentinsetadjustmentbehavior)
- **Expo Router:** [Native Tabs Documentation](https://docs.expo.dev/versions/latest/sdk/router-native-tabs/)

### Key Takeaways

1. ✅ **Use `useTabBarPadding()` hook** for all tab bar spacing needs
2. ✅ **Never add `insets.bottom`** to content padding with NativeTabs
3. ✅ **Only add 16px breathing room** for scrollable content
4. ✅ **Absolutely positioned elements** need manual positioning with `buttonBottom`
5. ✅ **Test on both iPhone SE and iPhone 14 Pro** to verify correct behavior

---

## LiquidGlassView / GlassView Not Rendering on Initial Load

### Symptoms

- Search bars or other glass effect components appear as plain views on first render
- Glass blur effect only appears after navigating away and back to the screen
- Works fine after hot reload but not on fresh app launch
- Issue affects specific screens while others work correctly

### Root Cause

**Missing Stack Navigator Layout**

When using Expo Router's **NativeTabs** (native `UITabBarController`), screens need a Stack navigator buffer for `LiquidGlassView` to properly calculate its bounds on initial mount.

**The Architecture:**
```
✅ WORKS:    NativeTabs → Stack → Screen
❌ BROKEN:   NativeTabs → Screen (no Stack)
```

**Why It Happens:**
`LiquidGlassView` (from `@callstack/liquid-glass`) has a timing issue when rendered directly within NativeTabs. The glass effect layer needs the Stack navigator's layout pass to properly calculate its rendering bounds on the first frame.

### Diagnosis

Check if the affected screen is a direct route file vs. a folder-based route:

```bash
# List the route structure
ls -la app/(admin)/

# Direct files (PROBLEM):
# logs.tsx              ← No Stack, glass won't render
# integrations.tsx      ← No Stack, glass won't render

# Folder-based (WORKS):
# users/                ← Has _layout.tsx with Stack
#   _layout.tsx
#   index.tsx
```

**Pattern Comparison:**
| Route Structure | Has Stack? | Glass Works? |
|-----------------|------------|--------------|
| `app/(tabs)/logs.tsx` | NO | ❌ |
| `app/(tabs)/logs/_layout.tsx` + `index.tsx` | YES | ✅ |

### The Solution

Convert direct route files to folder-based routes with Stack layouts.

**Before (broken):**
```
app/(admin)/
├── _layout.tsx          # NativeTabs
├── logs.tsx             # ❌ Direct file - no Stack buffer
└── integrations.tsx     # ❌ Direct file - no Stack buffer
```

**After (fixed):**
```
app/(admin)/
├── _layout.tsx          # NativeTabs
├── logs/
│   ├── _layout.tsx      # ✅ Stack navigator
│   └── index.tsx        # Screen (content from logs.tsx)
└── integrations/
    ├── _layout.tsx      # ✅ Stack navigator
    └── index.tsx        # Screen (content from integrations.tsx)
```

### Implementation

**Step 1: Create the Stack layout file:**
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

**Step 2: Move screen export to index.tsx:**
```tsx
// app/(admin)/logs/index.tsx
export { SystemLogsScreen as default } from '@/features/admin/screens/SystemLogsScreen';
```

**Step 3: Delete the old direct route file:**
```bash
rm app/(admin)/logs.tsx
```

**Step 4: Clear Metro cache and restart:**
```bash
npx expo start -c
```

The `-c` flag is **critical** - Metro caches routes, and without clearing, you'll get duplicate screen errors.

### Common Error After Fix

```
ERROR [Error: A navigator cannot contain multiple 'Screen' components
with the same name (found duplicate screen named 'logs')]
```

**Cause:** Metro bundler cached the old route structure.

**Solution:** Always run `npx expo start -c` after changing route files.

### Quick Checklist

When adding new tabs to NativeTabs:

- [ ] Create folder-based route (not direct file)
- [ ] Add `_layout.tsx` with Stack navigator
- [ ] Add `index.tsx` with screen export
- [ ] Run `npx expo start -c` to clear cache
- [ ] Verify glass effects render on first load

### Why Not Fix in GlassView?

A RAF (requestAnimationFrame) workaround in `GlassView.tsx` was attempted but is not the correct fix:
- It causes a visible flash (plain view → glass view)
- It doesn't address the root architectural issue
- The Stack navigator is the proper solution per Expo Router's design

### Related Files

- `src/components/ui/GlassView.tsx` - Glass effect component
- `app/(tabs)/_layout.tsx` - Main app NativeTabs
- `app/(admin)/_layout.tsx` - Admin panel NativeTabs
- Any `_layout.tsx` files using NativeTabs

### Key Takeaways

1. ✅ **Always use folder-based routes** for NativeTabs screens
2. ✅ **Include a Stack layout** in each tab folder
3. ✅ **Clear Metro cache** (`npx expo start -c`) after route changes
4. ❌ **Don't use direct route files** (e.g., `logs.tsx`) in NativeTabs
5. ❌ **Don't add RAF workarounds** to GlassView - fix the architecture

---

## App Background Color Shows at Keyboard Corners (iOS)

### Symptoms

- Small triangular "slices" of the app's background color appear at the top-left and top-right corners of the keyboard area when the keyboard opens
- The keyboard looks rectangular instead of having rounded/flush edges
- Issue only occurs on iOS during keyboard animation

### Root Cause

**Missing Background Color on KeyboardAvoidingView**

When using `KeyboardAvoidingView` on iOS, the view adjusts its content by modifying padding/height during keyboard animation. If the `KeyboardAvoidingView` doesn't have a background color set (transparent by default), the corners of the view reveal whatever is behind it - typically the window's default background color.

### Diagnosis

```bash
# Check if KeyboardAvoidingView has a background color
rg "KeyboardAvoidingView" src/features/*/screens/YourScreen.tsx -A 5
```

Look for `KeyboardAvoidingView` without a `style={{ backgroundColor: ... }}` prop.

### The Solution

Add a background color to the `KeyboardAvoidingView` that matches your screen's background:

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

### Why It Works

Setting `backgroundColor: colors.background` on the `KeyboardAvoidingView` ensures the entire view, including its corners during keyboard animation, matches your app's background. This eliminates the visual artifacts because there's no longer a color mismatch between the view and its parent.

### Example Fix

**Before (corner artifacts visible):**
```typescript
<KeyboardAvoidingView
  behavior={keyboardProps.behavior}
  keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
  className="flex-1"
>
```

**After (no artifacts):**
```typescript
<KeyboardAvoidingView
  behavior={keyboardProps.behavior}
  keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
  className="flex-1"
  style={{ backgroundColor: colors.background }}
>
```

### Related Issue: Extra Keyboard Padding

If there's an extra gap (e.g., 44pt) above the keyboard when editing form fields, check the `useKeyboardAvoidance` hook configuration:

```typescript
// WRONG - adds 44pt offset for a header that doesn't exist
const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: true });

// CORRECT - no header in tab navigator
const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });
```

The `hasNavigationHeader` option adds 44pt (standard iOS nav bar height) to the keyboard offset. Only use `true` when the screen is in a Stack navigator with a visible header.

### Key Takeaways

1. ✅ **Always add background color** to `KeyboardAvoidingView` matching screen background
2. ✅ **Set `hasNavigationHeader: false`** in `useKeyboardAvoidance` for tab screens without stack headers
3. ✅ **Use `colors.background`** from `useThemeColors()` for theme-aware coloring
4. ❌ **Don't leave KeyboardAvoidingView transparent** - it causes visual artifacts on iOS

### Related Documentation

- [UI_UX_TAB_BAR_SAFE_AREAS.md](./UI_UX_TAB_BAR_SAFE_AREAS.md) - Pattern 4: Keyboard Form Screens
- `src/hooks/useKeyboardAvoidance.ts` - Keyboard avoidance hook implementation

---

## OpenClaw Server — Production Issues

### SMS: Twilio Signature Validation Always Fails

**Symptom:** Server logs show `[Security] Invalid Twilio signature — rejecting webhook` for every incoming SMS. Or SMS just silently gets rejected.

**Root cause:** `SERVER_URL` env var missing or wrong on the droplet. The Twilio signature middleware reconstructs the webhook URL as `config.serverUrl + req.originalUrl`. Without `SERVER_URL`, it defaults to `http://localhost:3000`, which never matches what Twilio signed against (`https://openclaw.doughy.app/webhooks/sms`).

**Fix:**
```bash
ssh claw
# Check current value:
grep SERVER_URL /var/www/openclaw/.env
# If missing or wrong:
echo 'SERVER_URL=https://openclaw.doughy.app' >> /var/www/openclaw/.env
pm2 restart openclaw --update-env
```

**Verify:** Send a text, then `ssh claw "pm2 logs openclaw --lines 20 --nostream"` — should see `[SMS] Message from +1XXX: <text>`.

**Note:** `[Security] Missing X-Twilio-Signature header` in logs is normal — that's bots/scanners, not real Twilio traffic.

**Related env vars for SMS:**
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` — Twilio credentials
- `CLAW_PHONE_USER_MAP` — JSON mapping E.164 phones to Supabase user UUIDs
- `SERVER_URL` — **must** match the public URL Twilio sends webhooks to

---

### PostgREST: "Invalid schema" Error for Existing Schemas

**Symptom:** Server logs show `PGRST106 — Invalid schema: callpilot` (or any schema) even though the schema exists and is in `pgrst.db_schemas`.

**Root cause:** PostgREST caches its schema list. After adding a new schema to the exposed list, the cache must be explicitly reloaded.

**Fix (via Supabase SQL editor or MCP):**
```sql
NOTIFY pgrst, 'reload schema';
```

If the schema was just added to `pgrst.db_schemas`:
```sql
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
```

**Full manual fix:**
```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, investor, landlord, ai, crm, integrations, claw, callpilot';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
```

**Current exposed schemas (Feb 2026):** `public, graphql_public, investor, landlord, ai, crm, integrations, claw, callpilot`

---

### Discord Bot: Messages Not Being Processed

**Symptom:** Bot shows as online, can send messages, but incoming messages aren't flowing into the app.

**Possible causes:**
1. **User not linked:** Discord user ID must exist in `claw.channel_preferences` with `channel = 'discord'`. Without it, bot replies "I don't recognize your account."
2. **Wrong channel:** Bot only responds in `DISCORD_CHANNEL_ID` or DMs. Messages in other channels are silently ignored.
3. **v15 deprecation:** Bot uses `ready` event (should be `clientReady` for discord.js v15). Still works but generates a warning — not the cause of message issues.

**Diagnosis:**
```bash
ssh claw "pm2 logs openclaw --lines 100 --nostream 2>&1 | grep Discord"
```

---

### PM2 Not Picking Up New Environment Variables

**Symptom:** After editing `.env`, server behavior doesn't change.

**Root cause:** PM2 caches the env from when the process was first started.

**Fix:** Always use `--update-env`:
```bash
pm2 restart openclaw --update-env
```

---

### Supabase 502/503 in Queue Processor

**Symptom:** `[Queue] processQueue error: 502 Bad gateway` or `PGRST002`.

**Root cause:** Transient Supabase/Cloudflare issue. Queue runs every 5 seconds and auto-recovers.

**Action:** None needed. If persistent (>10 min), check [status.supabase.com](https://status.supabase.com/).

---

### Server Deployment — Common Gotchas

| Gotcha | What Happens | Fix |
|--------|-------------|-----|
| Forgot `--update-env` on pm2 restart | New env vars not picked up | `pm2 restart openclaw --update-env` |
| Rsync'd `.env` file | Overwrote production secrets | Always exclude: `--exclude='.env'` |
| Added npm dependency but didn't install on server | `Module not found` crash | Rsync `package.json` + `package-lock.json`, run `npm install --production` on server |
| Forgot to build before deploying | Old code still runs | `npm run build` locally first, then rsync `dist/` |
| Schema not exposed after migration | `PGRST106 Invalid schema` | `NOTIFY pgrst, 'reload config'; NOTIFY pgrst, 'reload schema';` |

---

## References

- [NativeWind Dark Mode Docs](https://www.nativewind.dev/docs/core-concepts/dark-mode)
- [NativeWind vars() API](https://www.nativewind.dev/docs/api/vars)
- [GitHub Issue #702 - Dark theme toggle fix](https://github.com/nativewind/nativewind/issues/702)
- [GitHub Issue #587 - Manual toggle issue](https://github.com/marklawlor/nativewind/issues/587)
- [Expo Router Navigation Context](https://docs.expo.dev/router/reference/authentication/)
