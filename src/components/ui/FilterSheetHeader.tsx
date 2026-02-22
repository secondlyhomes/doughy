// src/components/ui/FilterSheetHeader.tsx
// Header sub-component for FilterSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface FilterSheetHeaderProps {
  title: string;
  hasActiveFilters: boolean;
  onClose: () => void;
  onReset?: () => void;
}

export function FilterSheetHeader({
  title,
  hasActiveFilters,
  onClose,
  onReset,
}: FilterSheetHeaderProps) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-center justify-between px-4 py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <TouchableOpacity onPress={onClose} className="p-1" hitSlop={8}>
        <X size={24} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View className="flex-row items-center">
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {title}
        </Text>
        {hasActiveFilters && (
          <View
            className="w-2 h-2 rounded-full ml-2"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </View>

      {onReset ? (
        <TouchableOpacity onPress={onReset} className="flex-row items-center" hitSlop={8}>
          <RotateCcw size={16} color={colors.primary} />
          <Text className="ml-1" style={{ color: colors.primary }}>
            Reset
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 60 }} />
      )}
    </View>
  );
}
