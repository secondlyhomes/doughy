/**
 * Card Component
 *
 * Full-featured card component with variants, press handling, and shadows.
 * Includes 'glass' variant using GlassView.
 */

import { ReactNode } from 'react'
import { View, TouchableOpacity, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { GlassView } from '../GlassView'

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: ReactNode
  variant?: CardVariant
  padding?: CardPadding
  pressable?: boolean
  onPress?: () => void
  style?: ViewStyle
  disabled?: boolean
}

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

  function handlePress() {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress()
    }
  }

  // Glass variant delegates to GlassView
  if (variant === 'glass') {
    const paddingStyle = getPaddingStyles(padding, theme)
    const content = <View style={paddingStyle}>{children}</View>

    if (isPressable) {
      return (
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          style={[disabled && { opacity: theme.tokens.opacity[50] }, style]}
        >
          <GlassView intensity="medium">
            {content}
          </GlassView>
        </TouchableOpacity>
      )
    }

    return (
      <GlassView intensity="medium" style={style}>
        {content}
      </GlassView>
    )
  }

  // Standard variants
  const containerStyle: ViewStyle = {
    ...getVariantStyles(variant, theme),
    ...getPaddingStyles(padding, theme),
    ...(disabled && { opacity: theme.tokens.opacity[50] }),
    ...style,
  }

  if (isPressable) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
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

function getVariantStyles(variant: Exclude<CardVariant, 'glass'>, theme: any): ViewStyle {
  const baseStyle: ViewStyle = {
    borderRadius: theme.tokens.borderRadius.lg,
    overflow: 'hidden',
  }

  const variantStyles: Record<Exclude<CardVariant, 'glass'>, ViewStyle> = {
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

function getPaddingStyles(padding: CardPadding, theme: any): ViewStyle {
  const paddingStyles: Record<CardPadding, ViewStyle> = {
    none: { padding: 0 },
    sm: { padding: theme.tokens.spacing[3] },
    md: { padding: theme.tokens.spacing[4] },
    lg: { padding: theme.tokens.spacing[6] },
  }

  return paddingStyles[padding]
}
