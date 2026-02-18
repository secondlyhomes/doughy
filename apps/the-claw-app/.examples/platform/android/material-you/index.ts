/**
 * Material You Dynamic Theme
 *
 * Clean re-exports for Material You theming system
 */

// Types
export type {
  MaterialYouColors,
  DynamicThemeConfig,
  ButtonVariant,
  ButtonColors,
  CardColors,
  InputColors,
  NavigationColors,
} from './types';

// Provider
export { DynamicThemeProvider } from './DynamicThemeProvider';

// Hooks
export {
  useDynamicTheme,
  useMaterialYouColors,
  useIsDynamicTheme,
  useColorScheme,
  useIsDynamicColorAvailable,
  DynamicThemeContext,
} from './hooks/useDynamicTheme';

// Utilities
export { ColorUtils } from './utils/color-extraction';
export {
  ThemeComponents,
  getFallbackColors,
  FALLBACK_COLORS_LIGHT,
  FALLBACK_COLORS_DARK,
} from './utils/theme-generation';
