/**
 * CrmPushCard
 *
 * Shows extracted call data with per-field approval.
 * Groups fields by entity (property, lead, deal).
 * Confidence badges: high=green, medium=yellow, low=red.
 */

import { useState, memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact, triggerNotification } from '@/utils/haptics'
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'
import { GlassView } from '@/components/GlassView'
import { withOpacity } from '@/utils/formatters'
import type { ExtractionField, ExtractionConfidence, ExtractionGroup } from '@/types'

interface CrmPushCardProps {
  groups: ExtractionGroup[]
  onApproveField: (field: ExtractionField) => void
  onSkipField: (field: ExtractionField) => void
  onApproveAllEmpty: () => void
}

const CONFIDENCE_COLORS: Record<ExtractionConfidence, { badge: string; label: string }> = {
  high: { badge: '\uD83D\uDFE2', label: 'high' },
  medium: { badge: '\uD83D\uDFE1', label: 'medium' },
  low: { badge: '\uD83D\uDD34', label: 'low' },
}

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '(empty)'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    return value >= 1000 ? `$${value.toLocaleString()}` : String(value)
  }
  return String(value)
}

const FieldRow = memo(function FieldRow({
  field,
  onApprove,
  onSkip,
}: {
  field: ExtractionField
  onApprove: () => void
  onSkip: () => void
}) {
  const { theme } = useTheme()
  const [decided, setDecided] = useState(false)
  const conf = CONFIDENCE_COLORS[field.confidence]
  const isEmpty = field.currentValue === null || field.currentValue === ''
  const actionLabel = isEmpty ? 'Fill' : 'Overwrite'

  function handleApprove() {
    triggerImpact(ImpactFeedbackStyle.Light)
    setDecided(true)
    onApprove()
  }

  function handleSkip() {
    triggerImpact(ImpactFeedbackStyle.Light)
    setDecided(true)
    onSkip()
  }

  if (decided) return null

  return (
    <View style={{
      paddingVertical: theme.tokens.spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    }}>
      <Text variant="caption" weight="semibold" color={theme.colors.text.primary}>
        {formatFieldName(field.field)}
      </Text>
      <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginTop: 2 }}>
        Current: {formatValue(field.currentValue)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1], marginTop: theme.tokens.spacing[1] }}>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          From call: {formatValue(field.value)}
        </Text>
        <Text variant="caption">{conf.badge} {conf.label}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[2], marginTop: theme.tokens.spacing[2] }}>
        {([
          { onPress: handleApprove, label: actionLabel, a11y: `${actionLabel} ${field.field}`, icon: 'checkmark-circle' as const, color: theme.colors.success[500] },
          { onPress: handleSkip, label: 'Skip', a11y: `Skip ${field.field}`, icon: 'close-circle' as const, color: theme.colors.error[500] },
        ] as const).map((btn) => (
          <TouchableOpacity
            key={btn.label}
            onPress={btn.onPress}
            accessibilityLabel={btn.a11y}
            accessibilityRole="button"
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: theme.tokens.spacing[2], paddingVertical: theme.tokens.spacing[1],
              borderRadius: theme.tokens.borderRadius.md, backgroundColor: withOpacity(btn.color, 'light'),
            }}
          >
            <Ionicons name={btn.icon} size={16} color={btn.color} />
            <Text variant="caption" weight="semibold" color={btn.color}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
})

export function CrmPushCard({ groups, onApproveField, onSkipField, onApproveAllEmpty }: CrmPushCardProps) {
  const { theme } = useTheme()

  const emptyFieldCount = groups.reduce(
    (acc, g) => acc + g.fields.filter((f) => f.currentValue === null || f.currentValue === '').length,
    0
  )

  function handleApproveAll() {
    triggerNotification(NotificationFeedbackType.Success)
    onApproveAllEmpty()
  }

  return (
    <View style={{ gap: theme.tokens.spacing[3] }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
        <Text variant="h3">{'\uD83D\uDCCA'} Update CRM?</Text>
      </View>

      {/* Groups */}
      {groups.map((group) => (
        <GlassView
          key={group.label}
          intensity="subtle"
          style={{
            padding: theme.tokens.spacing[3],
            borderRadius: theme.tokens.borderRadius.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1], marginBottom: theme.tokens.spacing[2] }}>
            <Text variant="body" weight="semibold">
              {group.icon} {group.label}
            </Text>
          </View>

          {group.fields.map((field) => (
            <FieldRow
              key={field.field}
              field={field}
              onApprove={() => onApproveField(field)}
              onSkip={() => onSkipField(field)}
            />
          ))}
        </GlassView>
      ))}

      {/* Approve All Empty */}
      {emptyFieldCount > 0 && (
        <TouchableOpacity
          onPress={handleApproveAll}
          accessibilityLabel="Approve all empty fields"
          accessibilityRole="button"
          style={{
            paddingVertical: theme.tokens.spacing[3],
            borderRadius: theme.tokens.borderRadius.lg,
            backgroundColor: theme.colors.primary[500],
            alignItems: 'center',
          }}
        >
          <Text variant="body" weight="semibold" color={theme.colors.text.inverse}>
            Approve All Empty Fields ({emptyFieldCount})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
