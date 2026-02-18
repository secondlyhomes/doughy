/**
 * widget-styles.ts
 *
 * Styles for iOS Task Widget components
 */

import { StyleSheet } from 'react-native';
import type { ColorScheme } from '../types';
import { getColorPalette, PRIORITY_COLORS } from './widget-colors';

/**
 * Generate styles based on color scheme
 */
export function getWidgetStyles(colorScheme: ColorScheme) {
  const isDark = colorScheme === 'dark';
  const colors = getColorPalette(isDark);

  return StyleSheet.create({
    // Container styles
    container: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 16,
    },
    smallContainer: { justifyContent: 'space-between', alignItems: 'center' },
    mediumContainer: { justifyContent: 'flex-start' },
    largeContainer: { justifyContent: 'space-between' },

    // Header styles
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: { fontSize: 17, fontWeight: '600', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    badge: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: { fontSize: 15, fontWeight: '600', color: colors.text },

    // Progress styles
    circularProgress: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 6,
      borderColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 8,
    },
    percentageText: { fontSize: 24, fontWeight: '700', color: colors.text },
    statsRow: { alignItems: 'center' },
    statsText: { fontSize: 15, fontWeight: '600', color: colors.text },
    statsLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginRight: 8,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      width: 40,
      textAlign: 'right',
    },

    // Task list styles
    taskList: { flex: 1 },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.checkboxBorder,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    checkboxCompleted: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    taskContent: { flex: 1, marginRight: 8 },
    taskText: { fontSize: 15, color: colors.text },
    taskTextCompleted: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    categoryText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    taskMeta: { flexDirection: 'row', alignItems: 'center' },
    priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    priorityHigh: { backgroundColor: PRIORITY_COLORS.high },
    priorityMedium: { backgroundColor: PRIORITY_COLORS.medium },
    dueDate: { fontSize: 12, color: colors.textSecondary },

    // Empty state styles
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
    emptySubtext: {
      fontSize: 13,
      color: isDark ? '#6C6C70' : '#98989F',
      marginTop: 4,
    },

    // Footer styles
    footer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    footerText: { fontSize: 12, color: colors.textSecondary },
  });
}
