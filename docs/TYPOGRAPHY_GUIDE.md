# Typography Guide

This guide defines the typography system for Doughy AI, ensuring consistent and accessible text throughout the application.

## Table of Contents

1. [Font Size Scale](#font-size-scale)
2. [Font Weights](#font-weights)
3. [Line Heights](#line-heights)
4. [Heading Hierarchy](#heading-hierarchy)
5. [Body Text](#body-text)
6. [Usage Examples](#usage-examples)
7. [Accessibility Considerations](#accessibility-considerations)

---

## Font Size Scale

The font size scale is defined in `@/constants/design-tokens`:

| Token | Size | Use Case |
|-------|------|----------|
| `FONT_SIZES['2xs']` | 10px | Captions, badges, timestamps |
| `FONT_SIZES.xs` | 12px | Helper text, labels |
| `FONT_SIZES.sm` | 14px | Body text (compact), buttons |
| `FONT_SIZES.base` | 16px | Body text (default), inputs |
| `FONT_SIZES.lg` | 18px | Section headers, large body |
| `FONT_SIZES.xl` | 20px | Card titles, subheadings |
| `FONT_SIZES['2xl']` | 24px | Screen titles, H2 |
| `FONT_SIZES['3xl']` | 30px | Page headers, H1 |

```tsx
import { FONT_SIZES } from '@/constants/design-tokens';

// ✅ Always use tokens
<Text style={{ fontSize: FONT_SIZES.base }}>Body text</Text>
<Text style={{ fontSize: FONT_SIZES['2xl'] }}>Screen Title</Text>

// ❌ Never hardcode font sizes
<Text style={{ fontSize: 16 }}>Body text</Text>
<Text style={{ fontSize: 24 }}>Screen Title</Text>
```

---

## Font Weights

Font weights are standardized to ensure consistent visual hierarchy:

| Token | Value | Use Case |
|-------|-------|----------|
| `FONT_WEIGHTS.regular` | 400 | Body text, descriptions |
| `FONT_WEIGHTS.medium` | 500 | Buttons, labels, emphasis |
| `FONT_WEIGHTS.semibold` | 600 | Card titles, section headers |
| `FONT_WEIGHTS.bold` | 700 | Screen titles, important numbers |

```tsx
import { FONT_WEIGHTS } from '@/constants/design-tokens';

<Text style={{ fontWeight: FONT_WEIGHTS.semibold }}>Card Title</Text>
<Text style={{ fontWeight: FONT_WEIGHTS.regular }}>Body text</Text>
```

---

## Line Heights

Line heights are critical for readability, especially for body text:

| Token | Multiplier | Use Case |
|-------|------------|----------|
| `LINE_HEIGHTS.tight` | 1.2 | Headings, single-line labels |
| `LINE_HEIGHTS.normal` | 1.5 | Body text (WCAG compliant) |
| `LINE_HEIGHTS.relaxed` | 1.8 | Long-form content, accessibility |

**Important**: WCAG 1.4.12 requires text spacing to be adjustable to 1.5x line height.

```tsx
import { FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';

// ✅ Always calculate line height from font size
<Text style={{
  fontSize: FONT_SIZES.base,
  lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal, // 16 * 1.5 = 24
}}>
  This body text has proper line height for readability.
</Text>

// For headings, use tight line height
<Text style={{
  fontSize: FONT_SIZES['2xl'],
  lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.tight, // 24 * 1.2 = 28.8
}}>
  Screen Title
</Text>
```

---

## Heading Hierarchy

Maintain clear visual hierarchy with consistent heading styles:

### H1 - Page Headers (30px)

```tsx
<Text style={{
  fontSize: FONT_SIZES['3xl'],      // 30px
  fontWeight: FONT_WEIGHTS.bold,    // 700
  lineHeight: FONT_SIZES['3xl'] * LINE_HEIGHTS.tight,
  color: colors.foreground,
}}>
  Dashboard
</Text>
```

### H2 - Screen Titles (24px)

```tsx
<Text style={{
  fontSize: FONT_SIZES['2xl'],       // 24px
  fontWeight: FONT_WEIGHTS.bold,     // 700
  lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.tight,
  color: colors.foreground,
}}>
  Property Details
</Text>
```

### H3 - Card Titles (20px)

```tsx
<Text style={{
  fontSize: FONT_SIZES.xl,           // 20px
  fontWeight: FONT_WEIGHTS.semibold, // 600
  lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
  color: colors.foreground,
}}>
  Financial Summary
</Text>
```

### H4 - Section Headers (18px)

```tsx
<Text style={{
  fontSize: FONT_SIZES.lg,           // 18px
  fontWeight: FONT_WEIGHTS.semibold, // 600
  lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
  color: colors.foreground,
}}>
  Recent Activity
</Text>
```

### H5 - Subsection Headers (16px)

```tsx
<Text style={{
  fontSize: FONT_SIZES.base,         // 16px
  fontWeight: FONT_WEIGHTS.semibold, // 600
  lineHeight: FONT_SIZES.base * LINE_HEIGHTS.tight,
  color: colors.foreground,
}}>
  Contact Information
</Text>
```

---

## Body Text

### Default Body (16px)

For most content:

```tsx
<Text style={{
  fontSize: FONT_SIZES.base,
  fontWeight: FONT_WEIGHTS.regular,
  lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  color: colors.foreground,
}}>
  This is the default body text style.
</Text>
```

### Compact Body (14px)

For lists, table cells, cards:

```tsx
<Text style={{
  fontSize: FONT_SIZES.sm,
  fontWeight: FONT_WEIGHTS.regular,
  lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  color: colors.foreground,
}}>
  Compact text for dense UIs.
</Text>
```

### Muted Text

For secondary information:

```tsx
<Text style={{
  fontSize: FONT_SIZES.sm,
  fontWeight: FONT_WEIGHTS.regular,
  lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  color: colors.mutedForeground,
}}>
  Last updated 2 hours ago
</Text>
```

### Caption Text (12px)

For timestamps, labels, helper text:

```tsx
<Text style={{
  fontSize: FONT_SIZES.xs,
  fontWeight: FONT_WEIGHTS.regular,
  lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
  color: colors.mutedForeground,
}}>
  Updated Jan 15, 2026
</Text>
```

---

## Usage Examples

### Form Label

```tsx
<Text style={{
  fontSize: FONT_SIZES.sm,
  fontWeight: FONT_WEIGHTS.medium,
  lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  color: colors.foreground,
  marginBottom: SPACING.xs,
}}>
  Email Address
</Text>
```

### Button Text

```tsx
<Text style={{
  fontSize: FONT_SIZES.sm,
  fontWeight: FONT_WEIGHTS.medium,
  lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.tight,
  color: colors.primaryForeground,
}}>
  Save Changes
</Text>
```

### Badge Text

```tsx
<Text style={{
  fontSize: FONT_SIZES['2xs'],
  fontWeight: FONT_WEIGHTS.semibold,
  lineHeight: FONT_SIZES['2xs'] * LINE_HEIGHTS.tight,
  color: '#FFFFFF',
  textTransform: 'uppercase',
}}>
  NEW
</Text>
```

### Price Display

```tsx
<Text style={{
  fontSize: FONT_SIZES['2xl'],
  fontWeight: FONT_WEIGHTS.bold,
  lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.tight,
  color: colors.foreground,
}}>
  $425,000
</Text>
```

### Error Message

```tsx
<Text style={{
  fontSize: FONT_SIZES.sm,
  fontWeight: FONT_WEIGHTS.regular,
  lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  color: colors.destructive,
}}>
  Please enter a valid email address
</Text>
```

---

## Accessibility Considerations

### Dynamic Type Support

Support system font scaling by avoiding fixed container heights:

```tsx
// ✅ Good - flexible height
<View style={{ minHeight: 48 }}>
  <Text style={{ fontSize: FONT_SIZES.base }}>Content</Text>
</View>

// ❌ Bad - fixed height clips text
<View style={{ height: 48 }}>
  <Text style={{ fontSize: FONT_SIZES.base }}>Content</Text>
</View>
```

### Color Contrast

Always use theme colors that meet WCAG AA contrast ratios:

```tsx
// ✅ Good - uses theme colors
<Text style={{ color: colors.foreground }}>Readable text</Text>

// ❌ Bad - hardcoded color may fail contrast
<Text style={{ color: '#666666' }}>May be hard to read</Text>
```

### Line Length

Optimal reading experience at 45-75 characters per line:

```tsx
<View style={{ maxWidth: 600 }}>
  <Text style={{
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  }}>
    Long paragraph content here...
  </Text>
</View>
```

### Text Truncation

Always provide full content via accessibility:

```tsx
<Text
  numberOfLines={2}
  style={{ fontSize: FONT_SIZES.sm }}
  accessibilityLabel={fullDescription}
>
  {fullDescription}
</Text>
```

---

## Quick Reference

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Header (H1) | 3xl (30px) | bold | tight (1.2) |
| Screen Title (H2) | 2xl (24px) | bold | tight (1.2) |
| Card Title (H3) | xl (20px) | semibold | tight (1.2) |
| Section Header (H4) | lg (18px) | semibold | tight (1.2) |
| Body Text | base (16px) | regular | normal (1.5) |
| Compact Body | sm (14px) | regular | normal (1.5) |
| Button Text | sm (14px) | medium | tight (1.2) |
| Label | sm (14px) | medium | normal (1.5) |
| Caption | xs (12px) | regular | normal (1.5) |
| Badge | 2xs (10px) | semibold | tight (1.2) |
