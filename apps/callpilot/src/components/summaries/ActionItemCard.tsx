/**
 * ActionItemCard Component
 *
 * Displays a tappable action item with checkbox.
 */

import { useState } from 'react'
import { View, TouchableOpacity, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import type { ActionItem } from '@/types'

export interface ActionItemCardProps {
  item: ActionItem
  onToggle?: (id: string, completed: boolean) => void
  style?: ViewStyle
}

export function ActionItemCard({ item, onToggle, style }: ActionItemCardProps) {
  const { theme } = useTheme()
  const [completed, setCompleted] = useState(item.completed)

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const next = !completed
    setCompleted(next)
    onToggle?.(item.id, next)
  }

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={item.text}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: theme.tokens.spacing[2],
          gap: theme.tokens.spacing[3],
        },
        style,
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: theme.tokens.borderRadius.md,
          borderWidth: theme.tokens.borderWidth[2],
          borderColor: completed ? theme.colors.success[500] : theme.colors.border,
          backgroundColor: completed ? theme.colors.success[500] : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 2,
        }}
      >
        {completed && (
          <Text style={{ color: theme.tokens.colors.white, fontSize: 14, fontWeight: '700' }}>
            {'\u2713'}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        {completed ? (
          <Text variant="body" style={{ textDecorationLine: 'line-through' as const, opacity: 0.6 }}>
            {item.text}
          </Text>
        ) : (
          <Text variant="body">
            {item.text}
          </Text>
        )}
        {item.dueDate && (
          <Text variant="caption" color={theme.colors.text.tertiary}>
            Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}
