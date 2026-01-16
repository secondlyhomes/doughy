/**
 * Design System Tokens
 * Central source of truth for spacing, sizing, and styling constants
 *
 * These tokens ensure consistency across the entire application and make
 * it easier to maintain and update the design system.
 */

/**
 * Spacing scale based on 4px grid
 * Use these for padding, margins, and gaps throughout the app
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

/**
 * Border radius standards
 * Consistent rounding for all UI elements
 */
export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  '10': 10,    // Intermediate value
  lg: 12,
  '14': 14,    // Intermediate value
  xl: 16,
  '18': 18,    // Intermediate value
  '2xl': 20,
  '24': 24,    // Intermediate value
  '28': 28,    // Tab bar specific
  '36': 36,    // Icon containers
  full: 9999,
} as const;

/**
 * Opacity tokens for consistent alpha values
 * Use with withOpacity() utility to create semi-transparent colors
 *
 * @example
 * withOpacity(colors.primary, 'muted') // Returns color with 10% opacity
 */
export const OPACITY = {
  subtle: '0D',         // 5%  - very subtle backgrounds
  muted: '1A',          // 10% - muted backgrounds
  light: '20',          // 12.5% - light overlays
  medium: '33',         // 20% - standard overlays
  strong: '4D',         // 30% - prominent overlays
  opaque: '80',         // 50% - semi-opaque
  disabled: '80',       // 50% - disabled elements (same as opaque, but semantically clearer)
  backdrop: '80',       // 50% - standard backdrop
  backdropLight: '66',  // 40% - light mode backdrop (less intense)
  backdropDark: '99',   // 60% - dark mode backdrop (more visible)
  almostOpaque: 'E6',   // 90% - almost fully opaque overlays
} as const;

/**
 * Shadow/Elevation presets
 * Consistent shadows across the application
 * Use with getShadowStyle() utility
 */
export const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.25,
    elevation: 12,
  },
} as const;

/**
 * Icon sizes for consistent icon scaling
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
} as const;

/**
 * Typography sizes (for reference)
 * Most components should use Tailwind classes, but these are available
 * for components that need inline fontSize values
 */
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

/**
 * Numeric opacity values for style properties
 * Use these for opacity, activeOpacity, and other numeric opacity properties (not colors)
 *
 * For colors with opacity, use OPACITY tokens with withOpacity() utility instead
 *
 * @example
 * <TouchableOpacity activeOpacity={OPACITY_VALUES.pressed}>
 * <View style={{ opacity: OPACITY_VALUES.disabled }}>
 */
export const OPACITY_VALUES = {
  disabled: 0.5,    // Disabled interactive elements
  loading: 0.6,     // Loading/processing states
  inactive: 0.7,    // Inactive tabs, secondary actions
  pressed: 0.8,     // Active press state (TouchableOpacity activeOpacity)
  hover: 0.9,       // Hover state (web)
} as const;

/**
 * Glass blur intensity for web platform fallbacks
 * iOS/Android use native blur via expo-blur or liquid-glass
 * Web uses CSS backdrop-filter
 *
 * @example
 * // Web fallback
 * const webStyle = {
 *   backdropFilter: GLASS_BLUR.regular,
 *   WebkitBackdropFilter: GLASS_BLUR.regular,
 * };
 */
export const GLASS_BLUR = {
  subtle: 'blur(8px)',     // Light glass effect - less prominent
  regular: 'blur(12px)',   // Standard glass (most common use case)
  strong: 'blur(16px)',    // Prominent glass effect - more visible
} as const;

/**
 * UI timing constants for animations and interactions
 * Consistent timing across the application for predictable UX
 *
 * @example
 * // Navigation delay to let animation start
 * setTimeout(() => navigate(), UI_TIMING.ACTION_PRESS_DELAY);
 *
 * // Refresh indicator display duration
 * setTimeout(() => setRefreshing(false), UI_TIMING.REFRESH_INDICATOR);
 */
export const UI_TIMING = {
  /** Brief delay before executing action to let press animation start (FAB, buttons) */
  ACTION_PRESS_DELAY: 100,

  /** Duration to show refresh indicator after data refresh completes */
  REFRESH_INDICATOR: 500,

  /** Debounce delay for search input fields */
  SEARCH_DEBOUNCE: 300,

  /** Delay before auto-dismissing temporary notifications/toasts */
  TOAST_AUTO_DISMISS: 3000,

  /** Delay before triggering long-press actions */
  LONG_PRESS_DELAY: 500,
} as const;
