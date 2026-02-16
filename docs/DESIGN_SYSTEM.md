# Design System Guide

Comprehensive guide to the Doughy AI design system: tokens, utilities, components, and patterns.

**Last Updated:** January 30, 2026
**Status:** Phase 1, 2, & 3 Complete (iOS 26 Liquid Glass, Shared Formatters, Platform Considerations)

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [iOS 26 Liquid Glass](#ios-26-liquid-glass)
3. [Utility Functions](#utility-functions)
4. [Shared Formatters](#shared-formatters)
5. [Reusable Components](#reusable-components)
6. [Color Guidelines](#color-guidelines)
7. [Migration Guides](#migration-guides)
8. [Best Practices](#best-practices)
9. [Platform Considerations](#platform-considerations)

---

## Design Tokens

All design tokens are located in `/src/constants/design-tokens.ts`.

### Spacing

Based on a 4px grid system. Use these for padding, margins, and gaps.

```typescript
import { SPACING } from '@/constants/design-tokens';

<View style={{ padding: SPACING.lg, gap: SPACING.md }} />
```

**Available values:**
- `xs: 4` - Very tight spacing
- `sm: 8` - Tight spacing
- `md: 12` - Standard spacing
- `lg: 16` - Comfortable spacing
- `xl: 20` - Loose spacing
- `2xl: 24` - Extra loose
- `3xl: 32` - Section spacing
- `4xl: 40` - Large section spacing

### Border Radius

Consistent rounding for all UI elements.

```typescript
import { BORDER_RADIUS } from '@/constants/design-tokens';

<View style={{ borderRadius: BORDER_RADIUS.lg }} />
```

**Available values:**
- `sm: 6` - Subtle rounding
- `md: 8` - Standard rounding
- `lg: 12` - Comfortable rounding
- `xl: 16` - Prominent rounding
- `2xl: 20` - Extra prominent
- `full: 9999` - Fully rounded (pills, circles)

### Opacity

Hex suffix values for semi-transparent colors.

```typescript
import { OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

const mutedBg = withOpacity(colors.primary, 'muted'); // 10% opacity
```

**Available values:**
- `subtle: '0D'` - 5% opacity (very faint)
- `muted: '1A'` - 10% opacity (subtle backgrounds)
- `light: '20'` - 12.5% opacity (light overlays)
- `medium: '33'` - 20% opacity (standard overlays)
- `strong: '4D'` - 30% opacity (prominent overlays)
- `opaque: '80'` - 50% opacity (semi-transparent)
- `backdrop: '80'` - 50% opacity (default backdrop)
- `backdropLight: '66'` - 40% opacity (light mode backdrop)
- `backdropDark: '99'` - 60% opacity (dark mode backdrop)

### Shadows

Predefined shadow/elevation levels.

```typescript
import { getShadowStyle } from '@/lib/design-utils';

<View style={getShadowStyle(colors, { size: 'md' })} />
```

**Available sizes:**
- `sm` - Subtle shadow (cards, inputs)
- `md` - Standard shadow (buttons, elevated cards)
- `lg` - Prominent shadow (modals, FABs)
- `xl` - Maximum shadow (overlays, high elevation)

### Icon Sizes

Standard icon dimensions.

```typescript
import { ICON_SIZES } from '@/constants/design-tokens';

<Icon size={ICON_SIZES.lg} />
```

**Available values:**
- `xs: 12` - Tiny icons
- `sm: 14` - Small icons
- `md: 16` - Standard icons
- `lg: 20` - Large icons
- `xl: 24` - Extra large icons
- `2xl: 32` - Hero icons

### Glass Intensity

Native platform blur intensity values for expo-blur (iOS < 26 and Android).

```typescript
import { GLASS_INTENSITY } from '@/constants/design-tokens';

// Use with GlassView or BlurView intensity prop
<GlassView intensity={GLASS_INTENSITY.medium} />
```

**Available values:**
- `subtle: 30` - Overlays, tooltips, light glass effect
- `light: 40` - Headers, toolbars, navigation elements
- `medium: 55` - Cards, containers (default for most uses)
- `strong: 65` - Image overlays, property cards with backgrounds
- `opaque: 80` - Bottom sheets, modals requiring more opacity

**When to use each:**
| Component Type | Intensity | Reason |
|---------------|-----------|--------|
| Modal backdrop | `subtle` | Don't obscure content too much |
| Card on image | `strong` | Need readable text on varied backgrounds |
| Bottom sheet | `opaque` | Focus user on sheet content |
| Floating tab bar | `medium` | Balance visibility with glass aesthetic |

---

## iOS 26 Liquid Glass

The app uses iOS 26 Liquid Glass as the forward-looking design language, with graceful degradation for older iOS and Android.

### Core Principles

Per [Apple's Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/materials):

1. **Content First**: Interface controls visually recede when not actively used
2. **Dynamic Hierarchy**: UI adapts based on user actions and content
3. **Translucency**: Glass reflects and refracts surroundings naturally
4. **Accessibility**: Maintain WCAG 4.5:1 contrast ratio on glass surfaces

### GlassView Component

Location: `/src/components/ui/GlassView.tsx`

```typescript
import { GlassView, GlassBackdrop } from '@/components/ui';

// Standard glass container
<GlassView intensity={GLASS_INTENSITY.medium} effect="regular">
  <Text>Content on glass</Text>
</GlassView>

// Modal backdrop with blur
<GlassBackdrop intensity={20}>
  <ModalContent />
</GlassBackdrop>
```

**Props:**
- `intensity` - Blur intensity for expo-blur fallback (0-100)
- `tint` - Tint color ('light' | 'dark' | 'default')
- `effect` - Liquid Glass effect type ('clear' | 'regular') - iOS 26+ only
- `interactive` - Enable touch interaction effects - iOS 26+ only

### Platform Rendering

| Platform | Rendering Approach |
|----------|-------------------|
| iOS 26+ | Native `LiquidGlassView` from `@callstack/liquid-glass` |
| iOS < 26 | `expo-blur` with intensity matching |
| Android | `expo-blur` (consider solid fallback for performance-critical lists) |
| Web | CSS `backdrop-filter: blur()` |

### Glass Hierarchy (Future Enhancement)

> **TODO**: Consider adding hierarchy-aware variants for iOS 26 dynamic behavior:
> - `prominent` - Higher opacity, stays visible
> - `standard` - Default glass appearance
> - `receding` - Lower opacity when content is scrolled

---

## Utility Functions

Located in `/src/lib/design-utils.ts`.

### getShadowStyle()

Get theme-aware shadow styling.

```typescript
import { getShadowStyle } from '@/lib/design-utils';

// Basic usage
const shadowStyle = getShadowStyle(colors, { size: 'md' });

// With custom color
const glowStyle = getShadowStyle(colors, {
  size: 'lg',
  color: colors.primary
});

// Theme color glow
const themeGlow = getShadowStyle(colors, {
  size: 'lg',
  useThemeColor: true
});
```

**Options:**
- `size` - Shadow size preset (sm/md/lg/xl)
- `useThemeColor` - Use theme primary color (creates glow effect)
- `color` - Custom shadow color (overrides useThemeColor)

### withOpacity()

Add opacity to colors using design tokens.

```typescript
import { withOpacity } from '@/lib/design-utils';

const mutedBg = withOpacity(colors.primary, 'muted'); // 10%
const backdrop = withOpacity('#000', 'backdrop'); // 50%
const strongOverlay = withOpacity(colors.foreground, 'strong'); // 30%
```

### getBackdropColor()

Get theme-aware backdrop color for modals and sheets.

```typescript
import { getBackdropColor } from '@/lib/design-utils';
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const backdropColor = getBackdropColor(colorScheme === 'dark');

<View style={{ backgroundColor: backdropColor }} />
```

**Returns:**
- Light mode: `rgba(0, 0, 0, 0.4)` - 40% black
- Dark mode: `rgba(0, 0, 0, 0.6)` - 60% black

---

## Shared Formatters

Location: `/src/lib/formatters.ts`

Centralized formatting utilities to eliminate duplication across the codebase. These functions were previously duplicated in 9+ files.

### formatStatus()

Format status strings for display with proper capitalization.

```typescript
import { formatStatus } from '@/lib/formatters';

const displayStatus = formatStatus('in_progress'); // "In Progress"
const displayStatus = formatStatus('NEW');         // "New"
const displayStatus = formatStatus(null);          // "Unknown"
```

### getStatusBadgeVariant()

Get the appropriate Badge variant for a status string.

```typescript
import { getStatusBadgeVariant } from '@/lib/formatters';

<Badge variant={getStatusBadgeVariant(lead.status)}>
  {formatStatus(lead.status)}
</Badge>
```

**Variant mapping:**
| Status | Variant | Color |
|--------|---------|-------|
| new, open | `success` | Green |
| active, in_progress, contacted | `info` | Blue |
| pending, scheduled | `warning` | Yellow |
| won, completed, confirmed | `success` | Green |
| lost, cancelled, declined | `destructive` | Red |
| closed, archived | `secondary` | Gray |

### getScoreColor()

Get theme-aware color for score displays (lead scores, ratings, etc.).

```typescript
import { getScoreColor } from '@/lib/formatters';

const scoreColor = getScoreColor(lead.score, colors);

<Text style={{ color: scoreColor }}>{lead.score} pts</Text>
```

**Color thresholds:**
- Score >= 80: `colors.success` (green)
- Score >= 50: `colors.warning` (yellow)
- Score < 50: `colors.mutedForeground` (gray)

### Migration Note

If you find `formatStatus()`, `getStatusVariant()`, or similar functions in feature components, migrate them to use the shared utilities:

```typescript
// ❌ Before - duplicated in each component
const formatStatus = (status: string) => {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// ✅ After - use shared utility
import { formatStatus, getStatusBadgeVariant } from '@/lib/formatters';
```

---

## Reusable Components

### FormField

Standardized form input with label, error, helper text, icons, and prefix/suffix support.

**Location:** `/src/components/ui/FormField.tsx`
**Documentation:** [Form Utilities Guide](./FORM_UTILITIES_GUIDE.md)

```typescript
import { FormField } from '@/components/ui';
import { DollarSign } from 'lucide-react-native';

<FormField
  label="Purchase Price"
  value={values.price}
  onChangeText={(text) => updateField('price', text)}
  error={errors.price}
  required
  prefix="$"
  icon={DollarSign}
  keyboardType="numeric"
  helperText="Enter the purchase price"
/>
```

**Key Features:**
- Label with required indicator (*)
- Icon support (left-side)
- Prefix/suffix text
- Error and helper text
- Full dark mode support
- Multiline support

### useForm Hook

Form state management with validation and submission handling.

**Location:** `/src/hooks/useForm.ts`
**Documentation:** [Form Utilities Guide](./FORM_UTILITIES_GUIDE.md)

```typescript
import { useForm } from '@/hooks/useForm';

const { values, errors, updateField, handleSubmit, isSubmitting } = useForm({
  initialValues: { name: '', amount: '' },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.name) errs.name = 'Name is required';
    if (!vals.amount) errs.amount = 'Amount is required';
    return errs;
  },
  onSubmit: async (vals) => {
    await api.submit(vals);
  },
});
```

**Key Features:**
- Centralized state management
- Built-in validation
- Async submission
- Dirty state tracking
- Auto error clearing

### ListEmptyState

Reusable empty state for list screens.

**Location:** `/src/components/ui/ListEmptyState.tsx`

```typescript
import { ListEmptyState } from '@/components/ui';
import { Home } from 'lucide-react-native';

// Empty state
<ListEmptyState
  state="empty"
  icon={Home}
  title="No Properties Yet"
  description="Add your first property to get started."
  primaryAction={{
    label: 'Add Property',
    onPress: handleAdd
  }}
/>

// Loading state
<ListEmptyState state="loading" />

// Error state
<ListEmptyState
  state="error"
  primaryAction={{ label: 'Try Again', onPress: retry }}
/>

// Filtered state
<ListEmptyState
  state="filtered"
  title="No Results"
  description="Try adjusting your search or filters."
  secondaryAction={{
    label: 'Clear Filters',
    onPress: clearFilters
  }}
/>
```

**States:**
- `empty` - No items in list
- `loading` - Loading data
- `error` - Failed to load
- `filtered` - No results from search/filter

### DataCard

Consolidated card component for displaying structured data.

**Location:** `/src/components/ui/DataCard.tsx`

```typescript
import { DataCard } from '@/components/ui';
import { MapPin, DollarSign } from 'lucide-react-native';

<DataCard
  title="123 Main St"
  subtitle="Single Family"
  icon={MapPin}
  badge={{ label: 'New', variant: 'default' }}
  fields={[
    { label: 'MAO', value: '$450,000', icon: DollarSign },
    { label: 'Bedrooms', value: '3' },
    { label: 'Bathrooms', value: '2' },
  ]}
  actions={[
    { label: 'View Details', onPress: handleView },
  ]}
  onPress={handlePress}
/>
```

### Timeline

Timeline component for displaying chronological events.

**Location:** `/src/components/ui/Timeline.tsx`

```typescript
import { Timeline } from '@/components/ui';

<Timeline
  events={[
    {
      id: '1',
      type: 'note',
      timestamp: new Date(),
      title: 'Initial Contact',
      description: 'Called seller about property',
      metadata: { caller: 'John Doe' },
    },
    {
      id: '2',
      type: 'status_change',
      timestamp: new Date(),
      title: 'Deal Created',
      description: 'Deal moved to analyzing stage',
    },
  ]}
  eventConfig={{
    note: { icon: FileText, color: 'info' },
    status_change: { icon: TrendingUp, color: 'success' },
  }}
/>
```

---

## Color Guidelines

### Theme Colors

All colors come from `useThemeColors()` hook and adapt to light/dark mode automatically.

```typescript
import { useThemeColors } from '@/context/ThemeContext';

const colors = useThemeColors();

// Primary colors
colors.primary           // Brand primary color
colors.primaryForeground // Text on primary background

// Semantic colors
colors.destructive       // Error/danger color
colors.destructiveForeground
colors.warning           // Warning color
colors.warningForeground
colors.success           // Success color
colors.successForeground
colors.info              // Info color
colors.infoForeground

// Neutral colors
colors.background        // Page background
colors.foreground        // Primary text
colors.card              // Card background
colors.cardForeground    // Text on cards
colors.muted             // Muted backgrounds
colors.mutedForeground   // Muted text
colors.border            // Border color
```

### When to Use Hardcoded Colors

**✅ ACCEPTABLE:**
- Public marketing pages (intentional brand colors)
- Test mocks and fixtures
- Static preview/demo colors (with inline comment explaining why)

**❌ PROHIBITED:**
- Component styling (always use `colors`)
- Modal/sheet backdrops (use `getBackdropColor()`)
- Shadows (use `getShadowStyle()`)
- Text on colored backgrounds (use `primaryForeground`, `destructiveForeground`, etc.)

**Pattern for acceptable hardcodes:**
```typescript
// Intentional: Static brand color for marketing hero
backgroundColor: '#4d7c5f'
```

---

## Migration Guides

### Migrating Hardcoded Colors

**Before:**
```typescript
<Text style={{ color: '#ffffff' }}>Button Text</Text>
<View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
```

**After:**
```typescript
<Text style={{ color: colors.primaryForeground }}>Button Text</Text>
<View style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }} />
```

### Migrating Shadows

**Before:**
```typescript
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
}} />
```

**After:**
```typescript
<View style={getShadowStyle(colors, { size: 'md' })} />
```

### Migrating Forms

**Before (100+ lines):**
```typescript
const [name, setName] = useState('');
const [amount, setAmount] = useState('');
const [errors, setErrors] = useState({});

// Manual validation
// Manual error clearing
// Manual submission handling
```

**After (40 lines):**
```typescript
const { values, errors, updateField, handleSubmit } = useForm({
  initialValues: { name: '', amount: '' },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.name) errs.name = 'Required';
    return errs;
  },
  onSubmit: async (vals) => await api.submit(vals),
});
```

---

## Best Practices

### 1. Always Use Theme Colors

```typescript
// ❌ Bad
<Text style={{ color: '#000' }}>Text</Text>

// ✅ Good
<Text style={{ color: colors.foreground }}>Text</Text>
```

### 2. Use Design Tokens for Spacing

```typescript
// ❌ Bad
<View style={{ padding: 16, gap: 8 }} />

// ✅ Good
<View style={{ padding: SPACING.lg, gap: SPACING.sm }} />
```

### 3. Use Shadow Utility

```typescript
// ❌ Bad
shadowColor: '#000', shadowOffset: { width: 0, height: 2 }

// ✅ Good
getShadowStyle(colors, { size: 'md' })
```

### 4. Use FormField for Inputs

```typescript
// ❌ Bad - Manual label, input, error
<View>
  <Text>{label}</Text>
  <TextInput value={value} onChangeText={setValue} />
  {error && <Text>{error}</Text>}
</View>

// ✅ Good - FormField handles everything
<FormField
  label={label}
  value={value}
  onChangeText={setValue}
  error={error}
/>
```

### 5. Use ListEmptyState for Empty Lists

```typescript
// ❌ Bad - Custom empty state each time
{items.length === 0 && (
  <View>
    <Text>No items</Text>
    <Button onPress={handleAdd}>Add</Button>
  </View>
)}

// ✅ Good - Consistent empty state
{items.length === 0 && (
  <ListEmptyState
    state="empty"
    title="No Items"
    primaryAction={{ label: 'Add', onPress: handleAdd }}
  />
)}
```

### 6. Test Dark Mode

Always test components in both light and dark mode:

1. Navigate to Settings > Appearance
2. Toggle between Light/Dark/System
3. Verify text contrast and readability
4. Check backgrounds and borders

---

## Component Consolidation

The following components have been consolidated:

### ✅ DataCard
**Replaces:**
- PropertyCard (partially)
- LeadCard
- DealCard
- Generic card implementations

**Usage:** Anywhere you need a card with structured data

### ✅ Timeline
**Replaces:**
- DealTimeline (specialized version)
- LeadActivityFeed
- Custom timeline implementations

**Usage:** Anywhere you need chronological event display

### ✅ FormField + useForm
**Replaces:**
- Manual form inputs in 6+ files
- Duplicated validation logic
- Custom error handling

**Usage:** All forms (AddCompSheet, AddRepairSheet, etc.)

### ✅ ListEmptyState
**Replaces:**
- PropertyListEmpty (custom implementation)
- Various empty state patterns
- Loading/error states

**Usage:** All list screens (Leads, Deals, Properties, etc.)

---

## Files Modified (Phase 1 & 2)

### Phase 1 - Dark Mode Fixes (17 files)
- AboutScreen.tsx
- LoginScreen.tsx
- MFASetupScreen.tsx
- DashboardScreen.tsx
- AppearanceScreen.tsx
- DealAssistant.tsx
- PatchSetPreview.tsx
- AskTab.tsx
- JobsTab.tsx
- DealsListScreen.tsx
- DealCockpitScreen.tsx
- FloatingGlassTabBar.tsx
- Select.tsx
- DropdownMenu.tsx
- DatePicker.tsx
- BottomSheet.tsx
- GlassView.tsx
- TeamSettingsScreen.tsx
- SimpleAssistant.tsx
- QuickUnderwriteScreen.tsx
- PropertyDetailScreen.tsx

### Phase 2 - New Components Created (3 files)
- FormField.tsx (new)
- useForm.ts (new)
- ListEmptyState.tsx (new)

### Documentation Created (3 files)
- DARK_MODE_MIGRATION_LOG.md
- FORM_UTILITIES_GUIDE.md
- DESIGN_SYSTEM.md (this file)

---

## Verification Commands

Find remaining hardcoded colors:
```bash
rg '#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}(?![0-9a-fA-F])' \
  --type tsx \
  --glob '!src/features/public/**' \
  --glob '!src/**/__tests__/**' \
  --glob '!src/context/ThemeContext.tsx'
```

Find hardcoded rgba:
```bash
rg 'rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,' \
  --type tsx \
  --glob '!src/features/public/**' \
  --glob '!src/**/__tests__/**'
```

Expected result after Phase 1: **0 matches** (excluding acceptable cases)

---

## Next Steps

### Phase 3: Design Token Migration (Pending)
- Migrate border-radius values (50+ instances)
- Migrate spacing values (150+ instances)
- Create intermediate tokens for common values

### Phase 4: Additional Documentation (Pending)
- Component migration examples
- Video walkthrough
- Interactive Storybook

---

## Tab Bar Spacing & Bottom Padding

### Overview

The app uses **Expo Router's NativeTabs** (native iOS UITabBarController) which **automatically handles scroll view content insets** for the tab bar and safe area. This is a critical architectural detail that affects how we implement bottom padding.

**Key Constants:**
- `TAB_BAR_HEIGHT = 49px` - Native iOS tab bar height
- `TAB_BAR_SAFE_PADDING = 16px` - Minimal visual breathing room ONLY (iOS handles the rest)

**IMPORTANT:** Do NOT add `insets.bottom` to content padding when using NativeTabs - iOS handles this automatically. Adding it manually causes double-padding.

### The Pattern for ScrollView/FlatList Content

**✅ CORRECT - Use this pattern for screens with scrollable content:**

```typescript
import { useTabBarPadding } from '@/hooks';

function MyListScreen() {
  const { contentPadding } = useTabBarPadding();

  return (
    <ThemedSafeAreaView edges={['top']}>
      <FlatList
        data={items}
        contentContainerStyle={{ paddingBottom: contentPadding }}
        // Returns just 16px - iOS auto-handles tab bar + safe area
      />
    </ThemedSafeAreaView>
  );
}
```

**Manual alternative (if you can't use the hook):**
```typescript
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

function MyScreen() {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px - NO insets.bottom
      }}
    >
      {/* content */}
    </ScrollView>
  );
}
```

### Why NativeTabs is Different

**With NativeTabs (current):**
- iOS UITabBarController automatically adjusts `scrollView.contentInset.bottom`
- The system accounts for both tab bar height (49px) AND device safe area (~34px on iPhone X+)
- We only add 16px visual breathing room
- **Total padding on iPhone 14 Pro**: 16px (breathing room) + auto-handled by iOS

**With Custom Tab Bar (legacy FloatingGlassTabBar - no longer used):**
- Custom tab bar doesn't auto-adjust content insets
- We had to manually add `TAB_BAR_SAFE_PADDING + insets.bottom`
- This was the OLD pattern - don't use it anymore!

### For Absolutely Positioned Bottom Elements

Buttons/bars positioned absolutely at the bottom (wizard bars, action bars) need special handling because they're outside the scroll view and iOS doesn't auto-position them:

```typescript
import { useTabBarPadding } from '@/hooks';

const BOTTOM_BAR_HEIGHT = 72;

function MyDetailScreen() {
  const { buttonBottom } = useTabBarPadding();

  return (
    <ThemedSafeAreaView edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* ScrollView with padding to clear the fixed element */}
        <ScrollView
          contentContainerStyle={{
            paddingBottom: BOTTOM_BAR_HEIGHT + 16  // Element height + margin
          }}
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
            padding: 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {/* action buttons */}
        </View>
      </View>
    </ThemedSafeAreaView>
  );
}
```

**Manual alternative:**
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/components/ui';

function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: TAB_BAR_HEIGHT + insets.bottom  // Manually position above tab bar
      }}
    >
      {/* buttons */}
    </View>
  );
}
```

### The useTabBarPadding Hook

**Location:** `/src/hooks/useTabBarPadding.ts`

Centralized hook providing all tab bar spacing values:

```typescript
import { useTabBarPadding } from '@/hooks';

const {
  contentPadding,   // For ScrollView/FlatList: 16px (iOS handles tab bar)
  buttonBottom,     // For absolute buttons: 49px + insets.bottom
  tabBarHeight,     // Raw tab bar height (49px)
  safeAreaBottom,   // Device safe area inset (0-34px)
} = useTabBarPadding();
```

**When to use:**
- ✅ All new screens with scrollable content
- ✅ Screens with absolutely positioned bottom elements (wizard bars, action bars)
- ✅ Any time you need tab bar-related spacing

**Benefits:**
- Single source of truth
- Self-documenting code
- Automatic updates if tab bar constants change
- Works correctly with NativeTabs auto-handling

### Common Mistakes

❌ **WRONG - Adding insets.bottom to content padding (causes double-padding with NativeTabs):**
```typescript
// BAD - iOS already handles this, you'll get 50px+ of extra white space!
const insets = useSafeAreaInsets();
contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
```

✅ **CORRECT - Let iOS handle it:**
```typescript
// GOOD - Works perfectly on all devices
contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
// Or use the hook:
const { contentPadding } = useTabBarPadding();
contentContainerStyle={{ paddingBottom: contentPadding }}
```

❌ **WRONG - No padding at all:**
```typescript
// BAD - Content will touch tab bar with no visual breathing room
<ScrollView>
  {/* content */}
</ScrollView>
```

✅ **CORRECT - Add minimal breathing room:**
```typescript
// GOOD - 16px gap looks clean
<ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
  {/* content */}
</ScrollView>
```

❌ **WRONG - Hardcoded values:**
```typescript
// BAD - Magic number, doesn't update if constants change
contentContainerStyle={{ paddingBottom: 16 }}
```

✅ **CORRECT - Using constants or hook:**
```typescript
// GOOD - Updates automatically
const { contentPadding } = useTabBarPadding();
contentContainerStyle={{ paddingBottom: contentPadding }}
```

### Testing Checklist

When implementing bottom padding:

1. ✅ Test on iPhone SE (no home indicator, safe area bottom = 0px)
2. ✅ Test on iPhone 14 Pro (home indicator, safe area bottom ≈ 34px)
3. ✅ Scroll to bottom - content should have ~16px gap to tab bar
4. ✅ No content cut off or hidden
5. ✅ No excessive white space (>50px gap means double-padding bug)
6. ✅ Absolutely positioned elements appear above tab bar, not underneath
7. ✅ Spacing feels consistent with other screens (Conversations, Settings, Portfolio)

### Examples from the Codebase

**List screens (correct pattern):**
```typescript
// src/features/conversations/screens/ConversationsListScreen.tsx
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

<FlatList
  data={conversations}
  contentContainerStyle={{
    padding: 16,
    paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px
  }}
/>
```

**Settings screen (correct pattern):**
```typescript
// src/features/settings/screens/SettingsScreen.tsx
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

<ScrollView
  contentContainerStyle={{
    paddingBottom: TAB_BAR_SAFE_PADDING  // Just 16px
  }}
>
  {/* settings sections */}
</ScrollView>
```

**Screens with absolutely positioned bottom bars:**
```typescript
// src/features/real-estate/screens/PropertyDetailScreen.tsx (after fix)
import { useTabBarPadding } from '@/hooks';

const { buttonBottom } = useTabBarPadding();
const BOTTOM_BAR_HEIGHT = 72;

<View style={{ flex: 1 }}>
  <ScrollView
    contentContainerStyle={{
      paddingBottom: BOTTOM_BAR_HEIGHT + 16  // Clear the fixed bar
    }}
  >
    {/* property details */}
  </ScrollView>

  {/* Fixed action bar */}
  <View
    style={{
      position: 'absolute',
      bottom: buttonBottom,  // Above tab bar
      left: 0,
      right: 0,
    }}
  >
    {/* Edit, Delete buttons */}
  </View>
</View>
```

### Related Documentation

- **UI/UX Guide:** [UI_UX_TAB_BAR_SAFE_AREAS.md](./UI_UX_TAB_BAR_SAFE_AREAS.md) - Comprehensive guide with patterns and troubleshooting
- **Troubleshooting:** [TROUBLESHOOTING.md#content-going-under-tab-bar](./TROUBLESHOOTING.md#content-going-under-tab-bar) - Common issues and solutions
- **Hook Source:** `/src/hooks/useTabBarPadding.ts` - Inline documentation with detailed comments
- **Constants Source:** `/src/components/ui/FloatingGlassTabBar.tsx` - Tab bar constants definition

### Key Takeaways

1. **Use `useTabBarPadding()` hook** for all tab bar spacing needs
2. **Never add `insets.bottom` to content padding** with NativeTabs - iOS handles it automatically
3. **Only add 16px breathing room** for scrollable content
4. **Absolutely positioned elements** need manual positioning with `buttonBottom`
5. **Test on both iPhone SE and iPhone 14 Pro** to verify correct behavior

This pattern is standardized across the app. The working examples are ConversationsListScreen, SettingsScreen, and PortfolioScreen - use them as reference!

---

## Platform Considerations

### Priority: iOS First, Android Second

This app prioritizes iOS design patterns and uses iOS 26 Liquid Glass as the forward-looking design language. Android receives graceful degradation.

### Platform-Specific Rendering

| Component | iOS 26+ | iOS < 26 | Android | Web |
|-----------|---------|----------|---------|-----|
| Glass surfaces | `LiquidGlassView` | `expo-blur` | `expo-blur` | CSS `backdrop-filter` |
| Tab bar | Liquid Glass pill | Blur pill | Blur pill | CSS blur |
| Cards | Glass variant | Blur fallback | Solid + shadow | CSS blur |
| Modals | Native blur | expo-blur | expo-blur | CSS blur |

### Platform Detection Pattern

**Important:** `@callstack/liquid-glass` uses TurboModules that crash in Expo Go. Always use a safe `require()` import with try/catch — never a static `import`.

```typescript
import { Platform } from 'react-native';

// Safe import: native TurboModule not available in Expo Go
let LiquidGlassView: React.ComponentType<any> | null = null;
let isLiquidGlassSupported = false;
try {
  const lg = require('@callstack/liquid-glass');
  if (typeof lg.LiquidGlassView === 'function') {
    LiquidGlassView = lg.LiquidGlassView;
  }
  isLiquidGlassSupported = lg.isLiquidGlassSupported ?? false;
} catch (err) {
  if (__DEV__) {
    console.info('[Component] liquid-glass not available, using blur fallback:', (err as Error)?.message);
  }
}

// iOS 26+ specific features
if (Platform.OS === 'ios' && isLiquidGlassSupported && LiquidGlassView) {
  // Use LiquidGlassView
}

// iOS (any version) vs Android
if (Platform.OS === 'ios') {
  // iOS-specific behavior
} else if (Platform.OS === 'android') {
  // Android-specific behavior (may need performance optimizations)
}
```

### Android Performance Considerations

expo-blur can be expensive on Android. For performance-critical areas:

```typescript
// Option 1: Reduce blur intensity on Android
const intensity = Platform.OS === 'android'
  ? GLASS_INTENSITY.subtle  // Lower intensity = better performance
  : GLASS_INTENSITY.medium;

// Option 2: Use solid background on Android for lists
const useGlass = Platform.OS !== 'android' || !isPerformanceCritical;

<View style={{
  backgroundColor: useGlass ? undefined : colors.card,
}}>
  {useGlass ? (
    <GlassView intensity={intensity}>{children}</GlassView>
  ) : (
    children
  )}
</View>
```

### Testing Checklist

Before shipping, verify on:
- [ ] iOS 26+ (Liquid Glass native)
- [ ] iOS 15-25 (expo-blur fallback)
- [ ] Android 12+ (expo-blur)
- [ ] Web (CSS backdrop-filter)

---

## Support

For questions or issues with the design system:

1. Check this guide first
2. Review migration logs ([DARK_MODE_MIGRATION_LOG.md](./DARK_MODE_MIGRATION_LOG.md), [FORM_UTILITIES_GUIDE.md](./FORM_UTILITIES_GUIDE.md))
3. Look for similar patterns in the codebase
4. Create a GitHub issue if stuck

**Remember:** Consistency is key. When in doubt, use design tokens and reusable components.
