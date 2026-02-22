// src/features/admin/screens/integrations/LoadingSkeletons.tsx
// Loading skeleton UI with optional health check progress bar

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';

export interface LoadingSkeletonsProps {
  healthProgress: { completed: number; total: number } | null;
}

export const LoadingSkeletons = React.memo(function LoadingSkeletons({
  healthProgress,
}: LoadingSkeletonsProps) {
  const colors = useThemeColors();

  return (
    <View style={{ paddingHorizontal: SPACING.md }}>
      {healthProgress && (
        <View className="mb-4">
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
      <Skeleton className="h-24 rounded-xl mb-3" />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="mb-3">
          <Skeleton className="h-20 rounded-xl" />
        </View>
      ))}
    </View>
  );
});
