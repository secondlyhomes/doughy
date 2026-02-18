/**
 * FilterPill Component
 *
 * Small removable pill badge for active search filters.
 * Memoized to avoid re-renders when other pills change.
 */

import React from 'react'
import { TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Icon } from '../Icon'
import { withAlpha } from '@/utils/color'

export interface FilterPillProps {
  label: string
  onRemove: () => void
}

export const FilterPill = React.memo(function FilterPill({ label, onRemove }: FilterPillProps) {
  const { theme } = useTheme()

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onRemove()
  }

  return (
    <TouchableOpacity
      onPress={handleRemove}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.tokens.spacing[1],
        backgroundColor: withAlpha(theme.colors.primary[500], 0.2),
        paddingHorizontal: theme.tokens.spacing[2],
        paddingVertical: theme.tokens.spacing[1],
        borderRadius: theme.tokens.borderRadius.full,
      }}
    >
      <Text variant="caption" color={theme.colors.primary[500]} weight="medium">
        {label}
      </Text>
      <Icon name="close-circle" size={14} color={theme.colors.primary[500]} />
    </TouchableOpacity>
  )
})
