/**
 * Styles for NotificationsList component and sub-components
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme/tokens';

export const styles = StyleSheet.create({
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  markAllRead: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: '600',
  },

  // Center container (shared by empty and error states)
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },

  // Empty state styles
  emptyContainer: {
    flexGrow: 1,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // Error state styles
  errorText: {
    fontSize: fontSize.base,
    color: colors.error[600],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },

  // Footer styles
  footer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
});

// Export colors for components that need direct access
export { colors };
