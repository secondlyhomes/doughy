/**
 * ErrorState Component (Advanced Example)
 *
 * Error state with icon, message, and retry button
 * This is a reference implementation - copy to src/components/ and customize
 */

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text, Button } from '@/components'

export interface ErrorStateProps {
  /**
   * Error title
   * @default 'Something went wrong'
   */
  title?: string

  /**
   * Error message/description
   */
  message?: string

  /**
   * Retry button text
   * @default 'Try Again'
   */
  retryText?: string

  /**
   * Callback when retry button is pressed
   */
  onRetry?: () => void

  /**
   * Whether to show retry button
   * @default true
   */
  showRetry?: boolean

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * ErrorState Component
 *
 * @example
 * ```tsx
 * // Basic error
 * <ErrorState
 *   message="Failed to load data"
 *   onRetry={() => refetch()}
 * />
 *
 * // Custom title and message
 * <ErrorState
 *   title="Network Error"
 *   message="Please check your internet connection and try again."
 *   onRetry={handleRetry}
 * />
 *
 * // Without retry button
 * <ErrorState
 *   message="This feature is not available"
 *   showRetry={false}
 * />
 * ```
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  retryText = 'Try Again',
  onRetry,
  showRetry = true,
  style,
}: ErrorStateProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, style]}>
      {/* Error Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.error[50],
          },
        ]}
      >
        <Text
          style={{
            fontSize: 48,
            color: theme.colors.error[500],
          }}
        >
          ⚠️
        </Text>
      </View>

      {/* Title */}
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>

      {/* Message */}
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

      {/* Retry Button */}
      {showRetry && onRetry && (
        <Button
          title={retryText}
          variant="secondary"
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
    maxWidth: 300,
  },
  retryButton: {
    minWidth: 120,
  },
})
