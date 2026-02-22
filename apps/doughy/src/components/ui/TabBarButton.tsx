// src/components/ui/TabBarButton.tsx
// Individual tab button used inside FloatingGlassTabBar

import React from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { ICON_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { TAB_LABELS_FALLBACK } from './tab-bar-constants';
import { formatBadge } from './tab-bar-helpers';
import { styles } from './tab-bar-styles';

export interface TabBarButtonProps {
  routeKey: string;
  routeName: string;
  title?: string;
  isFocused: boolean;
  badge?: number | string;
  tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  colors: {
    primary: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
  };
  /** Whether to show a highlight background on the focused tab (used in fallback mode) */
  showFocusedBackground?: boolean;
  onTabLayout: (e: LayoutChangeEvent) => void;
  onTabContentLayout: (e: LayoutChangeEvent) => void;
  onPress: () => void;
}

export function TabBarButton({
  routeKey,
  routeName,
  title,
  isFocused,
  badge,
  tabBarIcon,
  colors,
  showFocusedBackground = false,
  onTabLayout,
  onTabContentLayout,
  onPress,
}: TabBarButtonProps) {
  const label = title || TAB_LABELS_FALLBACK[routeName] || routeName;
  const icon = tabBarIcon?.({
    focused: isFocused,
    color: isFocused ? colors.primary : colors.mutedForeground,
    size: ICON_SIZES.xl,
  });

  return (
    <View
      key={routeKey}
      style={[
        styles.tab,
        showFocusedBackground && isFocused && {
          backgroundColor: withOpacity(colors.primary, 'light'),
          borderRadius: BORDER_RADIUS.lg,
          marginHorizontal: 4,
        },
      ]}
      onLayout={onTabLayout}
      onTouchEnd={onPress}
    >
      <View
        style={styles.tabContent}
        onLayout={onTabContentLayout}
      >
        <View style={styles.iconContainer}>
          {icon}
          {badge != null && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={[styles.badgeText, { color: colors.destructiveForeground }]}>{formatBadge(badge)}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}
