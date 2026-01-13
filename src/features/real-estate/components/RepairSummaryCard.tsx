// src/features/real-estate/components/RepairSummaryCard.tsx
// Summary card showing total repair estimates and progress

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
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
  const showSyncWarning = totalEstimate !== propertyRepairCost && totalEstimate > 0;
  const completionPercentage = totalEstimate > 0 ? Math.round((totalCompleted / totalEstimate) * 100) : 0;

  return (
    <View className="bg-card rounded-xl border border-border overflow-hidden">
      <View className="p-4 bg-primary/5">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-muted-foreground">Total Estimated</Text>
            <Text className="text-2xl font-bold text-primary">{formatCurrency(totalEstimate)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-muted-foreground">Completed</Text>
            <Text className="text-lg font-semibold text-success">{formatCurrency(totalCompleted)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        {totalEstimate > 0 && (
          <View className="mt-3">
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-success rounded-full"
                style={{ width: `${Math.min(completionPercentage, 100)}%` }}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">
              {completionPercentage}% completed
            </Text>
          </View>
        )}
      </View>

      {/* Sync with property */}
      {showSyncWarning && (
        <TouchableOpacity
          onPress={onSyncRepairCost}
          className="flex-row items-center justify-center py-3 border-t border-border bg-warning/10"
        >
          <AlertCircle size={14} className="text-warning" />
          <Text className="text-sm text-warning font-medium ml-2">
            Update property repair cost to {formatCurrency(totalEstimate)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
