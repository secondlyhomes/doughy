/**
 * QuickActionBar
 *
 * Three equal icon buttons: Call, Text, Email for contact detail.
 * Each action can be undefined (disabled with reduced opacity).
 */

import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact } from '@/utils/haptics'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'

export interface QuickActionBarProps {
  onCall: (() => void) | undefined
  onText: (() => void) | undefined
  onEmail: (() => void) | undefined
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: (() => void) | undefined
  color: string
  disabled: boolean
}

function ActionButton({ icon, label, onPress, color, disabled }: ActionButtonProps) {
  const { theme } = useTheme()

  function handlePress() {
    if (disabled || !onPress) return
    triggerImpact(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[3],
        backgroundColor: theme.colors.surfaceSecondary,
        borderRadius: theme.tokens.borderRadius.lg,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text
        variant="caption"
        weight="semibold"
        color={color}
        style={{ marginTop: theme.tokens.spacing[1] }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export function QuickActionBar({ onCall, onText, onEmail }: QuickActionBarProps) {
  const { theme } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3] }}>
      <ActionButton icon="call" label="Call" onPress={onCall} color={theme.colors.success[500]} disabled={!onCall} />
      <ActionButton icon="chatbubble" label="Text" onPress={onText} color={theme.colors.info[500]} disabled={!onText} />
      <ActionButton icon="mail" label="Email" onPress={onEmail} color={theme.colors.warning[500]} disabled={!onEmail} />
    </View>
  )
}
