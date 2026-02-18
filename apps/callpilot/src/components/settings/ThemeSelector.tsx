/**
 * ThemeSelector
 *
 * Segmented control for Light / Dark / System theme mode.
 */

import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'
import type { ThemeMode } from '@/theme/ThemeContext'

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
]

export function ThemeSelector() {
  const { theme, themeMode, setThemeMode } = useTheme()

  return (
    <View accessibilityRole="tablist" style={{
      flexDirection: 'row',
      marginHorizontal: theme.tokens.spacing[4],
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: theme.tokens.borderRadius.lg,
      padding: 3,
    }}>
      {THEME_OPTIONS.map(({ key, label }) => {
        const isActive = themeMode === key
        return (
          <TouchableOpacity
            key={key}
            onPress={() => setThemeMode(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              paddingVertical: theme.tokens.spacing[2],
              borderRadius: theme.tokens.borderRadius.md,
              alignItems: 'center',
              backgroundColor: isActive ? theme.colors.background : 'transparent',
              ...(isActive ? theme.tokens.shadows.sm : {}),
            }}
          >
            <Text
              variant="bodySmall"
              weight="semibold"
              color={isActive ? theme.colors.text.primary : theme.colors.text.tertiary}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
