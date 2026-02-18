/**
 * OrgLogo.tsx
 *
 * Displays an organization logo or a placeholder with initials.
 */

import React from 'react'
import { View, Text, Image } from 'react-native'
import { styles } from '../styles'
import type { OrgLogoProps } from '../types'

/**
 * Renders an organization logo image or a placeholder with initials.
 *
 * @param logoUrl - Optional URL for the organization logo
 * @param name - Organization name (used for initials if no logo)
 * @param size - Size variant: 'small' (40px) or 'medium' (48px)
 */
export function OrgLogo({ logoUrl, name, size = 'small' }: OrgLogoProps) {
  const initials = name.substring(0, 2).toUpperCase()

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={size === 'small' ? styles.logo : styles.itemLogo}
      />
    )
  }

  return (
    <View style={size === 'small' ? styles.logoPlaceholder : styles.itemLogoPlaceholder}>
      <Text style={size === 'small' ? styles.logoText : styles.itemLogoText}>
        {initials}
      </Text>
    </View>
  )
}
