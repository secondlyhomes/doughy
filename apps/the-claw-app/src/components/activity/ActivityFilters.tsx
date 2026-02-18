/**
 * ActivityFilters Component
 *
 * Horizontal scrollable filter chips for the activity feed.
 */

import { ScrollView, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import type { ActivityFilter, ActivityStatusFilter } from '@/types'

export interface ActivityFiltersProps {
  timeFilter: ActivityFilter
  statusFilter: ActivityStatusFilter
  onTimeFilterChange: (filter: ActivityFilter) => void
  onStatusFilterChange: (filter: ActivityStatusFilter) => void
}

const TIME_FILTERS: { label: string; value: ActivityFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this-week' },
]

const STATUS_FILTERS: { label: string; value: ActivityStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
  { label: 'Auto', value: 'auto-approved' },
  { label: 'Failed', value: 'failed' },
]

export function ActivityFilters({
  timeFilter,
  statusFilter,
  onTimeFilterChange,
  onStatusFilterChange,
}: ActivityFiltersProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: theme.tokens.spacing[2] }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.tokens.spacing[2], paddingHorizontal: theme.tokens.spacing[4] }}
      >
        {TIME_FILTERS.map((filter) => (
          <FilterChip
            key={filter.value}
            label={filter.label}
            selected={timeFilter === filter.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onTimeFilterChange(filter.value)
            }}
          />
        ))}
        <View style={{ width: 1, backgroundColor: theme.colors.border, marginHorizontal: theme.tokens.spacing[1] }} />
        {STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter.value}
            label={filter.label}
            selected={statusFilter === filter.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onStatusFilterChange(filter.value)
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: theme.tokens.spacing[3],
        paddingVertical: theme.tokens.spacing[1] + 2,
        borderRadius: theme.tokens.borderRadius.full,
        backgroundColor: selected ? theme.colors.primary[500] : theme.colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary[500] : theme.colors.border,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        variant="caption"
        weight={selected ? 'semibold' : 'regular'}
        color={selected ? theme.colors.text.inverse : theme.colors.text.secondary}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}
