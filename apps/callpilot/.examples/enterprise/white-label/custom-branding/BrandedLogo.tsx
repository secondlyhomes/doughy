/**
 * BrandedLogo Component
 *
 * Displays the brand logo with configurable size and color variant.
 *
 * @example
 * ```tsx
 * <BrandedLogo size="large" variant="white" />
 * ```
 */

import React from 'react'
import { Image } from 'react-native'
import { useBranding } from '../ThemeCustomization'
import { BrandedLogoProps, LOGO_DIMENSIONS } from './types'

export function BrandedLogo({
  size = 'medium',
  variant = 'color',
  style,
}: BrandedLogoProps) {
  const branding = useBranding()

  const dimensions = LOGO_DIMENSIONS[size]
  const logoUri =
    variant === 'white' && branding.logoWhite
      ? branding.logoWhite
      : branding.logo

  return (
    <Image
      source={{ uri: logoUri }}
      style={[dimensions, style]}
      resizeMode="contain"
    />
  )
}
