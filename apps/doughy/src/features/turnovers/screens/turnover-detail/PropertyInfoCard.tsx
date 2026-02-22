// src/features/turnovers/screens/turnover-detail/PropertyInfoCard.tsx
// Property info card for turnover detail screen

import React from 'react';
import { View, Text } from 'react-native';
import { Home } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';

interface PropertyInfoCardProps {
  name: string;
  address?: string | null;
}

export function PropertyInfoCard({ name, address }: PropertyInfoCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="mb-4">
      <View className="flex-row items-center gap-3">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <Home size={24} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.lg,
              fontWeight: '600',
            }}
          >
            {name}
          </Text>
          {address && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
              }}
            >
              {address}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}
