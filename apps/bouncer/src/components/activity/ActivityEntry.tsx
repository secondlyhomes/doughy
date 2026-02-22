/**
 * ActivityEntry Component
 *
 * Compact entry: icon + description + time + cost + optional Undo button.
 */

import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Badge } from '../Badge/Badge'
import { CONNECTION_ICONS } from '@/constants/icons'
import type { ActionHistoryEntry } from '@/types'

export interface ActivityEntryProps {
  entry: ActionHistoryEntry
  onPress: (id: string) => void
  onUndo?: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityEntry({ entry, onPress, onUndo }: ActivityEntryProps) {
  const { theme } = useTheme()
  const iconName = entry.connectionId ? (CONNECTION_ICONS[entry.connectionId] || 'flash-outline') : 'flash-outline'
  const isUndone = !!entry.undoneAt
  const canUndo = entry.undoable && !isUndone && onUndo

  return (
    <TouchableOpacity
      onPress={() => onPress(entry.id)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[2],
        paddingHorizontal: theme.tokens.spacing[4],
        gap: theme.tokens.spacing[3],
        opacity: isUndone ? 0.5 : 1,
      }}
    >
      <Ionicons name={iconName as any} size={16} color={theme.colors.text.tertiary} />
      <View style={{ flex: 1 }}>
        <Text variant="bodySmall" weight="medium" numberOfLines={1}>{entry.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2], marginTop: 2 }}>
          <Text variant="caption" color={theme.colors.text.tertiary}>
            {timeAgo(entry.requestedAt)}
          </Text>
          {entry.costCents > 0 && (
            <Text variant="caption" color={theme.colors.text.tertiary}>
              ${(entry.costCents / 100).toFixed(2)}
            </Text>
          )}
          {isUndone && <Badge label="Undone" variant="default" />}
        </View>
      </View>
      {canUndo && (
        <TouchableOpacity
          onPress={() => onUndo!(entry.id)}
          style={{ paddingHorizontal: theme.tokens.spacing[2], paddingVertical: theme.tokens.spacing[1] }}
          accessibilityRole="button"
          accessibilityLabel="Undo"
        >
          <Text variant="caption" color={theme.colors.primary[500]} weight="semibold">Undo</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}
