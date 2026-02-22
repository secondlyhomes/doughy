// src/components/ui/FocusedSheetSection.tsx
// Section component for grouping content within FocusedSheet

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { styles } from '@/components/ui/focused-sheet-styles';
import type { FocusedSheetSectionProps } from '@/components/ui/focused-sheet-types';

export function FocusedSheetSection({ title, children }: FocusedSheetSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
