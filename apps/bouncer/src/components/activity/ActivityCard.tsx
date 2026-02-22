/**
 * ActivityCard Component
 *
 * Summary card for a single action in the activity timeline.
 * Shows connection icon, action name, time, status chip, and channel badge.
 */

import { useRef, useCallback } from 'react'
import { View, Animated, Pressable, AccessibilityInfo } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Badge } from '../Badge/Badge'
import { ACTIVITY_ICONS, DEFAULT_ACTIVITY_ICON, CONNECTION_ICONS } from '@/constants/icons'
import { STATUS_CONFIG, CHANNEL_LABELS } from '@/constants/integrations'
import type { ActionHistoryEntry } from '@/types'

export interface ActivityCardProps {
  entry: ActionHistoryEntry
  onPress: (entry: ActionHistoryEntry) => void
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Friendly labels for Claw task types */
const TOOL_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  draft_followups: 'Draft Follow-Ups',
  query: 'Query',
  custom: 'Custom Task',
  task: 'Task',
  send_sms: 'Send SMS',
  send_email: 'Send Email',
  create_task: 'Create Task',
  update_record: 'Update Record',
}

function getToolLabel(entry: ActionHistoryEntry): string {
  const friendlyLabel = TOOL_LABELS[entry.tool]
  if (friendlyLabel) return friendlyLabel

  if (entry.connectionId) {
    const name = entry.connectionId.charAt(0).toUpperCase() + entry.connectionId.slice(1)
    const action = entry.tool.split('.').pop() ?? ''
    const actionLabel = action
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    return `${name}: ${actionLabel}`
  }

  return entry.tool
    .split(/[._-]/)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getIcon(entry: ActionHistoryEntry): string {
  if (ACTIVITY_ICONS[entry.tool]) return ACTIVITY_ICONS[entry.tool]
  if (entry.connectionId && CONNECTION_ICONS[entry.connectionId]) return CONNECTION_ICONS[entry.connectionId]
  return DEFAULT_ACTIVITY_ICON
}

export function ActivityCard({ entry, onPress }: ActivityCardProps) {
  const { theme } = useTheme()
  const statusConfig = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.pending
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) return
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        ...theme.tokens.springs.snappy,
      }).start()
    })
  }, [scaleAnim, theme.tokens.springs.snappy])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...theme.tokens.springs.standard,
    }).start()
  }, [scaleAnim, theme.tokens.springs.standard])

  return (
    <Pressable
      onPress={() => onPress(entry)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${getToolLabel(entry)}: ${entry.description}`}
    >
    <Animated.View
      style={{
        flexDirection: 'row',
        padding: theme.tokens.spacing[4],
        backgroundColor: theme.colors.surface,
        borderRadius: theme.tokens.borderRadius.lg,
        borderWidth: entry.status === 'pending' ? 1 : 0,
        borderColor: entry.status === 'pending' ? theme.colors.warning[400] : 'transparent',
        transform: [{ scale: scaleAnim }],
        ...theme.tokens.shadows.sm,
      }}
    >
      {/* Icon */}
      <View style={{ marginRight: theme.tokens.spacing[3], paddingTop: 2 }}>
        <Ionicons name={getIcon(entry) as any} size={24} color={theme.colors.text.secondary} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text variant="bodySmall" weight="semibold" numberOfLines={1} style={{ flex: 1, marginRight: theme.tokens.spacing[2] }}>
            {getToolLabel(entry)}
          </Text>
          <Text variant="caption" color={theme.colors.text.tertiary}>
            {formatTime(entry.requestedAt)}
          </Text>
        </View>

        {/* Description */}
        <Text variant="bodySmall" color={theme.colors.text.secondary} numberOfLines={1} style={{ marginBottom: theme.tokens.spacing[2] }}>
          {entry.description}
        </Text>

        {/* Status + Channel row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
          <Badge label={statusConfig.label} variant={statusConfig.variant} size="sm" />
          {entry.channel && (
            <Badge
              label={CHANNEL_LABELS[entry.channel]}
              variant="default"
              size="sm"
            />
          )}
        </View>
      </View>
    </Animated.View>
    </Pressable>
  )
}
