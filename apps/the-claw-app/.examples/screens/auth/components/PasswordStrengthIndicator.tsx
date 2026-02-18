/**
 * Password Strength Indicator Component
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@/components'
import { useTheme } from '@/theme'
import type { PasswordStrength } from '../types'

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength
}

export function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  const { theme } = useTheme()

  const strengthColors = {
    weak: theme.colors.error[500],
    medium: theme.colors.warning[500],
    strong: theme.colors.success[500],
  }

  const color = strengthColors[strength]

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        <View style={[styles.bar, { backgroundColor: color }]} />
        <View
          style={[
            styles.bar,
            strength !== 'weak' && { backgroundColor: color },
          ]}
        />
        <View
          style={[
            styles.bar,
            strength === 'strong' && { backgroundColor: color },
          ]}
        />
      </View>
      <Text variant="caption" color={color} style={styles.text}>
        {strength.charAt(0).toUpperCase() + strength.slice(1)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 4,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
  },
  text: {
    marginTop: 4,
  },
})
