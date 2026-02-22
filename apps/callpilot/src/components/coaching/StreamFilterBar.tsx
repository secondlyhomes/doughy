/**
 * StreamFilterBar
 *
 * Compact icon-only toggle row for filtering the unified call stream.
 * Active icon gets pill background; inactive icons are muted.
 */

import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import type { StreamFilter } from '@/types/callStream'

export interface StreamFilterBarProps {
  filter: StreamFilter
  onFilterChange: (filter: StreamFilter) => void
  activeSuggestionCount: number
}

const FILTERS: Array<{
  key: StreamFilter
  icon: keyof typeof Ionicons.glyphMap
  label: string
}> = [
  { key: 'all', icon: 'chatbubbles-outline', label: 'All' },
  { key: 'suggestions', icon: 'bulb-outline', label: 'Tips' },
  { key: 'transcript', icon: 'document-text-outline', label: 'Script' },
  { key: 'minimal', icon: 'eye-off-outline', label: 'Focus' },
]

export function StreamFilterBar({
  filter,
  onFilterChange,
  activeSuggestionCount,
}: StreamFilterBarProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.tokens.spacing[2],
        paddingVertical: theme.tokens.spacing[2],
        paddingHorizontal: theme.tokens.spacing[4],
      }}
    >
      {FILTERS.map(f => {
        const isActive = filter === f.key
        const showBadge =
          f.key === 'suggestions' && activeSuggestionCount > 0 && !isActive

        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onFilterChange(f.key)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: isActive ? 12 : 8,
              borderRadius: theme.tokens.borderRadius.full,
              backgroundColor: isActive
                ? theme.colors.primary[500]
                : 'transparent',
            }}
          >
            <View>
              <Ionicons
                name={f.icon as any}
                size={18}
                color={
                  isActive
                    ? theme.tokens.colors.white
                    : theme.colors.neutral[500]
                }
              />
              {showBadge && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: 6,
                    minWidth: 12,
                    height: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: theme.tokens.colors.white,
                      fontSize: 8,
                      lineHeight: 10,
                    }}
                  >
                    {activeSuggestionCount}
                  </Text>
                </View>
              )}
            </View>
            {isActive && (
              <Text
                variant="caption"
                weight="semibold"
                style={{ color: theme.tokens.colors.white, fontSize: 11 }}
              >
                {f.label}
              </Text>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
