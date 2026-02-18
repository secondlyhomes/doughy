/**
 * Card Component (Advanced Example)
 *
 * Full-featured card component with variants, press handling, and shadows
 * This is a reference implementation - copy to src/components/ and customize
 */

import React, { ReactNode } from 'react'
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'

export type CardVariant = 'elevated' | 'outlined' | 'filled'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  /**
   * Card content
   */
  children: ReactNode

  /**
   * Card variant
   * @default 'elevated'
   */
  variant?: CardVariant

  /**
   * Padding size
   * @default 'md'
   */
  padding?: CardPadding

  /**
   * Whether the card is pressable
   * @default false
   */
  pressable?: boolean

  /**
   * Callback when card is pressed (makes card pressable)
   */
  onPress?: () => void

  /**
   * Custom style
   */
  style?: ViewStyle

  /**
   * Whether the card is disabled (when pressable)
   * @default false
   */
  disabled?: boolean
}

/**
 * Card Component
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * // Pressable card
 * <Card onPress={() => navigation.navigate('Details')}>
 *   <Text variant="h4">Title</Text>
 *   <Text>Description</Text>
 * </Card>
 *
 * // Outlined variant
 * <Card variant="outlined" padding="lg">
 *   <Text>Content with large padding</Text>
 * </Card>
 * ```
 */
export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  pressable = false,
  onPress,
  style,
  disabled = false,
}: CardProps) {
  const { theme } = useTheme()

  const isPressable = pressable || !!onPress

  // Container styles
  const containerStyle: ViewStyle = {
    ...getVariantStyles(variant, theme),
    ...getPaddingStyles(padding, theme),
    ...(disabled && { opacity: theme.tokens.opacity[50] }),
    ...style,
  }

  // Render as pressable or static
  if (isPressable) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={containerStyle}>{children}</View>
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(variant: CardVariant, theme: any): ViewStyle {
  const baseStyle: ViewStyle = {
    borderRadius: theme.tokens.borderRadius.lg,
    overflow: 'hidden',
  }

  const variantStyles: Record<CardVariant, ViewStyle> = {
    elevated: {
      backgroundColor: theme.colors.surface,
      ...theme.tokens.shadows.md,
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderWidth: theme.tokens.borderWidth[1],
      borderColor: theme.colors.border,
    },
    filled: {
      backgroundColor: theme.colors.surfaceSecondary,
    },
  }

  return {
    ...baseStyle,
    ...variantStyles[variant],
  }
}

/**
 * Get padding styles
 */
function getPaddingStyles(padding: CardPadding, theme: any): ViewStyle {
  const paddingStyles: Record<CardPadding, ViewStyle> = {
    none: {
      padding: 0,
    },
    sm: {
      padding: theme.tokens.spacing[3],
    },
    md: {
      padding: theme.tokens.spacing[4],
    },
    lg: {
      padding: theme.tokens.spacing[6],
    },
  }

  return paddingStyles[padding]
}
