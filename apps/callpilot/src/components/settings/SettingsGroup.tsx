/**
 * SettingsGroup
 *
 * iOS UITableView.Style.insetGrouped container for settings rows.
 * Wraps children in a rounded rect card with surface background.
 */

import { ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/theme'

interface SettingsGroupProps {
  children: ReactNode
}

export function SettingsGroup({ children }: SettingsGroupProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        marginHorizontal: theme.tokens.spacing[4],
        borderRadius: theme.tokens.borderRadius.lg,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  )
}
