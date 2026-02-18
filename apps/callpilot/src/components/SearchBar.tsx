/**
 * SearchBar
 *
 * Reusable search bar component with consistent styling.
 * Copied from the-claw-app, adapted for CallPilot's theme/icon system.
 */

import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { GlassView } from './GlassView'

export interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  onSubmit?: () => void
  onClear?: () => void
  isLoading?: boolean
  autoFocus?: boolean
  onFilter?: () => void
  hasActiveFilters?: boolean
  glass?: boolean
  /** Handler for view toggle button */
  onViewToggle?: () => void
  /** Current view mode for toggle icon display */
  viewMode?: 'list' | 'card'
}

const sizeConfig = {
  sm: { iconSize: 16 as const, fontSize: 14, px: 12, py: 6 },
  md: { iconSize: 18 as const, fontSize: 16, px: 12, py: 10 },
  lg: { iconSize: 20 as const, fontSize: 16, px: 16, py: 12 },
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  size = 'md',
  onSubmit,
  onClear,
  isLoading = false,
  autoFocus = false,
  onFilter,
  hasActiveFilters = false,
  glass = true,
  onViewToggle,
  viewMode,
}: SearchBarProps) {
  const { theme, isDark } = useTheme()
  const config = sizeConfig[size]

  const mutedBg = isDark ? theme.colors.neutral[700] + '4D' : theme.colors.surfaceSecondary
  const mutedFg = theme.colors.text.tertiary
  const fg = theme.colors.text.primary

  function handleClear() {
    if (onClear) {
      onClear()
    } else {
      onChangeText('')
    }
  }

  const searchBarContent = (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: config.px,
          paddingVertical: config.py,
          backgroundColor: glass ? 'transparent' : mutedBg,
          borderRadius: 9999,
        },
      ]}
    >
      <Ionicons name="search" size={config.iconSize} color={mutedFg} />
      <TextInput
        style={[styles.input, { color: fg, fontSize: config.fontSize }]}
        placeholder={placeholder}
        placeholderTextColor={mutedFg}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? 'search' : 'default'}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      {isLoading ? (
        <ActivityIndicator size="small" color={mutedFg} />
      ) : (
        value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close" size={18} color={mutedFg} />
          </TouchableOpacity>
        )
      )}
      {onViewToggle && (
        <TouchableOpacity
          onPress={onViewToggle}
          style={[styles.actionButton, { backgroundColor: mutedBg }]}
          accessibilityLabel={`Switch to ${viewMode === 'card' ? 'list' : 'card'} view`}
        >
          <Ionicons
            name={viewMode === 'card' ? 'list' : 'grid'}
            size={16}
            color={fg}
          />
        </TouchableOpacity>
      )}
      {onFilter && (
        <TouchableOpacity
          onPress={onFilter}
          style={[
            styles.actionButton,
            { backgroundColor: hasActiveFilters ? theme.colors.primary[500] : mutedBg },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={hasActiveFilters ? theme.tokens.colors.white : mutedFg}
          />
          {hasActiveFilters && (
            <View style={[styles.filterDot, { backgroundColor: theme.colors.error[500] }]} />
          )}
        </TouchableOpacity>
      )}
    </View>
  )

  if (glass) {
    return (
      <GlassView
        intensity="light"
        effect="regular"
        borderRadius={9999}
        interactive
        style={styles.glass}
      >
        {searchBarContent}
      </GlassView>
    )
  }

  return searchBarContent
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  actionButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  glass: {
    overflow: 'hidden',
  },
})
