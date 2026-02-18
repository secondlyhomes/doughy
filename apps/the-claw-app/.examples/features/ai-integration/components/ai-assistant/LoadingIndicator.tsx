/**
 * Loading Indicator Component
 *
 * Shows a loading spinner with "Thinking..." text.
 */

import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { styles } from './ai-assistant.styles'
import type { LoadingIndicatorProps } from './types'

/**
 * Loading indicator for AI processing
 *
 * @example
 * ```tsx
 * <LoadingIndicator visible={loading} />
 * ```
 */
export function LoadingIndicator({ visible }: LoadingIndicatorProps) {
  if (!visible) return null

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Thinking...</Text>
    </View>
  )
}
