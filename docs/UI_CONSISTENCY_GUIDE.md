# UI Consistency Guide

Standards and patterns for maintaining UI consistency across the Doughy AI codebase.

**Last Updated:** January 30, 2026
**Platform Priority:** iOS (primary), Android (secondary)
**Design Language:** iOS 26 Liquid Glass

---

## Table of Contents

1. [className vs style Usage](#classname-vs-style-usage)
2. [Component Variant Alignment](#component-variant-alignment)
3. [Glass Effect Guidelines](#glass-effect-guidelines)
4. [Shared Utilities](#shared-utilities)
5. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
6. [Consistency Checklist](#consistency-checklist)

---

## className vs style Usage

The codebase uses a hybrid approach with NativeWind (Tailwind CSS) and React Native StyleSheet.

### When to Use `className`

Use NativeWind classes for:
- **Layout**: `flex-1`, `flex-row`, `items-center`, `justify-between`
- **Static spacing**: `p-4`, `m-2`, `gap-3`
- **Responsive design**: `md:flex-row`, `lg:p-6`
- **Text utilities**: `text-lg`, `font-semibold`

```tsx
// ✅ Good - layout and static values
<View className="flex-1 p-4 gap-3">
  <Text className="text-lg font-semibold">Title</Text>
</View>
```

### When to Use `style`

Use inline styles for:
- **Theme colors**: Any color from `useThemeColors()`
- **Dynamic values**: Computed or conditional styles
- **Design tokens**: SPACING, BORDER_RADIUS, FONT_SIZES, etc.
- **Animations**: Reanimated shared values

```tsx
// ✅ Good - theme colors and tokens
const colors = useThemeColors();

<View style={{
  backgroundColor: colors.card,
  borderRadius: BORDER_RADIUS.lg,
  padding: SPACING.lg,
}}>
  <Text style={{ color: colors.foreground }}>Content</Text>
</View>
```

### Hybrid Usage

Combining both is acceptable when each serves its purpose:

```tsx
// ✅ Good - className for layout, style for theme
<View
  className="flex-1 flex-row items-center gap-3"
  style={{ backgroundColor: colors.muted }}
>
  <Icon size={ICON_SIZES.lg} color={colors.primary} />
  <Text style={{ color: colors.foreground }}>Label</Text>
</View>
```

### What to Avoid

```tsx
// ❌ Bad - hardcoded colors in className
<View className="bg-white p-4">

// ❌ Bad - layout in style when className works
<View style={{ flexDirection: 'row', alignItems: 'center' }}>

// ❌ Bad - mixing color approaches
<Text className="text-gray-500" style={{ color: colors.foreground }}>
```

---

## Component Variant Alignment

### Badge Variants

Location: `/src/components/ui/Badge.tsx`

| Variant | Color | Use Case |
|---------|-------|----------|
| `default` | Primary | Default state, highlights |
| `secondary` | Gray | Neutral info, categories |
| `destructive` | Red | Errors, critical states |
| `outline` | Border only | Tags, labels |
| `success` | Green | Positive states, completed |
| `warning` | Yellow | Caution, pending |
| `danger` | Red | Same as destructive |
| `info` | Blue | Informational |
| `inactive` | Muted | Disabled, archived |

### Button Variants

Location: `/src/components/ui/Button.tsx`

| Variant | Use Case |
|---------|----------|
| `default` | Primary actions |
| `secondary` | Secondary actions |
| `destructive` | Delete, cancel |
| `outline` | Tertiary actions |
| `ghost` | Subtle actions, icon buttons |
| `link` | Text links |

> **TODO (Future)**: Add `success`, `warning`, `info` variants to Button to match Badge for semantic status actions.

### Card Variants

Location: `/src/components/ui/Card.tsx`

| Variant | When to Use |
|---------|-------------|
| `default` | Standard cards with solid background |
| `glass` | iOS 26+ Liquid Glass effect (primary style) |

```tsx
// Prefer glass for iOS-forward design
<Card variant="glass">
  <CardContent>...</CardContent>
</Card>
```

---

## Glass Effect Guidelines

### Intensity Levels

Use `GLASS_INTENSITY` tokens from design-tokens.ts:

| Token | Value | Use Case |
|-------|-------|----------|
| `subtle` | 30 | Overlays, tooltips |
| `light` | 40 | Headers, toolbars |
| `medium` | 55 | Cards, containers (default) |
| `strong` | 65 | Image overlays |
| `opaque` | 80 | Bottom sheets, modals |

### Component-Specific Glass

| Component | Intensity | Effect Type |
|-----------|-----------|-------------|
| FloatingGlassTabBar | N/A (native) | `regular` |
| BottomSheet | `opaque` | `regular` |
| Card (glass) | `medium` | `regular` |
| Modal backdrop | `subtle` | N/A (blur only) |
| Property image overlay | `strong` | `clear` |

### Glass on Android

expo-blur is less performant on Android. Consider:

1. **Lower intensity**: Use `subtle` instead of `medium`
2. **Solid fallback**: For FlatList items, use solid background
3. **Selective glass**: Only use glass for key UI elements

```tsx
// Platform-aware glass
const shouldUseGlass = Platform.OS === 'ios' || !isListItem;

{shouldUseGlass ? (
  <GlassView intensity={GLASS_INTENSITY.medium}>
    {children}
  </GlassView>
) : (
  <View style={{ backgroundColor: colors.card }}>
    {children}
  </View>
)}
```

---

## Shared Utilities

### Always Use These (Don't Duplicate)

| Utility | Location | Purpose |
|---------|----------|---------|
| `formatStatus()` | `@/lib/formatters` | Format status strings |
| `getStatusBadgeVariant()` | `@/lib/formatters` | Get Badge variant for status |
| `getScoreColor()` | `@/lib/formatters` | Color for score displays |
| `getShadowStyle()` | `@/lib/design-utils` | Theme-aware shadows |
| `withOpacity()` | `@/lib/design-utils` | Add opacity to colors |
| `getBackdropColor()` | `@/lib/design-utils` | Modal backdrop color |
| `cn()` | `@/lib/utils` | Merge Tailwind classes |

### Import Pattern

```tsx
// ✅ Good - import from centralized locations
import { formatStatus, getStatusBadgeVariant } from '@/lib/formatters';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { SPACING, GLASS_INTENSITY } from '@/constants/design-tokens';

// ❌ Bad - duplicating utilities locally
const formatStatus = (status: string) => { /* ... */ };
```

---

## Anti-Patterns to Avoid

### 1. Duplicating Format Functions

```tsx
// ❌ Bad - this exists in 9+ files
const formatStatus = (status: string) => {
  return status.split('_').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
};

// ✅ Good - use shared utility
import { formatStatus } from '@/lib/formatters';
```

### 2. Hardcoding Design Token Values

```tsx
// ❌ Bad - hardcoded values
<View style={{ padding: 16, borderRadius: 12 }} />

// ✅ Good - use tokens
<View style={{ padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg }} />
```

### 3. Hardcoding Glass Intensity

```tsx
// ❌ Bad - magic number
<GlassView intensity={55} />

// ✅ Good - use token
<GlassView intensity={GLASS_INTENSITY.medium} />
```

### 4. Hardcoding Colors

```tsx
// ❌ Bad - hardcoded colors
<Text style={{ color: '#000000' }}>Text</Text>
<View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

// ✅ Good - use theme colors
<Text style={{ color: colors.foreground }}>Text</Text>
<View style={{ backgroundColor: getBackdropColor(isDark) }} />
```

### 5. Creating Feature-Specific Components for Shared UI

```tsx
// ❌ Bad - feature-specific card that duplicates DataCard
// src/features/leads/components/LeadInfoCard.tsx (custom implementation)

// ✅ Good - use DataCard with feature props
import { DataCard } from '@/components/ui';

<DataCard
  title={lead.name}
  fields={[...]}
  badge={{ label: formatStatus(lead.status), variant: getStatusBadgeVariant(lead.status) }}
/>
```

### 6. Inconsistent Status Badge Colors

```tsx
// ❌ Bad - different logic in different files
const getVariant = (status) => {
  if (status === 'new') return 'info';  // File A says info
  // ...
};

const getVariant = (status) => {
  if (status === 'new') return 'success';  // File B says success
  // ...
};

// ✅ Good - centralized in formatters.ts
import { getStatusBadgeVariant } from '@/lib/formatters';
// Always returns 'success' for 'new'
```

---

## Consistency Checklist

Before submitting a PR, verify:

### Design Tokens
- [ ] No hardcoded spacing values (use `SPACING.*`)
- [ ] No hardcoded border radius (use `BORDER_RADIUS.*`)
- [ ] No hardcoded font sizes (use `FONT_SIZES.*`)
- [ ] No hardcoded glass intensity (use `GLASS_INTENSITY.*`)

### Colors
- [ ] No hardcoded hex colors (use `colors.*` from theme)
- [ ] No hardcoded rgba (use `withOpacity()` or `getBackdropColor()`)
- [ ] Shadows use `getShadowStyle()` utility

### Shared Utilities
- [ ] Status formatting uses `formatStatus()` from `@/lib/formatters`
- [ ] Badge variants use `getStatusBadgeVariant()` from `@/lib/formatters`
- [ ] No duplicate utility functions in feature code

### Components
- [ ] Cards consider using `DataCard` instead of custom implementation
- [ ] Forms use `FormField` component
- [ ] Empty states use `ListEmptyState` component
- [ ] Timelines use `Timeline` component

### Platform
- [ ] Tested on iOS simulator
- [ ] Glass effects have Android fallback if needed
- [ ] No iOS-only APIs without Platform check

---

## Related Documentation

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens and utilities
- [UI_CONVENTIONS.md](./UI_CONVENTIONS.md) - Component patterns and accessibility
- [COMPONENT_MIGRATION.md](./COMPONENT_MIGRATION.md) - Migration guides
- [TYPOGRAPHY_GUIDE.md](./TYPOGRAPHY_GUIDE.md) - Typography standards

---

## Questions?

If you're unsure whether something is consistent:

1. Search the codebase for similar patterns
2. Check existing implementations in `/src/components/ui/`
3. Reference this guide and DESIGN_SYSTEM.md
4. When in doubt, use the shared utility/component

**Remember:** Consistency > Perfection. It's better to match existing patterns than to introduce a "better" but different approach.
