// src/features/admin/screens/integrations/IntegrationListHeader.tsx
// List header component with progress bar, health card, error banner, and filter count

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING } from '@/constants/design-tokens';
import { IntegrationHealthCard } from '../../components/IntegrationHealthCard';

export interface IntegrationListHeaderProps {
  isRefreshing: boolean;
  healthProgress: { completed: number; total: number } | null;
  apiKeyRefreshTrigger: number;
  loadError: string | null;
  loadAllHealth: () => Promise<void>;
  filteredCount: number;
  totalCount: number;
}

export const IntegrationListHeader = React.memo(function IntegrationListHeader({
  isRefreshing,
  healthProgress,
  apiKeyRefreshTrigger,
  loadError,
  loadAllHealth,
  filteredCount,
  totalCount,
}: IntegrationListHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
      {isRefreshing && healthProgress && (
        <View className="mb-3">
          <Text className="text-sm text-center mb-2" style={{ color: colors.mutedForeground }}>
            Checking integrations... {healthProgress.completed} of {healthProgress.total}
          </Text>
          <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
            <View
              className="h-full rounded-full"
              style={{ backgroundColor: colors.primary, width: `${(healthProgress.completed / healthProgress.total) * 100}%` }}
            />
          </View>
        </View>
      )}
      <IntegrationHealthCard refreshTrigger={apiKeyRefreshTrigger} />
      {loadError && (
        <TouchableOpacity
          className="flex-row items-center p-3 rounded-xl mb-3"
          style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
          onPress={loadAllHealth}
        >
          <AlertTriangle size={18} color={colors.destructive} />
          <View className="flex-1 ml-2">
            <Text className="text-sm font-medium" style={{ color: colors.destructive }}>
              {loadError}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.destructive }}>
              Tap to retry
            </Text>
          </View>
          <RefreshCw size={16} color={colors.destructive} />
        </TouchableOpacity>
      )}
      {filteredCount !== totalCount && (
        <Text className="text-xs mt-2 text-center" style={{ color: colors.mutedForeground }}>
          Showing {filteredCount} of {totalCount} integrations
        </Text>
      )}
    </View>
  );
});
