/**
 * Styles for FollowingList component and sub-components
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '@/theme/tokens';

export const styles = StyleSheet.create({
  // List styles
  list: {
    padding: spacing[4],
  },

  // User item styles
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },

  // Avatar styles
  avatarContainer: {
    marginRight: spacing[3],
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[600],
    fontSize: fontSize.lg,
    fontWeight: '600',
  },

  // User info styles
  info: {
    flex: 1,
    marginRight: spacing[2],
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[0.5],
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    marginBottom: spacing[0.5],
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },

  // State container styles
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
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

  // Empty state styles
  emptyText: {
    fontSize: fontSize.base,
    color: colors.neutral[500],
  },
});
