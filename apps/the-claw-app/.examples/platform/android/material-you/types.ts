/**
 * types.ts
 *
 * Material You Dynamic Color type definitions
 */

/**
 * Material You color roles
 */
export interface MaterialYouColors {
  // Primary colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // Secondary colors
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Tertiary colors
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Error colors
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Background colors
  background: string;
  onBackground: string;

  // Surface colors
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  // Surface containers
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Surface tints
  surfaceTint: string;
  surfaceBright: string;
  surfaceDim: string;

  // Outline colors
  outline: string;
  outlineVariant: string;

  // Inverse colors
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // Scrim
  scrim: string;
  shadow: string;
}

/**
 * Dynamic theme configuration
 */
export interface DynamicThemeConfig {
  colors: MaterialYouColors;
  isDynamic: boolean;
  isAvailable: boolean;
  colorScheme: 'light' | 'dark';
}

/**
 * Button variant types
 */
export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text';

/**
 * Button colors result
 */
export interface ButtonColors {
  background: string;
  text: string;
  border: string;
}

/**
 * Card colors result
 */
export interface CardColors {
  background: string;
  text: string;
  border: string;
}

/**
 * Input colors result
 */
export interface InputColors {
  background: string;
  text: string;
  placeholder: string;
  border: string;
  borderFocused: string;
  label: string;
}

/**
 * Navigation colors result
 */
export interface NavigationColors {
  background: string;
  text: string;
  textActive: string;
  indicator: string;
  icon: string;
  iconActive: string;
}
