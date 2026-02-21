// src/features/deals/screens/cockpit/CockpitTabBar.tsx
// Sticky header with tab selector and stage stepper for the Deal Cockpit

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { BORDER_RADIUS } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { haptic } from '@/lib/haptics';
import { StageStepper } from '../../components';
import type { Deal } from '../../types';

const TAB_LABELS = {
  overview: 'Overview',
  underwrite: 'Underwrite',
  offers: 'Offers',
  docs: 'Docs',
} as const;

export type TabKey = keyof typeof TAB_LABELS;

interface CockpitTabBarProps {
  deal: Deal;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onStagePress: () => void;
}

export function CockpitTabBar({ deal, activeTab, onTabChange, onStagePress }: CockpitTabBarProps) {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background, paddingBottom: 8 }}>
      {/* Tab Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            className="flex-row rounded-xl p-1"
            style={{ backgroundColor: colors.muted }}
          >
            {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  if (activeTab !== tab) {
                    haptic.selection();
                    onTabChange(tab);
                  }
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
                accessibilityLabel={`${TAB_LABELS[tab]} tab`}
                style={[
                  {
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: BORDER_RADIUS.lg,
                  },
                  activeTab === tab && {
                    backgroundColor: colors.background,
                    ...getShadowStyle(colors, { size: 'sm' }),
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color:
                      activeTab === tab
                        ? colors.foreground
                        : colors.mutedForeground,
                  }}
                >
                  {TAB_LABELS[tab]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Stage Stepper */}
      <StageStepper
        currentStage={deal.stage}
        dealId={deal.id}
        onStagePress={onStagePress}
      />
    </View>
  );
}
