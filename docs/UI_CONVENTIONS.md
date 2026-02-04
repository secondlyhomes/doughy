# UI Component Conventions

This document outlines the conventions and patterns used across UI components in the Doughy AI application.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Component Prop Patterns](#component-prop-patterns)
3. [Icon Patterns](#icon-patterns)
4. [Form Patterns](#form-patterns)
5. [Touch Interaction Patterns](#touch-interaction-patterns)
6. [Accessibility Patterns](#accessibility-patterns)
7. [Animation Patterns](#animation-patterns)
8. [Loading States](#loading-states)
9. [Error Handling](#error-handling)
10. [Native Header Patterns](#native-header-patterns-detail-screens)

---

## Design Tokens

Always use design tokens from `@/constants/design-tokens` instead of hardcoded values.

### Spacing

```tsx
import { SPACING } from '@/constants/design-tokens';

// ✅ Good
<View style={{ padding: SPACING.lg, marginBottom: SPACING.md }}>

// ❌ Bad
<View style={{ padding: 16, marginBottom: 12 }}>
```

### Font Sizes

```tsx
import { FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';

// ✅ Good
<Text style={{
  fontSize: FONT_SIZES.base,
  lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal
}}>

// ❌ Bad
<Text style={{ fontSize: 16 }}>
```

### Touch Targets

```tsx
import { TOUCH_TARGETS, DEFAULT_HIT_SLOP, PRESS_OPACITY } from '@/constants/design-tokens';

// ✅ Good - Use hitSlop for small visual elements
<TouchableOpacity
  hitSlop={DEFAULT_HIT_SLOP}
  activeOpacity={PRESS_OPACITY.DEFAULT}
>

// For larger elements, ensure minimum height
<TouchableOpacity style={{ minHeight: TOUCH_TARGETS.MINIMUM }}>
```

---

## Component Prop Patterns

### Boolean Props

Use descriptive boolean props, not `value` for non-form components:

```tsx
// ✅ Good
<Checkbox checked={isSelected} onCheckedChange={setIsSelected} />
<Switch enabled={isEnabled} onEnabledChange={setIsEnabled} />

// ❌ Avoid
<Checkbox value={isSelected} onChange={setIsSelected} />
```

### Callback Props

Use the `onXxx` naming pattern for callbacks:

```tsx
// ✅ Good
<Button onPress={handleSubmit} />
<Input onFocus={handleFocus} onBlur={handleBlur} />
<Card onPress={handleCardPress} onLongPress={handleLongPress} />

// ❌ Avoid
<Button onClick={handleSubmit} />
<Button pressHandler={handleSubmit} />
```

### Style Props

Support both `style` and `className`:

```tsx
interface ComponentProps {
  style?: ViewStyle;
  className?: string;
}
```

---

## Icon Patterns

### Icon Components

Always accept icon as a component, not a string:

```tsx
// ✅ Good
interface ButtonProps {
  icon?: React.ReactNode;
  // or
  renderIcon?: () => React.ReactNode;
}

<Button icon={<Plus size={16} />} />

// ❌ Avoid
interface ButtonProps {
  iconName?: string;
}

<Button iconName="plus" />
```

### Icon Sizing

Use `ICON_SIZES` tokens:

```tsx
import { ICON_SIZES } from '@/constants/design-tokens';

// ✅ Good
<Home size={ICON_SIZES.lg} color={colors.foreground} />

// ❌ Bad
<Home size={20} color={colors.foreground} />
```

---

## Form Patterns

### Focus States

All inputs must have visible focus states:

```tsx
const [isFocused, setIsFocused] = useState(false);

<TextInput
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
  style={{
    borderWidth: 1,  // Keep constant to avoid layout shift
    borderColor: isFocused ? colors.primary : colors.input,
  }}
/>
```

### Error Display

Show inline errors below inputs:

```tsx
<Input error={errors.email} />

// Inside Input component:
{error && (
  <Text
    style={{ color: colors.destructive }}
    accessibilityRole="alert"
  >
    {error}
  </Text>
)}
```

### Input Formatting

Use formatters from `@/lib/input-formatters`:

```tsx
import { formatCurrency, formatPhone } from '@/lib/input-formatters';

<Input
  value={formatCurrency(price)}
  onChangeText={(text) => setPrice(formatCurrency(text))}
  keyboardType="numeric"
/>
```

---

## Touch Interaction Patterns

### Haptic Feedback

Use the `haptic` utility for consistent feedback:

```tsx
import { haptic } from '@/lib/haptics';

// Light haptic for selections
const handleSelect = () => {
  haptic.light();
  // ...
};

// Medium haptic for confirmations
const handleConfirm = () => {
  haptic.medium();
  // ...
};

// Success haptic for completed actions
const handleSave = async () => {
  await saveData();
  haptic.success();
};
```

### Press Opacity

Use consistent `activeOpacity`:

```tsx
import { PRESS_OPACITY } from '@/constants/design-tokens';

<TouchableOpacity activeOpacity={PRESS_OPACITY.DEFAULT}>
```

### Touch Targets

Ensure 48dp minimum:

```tsx
import { TOUCH_TARGETS, DEFAULT_HIT_SLOP } from '@/constants/design-tokens';

// For small buttons
<TouchableOpacity
  hitSlop={DEFAULT_HIT_SLOP}
  style={{ width: 32, height: 32 }}
>

// For list items
<TouchableOpacity style={{ minHeight: TOUCH_TARGETS.MINIMUM }}>
```

---

## Accessibility Patterns

### Labels and Hints

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add new property"
  accessibilityHint="Opens the property creation form"
>

<Input
  accessibilityLabel={label}
  accessibilityHint="Enter the property address"
/>
```

### State

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityState={{
    disabled: isDisabled,
    busy: isLoading,
    selected: isSelected,
  }}
>
```

### Error Announcements

```tsx
{error && (
  <Text
    accessibilityRole="alert"
    accessibilityLiveRegion="polite"
    style={{ color: colors.destructive }}
  >
    {error}
  </Text>
)}
```

---

## Animation Patterns

### Spring Animations

Use consistent spring configs:

```tsx
import { withSpring } from 'react-native-reanimated';

// Snappy (UI interactions)
withSpring(value, { damping: 20, stiffness: 300 });

// Bouncy (playful elements)
withSpring(value, { damping: 10, stiffness: 100 });

// Smooth (transitions)
withSpring(value, { damping: 15, stiffness: 150 });
```

### Timing Animations

```tsx
import { withTiming, Easing } from 'react-native-reanimated';

// Standard duration
withTiming(value, { duration: 200, easing: Easing.ease });

// Longer transitions
withTiming(value, { duration: 300, easing: Easing.inOut(Easing.ease) });
```

---

## Loading States

### Skeleton Placeholders

Use skeletons for content loading:

```tsx
import { PropertyCardSkeleton, SkeletonList } from '@/components/ui';

{isLoading ? (
  <SkeletonList count={3} component={PropertyCardSkeleton} />
) : (
  properties.map(p => <PropertyCard key={p.id} property={p} />)
)}
```

### Inline Loading

Use `LoadingSpinner` for action buttons:

```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

---

## Error Handling

### Transient Feedback (Toast)

Use for non-blocking success/error messages:

```tsx
import { toast } from '@/components/ui';

// Success
toast.success('Property saved successfully');

// Error
toast.error('Failed to save property');

// Info
toast.info('Property updated');
```

### Blocking Confirmations (Alert)

Use for destructive actions:

```tsx
import { Alert } from 'react-native';

Alert.alert(
  'Delete Property',
  'Are you sure you want to delete this property?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
  ]
);
```

### Inline Errors

Use for field-level validation:

```tsx
<Input
  error={errors.price}
  accessibilityHint="Price must be a positive number"
/>
```

---

## Native Header Patterns (Detail Screens)

Detail screens should use native iOS headers via `Stack.Screen` options instead of custom header components. This ensures consistent iOS styling, animations, and native press feedback.

### Basic Pattern

```tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';

export function DetailScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Safe back navigation with fallback for deep-linking scenarios
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/list-screen'); // Fallback to parent list
    }
  }, [router]);

  // Memoize header options to prevent infinite re-render loops
  const headerOptions = useMemo((): NativeStackNavigationOptions => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          Screen Title
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
        <ArrowLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
  }), [colors, insets.top, handleBack]);

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        {/* Screen content - edges={[]} since header handles top safe area */}
      </ThemedSafeAreaView>
    </>
  );
}
```

### Key Requirements

1. **Type the return value**: Always use `NativeStackNavigationOptions` return type on the `useMemo`
2. **Memoize with useMemo**: Header options object must be memoized to prevent infinite re-renders
3. **Safe back navigation**: Use `router.canGoBack()` check with fallback route for deep-linking
4. **Header status bar height**: Set `headerStatusBarHeight: insets.top` for proper safe area handling
5. **Empty edges**: Use `edges={[]}` on `ThemedSafeAreaView` since the native header handles top safe area

### With Subtitle and Right Action

```tsx
const headerOptions = useMemo((): NativeStackNavigationOptions => ({
  headerShown: true,
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerStatusBarHeight: insets.top,
  headerTitle: () => (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ChannelIcon size={12} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
          {subtitle}
        </Text>
      </View>
    </View>
  ),
  headerLeft: () => (
    <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
      <ArrowLeft size={24} color={colors.foreground} />
    </TouchableOpacity>
  ),
  headerRight: () => (
    <TouchableOpacity onPress={() => setShowSheet(true)} style={{ padding: SPACING.sm }}>
      <MoreVertical size={24} color={colors.foreground} />
    </TouchableOpacity>
  ),
}), [colors, insets.top, title, subtitle, handleBack]);
```

### Layout Configuration

#### Simple Layout (no nested `_layout.tsx`)

For routes like `contacts/[id].tsx` or `landlord-inbox/[id].tsx`:

```tsx
// app/(tabs)/contacts/_layout.tsx
<Stack.Screen
  name="[id]"
  options={{
    headerShown: true, // Required - enables native header from screen
    presentation: 'fullScreenModal',
  }}
/>
```

#### Nested Layout (has `[id]/_layout.tsx`)

For routes like `bookings/[id]/index.tsx` or `rental-properties/[id]/index.tsx`:

```tsx
// app/(tabs)/bookings/_layout.tsx (parent)
<Stack.Screen
  name="[id]"
  options={{
    headerShown: false, // Disable parent header
    presentation: 'fullScreenModal',
  }}
/>

// app/(tabs)/bookings/[id]/_layout.tsx (nested)
<Stack.Screen
  name="index"
  options={{
    headerShown: true, // Child handles its own header
  }}
/>
```

### Common Pitfalls

| Issue | Cause | Solution |
|-------|-------|----------|
| Infinite re-render loop | Header options recreated every render | Wrap in `useMemo` with dependencies |
| "GO_BACK was not handled" | No navigation history on deep link | Use `router.canGoBack()` with fallback |
| White banner with "[id]" | Parent layout showing route as title | Set parent `headerShown: false`, child `headerShown: true` |
| Missing header | Layout has `headerShown: false` | Add `headerShown: true` to layout screen config |
| Stale data in header | Derived values outside useMemo | Move all derivations inside useMemo callback |

---

## Modal & Sheet Presentation Patterns

Different presentation styles serve different purposes. Choose based on the complexity and focus requirements of the content.

### When to Use Each Presentation Style

| Style | Component | Use Case | Examples |
|-------|-----------|----------|----------|
| Bottom Sheet | `BottomSheet` | Quick actions, filters, confirmations, 1-4 fields | Action menus, sort/filter, quick add |
| Focused Sheet | `FocusedSheet` | Focused forms, 5+ fields, calculations | Financing, Mortgage, Portfolio add |
| Full Screen | Stack navigation | Multi-step wizards, complex editors | Property wizard, Pattern editor |

### Decision Tree

1. **Is it quick (1-4 fields, 3-5 actions)?** → **Bottom Sheet**
2. **Is it a focused single form (5+ fields)?** → **Focused Sheet**
3. **Is it multi-step (3+ distinct views)?** → **Stack Navigation**
4. **Does it have mode switching (list/add/edit)?** → **Stack Navigation**

### Bottom Sheet (`BottomSheet`)

Use for low-friction, contextual interactions that don't require full attention:

```tsx
import { BottomSheet, BottomSheetSection } from '@/components/ui';

<BottomSheet
  visible={isOpen}
  onClose={handleClose}
  title="Filter Properties"
  snapPoints={['50%']}
>
  <BottomSheetSection title="Status">
    {/* Filter toggles */}
  </BottomSheetSection>
</BottomSheet>
```

**Good for:**
- Action menus (3-5 options)
- Filter/sort selections
- Quick confirmations
- Single-field inputs

### Focused Sheet (`FocusedSheet`)

Use for forms that need user concentration. Uses iOS native `pageSheet` presentation with swipe-down dismiss:

```tsx
import { FocusedSheet, FocusedSheetSection } from '@/components/ui';

<FocusedSheet
  visible={isOpen}
  onClose={handleClose}
  title="Add Financing"
  subtitle="Compare loan options"
  doneLabel="Save"
  onDone={handleSubmit}
  isSubmitting={isLoading}
>
  <FocusedSheetSection title="Loan Details">
    {/* Complex form fields */}
  </FocusedSheetSection>
</FocusedSheet>
```

**Good for:**
- Forms with 5+ fields
- Real-time calculations (mortgage, financing)
- Mode toggle forms (existing/new)
- Media capture flows (voice + photos)

**Benefits over BottomSheet:**
- Parent content dimmed (reduced distraction)
- Native iOS page sheet gesture
- Built-in header with Cancel/Done

### Stack Navigation

Use for complex flows with multiple distinct steps:

```tsx
// Define screens in navigator
<Stack.Screen name="security-patterns" component={SecurityPatternsScreen} />
<Stack.Screen name="security-pattern-editor" component={SecurityPatternEditorScreen} />

// Navigate between screens
router.push('/admin/security-patterns');
router.push({ pathname: '/admin/security-pattern-editor', params: { id: patternId } });
```

**Good for:**
- Multi-step wizards (3+ steps)
- List → Add → Edit flows
- Complex editors with multiple views

### Hick's Law Limits

Apply cognitive load limits consistently:

- **Action menus:** Max 5 options (use dividers to group)
- **Form fields visible:** Max 5 at once (use steps for more)
- **Tab bars:** Max 5 tabs (hide others in overflow menu)
- **Grid selections:** Max 6 prominent items (hide rest behind "More")
