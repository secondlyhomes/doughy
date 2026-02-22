/**
 * Activity Detail Screen
 *
 * Expanded view of a single activity entry with full details, undo support.
 */

import { useCallback, useMemo } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme, type Theme } from '@/theme'
import { useActivity } from '@/hooks/useActivity'
import { Text } from '@/components/Text'
import { Card } from '@/components/Card/Card'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { CHANNEL_LABELS, RESOLUTION_LABELS, TIER_CONFIG } from '@/constants/integrations'
import { TRUST_LEVEL_CONFIGS } from '@/types'

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function DetailRow({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.tokens.spacing[1] }}>
      <Text variant="bodySmall" color={theme.colors.text.tertiary}>{label}</Text>
      <Text variant="bodySmall" weight="medium" style={{ textTransform: 'capitalize' }}>{value}</Text>
    </View>
  )
}

function TimelineStep({ label, time, theme }: { label: string; time: string; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.tokens.spacing[1] }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary[500], marginRight: theme.tokens.spacing[2] }} />
      <Text variant="bodySmall" weight="medium" style={{ marginRight: theme.tokens.spacing[2] }}>{label}</Text>
      <Text variant="caption" color={theme.colors.text.tertiary}>{formatDateTime(time)}</Text>
    </View>
  )
}

export default function ActivityDetailScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { entryId } = useLocalSearchParams<{ entryId: string }>()
  const { allEntries, undoEntry } = useActivity()

  const entry = useMemo(
    () => allEntries.find((e) => e.id === entryId),
    [allEntries, entryId],
  )

  const handleUndo = useCallback(() => {
    if (!entry) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    undoEntry(entry.id)
  }, [entry, undoEntry])

  if (!entry) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Text variant="body" style={{ padding: theme.tokens.spacing[4] }}>Entry not found.</Text>
      </SafeAreaView>
    )
  }

  const tierConfig = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.none
  const trustConfig = TRUST_LEVEL_CONFIGS[entry.trustLevelAtTime]
  const canUndo = entry.undoable && !entry.undoneAt

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.tokens.spacing[4],
        }}
      >
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3">Activity Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.tokens.spacing[4], paddingBottom: theme.tokens.spacing[10] }}>
        {/* Title */}
        <Text variant="h3" style={{ marginBottom: theme.tokens.spacing[1] }}>
          {entry.preview.title}
        </Text>
        <Text variant="body" color={theme.colors.text.secondary} style={{ marginBottom: theme.tokens.spacing[4] }}>
          {entry.preview.summary}
        </Text>

        {/* Status badges */}
        <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[2], marginBottom: theme.tokens.spacing[4], flexWrap: 'wrap' }}>
          <Badge
            label={entry.status}
            variant={entry.status === 'denied' || entry.status === 'failed' ? 'error' : entry.status === 'pending' ? 'warning' : 'success'}
          />
          <Badge label={tierConfig.label} variant={tierConfig.variant} />
          {entry.undoneAt && <Badge label="Undone" variant="default" />}
        </View>

        {/* Details */}
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>Details</Text>
          {Object.entries(entry.preview.details).map(([key, value]) => (
            <View
              key={key}
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.tokens.spacing[1] }}
            >
              <Text variant="bodySmall" color={theme.colors.text.tertiary} style={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              <Text variant="bodySmall" weight="medium" style={{ flex: 1, textAlign: 'right', marginLeft: theme.tokens.spacing[3] }} numberOfLines={2}>
                {value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Audit info */}
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>Audit Trail</Text>
          <DetailRow label="Trust Level" value={`${trustConfig.emoji} ${trustConfig.label}`} theme={theme} />
          <DetailRow label="Connection" value={entry.connectionId ?? 'None'} theme={theme} />
          {entry.channel && <DetailRow label="Resolved via" value={CHANNEL_LABELS[entry.channel]} theme={theme} />}
          {entry.resolvedBy && <DetailRow label="Resolution" value={RESOLUTION_LABELS[entry.resolvedBy]} theme={theme} />}
          {entry.costCents > 0 && <DetailRow label="Cost" value={formatCents(entry.costCents)} theme={theme} />}
        </Card>

        {/* Timeline */}
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>Timeline</Text>
          <TimelineStep label="Requested" time={entry.requestedAt} theme={theme} />
          {entry.resolvedAt && <TimelineStep label="Resolved" time={entry.resolvedAt} theme={theme} />}
          {entry.executedAt && <TimelineStep label="Executed" time={entry.executedAt} theme={theme} />}
          {entry.undoneAt && <TimelineStep label="Undone" time={entry.undoneAt} theme={theme} />}
        </Card>

        {/* Undo */}
        {canUndo && (
          <Button
            title="Undo This Action"
            variant="secondary"
            size="lg"
            onPress={handleUndo}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
