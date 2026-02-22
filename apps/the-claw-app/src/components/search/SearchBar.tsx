/**
 * SearchBar Component
 *
 * Bottom-floating liquid glass pill for search + filters.
 * Sits above the home indicator. Uses LiquidGlass on iOS 26+,
 * BlurView on older iOS, solid surface on Android.
 */

import { View, TextInput, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { useTheme } from '@/theme'
import { Icon } from '../Icon'
import { FilterPill } from './FilterPill'
import { LiquidGlass, isLiquidGlassAvailable } from '../../../modules/liquid-glass'
import type { SearchFilters } from '@/types/search'

export interface ActiveFilter {
  key: keyof SearchFilters
  label: string
}

export interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  activeFilterLabels: ActiveFilter[]
  onRemoveFilter: (key: keyof SearchFilters) => void
  hasActiveFilters: boolean
  onFilterPress: () => void
  onHeightChange: (height: number) => void
}

export function SearchBar({
  query,
  onQueryChange,
  activeFilterLabels,
  onRemoveFilter,
  hasActiveFilters,
  onFilterPress,
  onHeightChange,
}: SearchBarProps) {
  const { theme, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const bottomOffset = Math.max(insets.bottom, 8)

  const content = (
    <View style={styles.row}>
      <Icon name="search-outline" size={18} color={theme.colors.text.tertiary} />

      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Search..."
        placeholderTextColor={theme.colors.text.tertiary}
        style={[
          styles.input,
          {
            color: theme.colors.text.primary,
            fontSize: theme.tokens.fontSize.sm,
          },
        ]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      {activeFilterLabels.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.tokens.spacing[1] }}
          style={styles.pillScroll}
        >
          {activeFilterLabels.map((filter) => (
            <FilterPill
              key={filter.key}
              label={filter.label}
              onRemove={() => onRemoveFilter(filter.key)}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity onPress={onFilterPress} activeOpacity={0.7} style={styles.filterButton}>
        <Icon name="options-outline" size={20} color={theme.colors.text.secondary} />
        {hasActiveFilters && (
          <View
            style={[
              styles.filterDot,
              { backgroundColor: theme.colors.primary[500] },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  )

  const pillRadius = 9999

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          marginHorizontal: theme.tokens.spacing[4],
        },
      ]}
      onLayout={(e) => onHeightChange(e.nativeEvent.layout.height + bottomOffset)}
    >
      {Platform.OS === 'ios' ? (
        isLiquidGlassAvailable ? (
          <LiquidGlass
            cornerRadius={pillRadius}
            style={styles.pill}
            isInteractive
          >
            {content}
          </LiquidGlass>
        ) : (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.pill, { borderRadius: pillRadius, overflow: 'hidden' }]}
          >
            {content}
          </BlurView>
        )
      ) : (
        <View
          style={[
            styles.pill,
            {
              borderRadius: pillRadius,
              backgroundColor: theme.colors.surface,
              ...theme.tokens.shadows.glass,
            },
          ]}
        >
          {content}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  pill: {
    height: 44,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
  },
  pillScroll: {
    flexShrink: 1,
    maxWidth: 160,
  },
  filterButton: {
    padding: 4,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
