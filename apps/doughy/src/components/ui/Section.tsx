// src/components/ui/Section.tsx
// Shared section card component with title for detail screens

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

export interface SectionProps {
  /** Section title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Section content */
  children: React.ReactNode;
  /** Optional action element on the right side of the header */
  rightAction?: React.ReactNode;
  /** Remove card styling (flat mode - no background/border) */
  flat?: boolean;
}

/**
 * Section - A card-style container with a title header
 *
 * Used in detail screens to group related information into logical sections.
 *
 * @example
 * // Basic usage
 * <Section title="Contact Information">
 *   <DetailRow label="Email" value="john@example.com" />
 *   <DetailRow label="Phone" value="(555) 123-4567" />
 * </Section>
 *
 * @example
 * // With subtitle and right action
 * <Section
 *   title="Payment History"
 *   subtitle="Last 30 days"
 *   rightAction={<Button size="sm">View All</Button>}
 * >
 *   {...}
 * </Section>
 *
 * @example
 * // Flat mode (no card styling)
 * <Section title="Notes" flat>
 *   <Text>...</Text>
 * </Section>
 */
export function Section({ title, subtitle, children, rightAction, flat }: SectionProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        !flat && {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
});
