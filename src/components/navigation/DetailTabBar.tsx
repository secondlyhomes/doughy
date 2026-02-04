// src/components/navigation/DetailTabBar.tsx
// Reusable tab bar for detail screens with horizontal scrolling pill-style tabs

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { haptic } from '@/lib/haptics';
import { getShadowStyle } from '@/lib/design-utils';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';

export interface TabConfig<T extends string = string> {
  key: T;
  label: string;
  /** If provided, tab is hidden when this returns false */
  visible?: boolean;
}

interface DetailTabBarProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function DetailTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: DetailTabBarProps<T>) {
  const colors = useThemeColors();

  // Filter to only visible tabs
  const visibleTabs = tabs.filter((tab) => tab.visible !== false);

  const handleTabPress = (tab: T) => {
    if (activeTab !== tab) {
      haptic.selection();
      onTabChange(tab);
    }
  };

  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: BORDER_RADIUS.xl,
            padding: 4,
            backgroundColor: colors.muted,
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${tab.label} tab`}
                style={[
                  {
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: BORDER_RADIUS.lg,
                  },
                  isActive && {
                    backgroundColor: colors.background,
                    ...getShadowStyle(colors, { size: 'sm' }),
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isActive ? colors.foreground : colors.mutedForeground,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default DetailTabBar;
