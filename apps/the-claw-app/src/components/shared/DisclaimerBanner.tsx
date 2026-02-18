/**
 * DisclaimerBanner Component
 *
 * Session-dismissible AI disclaimer banner
 * Returns on app restart
 */

import { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface DisclaimerBannerProps {
  style?: ViewStyle
}

export function DisclaimerBanner({ style }: DisclaimerBannerProps) {
  const { theme } = useTheme()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function handleDismiss() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setDismissed(true)
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.warning[50],
          borderColor: theme.colors.warning[200],
          borderWidth: 1,
          borderRadius: theme.tokens.borderRadius.md,
          padding: theme.tokens.spacing[3],
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text variant="bodySmall" weight="semibold" color={theme.colors.warning[800]}>
          AI Disclaimer
        </Text>
        <Text variant="caption" color={theme.colors.warning[700]} style={styles.text}>
          AI is a powerful tool, but it makes mistakes. Always verify important actions. You are the final checkpoint.
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss disclaimer"
      >
        <Text variant="caption" color={theme.colors.warning[600]}>X</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  content: { flex: 1 },
  text: { marginTop: 2 },
})
