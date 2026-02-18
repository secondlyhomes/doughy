/**
 * QueueSection Component
 *
 * Switches on trustLevel to render the appropriate queue view:
 * locked → read-only message, manual → approval cards, guarded → countdown cards,
 * autonomous → auto-execute message.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Card } from '../Card/Card'
import { SectionHeader } from '../control-panel/SectionHeader'
import { CountdownCard } from './CountdownCard'
import { ApprovalCard } from './ApprovalCard'
import type { TrustLevel, QueueItem } from '@/types'

export interface QueueSectionProps {
  trustLevel: TrustLevel
  countdownItems: QueueItem[]
  pendingItems: QueueItem[]
  countdownSeconds: number
  onCancel: (id: string) => void
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}

export function QueueSection({
  trustLevel,
  countdownItems,
  pendingItems,
  countdownSeconds,
  onCancel,
  onApprove,
  onDeny,
}: QueueSectionProps) {
  const { theme } = useTheme()
  const totalItems = countdownItems.length + pendingItems.length

  if (trustLevel === 'locked') {
    return (
      <View style={{ marginBottom: theme.tokens.spacing[6] }}>
        <SectionHeader title="Queue" />
        <Card variant="filled" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5] }}>
          <Text variant="body" weight="semibold" style={{ marginBottom: theme.tokens.spacing[1] }}>
            {'\uD83D\uDD12'} Read-Only Mode
          </Text>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            The Claw is watching but not acting. Upgrade trust level to enable actions.
          </Text>
        </Card>
      </View>
    )
  }

  if (trustLevel === 'autonomous') {
    return (
      <View style={{ marginBottom: theme.tokens.spacing[6] }}>
        <SectionHeader title="Queue" />
        <Card variant="filled" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5] }}>
          <Text variant="body" weight="semibold" style={{ marginBottom: theme.tokens.spacing[1] }}>
            {'\uD83D\uDE80'} Autonomous Mode
          </Text>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Actions execute immediately. Check the activity log below to see what happened.
          </Text>
        </Card>
      </View>
    )
  }

  const sectionTitle = trustLevel === 'manual'
    ? `Pending Approvals${totalItems > 0 ? '' : ''}`
    : `Queue`

  if (totalItems === 0) {
    return (
      <View style={{ marginBottom: theme.tokens.spacing[6] }}>
        <SectionHeader title={sectionTitle} />
        <View style={{ paddingHorizontal: theme.tokens.spacing[5], paddingVertical: theme.tokens.spacing[3] }}>
          <Text variant="bodySmall" color={theme.colors.text.tertiary} align="center">
            {trustLevel === 'manual' ? 'Nothing pending \u2728' : 'Queue clear \u2728'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ marginBottom: theme.tokens.spacing[6] }}>
      <SectionHeader title={sectionTitle} count={totalItems} />

      {/* Guarded mode: countdown cards */}
      {trustLevel === 'guarded' && countdownItems.map((item) => (
        <CountdownCard key={item.id} item={item} totalSeconds={countdownSeconds} onCancel={onCancel} />
      ))}

      {/* Manual mode or remaining pending items */}
      {pendingItems.map((item) => (
        <ApprovalCard key={item.id} item={item} onApprove={onApprove} onDeny={onDeny} />
      ))}

      {/* Queue status message */}
      {trustLevel === 'guarded' && countdownItems.length > 0 && pendingItems.length === 0 && (
        <Text
          variant="caption"
          color={theme.colors.text.tertiary}
          align="center"
          style={{ marginTop: theme.tokens.spacing[2], paddingHorizontal: theme.tokens.spacing[5] }}
        >
          Queue clear after these {'\u2728'}
        </Text>
      )}
    </View>
  )
}
