/**
 * LoadingFallback Component
 *
 * Default loading indicator for lazy-loaded screens.
 */

import { View, Text, ActivityIndicator } from 'react-native'
import { styles } from '../styles'

/**
 * Default loading fallback shown while lazy screen loads
 */
export function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  )
}
