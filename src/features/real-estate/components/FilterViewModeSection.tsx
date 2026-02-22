// src/features/real-estate/components/FilterViewModeSection.tsx
// View mode toggle (list/grid) for PropertyFiltersSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { List, Grid } from 'lucide-react-native';

interface FilterViewModeSectionProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export function FilterViewModeSection({ viewMode, onViewModeChange }: FilterViewModeSectionProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="View Mode">
      <View className="flex-row rounded-xl" style={{ backgroundColor: colors.muted }}>
        <TouchableOpacity
          onPress={() => onViewModeChange('list')}
          className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl"
          style={viewMode === 'list' ? { backgroundColor: colors.primary } : undefined}
        >
          <List size={18} color={viewMode === 'list' ? colors.primaryForeground : colors.mutedForeground} />
          <Text
            className="ml-2 font-medium"
            style={{ color: viewMode === 'list' ? colors.primaryForeground : colors.mutedForeground }}
          >
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onViewModeChange('grid')}
          className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl"
          style={viewMode === 'grid' ? { backgroundColor: colors.primary } : undefined}
        >
          <Grid size={18} color={viewMode === 'grid' ? colors.primaryForeground : colors.mutedForeground} />
          <Text
            className="ml-2 font-medium"
            style={{ color: viewMode === 'grid' ? colors.primaryForeground : colors.mutedForeground }}
          >
            Grid
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetSection>
  );
}
