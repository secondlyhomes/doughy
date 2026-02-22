// src/components/ui/FocusedSheetFooter.tsx
// Footer component for action buttons at bottom of FocusedSheet

import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { styles } from '@/components/ui/focused-sheet-styles';
import type { FocusedSheetFooterProps } from '@/components/ui/focused-sheet-types';

export function FocusedSheetFooter({ children }: FocusedSheetFooterProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + SPACING.md,
        },
      ]}
    >
      {children}
    </View>
  );
}
