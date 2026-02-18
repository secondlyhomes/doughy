/**
 * StatusBadge Component
 *
 * Displays subscription status with visual indicator
 */

import React from 'react'
import { View, Text } from 'react-native'
import { styles } from '../styles'
import type { StatusBadgeProps } from '../types'

export function StatusBadge({
  statusText,
  statusColor,
  isTrial,
  daysUntilRenewal,
  theme,
}: StatusBadgeProps) {
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
      {isTrial && daysUntilRenewal !== null && (
        <Text style={[styles.trialText, { color: theme.colors.text.secondary }]}>
          {daysUntilRenewal} days remaining
        </Text>
      )}
    </View>
  )
}
