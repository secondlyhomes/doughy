/**
 * CoachingTabBar
 *
 * Three pill-style tabs for switching between coaching content.
 */

import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export type CoachingTab = 'approach' | 'facts' | 'suggestions'

export interface CoachingTabBarProps {
  activeTab: CoachingTab
  onTabChange: (tab: CoachingTab) => void
}

const TABS: { key: CoachingTab; label: string }[] = [
  { key: 'approach', label: 'Approach' },
  { key: 'facts', label: 'Key Facts' },
  { key: 'suggestions', label: 'Suggestions' },
]

export function CoachingTabBar({ activeTab, onTabChange }: CoachingTabBarProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.tokens.spacing[2],
        paddingHorizontal: theme.tokens.spacing[4],
        paddingVertical: theme.tokens.spacing[2],
      }}
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onTabChange(key)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: theme.tokens.spacing[2],
              borderRadius: theme.tokens.borderRadius.full,
              backgroundColor: isActive
                ? theme.colors.primary[500]
                : theme.colors.neutral[700],
              alignItems: 'center',
            }}
          >
            <Text
              variant="caption"
              weight={isActive ? 'semibold' : 'medium'}
              color={
                isActive
                  ? theme.tokens.colors.white
                  : theme.colors.neutral[300]
              }
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
