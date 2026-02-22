// src/features/admin/screens/integrations/IntegrationListEmpty.tsx
// Empty state component for the integrations list

import React from 'react';
import { View, Text } from 'react-native';
import { XCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

export const IntegrationListEmpty = React.memo(function IntegrationListEmpty() {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center py-24">
      <XCircle size={48} color={colors.mutedForeground} />
      <Text className="mt-4 text-base" style={{ color: colors.mutedForeground }}>
        No integrations found
      </Text>
    </View>
  );
});
