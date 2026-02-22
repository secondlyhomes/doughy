/**
 * ConnectionStatusBar Component
 *
 * Top bar showing gateway connection state
 */

import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { StatusDot, StatusDotColor } from '../StatusDot'
import { ConnectionStatus } from '@/types'

export interface ConnectionStatusBarProps {
  status: ConnectionStatus
  serverName?: string | null
  style?: ViewStyle
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: StatusDotColor; label: string }> = {
  connected: { color: 'green', label: 'Connected' },
  connecting: { color: 'yellow', label: 'Connecting...' },
  disconnected: { color: 'gray', label: 'Disconnected' },
  error: { color: 'red', label: 'Connection Error' },
}

export function ConnectionStatusBar({
  status,
  serverName,
  style,
}: ConnectionStatusBarProps) {
  const { theme } = useTheme()
  const config = STATUS_CONFIG[status]

  return (
    <View
      style={[
        {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          paddingHorizontal: theme.tokens.spacing[4],
          paddingVertical: theme.tokens.spacing[2],
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          gap: theme.tokens.spacing[2],
        } as ViewStyle,
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Gateway ${config.label}${serverName ? `: ${serverName}` : ''}`}
    >
      <StatusDot color={config.color} pulse={status === 'connecting'} />
      <Text variant="bodySmall" color={theme.colors.text.secondary}>
        {config.label}
      </Text>
      {serverName && status === 'connected' && (
        <Text variant="caption" color={theme.colors.text.tertiary}>
          {serverName}
        </Text>
      )}
    </View>
  )
}
