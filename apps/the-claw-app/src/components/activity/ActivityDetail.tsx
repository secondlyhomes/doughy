/**
 * ActivityDetail Component
 *
 * Expanded detail view for a single activity entry.
 * Shows full preview, risk tier, approval info, and lifecycle timeline.
 */

import { useState } from 'react'
import { View, ScrollView, Modal, TouchableOpacity, TextInput, Platform, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme, type Theme } from '@/theme'
import { Text } from '../Text'
import { Badge } from '../Badge/Badge'
import { Card } from '../Card/Card'
import { LiquidGlass, isLiquidGlassAvailable } from '../../../modules/liquid-glass'
import { CHANNEL_LABELS, RESOLUTION_LABELS, TIER_CONFIG } from '@/constants/integrations'
import type { ActionHistoryEntry } from '@/types'

export interface ActivityDetailProps {
  entry: ActionHistoryEntry | null
  visible: boolean
  onClose: () => void
  onApprove?: (id: string, editedContent?: string) => void
  onDeny?: (id: string) => void
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ActivityDetail({ entry, visible, onClose, onApprove, onDeny }: ActivityDetailProps) {
  const { theme, isDark } = useTheme()
  const [editedDraft, setEditedDraft] = useState<string | null>(null)

  if (!entry) return null

  const tierConfig = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.none
  const isEditable = entry.status === 'pending' && entry.preview.summary

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Glass header */}
        <View style={{ overflow: 'hidden' }}>
          {Platform.OS === 'ios' ? (
            isLiquidGlassAvailable ? (
              <LiquidGlass style={StyleSheet.absoluteFill} />
            ) : (
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            )
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface }]} />
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.tokens.spacing[4],
            }}
          >
            <Text variant="h3">Action Detail</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text variant="body" color={theme.colors.primary[500]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: theme.tokens.spacing[4],
            paddingBottom: theme.tokens.spacing[10],
          }}
        >
          {/* Title */}
          <Text variant="h3" style={{ marginBottom: theme.tokens.spacing[1] }}>
            {entry.preview.title}
          </Text>
          <Text variant="body" color={theme.colors.text.secondary} style={{ marginBottom: theme.tokens.spacing[4] }}>
            {entry.preview.summary}
          </Text>

          {/* Status + Tier badges */}
          <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[2], marginBottom: theme.tokens.spacing[4] }}>
            <Badge label={entry.status} variant={entry.status === 'denied' || entry.status === 'failed' ? 'error' : entry.status === 'pending' ? 'warning' : 'success'} />
            <Badge label={tierConfig.label} variant={tierConfig.variant} />
          </View>

          {/* Preview details */}
          <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
            <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
              Details
            </Text>
            {Object.entries(entry.preview.details).map(([key, value]) => (
              <View
                key={key}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: theme.tokens.spacing[1],
                }}
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
            <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
              Audit Trail
            </Text>
            <DetailRow label="Trust Level" value={entry.trustLevelAtTime} theme={theme} />
            <DetailRow label="Connection" value={entry.connectionId ?? 'None'} theme={theme} />
            {entry.channel && (
              <DetailRow label="Resolved via" value={CHANNEL_LABELS[entry.channel]} theme={theme} />
            )}
            {entry.resolvedBy && (
              <DetailRow label="Resolution" value={RESOLUTION_LABELS[entry.resolvedBy]} theme={theme} />
            )}
          </Card>

          {/* Timeline */}
          <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
            <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
              Timeline
            </Text>
            <TimelineStep label="Requested" time={entry.requestedAt} theme={theme} />
            {entry.resolvedAt && (
              <TimelineStep label="Resolved" time={entry.resolvedAt} theme={theme} />
            )}
            {entry.executedAt && (
              <TimelineStep label="Executed" time={entry.executedAt} theme={theme} />
            )}
            {!entry.resolvedAt && entry.status === 'pending' && (
              <Text variant="bodySmall" color={theme.colors.warning[500]} style={{ marginTop: theme.tokens.spacing[1] }}>
                Awaiting resolution...
              </Text>
            )}
          </Card>

          {/* Editable draft for pending items */}
          {isEditable && (
            <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
              <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
                Draft Message {editedDraft !== null ? '(edited)' : ''}
              </Text>
              <TextInput
                value={editedDraft ?? entry.preview.summary}
                onChangeText={(text) => setEditedDraft(text)}
                multiline
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
                  fontSize: 15,
                  lineHeight: 22,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.tokens.borderRadius.md,
                  padding: theme.tokens.spacing[3],
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={theme.colors.text.tertiary}
                accessibilityLabel="Edit draft message"
              />
              {editedDraft !== null && (
                <TouchableOpacity
                  onPress={() => setEditedDraft(null)}
                  style={{ marginTop: theme.tokens.spacing[1] }}
                >
                  <Text variant="caption" color={theme.colors.primary[500]}>Reset to original</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Actions for pending items */}
          {entry.status === 'pending' && onApprove && onDeny && (
            <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3], marginTop: theme.tokens.spacing[2] }}>
              <TouchableOpacity
                onPress={() => onDeny(entry.id)}
                style={{
                  flex: 1,
                  padding: theme.tokens.spacing[4],
                  borderRadius: theme.tokens.borderRadius.lg,
                  backgroundColor: theme.colors.error[500],
                  alignItems: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Deny action"
              >
                <Text variant="body" weight="semibold" color={theme.colors.text.inverse}>Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onApprove(entry.id, editedDraft ?? undefined)
                  setEditedDraft(null)
                }}
                style={{
                  flex: 1,
                  padding: theme.tokens.spacing[4],
                  borderRadius: theme.tokens.borderRadius.lg,
                  backgroundColor: theme.colors.success[500],
                  alignItems: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel={editedDraft !== null ? 'Approve with edits' : 'Approve action'}
              >
                <Text variant="body" weight="semibold" color={theme.colors.text.inverse}>
                  {editedDraft !== null ? 'Approve (edited)' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
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
