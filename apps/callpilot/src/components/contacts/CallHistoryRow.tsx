/**
 * CallHistoryRow
 *
 * Lightweight row for inline call history: date, caller, duration, outcome badge.
 */

import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { withOpacity } from '@/utils/formatters'
import { Text } from '@/components/Text'
import type { Call } from '@/types'

export interface CallHistoryRowProps {
  call: Call
  onPress?: (call: Call) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const OUTCOME_LABELS: Record<Call['outcome'], string> = {
  won: 'Won',
  progressed: 'Progressed',
  stalled: 'Stalled',
  lost: 'Lost',
  follow_up: 'Follow-up',
}

export function CallHistoryRow({ call, onPress }: CallHistoryRowProps) {
  const { theme } = useTheme()
  const outcomeColor = callpilotColors.outcome[call.outcome]

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[2],
        gap: theme.tokens.spacing[3],
      }}
    >
      <Ionicons name="call-outline" size={16} color={theme.colors.text.tertiary} />

      <View style={{ flex: 1 }}>
        <Text variant="bodySmall" weight="medium">
          {formatDate(call.startedAt)}
        </Text>
        <Text variant="caption" color={theme.colors.text.tertiary}>
          {formatDuration(call.duration)}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: withOpacity(outcomeColor, 'light'),
          borderRadius: theme.tokens.borderRadius.full,
          paddingHorizontal: theme.tokens.spacing[2],
          paddingVertical: 2,
        }}
      >
        <Text variant="caption" weight="semibold" color={outcomeColor} style={{ fontSize: theme.tokens.fontSize['2xs'] }}>
          {OUTCOME_LABELS[call.outcome]}
        </Text>
      </View>

      {onPress && (
        <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(call)} accessibilityRole="button" accessibilityLabel={`View call from ${formatDate(call.startedAt)}`}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}
