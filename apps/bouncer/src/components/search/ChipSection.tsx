/**
 * ChipSection Component
 *
 * Horizontal chip row for the search filter sheet.
 * Selected chip gets primary color; unselected gets surfaceSecondary.
 */

import { View, TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

export interface ChipSectionProps<T extends string> {
  label: string
  options: ChipOption<T>[]
  selected: T
  onSelect: (value: T) => void
}

export function ChipSection<T extends string>({ label, options, selected, onSelect }: ChipSectionProps<T>) {
  const { theme } = useTheme()

  return (
    <View style={{ marginBottom: theme.tokens.spacing[4] }}>
      <Text variant="caption" color={theme.colors.text.secondary} weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.tokens.spacing[2] }}>
        {options.map((option) => {
          const isSelected = option.value === selected
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
                onSelect(option.value)
              }}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: theme.tokens.spacing[3],
                paddingVertical: theme.tokens.spacing[2],
                borderRadius: theme.tokens.borderRadius.full,
                backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.surfaceSecondary,
              }}
            >
              <Text
                variant="caption"
                weight="medium"
                color={isSelected ? theme.colors.text.inverse : theme.colors.text.secondary}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
