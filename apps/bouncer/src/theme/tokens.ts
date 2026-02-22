/**
 * Design Tokens — The Claw
 *
 * Core tokens imported from @secondly/design-tokens.
 * App-specific extensions (trustColors, clawGlass) added below.
 */
import {
  colors as sharedColors,
  spacing as sharedSpacing,
  fontSize as sharedFontSize,
  fontWeight as sharedFontWeight,
  lineHeight as sharedLineHeight,
  borderRadius as sharedBorderRadius,
  borderWidth as sharedBorderWidth,
  shadows as sharedShadows,
  opacity as sharedOpacity,
  glassIntensity as sharedGlassIntensity,
  duration as sharedDuration,
  sizing as sharedSizing,
  zIndex as sharedZIndex,
} from '@secondly/design-tokens';

// Re-export shared tokens
export const colors = sharedColors;
export const spacing = sharedSpacing;
export const fontSize = sharedFontSize;
export const lineHeight = sharedLineHeight;
export const borderRadius = sharedBorderRadius;
export const borderWidth = sharedBorderWidth;
export const opacity = sharedOpacity;
export const glassIntensity = sharedGlassIntensity;
export const duration = sharedDuration;
export const zIndex = sharedZIndex;

// Re-export with Claw's naming conventions
export const fontWeight = {
  ...sharedFontWeight,
  normal: '400' as const,
};

export const shadows = {
  ...sharedShadows,
  // Claw-specific semantic aliases
  subtle: sharedShadows.sm,
  glass: sharedShadows.md,
  elevated: sharedShadows.lg,
} as const;

// Claw-specific: spring configs use Animated.spring format (tension/friction)
export const springs = {
  standard: { tension: 120, friction: 14 },
  snappy: { tension: 180, friction: 20 },
  gentle: { tension: 80, friction: 16 },
} as const;

// Claw-specific: sizing extensions
export const sizing = {
  ...sharedSizing,
  dot: { sm: 8, md: 12, lg: 16 },
  switch: { trackWidth: 52, trackHeight: 32, thumbSize: 28, thumbOffset: 2 },
} as const;

// Claw-specific: trust level colors for the control panel
export const trustColors = {
  locked: '#6b7280',
  manual: '#3b82f6',
  guarded: '#f59e0b',
  autonomous: '#22c55e',
  killed: '#ef4444',
} as const;

// Claw-specific: glass intensities offset +5 from base for darker control-room feel
export const clawGlass = {
  subtle: 35,
  light: 45,
  medium: 60,
  strong: 70,
  opaque: 85,
} as const;

/**
 * Theme tokens
 * Combines all design tokens into a single object
 */
export const tokens = {
  colors,
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  borderWidth,
  shadows,
  opacity,
  duration,
  springs,
  glassIntensity,
  sizing,
  zIndex,
  trustColors,
  clawGlass,
} as const;

export type Tokens = typeof tokens;
export type ColorScale = keyof typeof colors;
export type SpacingScale = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
