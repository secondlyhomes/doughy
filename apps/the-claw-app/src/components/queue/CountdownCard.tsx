/**
 * CountdownCard Component
 *
 * Glass card with action title, preview text, channel tag, animated progress bar,
 * and prominent Cancel button. Progress bar width = remaining/total seconds.
 */

import { useState, useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Button } from '../Button/Button'
import { Card } from '../Card/Card'
import { Badge } from '../Badge/Badge'
import type { QueueItem } from '@/types'
import { CONNECTION_ICONS } from '@/constants/icons'

export interface CountdownCardProps {
  item: QueueItem
  totalSeconds: number
  onCancel: (id: string) => void
}

export function CountdownCard({ item, totalSeconds, onCancel }: CountdownCardProps) {
  const { theme } = useTheme()
  const [remainingMs, setRemainingMs] = useState(0)
  const progressAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!item.countdownEndsAt) return

    const endTime = new Date(item.countdownEndsAt).getTime()
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now())
      setRemainingMs(remaining)
      const fraction = remaining / (totalSeconds * 1000)
      progressAnim.setValue(fraction)
    }, 100)

    return () => clearInterval(interval)
  }, [item.countdownEndsAt, totalSeconds])

  const seconds = Math.ceil(remainingMs / 1000)
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
        <Badge label={`${seconds}s`} variant={seconds <= 5 ? 'error' : 'warning'} />
      </View>

      {/* Preview text */}
      <Text variant="bodySmall" color={theme.colors.text.secondary} numberOfLines={2} style={{ marginBottom: theme.tokens.spacing[3] }}>
        {item.summary}
      </Text>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: theme.colors.surfaceSecondary, borderRadius: 2, marginBottom: theme.tokens.spacing[3], overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: seconds <= 5 ? theme.colors.error[500] : theme.colors.warning[500],
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      {/* Risk + Cancel */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
        <Badge label={item.riskLevel} variant={riskVariant} />
        <View style={{ flex: 1 }} />
        <Button
          title="Cancel"
          variant="secondary"
          size="sm"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCancel(item.id) }}
        />
      </View>
    </Card>
  )
}
