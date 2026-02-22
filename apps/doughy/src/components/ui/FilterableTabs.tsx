// src/components/ui/FilterableTabs.tsx
// Generic tabs for filtering lists (Assets/Supplies, Active/Archived, etc.)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  PRESS_OPACITY,
} from '@/constants/design-tokens';
import { Badge } from './Badge';

export interface FilterableTab {
  /** Unique key for the tab */
  key: string;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Optional icon */
  icon?: React.ReactNode;
}

export interface FilterableTabsProps {
  /** Array of tab configurations */
  tabs: FilterableTab[];
  /** Currently selected tab key */
  value: string;
  /** Callback when tab is selected */
  onChange: (key: string) => void;
  /** Visual variant */
  variant?: 'pills' | 'underline' | 'segment';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether tabs should scroll horizontally */
  scrollable?: boolean;
  /** Whether to show count badges */
  showCounts?: boolean;
  /** Style for the container */
  style?: StyleProp<ViewStyle>;
}

export function FilterableTabs({
  tabs,
  value,
  onChange,
  variant = 'pills',
  size = 'md',
  scrollable = false,
  showCounts = true,
  style,
}: FilterableTabsProps) {
  const colors = useThemeColors();

  const sizeConfig = {
    sm: {
      paddingH: SPACING.sm,
      paddingV: SPACING.xs,
      fontSize: FONT_SIZES.sm,
      gap: SPACING.xs,
    },
    md: {
      paddingH: SPACING.md,
      paddingV: SPACING.sm,
      fontSize: FONT_SIZES.base,
      gap: SPACING.sm,
    },
  }[size];

  const renderTab = (tab: FilterableTab) => {
    const isActive = value === tab.key;

    // Variant-specific styles
    const getTabStyles = () => {
      switch (variant) {
        case 'underline':
          return {
            backgroundColor: 'transparent',
            borderBottomWidth: isActive ? 2 : 0,
            borderBottomColor: isActive ? colors.primary : 'transparent',
            borderRadius: 0,
          };
        case 'segment':
          return {
            backgroundColor: isActive ? colors.primary : 'transparent',
            borderRadius: BORDER_RADIUS.md,
            borderWidth: 0,
          };
        case 'pills':
        default:
          return {
            backgroundColor: isActive ? colors.primary : colors.muted,
            borderRadius: BORDER_RADIUS.full,
            borderWidth: 0,
          };
      }
    };

    const tabStyles = getTabStyles();
    const textColor = variant === 'pills' || variant === 'segment'
      ? (isActive ? colors.primaryForeground : colors.foreground)
      : (isActive ? colors.primary : colors.mutedForeground);

    return (
      <TouchableOpacity
        key={tab.key}
        onPress={() => onChange(tab.key)}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        style={[
          styles.tab,
          {
            paddingHorizontal: sizeConfig.paddingH,
            paddingVertical: sizeConfig.paddingV,
            ...tabStyles,
          },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${tab.label}${tab.count !== undefined ? `, ${tab.count} items` : ''}`}
      >
        {tab.icon && <View style={{ marginRight: SPACING.xs }}>{tab.icon}</View>}

        <Text
          style={[
            styles.label,
            {
              color: textColor,
              fontSize: sizeConfig.fontSize,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {tab.label}
        </Text>

        {showCounts && tab.count !== undefined && tab.count > 0 && (
          <Badge
            variant={isActive && (variant === 'pills' || variant === 'segment') ? 'secondary' : 'default'}
            size="sm"
            style={{ marginLeft: SPACING.xs }}
          >
            {tab.count}
          </Badge>
        )}
      </TouchableOpacity>
    );
  };

  const content = (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        { gap: sizeConfig.gap },
        variant === 'segment' && [
          styles.segmentContainer,
          { backgroundColor: colors.muted, borderRadius: BORDER_RADIUS.lg },
        ],
        style,
      ]}
    >
      {tabs.map(renderTab)}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentContainer: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {},
});
