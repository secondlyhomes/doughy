/**
 * CallHistoryCard Component
 *
 * Displays a single call record in the call history list.
 */

import { View, TouchableOpacity, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { StatusBadge } from '../StatusBadge'
import type { Call } from '@/types'

export interface CallHistoryCardProps {
  call: Call
  onPress: (call: Call) => void
  style?: ViewStyle
}

const OUTCOME_LABELS: Record<Call['outcome'], string> = {
  won: 'Won',
  progressed: 'Progressed',
  stalled: 'Stalled',
  lost: 'Lost',
  follow_up: 'Follow Up',
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function formatCallDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CallHistoryCard({ call, onPress, style }: CallHistoryCardProps) {
  const { theme } = useTheme()

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(call)
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Call with ${call.contactName}, ${OUTCOME_LABELS[call.outcome]}`}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.tokens.borderRadius.lg,
          padding: theme.tokens.spacing[4],
          ...theme.tokens.shadows.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: theme.tokens.spacing[3] }}>
          <Text variant="h5">{call.contactName}</Text>
          <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3], marginTop: theme.tokens.spacing[1] }}>
            <Text variant="caption">{formatCallDate(call.startedAt)}</Text>
            <Text variant="caption">{formatDuration(call.duration)}</Text>
          </View>
        </View>
        <StatusBadge
          label={OUTCOME_LABELS[call.outcome]}
          variant="outcome"
          outcome={call.outcome}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3], marginTop: theme.tokens.spacing[2] }}>
        {call.hasVoiceMemo && (
          <Text variant="caption" color={theme.colors.primary[500]}>
            Voice memo
          </Text>
        )}
        {call.hasSummary && (
          <Text variant="caption" color={theme.colors.primary[500]}>
            Summary
          </Text>
        )}
        {!call.hasVoiceMemo && !call.hasSummary && (
          <Text variant="caption" color={theme.colors.text.tertiary}>
            No memo recorded
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}
