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
  ml: 18,   // Intermediate: between md (16) and lg (20)
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,  // Large icons for empty states, hero sections
} as const;

/**
 * Icon container sizes (for width/height on icon wrappers)
 * Use these for consistent icon container dimensions
 *
 * @example
 * <View style={{ width: ICON_CONTAINER_SIZES.md, height: ICON_CONTAINER_SIZES.md }}>
 *   <Icon size={ICON_SIZES.lg} />
 * </View>
 */
export const ICON_CONTAINER_SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
} as const;

/**
 * Typography sizes (for reference)
 * Most components should use Tailwind classes, but these are available
 * for components that need inline fontSize values
 */
export const FONT_SIZES = {
  '2xs': 10,  // Captions, badges
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,     // Section headers
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

/**
 * Font weights for consistent typography
 * Maps to React Native fontWeight values
 */
export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Line heights for readable typography
 * WCAG 1.4.12 recommends 1.5x for body text
 *
 * @example
 * <Text style={{ lineHeight: fontSize * LINE_HEIGHTS.normal }}>
 */
export const LINE_HEIGHTS = {
  tight: 1.2,    // Headings, single-line labels
  normal: 1.5,   // Body text (WCAG compliant)
  relaxed: 1.8,  // Large body text, accessibility
} as const;

/**
 * Minimum touch target sizes per platform guidelines
 * Apple HIG: 44pt minimum
 * Material Design: 48dp minimum
 *
 * Use COMFORTABLE for primary actions, MINIMUM for dense UIs
 */
export const TOUCH_TARGETS = {
  MINIMUM: 48,      // Minimum accessible touch target
  COMFORTABLE: 56,  // Comfortable touch target for primary actions
} as const;

/**
 * Default hit slop to expand touch targets without changing visual size
 * Apply to elements that are visually smaller than TOUCH_TARGETS.MINIMUM
 *
 * @example
 * <TouchableOpacity hitSlop={DEFAULT_HIT_SLOP}>
 */
export const DEFAULT_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/**
 * Press opacity values for TouchableOpacity activeOpacity
 * Use DEFAULT for most interactive elements
 *
 * @example
 * <TouchableOpacity activeOpacity={PRESS_OPACITY.DEFAULT}>
 */
export const PRESS_OPACITY = {
  DEFAULT: 0.7,   // Standard press feedback
  STRONG: 0.6,    // More prominent feedback for emphasis
};

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
 * Glass intensity for native platforms (expo-blur intensity prop)
 * iOS 26+ uses LiquidGlassView (ignores intensity), iOS < 26 and Android use expo-blur
 *
 * Use these instead of hardcoding intensity values to ensure consistency.
 *
 * @example
 * import { GLASS_INTENSITY } from '@/constants/design-tokens';
 *
 * <GlassView intensity={GLASS_INTENSITY.medium} />
 * <BlurView intensity={GLASS_INTENSITY.opaque} tint="dark" />
 */
export const GLASS_INTENSITY = {
  /** 30 - Overlays, tooltips, light glass effect */
  subtle: 30,
  /** 40 - Headers, toolbars, navigation elements */
  light: 40,
  /** 55 - Cards, containers (default for most uses) */
  medium: 55,
  /** 65 - Image overlays, property cards with backgrounds */
  strong: 65,
  /** 80 - Bottom sheets, modals requiring more opacity */
  opaque: 80,
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

/**
 * Animation duration constants in milliseconds
 * Use for timing-based animations (not spring-based)
 *
 * @example
 * Animated.timing(value, {
 *   toValue: 1,
 *   duration: ANIMATION_DURATION.normal,
 *   useNativeDriver: true,
 * });
 */
export const ANIMATION_DURATION = {
  /** Very fast animations (subtle feedback) */
  fast: 150,
  /** Standard animation speed */
  normal: 250,
  /** Slower animations (entrances, emphasis) */
  slow: 350,
  /** Page transitions */
  pageTransition: 300,
} as const;

/**
 * Spring animation configurations for react-native-reanimated
 * Use with withSpring() for natural, physics-based animations
 *
 * damping: Higher = less bouncy, lower = more bouncy
 * stiffness: Higher = faster snap, lower = slower
 * mass: Higher = heavier feel, lower = lighter
 *
 * @example
 * import { withSpring } from 'react-native-reanimated';
 * import { SPRING_CONFIGS } from '@/constants/design-tokens';
 *
 * // For a button press
 * scale.value = withSpring(0.95, SPRING_CONFIGS.snappy);
 *
 * // For a modal entrance
 * translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
 */
export const SPRING_CONFIGS = {
  /** Quick, responsive animations for interactive elements (buttons, toggles) */
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 0.8,
  },
  /** Standard animations for most UI transitions */
  default: {
    damping: 15,
    stiffness: 300,
    mass: 1,
  },
  /** Smooth, gentle animations for larger elements (modals, sheets) */
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  /** Bouncy animations for playful interactions (success states, celebrations) */
  bouncy: {
    damping: 10,
    stiffness: 250,
    mass: 0.8,
  },
  /** Stiff, minimal bounce for subtle movements */
  stiff: {
    damping: 25,
    stiffness: 500,
    mass: 1,
  },
} as const;

/**
 * Entrance/exit animation configurations
 * Common patterns for list items and view transitions
 *
 * @example
 * // Using with Reanimated FadeIn/FadeOut
 * import { FadeIn, FadeOut } from 'react-native-reanimated';
 * import { ENTRANCE_ANIMATIONS } from '@/constants/design-tokens';
 *
 * <Animated.View entering={FadeIn.duration(ENTRANCE_ANIMATIONS.fadeIn.duration)}>
 */
export const ENTRANCE_ANIMATIONS = {
  fadeIn: {
    duration: 200,
    delay: 0,
  },
  slideUp: {
    duration: 250,
    translateY: 20,
  },
  scaleIn: {
    duration: 200,
    initialScale: 0.9,
  },
  /** Staggered list item animation */
  listItem: {
    duration: 200,
    delayPerItem: 50,
    maxDelay: 300,
  },
} as const;

/**
 * FAB (Floating Action Button) constants
 * For expandable action menus with stacked buttons
 */
export const FAB_CONSTANTS = {
  /** Vertical spacing between action buttons when FAB is expanded */
  ACTION_SPACING: 70,
  /** Horizontal alignment offset for action buttons */
  ALIGNMENT_OFFSET: -4,
} as const;

/**
 * Swipe action button width for gesture-based list items
 * Standard width for reveal actions (star, call, archive, etc.)
 */
export const SWIPE_ACTION_WIDTH = 80;

/**
 * Badge constants for notification indicators
 * Used on tab bar and other badge-displaying components
 */
export const BADGE_CONSTANTS = {
  /** Minimum width/height for badge circle */
  MIN_SIZE: 18,
  /** Vertical offset from parent (negative = above) */
  OFFSET_TOP: -6,
  /** Horizontal offset from parent (negative = left of right edge) */
  OFFSET_RIGHT: -10,
} as const;
