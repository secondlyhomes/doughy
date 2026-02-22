/**
 * PropertyFormActions
 *
 * Bottom action buttons (Cancel / Save) for the PropertyForm.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Save, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface PropertyFormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}

export function PropertyFormActions({
  onCancel,
  onSubmit,
  isLoading,
  submitLabel,
}: PropertyFormActionsProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-3 p-4 border-t" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
      <TouchableOpacity
        onPress={onCancel}
        disabled={isLoading}
        className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
        style={{ backgroundColor: colors.muted }}
      >
        <X size={20} color={colors.foreground} />
        <Text className="font-semibold ml-2" style={{ color: colors.foreground }}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSubmit}
        disabled={isLoading}
        className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
        style={{ backgroundColor: colors.primary }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <>
            <Save size={20} color={colors.primaryForeground} />
            <Text className="font-semibold ml-2" style={{ color: colors.primaryForeground }}>{submitLabel}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
