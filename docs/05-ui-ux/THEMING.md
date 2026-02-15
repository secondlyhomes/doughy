# Theming Guide

## Overview

A robust theming system enables dark mode, accessibility preferences, and consistent styling. This guide covers implementing themes for React Native + Expo.

## Theme Structure

```typescript
// src/theme/types.ts
export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };

  // Brand
  primary: ColorScale;
  secondary: ColorScale;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // Borders
  border: string;
  borderFocused: string;

  // Interactive
  overlay: string;
  highlight: string;
}

type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Default
  600: string;
  700: string;
  800: string;
  900: string;
};
```

## Light Theme

```typescript
// src/theme/lightTheme.ts
import { Theme, ThemeColors } from './types';
import { spacing, typography, borderRadius, shadows } from './tokens';

const colors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F5F5',

  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    disabled: '#9E9E9E',
    inverse: '#FFFFFF',
  },

  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  border: '#E0E0E0',
  borderFocused: '#4CAF50',

  overlay: 'rgba(0, 0, 0, 0.5)',
  highlight: 'rgba(76, 175, 80, 0.1)',
};

export const lightTheme: Theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  isDark: false,
};
```

## Dark Theme (OLED-Optimized)

```typescript
// src/theme/darkTheme.ts
import { Theme, ThemeColors } from './types';
import { spacing, typography, borderRadius, shadows } from './tokens';

const colors: ThemeColors = {
  // Dark surface (use true #000000 for OLED optimization if needed)
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',

  text: {
    primary: '#F9FAFB', // Slightly off-white for reduced eye strain
    secondary: 'rgba(249, 250, 251, 0.7)',
    disabled: 'rgba(249, 250, 251, 0.38)',
    inverse: '#121212',
  },

  primary: {
    50: '#1B3D1F',
    100: '#234D27',
    200: '#2E5E31',
    300: '#3A703B',
    400: '#468347',
    500: '#66BB6A',  // Brighter for dark mode
    600: '#81C784',
    700: '#A5D6A7',
    800: '#C8E6C9',
    900: '#E8F5E9',
  },

  secondary: {
    50: '#0D2137',
    100: '#143352',
    200: '#1B4670',
    300: '#225A8E',
    400: '#2A6EAC',
    500: '#64B5F6',  // Brighter for dark mode
    600: '#90CAF9',
    700: '#BBDEFB',
    800: '#E3F2FD',
    900: '#F5FAFF',
  },

  success: '#81C784',
  warning: '#FFB74D',
  error: '#EF5350',
  info: '#64B5F6',

  border: 'rgba(255, 255, 255, 0.12)',
  borderFocused: '#66BB6A',

  overlay: 'rgba(0, 0, 0, 0.7)',
  highlight: 'rgba(102, 187, 106, 0.15)',
};

export const darkTheme: Theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows: {
    // Shadows are less visible on dark backgrounds
    sm: { ...shadows.sm, shadowOpacity: 0.3 },
    md: { ...shadows.md, shadowOpacity: 0.4 },
    lg: { ...shadows.lg, shadowOpacity: 0.5 },
    xl: { ...shadows.xl, shadowOpacity: 0.6 },
  },
  isDark: true,
};
```

## Theme Provider

```typescript
// src/theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import type { Theme } from './types';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = '@app/theme-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  // Save preference
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  // Determine actual theme
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const theme = isDark ? darkTheme : lightTheme;

  if (!isLoaded) {
    return null; // Or splash screen
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Convenience hook for just the theme object
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}
```

## Using Theme in Components

### Styled Component

```typescript
// src/components/Card.tsx
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export function Card({ children, elevated = false }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderColor: theme.colors.border,
        },
        elevated && theme.shadows.md,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
});
```

### Theme-Aware Text

```typescript
// src/components/Text.tsx
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

type TextVariant = 'primary' | 'secondary' | 'disabled';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  style?: any;
}

export function Text({ children, variant = 'primary', style }: TextProps) {
  const { theme } = useTheme();

  return (
    <RNText
      style={[
        styles.text,
        { color: theme.colors.text[variant] },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontFamily: 'Lexend_400Regular',
  },
});
```

## Theme Settings Screen

```typescript
// app/settings/appearance.tsx
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { RadioGroup } from '@/components/RadioGroup';

const THEME_OPTIONS = [
  { value: 'system', label: 'System', description: 'Follow device settings' },
  { value: 'light', label: 'Light', description: 'Always use light theme' },
  { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
];

export default function AppearanceSettings() {
  const { theme, themeMode, setThemeMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <RadioGroup
        label="Theme"
        options={THEME_OPTIONS}
        value={themeMode}
        onChange={setThemeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

## Status Bar Handling

```typescript
// app/_layout.tsx
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {/* Rest of layout */}
    </>
  );
}
```

## Navigation Theme

```typescript
// app/_layout.tsx
import { ThemeProvider as NavigationThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const { theme } = useTheme();

  const navigationTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: theme.colors.primary[500],
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text.primary,
          border: theme.colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: theme.colors.primary[500],
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text.primary,
          border: theme.colors.border,
        },
      };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* Rest of layout */}
    </NavigationThemeProvider>
  );
}
```

## Glass Effect Tokens

For iOS 26+ Liquid Glass support, add glass tokens to your theme:

```typescript
// src/theme/glass.ts
export const glass = {
  styles: {
    clear: 'clear' as const,
    regular: 'regular' as const,
  },
  fallback: {
    light: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(31, 41, 55, 0.85)',
  },
};
```

Integrate with your `ThemeColors` interface by adding glass fallback colors that adapt to light/dark mode. The `GlassView` component uses these tokens automatically — the `fallback.light` and `fallback.dark` values provide the Android background color when native glass is unavailable.

```typescript
// Usage in components
import { glass } from '@/theme';

const fallbackColor = isDark ? glass.fallback.dark : glass.fallback.light;
```

For the full Liquid Glass implementation guide, see [LIQUID-GLASS.md](LIQUID-GLASS.md).

## Checklist

- [ ] Light and dark themes defined
- [ ] ThemeProvider wraps app
- [ ] Theme preference persisted
- [ ] System preference respected
- [ ] Components use theme colors
- [ ] Status bar adapts to theme
- [ ] Navigation theme matches
- [ ] Dark theme uses #121212 (optional: #000000 for OLED devices)
- [ ] Color contrast meets WCAG AA
- [ ] Settings screen for theme selection
- [ ] Glass tokens defined for Liquid Glass fallbacks
