/**
 * ConnectionCard Component
 *
 * Compact card: status dot + name + status text + summary + chevron.
 */

import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { StatusDot } from '../StatusDot'
import type { ServiceConnection } from '@/types'
import type { StatusDotColor } from '../StatusDot'

export interface ConnectionCardProps {
  connection: ServiceConnection
  onPress: (id: string) => void
}

const STATUS_DOT_MAP: Record<string, StatusDotColor> = {
  connected: 'green',
  warning: 'yellow',
  error: 'red',
  disconnected: 'gray',
}

export function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
  const { theme } = useTheme()
  const dotColor = STATUS_DOT_MAP[connection.status] || 'gray'

  return (
    <TouchableOpacity
      onPress={() => onPress(connection.id)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[3],
        paddingHorizontal: theme.tokens.spacing[4],
        gap: theme.tokens.spacing[3],
      }}
      accessibilityRole="button"
      accessibilityLabel={`${connection.name}: ${connection.status}`}
    >
      <StatusDot color={dotColor} />
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium">{connection.name}</Text>
        <Text variant="caption" color={theme.colors.text.tertiary} numberOfLines={1}>
          {connection.summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  )
}
