// src/features/campaigns/screens/CampaignFiltersSheet.tsx
// Filter bottom sheet for the campaigns list screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';

// Status filters
export const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Completed' },
] as const;

export type CampaignStatusFilter = typeof STATUS_FILTERS[number]['key'];

export interface CampaignFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeStatus: CampaignStatusFilter;
  statusCounts: Record<string, number>;
  onSelectStatus: (status: CampaignStatusFilter) => void;
  onClearFilters: () => void;
}

export function CampaignFiltersSheet({
  visible,
  onClose,
  activeStatus,
  statusCounts,
  onSelectStatus,
  onClearFilters,
}: CampaignFiltersSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Campaign Filters"
    >
      <BottomSheetSection title="Status">
        <View className="flex-row flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => {
            const isActive = activeStatus === status.key;
            const count = statusCounts[status.key] || 0;
            return (
              <TouchableOpacity
                key={status.key}
                onPress={() => {
                  onSelectStatus(status.key);
                  onClose();
                }}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: isActive ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {status.label} {count > 0 ? `(${count})` : ''}
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
