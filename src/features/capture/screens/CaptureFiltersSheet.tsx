// src/features/capture/screens/CaptureFiltersSheet.tsx
// Bottom sheet for capture queue filters

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { TABS, type TabKey } from './capture-screen-types';

interface CaptureFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  pendingCount: number;
  onClearFilters: () => void;
}

export function CaptureFiltersSheet({
  visible,
  onClose,
  activeTab,
  setActiveTab,
  pendingCount,
  onClearFilters,
}: CaptureFiltersSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Capture Filters"
    >
      <BottomSheetSection title="View">
        <View className="flex-row flex-wrap gap-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const label = tab.key === 'queue' && pendingCount > 0
              ? `${tab.label} (${pendingCount})`
              : tab.label;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                }}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                accessibilityRole="tab"
                accessibilityLabel={`${label} view${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Action buttons */}
      <View className="flex-row gap-3 pt-4 pb-6">
        <Button
          variant="outline"
          onPress={onClearFilters}
          className="flex-1"
        >
          Clear Filters
        </Button>
        <Button
          onPress={onClose}
          className="flex-1"
        >
          Done
        </Button>
      </View>
    </BottomSheet>
  );
}
