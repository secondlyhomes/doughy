/**
 * CostCard Component
 *
 * Monthly cost summary with monospace numbers, breakdown, and key stats.
 * Shows current month name. Numbers right-aligned for readability.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Card } from '../Card/Card'
import { SectionHeader } from '../control-panel/SectionHeader'
import { Skeleton } from '../shared/Skeleton'
import type { MonthlyCostSummary } from '@/types'

export interface CostCardProps {
  summary: MonthlyCostSummary | null
  loading: boolean
  error?: string | null
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function CostRow({
  label,
  value,
  theme,
  bold,
}: {
  label: string
  value: string
  theme: any
  bold?: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text variant="bodySmall" color={theme.colors.text.secondary}>{label}</Text>
      <Text
        variant="bodySmall"
        weight={bold ? 'bold' : 'medium'}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  )
}

function StatRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
      <Text variant="caption" color={theme.colors.text.tertiary}>{label}</Text>
      <Text variant="caption" weight="medium" style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  )
}

export function CostCard({ summary, loading, error }: CostCardProps) {
  const { theme } = useTheme()
  const now = new Date()
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`

  if (loading) {
    return (
      <View style={{ marginBottom: theme.tokens.spacing[8] }}>
        <SectionHeader title={monthLabel} />
        <Card variant="outlined" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5], gap: theme.tokens.spacing[3] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={80} height={28} />
          </View>
          <Skeleton width="100%" height={12} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="60%" height={12} />
        </Card>
      </View>
    )
  }

  // Error state — load finished but failed
  if (error || !summary) {
    return (
      <View style={{ marginBottom: theme.tokens.spacing[8] }}>
        <SectionHeader title={monthLabel} />
        <Card variant="outlined" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5] }}>
          <Text variant="bodySmall" color={theme.colors.text.tertiary} align="center">
            {error ? 'Unable to load cost data.' : 'No cost data available yet.'}
          </Text>
        </Card>
      </View>
    )
  }

  // Zero state — loaded successfully but no actions this month
  const isEmpty = summary.totalCents === 0 && summary.actionCount === 0

  return (
    <View style={{ marginBottom: theme.tokens.spacing[8] }}>
      <SectionHeader title={monthLabel} />
      <Card variant="outlined" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5] }}>
        {/* Total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: theme.tokens.spacing[3] }}>
          <Text variant="caption" color={theme.colors.text.tertiary}>Total</Text>
          <Text variant="h2" weight="bold" style={{ fontVariant: ['tabular-nums'] }}>
            {formatCents(summary.totalCents)}
          </Text>
        </View>

        {isEmpty ? (
          <Text variant="caption" color={theme.colors.text.tertiary} align="center">
            No actions this month. Costs will appear as The Claw takes actions.
          </Text>
        ) : (
          <>
            {/* Breakdown */}
            {summary.breakdown.map((item) => (
              <CostRow key={item.label} label={item.label} value={formatCents(item.amountCents)} theme={theme} />
            ))}

            {/* Divider + Stats */}
            <View
              style={{
                marginTop: theme.tokens.spacing[3],
                paddingTop: theme.tokens.spacing[3],
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <StatRow label="Leads touched" value={String(summary.leadsTouched)} theme={theme} />
              <StatRow label="Actions taken" value={String(summary.actionCount)} theme={theme} />
              {summary.dealsInfluenced !== undefined && (
                <StatRow label="Deals influenced" value={String(summary.dealsInfluenced)} theme={theme} />
              )}
              <View style={{ height: theme.tokens.spacing[2] }} />
              <StatRow label="Cost per lead" value={formatCents(summary.costPerLeadCents)} theme={theme} />
            </View>
          </>
        )}
      </Card>
    </View>
  )
}
