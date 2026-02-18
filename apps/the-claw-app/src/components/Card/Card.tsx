/**
 * Card Component
 *
 * Pressable card container with variants and theme support
 */

import { ReactNode } from 'react'
import { View, TouchableOpacity, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'

export type CardVariant = 'elevated' | 'outlined' | 'filled'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: ReactNode
  variant?: CardVariant
  padding?: CardPadding
  onPress?: () => void
  style?: ViewStyle
  disabled?: boolean
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
  disabled = false,
}: CardProps) {
  const { theme } = useTheme()

  const containerStyle: ViewStyle = {
    ...getVariantStyles(variant, theme),
    ...getPaddingStyles(padding, theme),
    ...(disabled && { opacity: theme.tokens.opacity[50] }),
    ...style,
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
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

function getVariantStyles(variant: CardVariant, theme: any): ViewStyle {
  const base: ViewStyle = {
    borderRadius: theme.tokens.borderRadius.lg,
    overflow: 'hidden',
  }

  const variants: Record<CardVariant, ViewStyle> = {
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

  return { ...base, ...variants[variant] }
}

function getPaddingStyles(padding: CardPadding, theme: any): ViewStyle {
  const sizes: Record<CardPadding, ViewStyle> = {
    none: { padding: 0 },
    sm: { padding: theme.tokens.spacing[3] },
    md: { padding: theme.tokens.spacing[4] },
    lg: { padding: theme.tokens.spacing[6] },
  }
  return sizes[padding]
}
