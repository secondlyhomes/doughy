/**
 * LoadingState Component (Advanced Example)
 *
 * Loading state with spinner and optional message
 * This is a reference implementation - copy to src/components/ and customize
 */

import React from 'react'
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '@/components'

export interface LoadingStateProps {
  /**
   * Loading message
   */
  message?: string

  /**
   * Size of the spinner
   * @default 'large'
   */
  size?: 'small' | 'large'

  /**
   * Whether to show as overlay (covers entire screen)
   * @default false
   */
  overlay?: boolean

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * LoadingState Component
 *
 * @example
 * ```tsx
 * // Basic loading
 * <LoadingState />
 *
 * // With message
 * <LoadingState message="Loading your data..." />
 *
 * // Full-screen overlay
 * <LoadingState overlay message="Processing..." />
 *
 * // Inline loading (small)
 * <LoadingState size="small" message="Loading..." />
 * ```
 */
export function LoadingState({
  message,
  size = 'large',
  overlay = false,
  style,
}: LoadingStateProps) {
  const { theme } = useTheme()

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...(overlay && {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.background,
      zIndex: theme.tokens.zIndex.modal,
    }),
    ...style,
  }

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={theme.colors.primary[500]} />
      {message && (
        <Text
          variant="body"
          color={theme.colors.text.secondary}
          align="center"
          style={styles.message}
        >
          {message}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
  },
})
