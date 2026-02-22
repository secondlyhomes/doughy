/**
 * FilterChip + FilterChipGroup
 *
 * Reusable filter chip pattern extracted from messages/calls filter UI.
 */

import { ScrollView, TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from './Text'

export interface FilterChipProps {
  label: string
  isActive: boolean
  onPress: () => void
  icon?: React.ReactNode
}

export function FilterChip({ label, isActive, onPress, icon }: FilterChipProps) {
  const { theme } = useTheme()

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Filter by ${label}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.tokens.spacing[3],
        paddingVertical: theme.tokens.spacing[2],
        borderRadius: theme.tokens.borderRadius.full,
        backgroundColor: isActive ? theme.colors.primary[500] : theme.colors.surfaceSecondary,
        gap: theme.tokens.spacing[1],
      }}
    >
      {icon}
      <Text
        variant="bodySmall"
        weight="semibold"
        color={isActive ? theme.tokens.colors.white : theme.colors.text.secondary}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export interface FilterChipGroupProps<T extends string> {
  filters: { key: T; label: string; icon?: React.ReactNode }[]
  activeFilter: T
  onFilterChange: (key: T) => void
}

export function FilterChipGroup<T extends string>({
  filters,
  activeFilter,
  onFilterChange,
}: FilterChipGroupProps<T>) {
  const { theme } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: theme.tokens.spacing[4],
        paddingVertical: theme.tokens.spacing[2],
        gap: theme.tokens.spacing[2],
      }}
    >
      {filters.map(({ key, label, icon }) => (
        <FilterChip
          key={key}
          label={label}
          isActive={activeFilter === key}
          onPress={() => onFilterChange(key)}
          icon={icon}
        />
      ))}
    </ScrollView>
  )
}
