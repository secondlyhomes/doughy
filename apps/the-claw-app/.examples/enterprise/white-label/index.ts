/**
 * WHITE-LABEL MODULE
 *
 * Complete white-labeling system for multi-tenant apps
 *
 * @example
 * ```tsx
 * import { WhiteLabelProvider, useTheme, useBranding } from './white-label'
 *
 * function App() {
 *   return (
 *     <WhiteLabelProvider organizationId="org-123">
 *       <ThemedContent />
 *     </WhiteLabelProvider>
 *   )
 * }
 *
 * function ThemedContent() {
 *   const theme = useTheme()
 *   const branding = useBranding()
 *   // ...
 * }
 * ```
 */

// Provider
export { WhiteLabelProvider, WhiteLabelContext } from './WhiteLabelProvider'

// Hooks
export {
  useWhiteLabel,
  useTheme,
  useBranding,
  useFeatures,
  useUrls,
  createThemeFromConfig,
} from './hooks/useThemeCustomization'

// Types
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

// Defaults
export {
  DEFAULT_BRANDING,
  DEFAULT_FEATURES,
  DEFAULT_URLS,
  DEFAULT_THEME,
} from './defaults'

// Utilities
export {
  isValidColor,
  hexToRgb,
  getContrastColor,
  lightenColor,
  darkenColor,
  preloadBrandingAssets,
} from './utils/colorUtils'
