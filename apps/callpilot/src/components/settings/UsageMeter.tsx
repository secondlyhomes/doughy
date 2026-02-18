/**
 * UsageMeter
 *
 * Shows calls-this-month progress bar in settings.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text, Card } from '@/components'

interface UsageMeterProps {
  callsThisMonth: number
  callLimit: number
}

export function UsageMeter({ callsThisMonth, callLimit }: UsageMeterProps) {
  const { theme } = useTheme()
  const pct = callLimit > 0 ? Math.min(Math.round((callsThisMonth / callLimit) * 100), 100) : 0
  const isHigh = callLimit > 0 && callsThisMonth / callLimit > 0.8

  return (
    <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.tokens.spacing[3] }}>
          <Text variant="body">Calls this month</Text>
          <Text variant="body" weight="semibold">
            {callsThisMonth} of {callLimit}
          </Text>
        </View>
        <View style={{
          height: theme.tokens.spacing[2],
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.tokens.borderRadius.full,
          overflow: 'hidden',
        }}>
          <View style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: isHigh ? theme.colors.error[500] : theme.colors.primary[500],
            borderRadius: theme.tokens.borderRadius.full,
          }} />
        </View>
      </Card>
    </View>
  )
}
