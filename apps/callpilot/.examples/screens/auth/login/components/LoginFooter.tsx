/**
 * LoginFooter Component
 *
 * Renders the signup link at the bottom of the login screen
 */

import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text } from '@/components'
import { useTheme } from '@/theme'
import { styles } from '../styles'
import type { LoginFooterProps } from '../types'

/**
 * Footer section with signup link
 */
export function LoginFooter({ onSignUpPress }: LoginFooterProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.footer}>
      <Text variant="body" color={theme.colors.text.secondary}>
        Don't have an account?{' '}
      </Text>
      <TouchableOpacity onPress={onSignUpPress}>
        <Text variant="body" weight="semibold" color={theme.colors.primary[500]}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  )
}
