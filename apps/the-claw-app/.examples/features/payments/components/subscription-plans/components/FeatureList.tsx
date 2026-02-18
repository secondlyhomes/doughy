/**
 * FeatureList Component
 *
 * Displays a list of plan features with checkmarks
 */

import React from 'react'
import { View, Text } from 'react-native'
import { useTheme } from '@/theme'
import { styles } from '../styles'
import type { FeatureListProps } from '../types'

export function FeatureList({ features }: FeatureListProps) {
  const theme = useTheme()

  return (
    <View style={styles.features}>
      {features.map((feature, index) => (
        <View key={index} style={styles.featureRow}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>
            {feature}
          </Text>
        </View>
      ))}
    </View>
  )
}
