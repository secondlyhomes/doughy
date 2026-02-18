/**
 * BrandedButton Component
 *
 * A themed button that adapts to the white-label configuration.
 *
 * @example
 * ```tsx
 * <BrandedButton variant="primary" onPress={handlePress}>
 *   Click me
 * </BrandedButton>
 * ```
 */

import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../ThemeCustomization'
import { BrandedButtonProps, ButtonSize, ButtonVariant } from './types'
import { styles } from './styles'

interface SizeStyle {
  paddingHorizontal: number
  paddingVertical: number
  fontSize: number
}

interface VariantStyle {
  container: object
  text: object
}

export function BrandedButton({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: BrandedButtonProps) {
  const theme = useTheme()

  const sizeStyles: Record<ButtonSize, SizeStyle> = {
    small: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      fontSize: theme.typography.fontSize.sm,
    },
    medium: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSize.md,
    },
    large: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      fontSize: theme.typography.fontSize.lg,
    },
  }

  const variantStyles: Record<ButtonVariant, VariantStyle> = {
    primary: {
      container: { backgroundColor: theme.colors.primary },
      text: { color: '#FFFFFF' },
    },
    secondary: {
      container: { backgroundColor: theme.colors.secondary },
      text: { color: '#FFFFFF' },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      text: { color: theme.colors.primary },
    },
  }

  const containerStyle = [
    styles.button,
    { borderRadius: theme.borderRadius.md },
    variantStyles[variant].container,
    sizeStyles[size],
    disabled && { opacity: 0.5 },
    style,
  ]

  const textStyleCombined = [
    styles.buttonText,
    {
      fontFamily: theme.typography.fontFamily,
      fontSize: sizeStyles[size].fontSize,
    },
    variantStyles[variant].text,
    textStyle,
  ]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyle}
    >
      <Text style={textStyleCombined}>
        {loading ? 'Loading...' : children}
      </Text>
    </TouchableOpacity>
  )
}
