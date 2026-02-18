/**
 * Text Component
 *
 * Theme-aware text component with variants and accessibility
 */

import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native'
import { useTheme } from '@/theme'

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'body'
  | 'bodySmall'
  | 'bodyLarge'
  | 'caption'

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold'

export interface TextProps extends RNTextProps {
  /**
   * Text variant
   * @default 'body'
   */
  variant?: TextVariant

  /**
   * Text color (overrides variant color)
   */
  color?: string

  /**
   * Font weight
   */
  weight?: TextWeight

  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right'

  /**
   * Custom style
   */
  style?: TextStyle | TextStyle[]
}

/**
 * Text Component
 *
 * @example
 * ```tsx
 * // Heading
 * <Text variant="h1">Welcome</Text>
 *
 * // Body text
 * <Text>This is regular body text</Text>
 *
 * // Custom color
 * <Text color={theme.colors.primary[500]}>Primary color text</Text>
 *
 * // Custom weight
 * <Text weight="bold">Bold text</Text>
 * ```
 */
export function Text({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const { theme } = useTheme()

  const textStyle: TextStyle = {
    ...getVariantStyles(variant, theme),
    ...(color && { color }),
    ...(weight && {
      fontWeight: theme.tokens.fontWeight[
        ({ regular: 'normal', medium: 'medium', semibold: 'semibold', bold: 'bold' } as const)[weight]
      ],
    }),
    ...(align && { textAlign: align }),
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  }

  return (
    <RNText style={textStyle} {...rest}>
      {children}
    </RNText>
  )
}

/**
 * Get styles for text variant
 */
function getVariantStyles(variant: TextVariant, theme: any): TextStyle {
  const variantStyles: Record<TextVariant, TextStyle> = {
    h1: {
      fontSize: theme.tokens.fontSize['4xl'],
      fontWeight: theme.tokens.fontWeight.bold,
      lineHeight: theme.tokens.fontSize['4xl'] * theme.tokens.lineHeight.tight,
      color: theme.colors.text.primary,
    },
    h2: {
      fontSize: theme.tokens.fontSize['3xl'],
      fontWeight: theme.tokens.fontWeight.bold,
      lineHeight: theme.tokens.fontSize['3xl'] * theme.tokens.lineHeight.tight,
      color: theme.colors.text.primary,
    },
    h3: {
      fontSize: theme.tokens.fontSize['2xl'],
      fontWeight: theme.tokens.fontWeight.semibold,
      lineHeight: theme.tokens.fontSize['2xl'] * theme.tokens.lineHeight.tight,
      color: theme.colors.text.primary,
    },
    h4: {
      fontSize: theme.tokens.fontSize.xl,
      fontWeight: theme.tokens.fontWeight.semibold,
      lineHeight: theme.tokens.fontSize.xl * theme.tokens.lineHeight.snug,
      color: theme.colors.text.primary,
    },
    h5: {
      fontSize: theme.tokens.fontSize.lg,
      fontWeight: theme.tokens.fontWeight.semibold,
      lineHeight: theme.tokens.fontSize.lg * theme.tokens.lineHeight.snug,
      color: theme.colors.text.primary,
    },
    body: {
      fontSize: theme.tokens.fontSize.base,
      fontWeight: theme.tokens.fontWeight.normal,
      lineHeight: theme.tokens.fontSize.base * theme.tokens.lineHeight.normal,
      color: theme.colors.text.primary,
    },
    bodySmall: {
      fontSize: theme.tokens.fontSize.sm,
      fontWeight: theme.tokens.fontWeight.normal,
      lineHeight: theme.tokens.fontSize.sm * theme.tokens.lineHeight.normal,
      color: theme.colors.text.primary,
    },
    bodyLarge: {
      fontSize: theme.tokens.fontSize.lg,
      fontWeight: theme.tokens.fontWeight.normal,
      lineHeight: theme.tokens.fontSize.lg * theme.tokens.lineHeight.normal,
      color: theme.colors.text.primary,
    },
    caption: {
      fontSize: theme.tokens.fontSize.xs,
      fontWeight: theme.tokens.fontWeight.normal,
      lineHeight: theme.tokens.fontSize.xs * theme.tokens.lineHeight.normal,
      color: theme.colors.text.secondary,
    },
  }

  return variantStyles[variant]
}
