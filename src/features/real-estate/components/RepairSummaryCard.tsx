// src/features/real-estate/components/RepairSummaryCard.tsx
// Summary card showing total repair estimates and progress
// Now uses DataCard for consistency

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, Wrench } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { DataCard } from '@/components/ui';
import { formatCurrency } from '../utils/formatters';
import { withOpacity } from '@/lib/design-utils';

interface RepairSummaryCardProps {
  totalEstimate: number;
  totalCompleted: number;
  propertyRepairCost: number;
  onSyncRepairCost: () => void;
}

export function RepairSummaryCard({
  totalEstimate,
  totalCompleted,
  propertyRepairCost,
  onSyncRepairCost,
}: RepairSummaryCardProps) {
  const colors = useThemeColors();
  const showSyncWarning = totalEstimate !== propertyRepairCost && totalEstimate > 0;
  const completionPercentage = totalEstimate > 0 ? Math.round((totalCompleted / totalEstimate) * 100) : 0;

  // Build footer content with progress bar and sync warning
  const footerContent = (
    <>
      {/* Progress bar */}
      {totalEstimate > 0 && (
        <View className="mb-2">
          <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.min(completionPercentage, 100)}%`, backgroundColor: colors.success }}
            />
          </View>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {completionPercentage}% completed
          </Text>
        </View>
      )}

      {/* Sync with property */}
      {showSyncWarning && (
        <TouchableOpacity
          onPress={onSyncRepairCost}
          className="flex-row items-center justify-center py-2 px-3 rounded-md mt-2"
          style={{ backgroundColor: withOpacity(colors.warning, 'muted') }}
        >
          <AlertCircle size={14} color={colors.warning} />
          <Text className="text-sm font-medium ml-2" style={{ color: colors.warning }}>
            Update property repair cost to {formatCurrency(totalEstimate)}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <DataCard
      title="Repair Summary"
      headerIcon={Wrench}
      highlightLabel="Total Estimated"
      highlightValue={
        <View className="flex-row items-end justify-between w-full">
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
            {formatCurrency(totalEstimate)}
          </Text>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Completed</Text>
            <Text className="text-lg font-semibold" style={{ color: colors.success }}>
              {formatCurrency(totalCompleted)}
            </Text>
          </View>
        </View>
      }
      highlightColor={colors.primary}
      footerContent={footerContent}
    />
  );
}
