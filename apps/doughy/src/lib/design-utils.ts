import { ViewStyle } from 'react-native';
import { ThemeColors } from '@/contexts/ThemeContext';
import { SHADOWS, OPACITY } from '@/constants/design-tokens';

export interface ShadowOptions {
  /**
   * Shadow size preset
   * @default 'md'
   */
  size?: keyof typeof SHADOWS;
  /**
   * Whether to use theme primary color for shadow (creates a glow effect)
   * @default false
   */
  useThemeColor?: boolean;
  /**
   * Custom shadow color (overrides useThemeColor)
   */
  color?: string;
}

/**
 * Get consistent shadow styling
 *
 * @param colors - Theme colors from useThemeColors()
 * @param options - Shadow customization options
 * @returns ViewStyle object with shadow properties
 *
 * @example
 * const shadowStyle = getShadowStyle(colors, { size: 'lg' });
 * <View style={[styles.card, shadowStyle]} />
 *
 * @example
 * // Create a glow effect with theme color
 * const glowStyle = getShadowStyle(colors, { size: 'lg', useThemeColor: true });
 * <View style={[styles.fab, glowStyle]} />
 */
export function getShadowStyle(
  colors: ThemeColors,
  options: ShadowOptions = {}
): ViewStyle {
  const { size = 'md', useThemeColor = false, color } = options;
  const shadow = SHADOWS[size];

  return {
    ...shadow,
    shadowColor: color || (useThemeColor ? colors.primary : '#000'),
  };
}

/**
 * Get color with opacity token
 *
 * @param color - Base color (must be hex format, e.g., '#4d7c5f')
 * @param opacity - Opacity token key from OPACITY constants
 * @returns Color string with opacity suffix
 *
 * @example
 * const mutedBackground = withOpacity(colors.primary, 'muted'); // 10% opacity
 * const backdrop = withOpacity(colors.background, 'backdrop'); // 50% opacity
 *
 * @example
 * <View style={{ backgroundColor: withOpacity(colors.primary, 'subtle') }} />
 */
export function withOpacity(color: string, opacity: keyof typeof OPACITY): string {
  // Validate opacity key exists
  if (!(opacity in OPACITY)) {
    console.error(`[withOpacity] Invalid opacity key: "${opacity}". Using 'opaque' as fallback.`);
    return color; // Return original color as fallback
  }

  // Remove any existing opacity suffix if present
  const baseColor = color.length > 7 ? color.substring(0, 7) : color;
  return `${baseColor}${OPACITY[opacity]}`;
}

/**
 * Get theme-aware backdrop color for modals, sheets, and overlays
 *
 * @param isDark - Whether dark mode is active (from useColorScheme() === 'dark')
 * @returns Semi-transparent black backdrop color (40% for light, 60% for dark)
 *
 * @example
 * const colorScheme = useColorScheme();
 * <View style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }} />
 *
 * @example
 * // In a component with theme context
 * const { isDark } = useTheme();
 * const backdropStyle = { backgroundColor: getBackdropColor(isDark) };
 */
export function getBackdropColor(isDark: boolean): string {
  return isDark
    ? withOpacity('#000', 'backdropDark')
    : withOpacity('#000', 'backdropLight');
}
