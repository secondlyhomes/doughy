// src/features/deals/screens/cockpit/tabs/UnderwriteTab.tsx
// Placeholder tab for the underwrite / quick analysis feature

import React from 'react';
import { View, Text } from 'react-native';
import { Calculator } from 'lucide-react-native';
import { ICON_SIZES } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';

interface UnderwriteTabProps {
  onUnderwrite: () => void;
}

export function UnderwriteTab({ onUnderwrite }: UnderwriteTabProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center p-4 pt-12">
      <Calculator size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
      <Text
        className="text-lg font-semibold mt-4"
        style={{ color: colors.foreground }}
      >
        Quick Underwrite
      </Text>
      <Text
        className="text-sm text-center mt-2"
        style={{ color: colors.mutedForeground }}
      >
        Detailed analysis with MAO, profit projections, and financing
        scenarios
      </Text>
      <Button className="mt-4" onPress={onUnderwrite}>
        Open Full Analysis
      </Button>
    </View>
  );
}
