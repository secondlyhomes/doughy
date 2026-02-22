// src/features/assistant/components/AssistantTabBar.tsx
// Tab bar for the AI Assistant bottom sheet (Actions/Ask/Jobs)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';

import { TabId, TABS } from './deal-assistant-types';
import { styles } from './deal-assistant-styles';

interface AssistantTabBarProps {
  activeTab: TabId;
  pendingCount: number;
  onTabChange: (tab: TabId) => void;
}

export function AssistantTabBar({ activeTab, pendingCount, onTabChange }: AssistantTabBarProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} tab${tab.id === 'jobs' && pendingCount > 0 ? `, ${pendingCount} pending` : ''}`}
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              size={ICON_SIZES.ml}
              color={isActive ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
            {/* Jobs tab badge */}
            {tab.id === 'jobs' && pendingCount > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.tabBadgeText, { color: colors.primaryForeground }]}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
