/**
 * WHITE-LABEL THEME CUSTOMIZATION
 *
 * Complete white-labeling system for multi-tenant apps
 * Allows organizations to customize branding, colors, and features
 *
 * @example
 * ```tsx
 * <WhiteLabelProvider>
 *   <App />
 * </WhiteLabelProvider>
 * ```
 */

// Re-export provider
export { WhiteLabelProvider, WhiteLabelContext } from './WhiteLabelProvider'

// Re-export hooks
export {
  useWhiteLabel,
  useTheme,
  useBranding,
  useFeatures,
  useUrls,
  createThemeFromConfig,
} from './hooks/useThemeCustomization'

// Re-export types
export type {
  WhiteLabelBranding,
  WhiteLabelFeatures,
  WhiteLabelUrls,
  WhiteLabelConfig,
  WhiteLabelTheme,
  WhiteLabelContextValue,
  WhiteLabelProviderProps,
  WhiteLabelCustomization,
  WhiteLabelMetadata,
  WhiteLabelThemeColors,
  WhiteLabelTypography,
  WhiteLabelSpacing,
  WhiteLabelBorderRadius,
  WhiteLabelShadow,
  WhiteLabelShadows,
} from './types'

// Re-export defaults
export {
  DEFAULT_BRANDING,
  DEFAULT_FEATURES,
  DEFAULT_URLS,
  DEFAULT_THEME,
} from './defaults'

// Re-export utilities
export {
  isValidColor,
  hexToRgb,
  getContrastColor,
  lightenColor,
  darkenColor,
  preloadBrandingAssets,
} from './utils/colorUtils'
