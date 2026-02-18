/**
 * CompactCallHeader
 *
 * Single-row header showing call status, contact info, and timer.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface CompactCallHeaderProps {
  contactName: string
  company: string
  duration: number
  isConnected: boolean
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function CompactCallHeader({
  contactName,
  company,
  duration,
  isConnected,
}: CompactCallHeaderProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.tokens.spacing[4],
        paddingVertical: theme.tokens.spacing[3],
        backgroundColor: theme.colors.neutral[800],
        borderRadius: theme.tokens.borderRadius.lg,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isConnected
            ? theme.colors.success[500]
            : theme.colors.neutral[500],
          marginRight: theme.tokens.spacing[2],
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="bodySmall"
          weight="semibold"
          color={theme.tokens.colors.white}
          numberOfLines={1}
        >
          {contactName}
        </Text>
        {company ? (
          <Text
            variant="caption"
            color={theme.colors.neutral[400]}
            numberOfLines={1}
          >
            {company}
          </Text>
        ) : null}
      </View>
      <Text
        variant="body"
        weight="semibold"
        color={theme.tokens.colors.white}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatTimer(duration)}
      </Text>
    </View>
  )
}
