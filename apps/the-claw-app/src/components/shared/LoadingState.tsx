/**
 * LoadingState Component
 *
 * Centered spinner with optional message
 */

import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface LoadingStateProps {
  message?: string
  size?: 'small' | 'large'
  overlay?: boolean
  style?: ViewStyle
}

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
  message: { marginTop: 16 },
})
