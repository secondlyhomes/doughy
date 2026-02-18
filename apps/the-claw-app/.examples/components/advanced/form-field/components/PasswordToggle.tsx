/**
 * PasswordToggle Component
 *
 * A toggleable button for showing/hiding password fields
 */

import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Text } from '@/components'
import { PasswordToggleProps } from '../types'
import { styles } from '../styles'

/**
 * PasswordToggle - Button to toggle password visibility
 *
 * @example
 * ```tsx
 * <PasswordToggle
 *   isVisible={showPassword}
 *   onToggle={() => setShowPassword(!showPassword)}
 * />
 * ```
 */
export function PasswordToggle({ isVisible, onToggle }: PasswordToggleProps) {
  return (
    <View style={[styles.icon, styles.rightIcon]}>
      <TouchableOpacity onPress={onToggle}>
        <Text>{isVisible ? '👁️' : '👁️‍🗨️'}</Text>
      </TouchableOpacity>
    </View>
  )
}
