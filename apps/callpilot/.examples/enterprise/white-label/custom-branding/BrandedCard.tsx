/**
 * BrandedCard Component
 *
 * A themed card container with shadow and rounded corners.
 *
 * @example
 * ```tsx
 * <BrandedCard>
 *   <Text>Card content</Text>
 * </BrandedCard>
 * ```
 */

import React from 'react'
import { View } from 'react-native'
import { useTheme } from '../ThemeCustomization'
import { BrandedCardProps } from './types'
import { styles } from './styles'

export function BrandedCard({ children, style }: BrandedCardProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
        },
        theme.shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  )
}
