/**
 * Theme Context
 *
 * Provides theme (light/dark mode) to the entire app
 * Persists user preference in AsyncStorage
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { tokens } from './tokens'

const THEME_STORAGE_KEY = '@app/theme-mode'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ColorScheme = 'light' | 'dark'

interface ThemeColors {
  // Background colors
  background: string
  surface: string
  surfaceSecondary: string

  // Text colors
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }

  // Border colors
  border: string
  borderFocus: string

  // Semantic colors (use token colors)
  primary: typeof tokens.colors.primary
  success: typeof tokens.colors.success
  warning: typeof tokens.colors.warning
  error: typeof tokens.colors.error
  info: typeof tokens.colors.info

  // Neutral colors
  neutral: typeof tokens.colors.neutral
}

interface Theme {
  mode: ColorScheme
  colors: ThemeColors
  tokens: typeof tokens
}

interface ThemeContextValue {
  theme: Theme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Light theme colors — matched to Doughy
const lightColors: ThemeColors = {
  background: '#fafafa',
  surface: tokens.colors.white,
  surfaceSecondary: '#f1f5f9',

  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    tertiary: tokens.colors.neutral[400],
    inverse: tokens.colors.white,
  },

  border: '#e2e8f0',
  borderFocus: tokens.colors.primary[500],

  primary: tokens.colors.primary,
  success: tokens.colors.success,
  warning: tokens.colors.warning,
  error: tokens.colors.error,
  info: tokens.colors.info,
  neutral: tokens.colors.neutral,
}

// Dark theme colors — matched to Doughy
const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',

  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    tertiary: tokens.colors.neutral[500],
    inverse: '#0f172a',
  },

  border: '#334155',
  borderFocus: tokens.colors.primary[400],

  primary: tokens.colors.primary,
  success: tokens.colors.success,
  warning: tokens.colors.warning,
  error: tokens.colors.error,
  info: tokens.colors.info,
  neutral: tokens.colors.neutral,
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme() ?? 'light'
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')
  const [isLoading, setIsLoading] = useState(true)

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference()
  }, [])

  async function loadThemePreference() {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setThemeModeState(saved as ThemeMode)
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function setThemeMode(mode: ThemeMode) {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode)
      setThemeModeState(mode)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  // Determine actual color scheme
  const colorScheme: ColorScheme = themeMode === 'system' ? systemColorScheme : themeMode

  const theme: Theme = {
    mode: colorScheme,
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    tokens,
  }

  const value: ThemeContextValue = {
    theme,
    themeMode,
    setThemeMode,
    isDark: colorScheme === 'dark',
  }

  // Don't render children until theme is loaded (prevents flash)
  if (isLoading) {
    return null
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to access theme context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark, setThemeMode } = useTheme()
 *
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={{ color: theme.colors.text.primary }}>
 *         Hello {isDark ? 'night' : 'day'}!
 *       </Text>
 *     </View>
 *   )
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

/**
 * Hook to access theme colors directly
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const colors = useThemeColors()
 *
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text.primary }}>Hello!</Text>
 *     </View>
 *   )
 * }
 * ```
 */
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme()
  return theme.colors
}

/**
 * Type exports
 */
export type { Theme, ThemeColors }
