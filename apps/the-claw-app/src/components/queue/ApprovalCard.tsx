/**
 * ApprovalCard Component
 *
 * Glass card for manual-mode items: action title, preview, Approve/Deny buttons inline.
 */

import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Button } from '../Button/Button'
import { Card } from '../Card/Card'
import { Badge } from '../Badge/Badge'
import type { QueueItem } from '@/types'
import { CONNECTION_ICONS } from '@/constants/icons'

export interface ApprovalCardProps {
  item: QueueItem
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}

export function ApprovalCard({ item, onApprove, onDeny }: ApprovalCardProps) {
  const { theme } = useTheme()
  const iconName = CONNECTION_ICONS[item.connectionId] || 'flash-outline'
  const riskVariant = item.riskLevel === 'high' ? 'error' : item.riskLevel === 'medium' ? 'warning' : 'info'

  return (
    <Card variant="outlined" padding="md" style={{ marginHorizontal: theme.tokens.spacing[4], marginBottom: theme.tokens.spacing[3] }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.tokens.spacing[2], gap: theme.tokens.spacing[2] }}>
        <Ionicons name={iconName as any} size={16} color={theme.colors.text.secondary} />
        <Text variant="body" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
          {item.title}
        </Text>
        <Badge label={item.riskLevel} variant={riskVariant} />
      </View>

      {/* Preview text */}
      <Text variant="bodySmall" color={theme.colors.text.secondary} numberOfLines={2} style={{ marginBottom: theme.tokens.spacing[3] }}>
        {item.summary}
      </Text>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[2] }}>
        <Button title="Deny" variant="secondary" size="sm" onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onDeny(item.id) }} style={{ flex: 1 }} />
        <Button title="Approve" variant="primary" size="sm" onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onApprove(item.id) }} style={{ flex: 1 }} />
      </View>
    </Card>
  )
}
