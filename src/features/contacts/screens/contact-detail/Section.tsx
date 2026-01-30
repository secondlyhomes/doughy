// src/features/contacts/screens/contact-detail/Section.tsx
// Reusable section card for contact info display

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

export interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = {
  section: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600' as const,
    marginBottom: SPACING.md,
  },
};
