/**
 * BrandedIcon Component
 *
 * Displays the brand app icon with configurable size.
 *
 * @example
 * ```tsx
 * <BrandedIcon size={64} />
 * ```
 */

import React from 'react'
import { Image } from 'react-native'
import { useBranding } from '../ThemeCustomization'
import { BrandedIconProps } from './types'

export function BrandedIcon({ size = 64, style }: BrandedIconProps) {
  const branding = useBranding()

  return (
    <Image
      source={{ uri: branding.icon }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.2,
        },
        style,
      ]}
      resizeMode="cover"
    />
  )
}
