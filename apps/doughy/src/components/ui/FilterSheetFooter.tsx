// src/components/ui/FilterSheetFooter.tsx
// Footer sub-component for FilterSheet

import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from './Button';

interface FilterSheetFooterProps {
  footerStyle: 'apply' | 'done' | 'none';
  onClose: () => void;
  onApply?: () => void;
  onReset?: () => void;
  applyLabel: string;
  clearLabel: string;
}

export function FilterSheetFooter({
  footerStyle,
  onClose,
  onApply,
  onReset,
  applyLabel,
  clearLabel,
}: FilterSheetFooterProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  if (footerStyle === 'none') return null;

  return (
    <View
      className="px-4 pb-4 pt-2"
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {footerStyle === 'apply' ? (
        <Button onPress={onApply ?? onClose} size="lg" className="w-full">
          {applyLabel}
        </Button>
      ) : (
        <View className="flex-row gap-3">
          <Button variant="outline" onPress={onReset} className="flex-1">
            {clearLabel}
          </Button>
          <Button onPress={onClose} className="flex-1">
            Done
          </Button>
        </View>
      )}
    </View>
  );
}
