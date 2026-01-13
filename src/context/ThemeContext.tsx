// src/context/ThemeContext.tsx
// Dark mode support with system preference detection
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Save theme preference
  const setMode = useCallback(
    async (newMode: ThemeMode) => {
      setModeState(newMode);
      try {
        await AsyncStorage.setItem(storageKey, newMode);
      } catch (err) {
        console.error('Error saving theme:', err);
      }
    },
    [storageKey]
  );

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'light' : 'light');
  }, [mode, setMode]);

  // Determine if dark mode should be active
  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  // Get current colors
  const colors = isDark ? darkColors : lightColors;

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
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
