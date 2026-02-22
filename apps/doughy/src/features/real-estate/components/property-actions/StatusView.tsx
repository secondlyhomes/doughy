// src/features/real-estate/components/property-actions/StatusView.tsx
// Status change view for property actions sheet

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { PropertyStatus, PropertyConstants } from '../../types/constants';
import { BackButton } from './BackButton';
import { getStatusColors } from './utils';

export interface StatusViewProps {
  currentStatus: string;
  processingAction: string | null;
  isLoading: boolean;
  onBack: () => void;
  onStatusChange: (status: PropertyStatus) => void;
}

export function StatusView({
  currentStatus,
  processingAction,
  isLoading,
  onBack,
  onStatusChange,
}: StatusViewProps) {
  const colors = useThemeColors();

  return (
    <View>
      <BackButton onPress={onBack} />
      <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
        Change Status
      </Text>
      <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
        Current: <Text className="font-medium" style={{ color: colors.foreground }}>{currentStatus}</Text>
      </Text>

      <View className="gap-2">
        {PropertyConstants.STATUS_OPTIONS.map((option) => {
          const isSelected = currentStatus === option.value;
          const statusColors = getStatusColors(option.value, colors);
          const isProcessing = processingAction === `status-${option.value}`;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onStatusChange(option.value as PropertyStatus)}
              disabled={isLoading}
              className="flex-row items-center justify-between p-4 rounded-xl border"
              style={{
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? withOpacity(colors.primary, 'subtle') : colors.card,
              }}
            >
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: statusColors.solid }} />
                <Text className="font-medium" style={{ color: isSelected ? colors.primary : colors.foreground }}>
                  {option.label}
                </Text>
              </View>
              {isProcessing ? (
                <ActivityIndicator size="small" />
              ) : isSelected ? (
                <Check size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
