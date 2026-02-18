/**
 * ErrorState Component
 *
 * Error display with icon, message, and retry button.
 * Uses Ionicons and theme tokens for consistency.
 */

import { View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Button } from '../Button/Button'

export interface ErrorStateProps {
  title?: string
  message?: string
  retryText?: string
  onRetry?: () => void
  showRetry?: boolean
  style?: ViewStyle
}

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
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.tokens.spacing[6],
        },
        style,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: theme.tokens.borderRadius.full,
          backgroundColor: theme.colors.error[50],
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.tokens.spacing[6],
        }}
      >
        <Ionicons name="alert-circle" size={44} color={theme.colors.error[500]} />
      </View>

      <Text variant="h3" align="center" style={{ marginBottom: theme.tokens.spacing[2] }}>
        {title}
      </Text>

      {message && (
        <Text
          variant="body"
          color={theme.colors.text.secondary}
          align="center"
          style={{ marginBottom: theme.tokens.spacing[6], maxWidth: 300 }}
        >
          {message}
        </Text>
      )}

      {showRetry && onRetry && (
        <Button
          title={retryText}
          variant="secondary"
          onPress={onRetry}
          style={{ minWidth: 120 }}
        />
      )}
    </View>
  )
}
