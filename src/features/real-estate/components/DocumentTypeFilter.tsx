/**
 * DocumentTypeFilter Component
 * Segmented control to filter documents by category
 *
 * Uses the same pattern as PropertyAnalysisTab mode toggle for consistency.
 * Follows Zone B design system with zero hardcoded values.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, OPACITY_VALUES } from '@/constants/design-tokens';

export type DocumentFilterType = 'all' | 'research' | 'transaction' | 'seller';

export interface DocumentTypeFilterProps {
  /** Currently selected filter type */
  selectedType: DocumentFilterType;

  /** Callback when filter type changes */
  onSelectType: (type: DocumentFilterType) => void;

  /** Optional counts for each type (shows badge) */
  counts?: {
    all: number;
    research: number;
    transaction: number;
    seller: number;
  };

  /** Whether the filter is disabled */
  disabled?: boolean;
}

const FILTER_OPTIONS: Array<{
  value: DocumentFilterType;
  label: string;
  description: string;
}> = [
  {
    value: 'all',
    label: 'All',
    description: 'All documents',
  },
  {
    value: 'research',
    label: 'Research',
    description: 'Inspection, appraisal, title, comps, photos',
  },
  {
    value: 'transaction',
    label: 'Transaction',
    description: 'Offers, contracts, closing docs',
  },
  {
    value: 'seller',
    label: 'Seller',
    description: 'ID, tax returns, bank statements',
  },
];

export function DocumentTypeFilter({
  selectedType,
  onSelectType,
  counts,
  disabled = false,
}: DocumentTypeFilterProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withOpacity(colors.muted, 'strong'),
          borderRadius: BORDER_RADIUS.lg,
        },
      ]}
    >
      {FILTER_OPTIONS.map((option) => {
        const isSelected = selectedType === option.value;
        const count = counts?.[option.value];

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => !disabled && onSelectType(option.value)}
            disabled={disabled}
            activeOpacity={OPACITY_VALUES.pressed}
            style={[
              styles.option,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : 'transparent',
                borderRadius: BORDER_RADIUS.md,
                opacity: disabled ? OPACITY_VALUES.disabled : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${option.label}`}
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityHint={option.description}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.primaryForeground : colors.foreground,
                  fontWeight: isSelected ? '600' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
            {count !== undefined && count > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? withOpacity(colors.primaryForeground, 'light')
                      : withOpacity(colors.muted, 'opaque'),
                    marginLeft: SPACING.xs,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isSelected
                        ? colors.primary
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  label: {
    fontSize: 14,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
