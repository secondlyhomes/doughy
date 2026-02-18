/**
 * CostSummary Component
 *
 * Displays total cost and token usage for the conversation
 */

import React from 'react'
import { View, Text } from 'react-native'
import { styles } from './styles'
import type { CostSummaryProps } from './types'

/**
 * Cost summary component showing total cost and tokens
 */
export function CostSummary({ totalCost, totalTokens }: CostSummaryProps) {
  return (
    <View style={styles.costSummary}>
      <Text style={styles.costSummaryText}>
        Total: ${totalCost.toFixed(4)} - {totalTokens} tokens
      </Text>
    </View>
  )
}
