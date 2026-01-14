// src/features/real-estate/components/RepairSummaryCard.tsx
// Summary card showing total repair estimates and progress

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { formatCurrency } from '../utils/formatters';

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

  return (
    <View className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <View className="p-4" style={{ backgroundColor: `${colors.primary}0D` }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Total Estimated</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{formatCurrency(totalEstimate)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Completed</Text>
            <Text className="text-lg font-semibold" style={{ color: colors.success }}>{formatCurrency(totalCompleted)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        {totalEstimate > 0 && (
          <View className="mt-3">
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
      </View>

      {/* Sync with property */}
      {showSyncWarning && (
        <TouchableOpacity
          onPress={onSyncRepairCost}
          className="flex-row items-center justify-center py-3 border-t"
          style={{ borderColor: colors.border, backgroundColor: `${colors.warning}1A` }}
        >
          <AlertCircle size={14} color={colors.warning} />
          <Text className="text-sm font-medium ml-2" style={{ color: colors.warning }}>
            Update property repair cost to {formatCurrency(totalEstimate)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
