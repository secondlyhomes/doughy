/**
 * TrustLevelOption Component
 *
 * Selectable card with emoji, label, description, checkmark if current.
 */

import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { withAlpha } from '@/utils/color'
import type { TrustLevelConfig } from '@/types'

export interface TrustLevelOptionProps {
  config: TrustLevelConfig
  isSelected: boolean
  onPress: () => void
}

export function TrustLevelOption({ config, isSelected, onPress }: TrustLevelOptionProps) {
  const { theme } = useTheme()

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.tokens.spacing[4],
        borderRadius: theme.tokens.borderRadius.lg,
        borderWidth: 2,
        borderColor: isSelected ? config.color : theme.colors.border,
        backgroundColor: isSelected ? withAlpha(config.color, 0.06) : theme.colors.surface,
        gap: theme.tokens.spacing[3],
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${config.label}: ${config.description}`}
    >
      <Text variant="h3">{config.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="bold">{config.label}</Text>
        <Text variant="caption" color={theme.colors.text.secondary}>{config.description}</Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={config.color} />
      )}
    </TouchableOpacity>
  )
}
