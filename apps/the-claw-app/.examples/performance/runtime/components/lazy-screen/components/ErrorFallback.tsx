/**
 * ErrorFallback Component
 *
 * Default error display for failed lazy screen loads.
 */

import { View, Text, Pressable } from 'react-native'
import { styles } from '../styles'
import type { ErrorFallbackProps } from '../types'

/**
 * Default error fallback shown when lazy screen fails to load
 */
export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Failed to load screen</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Pressable style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </Pressable>
    </View>
  )
}
