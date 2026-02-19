/**
 * ConnectionsSection Component
 *
 * Vertical list of ConnectionCards with section header.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Card } from '../Card/Card'
import { Text } from '../Text'
import { SectionHeader } from '../control-panel/SectionHeader'
import { ConnectionCard } from './ConnectionCard'
import { Divider } from '../Divider'
import { Skeleton } from '../shared/Skeleton'
import type { ServiceConnection } from '@/types'

export interface ConnectionsSectionProps {
  connections: ServiceConnection[]
  onConnectionPress: (id: string) => void
  loading?: boolean
}

function ConnectionsSkeleton() {
  const { theme } = useTheme()
  return (
    <Card variant="outlined" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5], gap: theme.tokens.spacing[3] }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[3] }}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={{ flex: 1, gap: theme.tokens.spacing[1] }}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="80%" height={10} />
          </View>
        </View>
      ))}
    </Card>
  )
}

export function ConnectionsSection({ connections, onConnectionPress, loading }: ConnectionsSectionProps) {
  const { theme } = useTheme()

  return (
    <View style={{ marginBottom: theme.tokens.spacing[8] }}>
      <SectionHeader title="Connections" count={loading ? undefined : connections.filter(c => c.status === 'connected').length} />
      {loading ? (
        <ConnectionsSkeleton />
      ) : connections.length === 0 ? (
        <Card variant="outlined" padding="md" style={{ marginHorizontal: theme.tokens.spacing[5], alignItems: 'center', paddingVertical: theme.tokens.spacing[6] }}>
          <Text variant="body" color={theme.colors.text.tertiary} align="center">
            No connections found
          </Text>
        </Card>
      ) : (
        <Card variant="outlined" padding="none" style={{ marginHorizontal: theme.tokens.spacing[5] }}>
          {connections.map((conn, i) => (
            <View key={`${conn.id}-${i}`}>
              <ConnectionCard connection={conn} onPress={onConnectionPress} />
              {i < connections.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      )}
    </View>
  )
}
