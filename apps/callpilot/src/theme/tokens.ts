/**
 * Design Tokens — CallPilot
 *
 * Core tokens imported from @secondly/design-tokens.
 * App-specific extensions (opacityHex, springConfig) added below.
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
  opacityHex as sharedOpacityHex,
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

// Re-export with CallPilot's naming conventions
export const fontWeight = {
  ...sharedFontWeight,
  normal: '400' as const, // CallPilot alias
};

export const shadows = {
  ...sharedShadows,
  // Keep shadowColor on all for RN compatibility (shared package already includes it)
} as const;

export const opacityHex = sharedOpacityHex;
export type OpacityHexKey = keyof typeof opacityHex;

// CallPilot-specific: spring configs use Reanimated withSpring format
export const springConfig = {
  gentle: { damping: 20, stiffness: 120, mass: 1 },
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
  snappy: { damping: 25, stiffness: 300, mass: 0.6 },
} as const;

// CallPilot-specific: sizing extensions
export const sizing = {
  ...sharedSizing,
  tabBar: 88,
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
  opacityHex,
  duration,
  springConfig,
  glassIntensity,
  sizing,
  zIndex,
} as const;

export type Tokens = typeof tokens;
export type ColorScale = keyof typeof colors;
export type SpacingScale = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
