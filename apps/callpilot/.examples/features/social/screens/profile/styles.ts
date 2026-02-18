/**
 * Profile Screen Styles
 *
 * StyleSheet definitions for the profile screen module.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme/tokens';

export const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },

  // Error state
  errorText: {
    fontSize: fontSize.base,
    color: colors.error[600],
    textAlign: 'center',
  },

  // Header
  header: {
    backgroundColor: colors.white,
    padding: spacing[6],
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing[4],
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.primary[600],
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  fullName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  username: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
  },
  editButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  editButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[700],
  },

  // Sections
  section: {
    backgroundColor: colors.white,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },

  // Bio
  bio: {
    fontSize: fontSize.base,
    color: colors.neutral[700],
    lineHeight: 22,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing[2],
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  infoLink: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
  },

  // Stats
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: spacing[2],
    paddingVertical: spacing[4],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },

  // Badge
  badge: {
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    marginTop: spacing[2],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing[4],
  },
  badgeText: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    textAlign: 'center',
    fontWeight: '500',
  },

  // Empty state
  emptyActivity: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: fontSize.base,
    color: colors.neutral[500],
  },
});
