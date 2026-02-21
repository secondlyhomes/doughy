/**
 * Design System Tokens
 *
 * Re-exports shared tokens from @secondly/design-tokens and adds Doughy-specific
 * tokens. All imports via `@/constants/design-tokens` continue working unchanged.
 */
export {
  glassIntensity as GLASS_INTENSITY,
  opacityHex as OPACITY,
  shadows as SHADOWS,
} from '@secondly/design-tokens';

// Re-export shared spacing under Doughy's named-key convention
// Doughy uses named keys (xs, sm, md, lg) rather than numeric keys (1, 2, 3, 4)
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  '10': 10,
  lg: 12,
  '14': 14,
  xl: 16,
  '18': 18,
  '2xl': 20,
  '24': 24,
  '28': 28,
  '36': 36,
  full: 9999,
} as const;

export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  ml: 18,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const ICON_CONTAINER_SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
} as const;

export const FONT_SIZES = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
} as const;

export const TOUCH_TARGETS = {
  MINIMUM: 48,
  COMFORTABLE: 56,
} as const;

export const DEFAULT_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export const PRESS_OPACITY = {
  DEFAULT: 0.7,
  STRONG: 0.6,
};

export const OPACITY_VALUES = {
  disabled: 0.5,
  loading: 0.6,
  inactive: 0.7,
  pressed: 0.8,
  hover: 0.9,
} as const;

export const GLASS_BLUR = {
  subtle: 'blur(8px)',
  regular: 'blur(12px)',
  strong: 'blur(16px)',
} as const;

export const UI_TIMING = {
  ACTION_PRESS_DELAY: 100,
  REFRESH_INDICATOR: 500,
  SEARCH_DEBOUNCE: 300,
  TOAST_AUTO_DISMISS: 3000,
  LONG_PRESS_DELAY: 500,
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  pageTransition: 300,
} as const;

export const SPRING_CONFIGS = {
  snappy: { damping: 20, stiffness: 400, mass: 0.8 },
  default: { damping: 15, stiffness: 300, mass: 1 },
  gentle: { damping: 20, stiffness: 200, mass: 1 },
  bouncy: { damping: 10, stiffness: 250, mass: 0.8 },
  stiff: { damping: 25, stiffness: 500, mass: 1 },
} as const;

export const ENTRANCE_ANIMATIONS = {
  fadeIn: { duration: 200, delay: 0 },
  slideUp: { duration: 250, translateY: 20 },
  scaleIn: { duration: 200, initialScale: 0.9 },
  listItem: { duration: 200, delayPerItem: 50, maxDelay: 300 },
} as const;

export const FAB_CONSTANTS = {
  ACTION_SPACING: 70,
  ALIGNMENT_OFFSET: -4,
} as const;

export const SWIPE_ACTION_WIDTH = 80;

export const BADGE_CONSTANTS = {
  MIN_SIZE: 18,
  OFFSET_TOP: -6,
  OFFSET_RIGHT: -10,
} as const;
