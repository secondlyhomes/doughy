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

## References

- [NativeWind Dark Mode Docs](https://www.nativewind.dev/docs/core-concepts/dark-mode)
- [NativeWind vars() API](https://www.nativewind.dev/docs/api/vars)
- [GitHub Issue #702 - Dark theme toggle fix](https://github.com/nativewind/nativewind/issues/702)
- [GitHub Issue #587 - Manual toggle issue](https://github.com/marklawlor/nativewind/issues/587)
- [Expo Router Navigation Context](https://docs.expo.dev/router/reference/authentication/)
