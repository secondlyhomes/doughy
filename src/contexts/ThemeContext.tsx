// src/context/ThemeContext.tsx
// Dark mode support with system preference detection
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useRNColorScheme, Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativeWindColorScheme } from 'nativewind';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Semantic status colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
}

// Light theme colors
const lightColors: ThemeColors = {
  background: '#fafafa',
  foreground: '#0f172a',
  card: '#ffffff',
  cardForeground: '#0f172a',
  popover: '#ffffff',
  popoverForeground: '#0f172a',
  primary: '#4d7c5f', // Sage green
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  accent: '#f1f5f9',
  accentForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#4d7c5f',
  // Semantic status colors
  success: '#22c55e',           // green-500
  successForeground: '#14532d', // green-900
  warning: '#f59e0b',           // amber-500
  warningForeground: '#78350f', // amber-900
  info: '#3b82f6',              // blue-500
  infoForeground: '#1e3a8a',    // blue-900
};

// Dark theme colors
const darkColors: ThemeColors = {
  background: '#0f172a',
  foreground: '#f8fafc',
  card: '#1e293b',
  cardForeground: '#f8fafc',
  popover: '#1e293b',
  popoverForeground: '#f8fafc',
  primary: '#6b9b7e', // Lighter sage for dark mode
  primaryForeground: '#ffffff',
  secondary: '#334155',
  secondaryForeground: '#f8fafc',
  muted: '#334155',
  mutedForeground: '#94a3b8',
  accent: '#334155',
  accentForeground: '#f8fafc',
  destructive: '#f87171',
  destructiveForeground: '#ffffff',
  border: '#334155',
  input: '#334155',
  ring: '#6b9b7e',
  // Semantic status colors (lighter for dark mode)
  success: '#4ade80',           // green-400
  successForeground: '#052e16', // green-950
  warning: '#fbbf24',           // amber-400
  warningForeground: '#451a03', // amber-950
  info: '#60a5fa',              // blue-400
  infoForeground: '#172554',    // blue-950
};

// Context type
export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'doughy-theme-mode';

// Theme provider props
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const systemColorScheme = useRNColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setModeState(saved as ThemeMode);
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, [storageKey]);

  // Save theme preference (optimistic update with revert on failure)
  const setMode = useCallback(
    async (newMode: ThemeMode) => {
      const previousMode = mode;
      setModeState(newMode);
      try {
        await AsyncStorage.setItem(storageKey, newMode);
      } catch (err) {
        console.error('[ThemeContext] Failed to persist theme, reverting:', err);
        setModeState(previousMode);
      }
    },
    [storageKey, mode]
  );

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'light' : 'light');
  }, [mode, setMode]);

  // Determine if dark mode should be active
  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  // Sync color scheme with both React Native and NativeWind APIs
  // This ensures dark mode works for:
  // - useThemeColors() hook (via isDark state)
  // - NativeWind Tailwind classes (via media query in global.css)
  // - System UI elements like StatusBar
  useEffect(() => {
    const scheme = isDark ? 'dark' : 'light';
    // React Native's Appearance API - only available on native platforms
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(scheme);
    }
    // NativeWind's colorScheme API - works on all platforms
    nativeWindColorScheme.set(scheme);
  }, [isDark]);

  // Get current colors
  const colors = isDark ? darkColors : lightColors;

  // Render children with system-aware theme while loading to maintain component tree structure
  // This prevents navigation context issues that can occur when returning null
  // Uses system color scheme to minimize flash (covers the most common "system" mode case)
  if (!isLoaded) {
    const systemIsDark = systemColorScheme === 'dark';
    return (
      <ThemeContext.Provider value={{ mode: 'system', setMode: () => {}, isDark: systemIsDark, colors: systemIsDark ? darkColors : lightColors, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get just the colors (useful for non-component code)
export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

// Export color definitions for external use
export { lightColors, darkColors };
