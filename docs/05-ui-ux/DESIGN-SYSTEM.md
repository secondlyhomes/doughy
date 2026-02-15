# Design System

## Overview

A consistent design system ensures visual coherence and speeds up development. This document defines colors, typography, spacing, and component patterns.

## Color Palette

### Semantic Colors

```typescript
// src/theme/colors.ts
export const colors = {
  // Primary - Main brand color
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Default
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Neutral - Text, backgrounds, borders
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Backgrounds
  background: {
    light: '#FFFFFF',
    dark: '#121212', // True black for OLED
  },

  // Surfaces (cards, modals)
  surface: {
    light: '#FFFFFF',
    dark: '#1E1E1E',
  },
};
```

### Dark Mode Colors

```typescript
// src/theme/darkColors.ts
export const darkColors = {
  background: '#121212', // OLED black
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.38)',
  },
  border: 'rgba(255, 255, 255, 0.12)',
};
```

### Color Contrast Requirements

| Use Case | Minimum Ratio | Our Ratio |
|----------|---------------|-----------|
| Body text | 4.5:1 | 6.0:1+ |
| Large text | 3:1 | 4.5:1+ |
| UI components | 3:1 | 3:1+ |
| Focus indicators | 3:1 | 4.5:1+ |

## Typography

### Font Stack

```typescript
// src/theme/typography.ts
export const fonts = {
  // Primary font - optimized for dyslexia/ADHD
  primary: {
    regular: 'Lexend_400Regular',
    medium: 'Lexend_500Medium',
    semibold: 'Lexend_600SemiBold',
    bold: 'Lexend_700Bold',
  },

  // Monospace for code
  mono: 'JetBrainsMono_400Regular',
};
```

### Type Scale

```typescript
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
```

### Text Styles

```typescript
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSize['4xl'],
    fontFamily: fonts.primary.bold,
    lineHeight: lineHeight.tight,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontFamily: fonts.primary.bold,
    lineHeight: lineHeight.tight,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontFamily: fonts.primary.semibold,
    lineHeight: lineHeight.tight,
  },

  // Body
  bodyLarge: {
    fontSize: fontSize.lg,
    fontFamily: fonts.primary.regular,
    lineHeight: lineHeight.relaxed,
  },
  body: {
    fontSize: fontSize.base,
    fontFamily: fonts.primary.regular,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontFamily: fonts.primary.regular,
    lineHeight: lineHeight.normal,
  },

  // Labels
  label: {
    fontSize: fontSize.sm,
    fontFamily: fonts.primary.medium,
    lineHeight: lineHeight.tight,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: fonts.primary.regular,
    lineHeight: lineHeight.tight,
  },
};
```

## Spacing

### Spacing Scale

```typescript
// src/theme/spacing.ts
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

// Semantic spacing
export const layout = {
  screenPadding: spacing[4], // 16
  cardPadding: spacing[4], // 16
  sectionGap: spacing[6], // 24
  itemGap: spacing[3], // 12
  inlineGap: spacing[2], // 8
};
```

### Touch Targets

```typescript
export const touchTargets = {
  minimum: 44, // iOS minimum
  recommended: 48, // WCAG recommended
  comfortable: 56, // Large touch targets
};
```

## Border Radius

```typescript
// src/theme/borderRadius.ts
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};
```

## Shadows

```typescript
// src/theme/shadows.ts
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};
```

## Glass Effects

Glass effects add translucent, dynamic materials to elevated surfaces. On iOS 26+, this uses native Liquid Glass; on older platforms, graceful fallbacks maintain the design intent.

### Glass Styles

| Style | Effect | Use Case |
|-------|--------|----------|
| `clear` | Lighter, more transparent | Subtle overlays, secondary surfaces |
| `regular` | Standard translucency | Navigation elements, cards, primary UI |

### When to Use Glass

- **Navigation chrome** — tab bars, headers, toolbars
- **Floating elements** — FABs, action sheets, overlays
- **Elevated cards** — content cards above scrolling content
- **Segmented controls** — filters, tab selectors

### When NOT to Use Glass

- Full-screen backgrounds (kills content readability)
- Heavy text areas (reduces legibility)
- Every surface (Apple: "reserved for the navigation layer")

### Fallback Colors

When native glass is unavailable, use theme-aware fallback colors:

```typescript
// src/theme/glass.ts
export const glass = {
  styles: { clear: 'clear', regular: 'regular' },
  fallback: {
    light: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(31, 41, 55, 0.85)',
  },
};
```

For the full implementation guide, see [Liquid Glass](LIQUID-GLASS.md).

## Component Tokens

### Button

```typescript
export const buttonTokens = {
  height: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  paddingHorizontal: {
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
  },
  borderRadius: borderRadius.lg,
  fontSize: {
    sm: fontSize.sm,
    md: fontSize.base,
    lg: fontSize.lg,
  },
};
```

### Input

```typescript
export const inputTokens = {
  height: 48,
  paddingHorizontal: spacing[4],
  borderRadius: borderRadius.md,
  borderWidth: 1,
  fontSize: fontSize.base,
};
```

### Card

```typescript
export const cardTokens = {
  padding: spacing[4],
  borderRadius: borderRadius.xl,
  gap: spacing[3],
};
```

## Using the Design System

### Theme Provider

```typescript
// src/theme/ThemeProvider.tsx
import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { colors, darkColors } from './colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    colors: isDark ? { ...colors, ...darkColors } : colors,
    isDark,
    // ... other theme values
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Styled Components

```typescript
// src/components/Button.tsx
import { useTheme } from '@/theme';

export function Button({ variant = 'primary', size = 'md', children, ...props }) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        { backgroundColor: theme.colors.primary[500] },
      ]}
      {...props}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}
```

## Checklist

- [ ] Color palette defined with light/dark variants
- [ ] Typography scale implemented
- [ ] Spacing system consistent
- [ ] Touch targets meet 48px minimum
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Components use theme tokens
- [ ] Dark mode tested on OLED screens
- [ ] Glass effect tokens defined with platform fallbacks
