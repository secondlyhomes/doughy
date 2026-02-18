/**
 * THEME CUSTOMIZATION HOOKS
 *
 * Hooks for accessing white-label theme and configuration
 */

import { useContext } from 'react'
import { WhiteLabelContext } from '../WhiteLabelProvider'
import { DEFAULT_BRANDING, DEFAULT_FEATURES, DEFAULT_URLS, DEFAULT_THEME } from '../defaults'
import type { WhiteLabelConfig, WhiteLabelTheme } from '../types'

/**
 * Access white-label context with full functionality
 */
export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext)
  if (!context) {
    throw new Error('useWhiteLabel must be used within WhiteLabelProvider')
  }
  return context
}

/**
 * Access theme only
 */
export function useTheme() {
  const { theme } = useWhiteLabel()
  return theme
}

/**
 * Access branding configuration
 */
export function useBranding() {
  const { config } = useWhiteLabel()
  return config?.branding || DEFAULT_BRANDING
}

/**
 * Access feature flags
 */
export function useFeatures() {
  const { config } = useWhiteLabel()
  return config?.features || DEFAULT_FEATURES
}

/**
 * Access URL configuration
 */
export function useUrls() {
  const { config } = useWhiteLabel()
  return config?.urls || DEFAULT_URLS
}

/**
 * Create theme from white-label config
 */
export function createThemeFromConfig(config: WhiteLabelConfig | null): WhiteLabelTheme {
  if (!config) {
    return DEFAULT_THEME
  }

  const { branding, customization } = config

  return {
    colors: {
      ...DEFAULT_THEME.colors,
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      accent: branding.accentColor || DEFAULT_THEME.colors.accent,
    },
    typography: {
      ...DEFAULT_THEME.typography,
      fontFamily: customization.fontFamily || DEFAULT_THEME.typography.fontFamily,
    },
    spacing: customization.spacing
      ? {
          xs: customization.spacing * 0.25,
          sm: customization.spacing * 0.5,
          md: customization.spacing,
          lg: customization.spacing * 1.5,
          xl: customization.spacing * 2,
          xxl: customization.spacing * 3,
        }
      : DEFAULT_THEME.spacing,
    borderRadius: customization.borderRadius
      ? {
          sm: customization.borderRadius * 0.5,
          md: customization.borderRadius,
          lg: customization.borderRadius * 1.5,
          xl: customization.borderRadius * 2,
          full: 9999,
        }
      : DEFAULT_THEME.borderRadius,
    shadows: DEFAULT_THEME.shadows,
  }
}
