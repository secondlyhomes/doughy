/**
 * BrandedBackground Component
 *
 * A container that applies the brand background image or color.
 *
 * @example
 * ```tsx
 * <BrandedBackground>
 *   <YourContent />
 * </BrandedBackground>
 * ```
 */

import React from 'react'
import { View, Image } from 'react-native'
import { useBranding, useTheme } from '../ThemeCustomization'
import { BrandedBackgroundProps } from './types'
import { styles } from './styles'

export function BrandedBackground({ children, style }: BrandedBackgroundProps) {
  const branding = useBranding()
  const theme = useTheme()

  if (branding.backgroundImage) {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={{ uri: branding.backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.contentOverlay}>{children}</View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {children}
    </View>
  )
}
