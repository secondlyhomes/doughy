/**
 * Shared Effect Tokens
 *
 * Glass intensity, opacity, shadows, and animation presets shared across all apps.
 */

/** Glass intensity for native blur (expo-blur intensity prop) */
export const glassIntensity = {
  subtle: 30,
  light: 40,
  medium: 55,
  strong: 65,
  opaque: 80,
} as const;

/** Opacity hex suffixes for color manipulation (e.g. `${color}${opacityHex.muted}`) */
export const opacityHex = {
  subtle: '0D',
  muted: '1A',
  light: '20',
  medium: '33',
  strong: '4D',
  opaque: '80',
  disabled: '80',
  backdrop: '80',
  backdropLight: '66',
  backdropDark: '99',
  almostOpaque: 'E6',
} as const;

/** Numeric opacity values for style properties */
export const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  25: 0.25,
  30: 0.3,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  70: 0.7,
  75: 0.75,
  80: 0.8,
  90: 0.9,
  95: 0.95,
  100: 1,
} as const;

/** Shadow presets (React Native compatible) */
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

/** Animation durations in milliseconds */
export const duration = {
  fastest: 100,
  fast: 150,
  normal: 250,
  slow: 350,
  slowest: 800,
} as const;
