// src/features/portfolio/screens/portfolio-screen/PortfolioListHeader.tsx
// List header with summary card and create group button

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FolderPlus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PortfolioSummaryCard } from '../../components';
import type { PortfolioSummary } from '../../types';

interface PortfolioListHeaderProps {
  summary: PortfolioSummary | null | undefined;
  propertyCount: number;
  onCreateGroup: () => void;
}

export const PortfolioListHeader = React.memo(function PortfolioListHeader({
  summary,
  propertyCount,
  onCreateGroup,
}: PortfolioListHeaderProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-4">
      {/* Summary Card */}
      {summary && propertyCount > 0 && (
        <PortfolioSummaryCard summary={summary} />
      )}

      {/* Create Group Button (if properties exist) */}
      {propertyCount > 0 && (
        <TouchableOpacity
          onPress={onCreateGroup}
          className="flex-row items-center justify-center gap-2 py-3 mt-3 rounded-lg border border-dashed"
          style={{ borderColor: colors.border }}
        >
          <FolderPlus size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>
            Create Group
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
