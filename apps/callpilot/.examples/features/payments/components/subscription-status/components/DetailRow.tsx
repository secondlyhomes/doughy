/**
 * DetailRow Component
 *
 * Displays a label-value pair for subscription details
 */

import React from 'react'
import { View, Text } from 'react-native'
import { styles } from '../styles'
import type { DetailRowProps } from '../types'

export function DetailRow({ label, value, theme }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
        {value}
      </Text>
    </View>
  )
}
