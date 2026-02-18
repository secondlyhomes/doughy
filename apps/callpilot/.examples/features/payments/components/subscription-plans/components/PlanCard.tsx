/**
 * PlanCard Component
 *
 * Displays a single subscription plan with pricing and features
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '@/theme'
import { styles } from '../styles'
import { FeatureList } from './FeatureList'
import type { PlanCardProps } from '../types'

export function PlanCard({ plan, isSelected, savingsPercent, onSelect }: PlanCardProps) {
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={() => onSelect(plan.id)}
    >
      {plan.recommended && (
        <View
          style={[styles.recommendedBadge, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}

      {savingsPercent > 0 && (
        <View style={[styles.savingsBadge, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.savingsText}>Save {savingsPercent}%</Text>
        </View>
      )}

      <Text style={[styles.planName, { color: theme.colors.text.primary }]}>
        {plan.name}
      </Text>

      <Text style={[styles.planDescription, { color: theme.colors.text.secondary }]}>
        {plan.description}
      </Text>

      <View style={styles.priceContainer}>
        <Text style={[styles.priceAmount, { color: theme.colors.text.primary }]}>
          ${(plan.amount / 100).toFixed(0)}
        </Text>
        <Text style={[styles.priceInterval, { color: theme.colors.text.secondary }]}>
          /{plan.interval}
        </Text>
      </View>

      <FeatureList features={plan.features} />

      {isSelected && (
        <View
          style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}
        />
      )}
    </TouchableOpacity>
  )
}
