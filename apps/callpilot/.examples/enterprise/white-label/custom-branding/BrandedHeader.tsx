/**
 * BrandedHeader Component
 *
 * A branded header that displays either the logo or a title.
 *
 * @example
 * ```tsx
 * <BrandedHeader showLogo />
 * <BrandedHeader title="Dashboard" showLogo={false} />
 * ```
 */

import React from 'react'
import { View, Text } from 'react-native'
import { useBranding, useTheme } from '../ThemeCustomization'
import { BrandedLogo } from './BrandedLogo'
import { BrandedHeaderProps } from './types'
import { styles } from './styles'

export function BrandedHeader({
  title,
  showLogo = true,
  style,
}: BrandedHeaderProps) {
  const branding = useBranding()
  const theme = useTheme()

  return (
    <View
      style={[styles.header, { backgroundColor: theme.colors.surface }, style]}
    >
      {showLogo ? (
        <BrandedLogo size="small" />
      ) : (
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {title || branding.appName}
        </Text>
      )}
    </View>
  )
}
