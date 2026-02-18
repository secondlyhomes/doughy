/**
 * LoginHeader Component
 *
 * Renders the login screen header with title and subtitle
 */

import React from 'react'
import { View } from 'react-native'
import { Text } from '@/components'
import { useTheme } from '@/theme'
import { styles } from '../styles'
import type { LoginHeaderProps } from '../types'

/**
 * Header section for the login screen
 */
export function LoginHeader({
  title = 'Welcome Back',
  subtitle = 'Sign in to continue',
}: LoginHeaderProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.header}>
      <Text variant="h1" align="center" style={styles.title}>
        {title}
      </Text>
      <Text
        variant="body"
        align="center"
        color={theme.colors.text.secondary}
        style={styles.subtitle}
      >
        {subtitle}
      </Text>
    </View>
  )
}
