// src/components/ui/FilterSearchBar.tsx
// Unified search bar with filter pills for all list screens
// Wraps SearchBar with active filter indicators and dismissible pills

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { SearchBar, type SearchBarProps } from './SearchBar';

export interface FilterPill {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterSearchBarProps extends SearchBarProps {
  /** Active filter pills to display below the search bar */
  filters?: FilterPill[];
}

export function FilterSearchBar({
  filters = [],
  ...searchBarProps
}: FilterSearchBarProps) {
  const colors = useThemeColors();
  const activeFilters = filters.filter(f => f.label);

  return (
    <View>
      <SearchBar {...searchBarProps} glass hasActiveFilters={activeFilters.length > 0} />

      {activeFilters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: SPACING.xs,
            gap: SPACING.xs,
            flexDirection: 'row',
          }}
        >
          {activeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={filter.onRemove}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary,
                borderRadius: BORDER_RADIUS.xl,
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.xxs,
                gap: SPACING.xxs,
              }}
              accessibilityLabel={`Remove ${filter.label} filter`}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.primaryForeground, fontSize: FONT_SIZES.xs, fontWeight: '500' }}>
                {filter.label}
              </Text>
              <X size={ICON_SIZES.xs} color={colors.primaryForeground} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
