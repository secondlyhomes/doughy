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
