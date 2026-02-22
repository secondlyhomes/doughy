/**
 * SectionHeader Component
 *
 * Reusable section header with title, optional badge count, and optional "See all" link.
 */

import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Badge } from '../Badge/Badge'

export interface SectionHeaderProps {
  title: string
  count?: number
  onSeeAll?: () => void
}

export function SectionHeader({ title, count, onSeeAll }: SectionHeaderProps) {
  const { theme } = useTheme()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.tokens.spacing[3], paddingHorizontal: theme.tokens.spacing[5] }}>
      <Text variant="h3" style={{ flex: 1 }}>{title}</Text>
      {count !== undefined && count > 0 && (
        <Badge label={String(count)} variant="warning" />
      )}
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={{ marginLeft: theme.tokens.spacing[2] }}>
          <Text variant="bodySmall" color={theme.colors.primary[500]}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
