/**
 * ActivitySection Component
 *
 * Groups entries by day: "Today", "Yesterday", "This Week".
 * Today is expanded by default, others collapsed with tap to expand.
 */

import { useState, useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme'
import { SectionHeader } from '../control-panel/SectionHeader'
import { ActivityEntry } from './ActivityEntry'
import { Card } from '../Card/Card'
import { Divider } from '../Divider'
import { Text } from '../Text'
import type { ActionHistoryEntry } from '@/types'

export interface ActivitySectionProps {
  entries: ActionHistoryEntry[]
  onEntryPress: (id: string) => void
  onUndo: (id: string) => void
  onSeeAll?: () => void
}

interface DayGroup {
  label: string
  entries: ActionHistoryEntry[]
  defaultExpanded: boolean
}

function groupByDay(entries: ActionHistoryEntry[]): DayGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 6 * 86400000)

  const todayEntries: ActionHistoryEntry[] = []
  const yesterdayEntries: ActionHistoryEntry[] = []
  const weekEntries: ActionHistoryEntry[] = []
  const olderEntries: ActionHistoryEntry[] = []

  for (const entry of entries) {
    const entryDate = new Date(entry.requestedAt)
    if (entryDate >= today) {
      todayEntries.push(entry)
    } else if (entryDate >= yesterday) {
      yesterdayEntries.push(entry)
    } else if (entryDate >= weekAgo) {
      weekEntries.push(entry)
    } else {
      olderEntries.push(entry)
    }
  }

  const groups: DayGroup[] = []
  if (todayEntries.length > 0) groups.push({ label: 'Today', entries: todayEntries, defaultExpanded: true })
  if (yesterdayEntries.length > 0) groups.push({ label: 'Yesterday', entries: yesterdayEntries, defaultExpanded: false })
  if (weekEntries.length > 0) groups.push({ label: 'This Week', entries: weekEntries, defaultExpanded: false })
  if (olderEntries.length > 0) groups.push({ label: 'Older', entries: olderEntries, defaultExpanded: false })

  return groups
}

function CollapsibleGroup({
  group,
  onEntryPress,
  onUndo,
}: {
  group: DayGroup
  onEntryPress: (id: string) => void
  onUndo: (id: string) => void
}) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(group.defaultExpanded)

  return (
    <View style={{ marginBottom: theme.tokens.spacing[3] }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.tokens.spacing[5],
          paddingVertical: theme.tokens.spacing[2],
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
          <Text variant="bodySmall" weight="semibold">{group.label}</Text>
          <Text variant="caption" color={theme.colors.text.tertiary}>({group.entries.length})</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.text.tertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <Card variant="outlined" padding="none" style={{ marginHorizontal: theme.tokens.spacing[5] }}>
          {group.entries.map((entry, i) => (
            <View key={entry.id}>
              <ActivityEntry entry={entry} onPress={onEntryPress} onUndo={onUndo} />
              {i < group.entries.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      )}
    </View>
  )
}

export function ActivitySection({ entries, onEntryPress, onUndo, onSeeAll }: ActivitySectionProps) {
  const { theme } = useTheme()
  const groups = useMemo(() => groupByDay(entries), [entries])

  return (
    <View style={{ marginBottom: theme.tokens.spacing[8] }}>
      <SectionHeader title="Activity" count={entries.length} onSeeAll={onSeeAll} />
      {groups.length === 0 ? (
        <View style={{ paddingHorizontal: theme.tokens.spacing[5], paddingVertical: theme.tokens.spacing[3] }}>
          <Text variant="bodySmall" color={theme.colors.text.tertiary} align="center">
            No activity yet. The Claw will log everything it does here.
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <CollapsibleGroup
            key={group.label}
            group={group}
            onEntryPress={onEntryPress}
            onUndo={onUndo}
          />
        ))
      )}
    </View>
  )
}
