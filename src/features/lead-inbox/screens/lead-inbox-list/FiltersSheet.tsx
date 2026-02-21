// src/features/lead-inbox/screens/lead-inbox-list/FiltersSheet.tsx
// Filter and sort bottom sheet for the lead inbox list screen

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Check } from 'lucide-react-native';

import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import type { LeadInboxFilter, LeadInboxSort } from '../../types';

import { FILTER_OPTIONS, SORT_OPTIONS } from './constants';

export interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: LeadInboxFilter;
  onFilterChange: (filter: LeadInboxFilter) => void;
  activeSort: LeadInboxSort;
  onSortChange: (sort: LeadInboxSort) => void;
  onClearFilters: () => void;
}

export function FiltersSheet({
  visible,
  onClose,
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  onClearFilters,
}: FiltersSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter Conversations"
    >
      <BottomSheetSection title="Show">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.key;
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => onFilterChange(option.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
              >
                <IconComponent
                  size={14}
                  color={isActive ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: '500',
                    color: isActive ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      <BottomSheetSection title="Sort By">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {SORT_OPTIONS.map((option) => {
            const isActive = activeSort === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => onSortChange(option.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SIZES.sm,
                    color: isActive ? colors.primary : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      <View style={{ flexDirection: 'row', gap: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.lg }}>
        <Button variant="outline" onPress={onClearFilters} style={{ flex: 1 }}>
          Clear Filters
        </Button>
        <Button onPress={onClose} style={{ flex: 1 }}>
          Done
        </Button>
      </View>
    </BottomSheet>
  );
}
