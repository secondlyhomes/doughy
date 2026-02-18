/**
 * Edit Profile Screen Styles
 *
 * StyleSheet definitions for the edit profile feature.
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  cancelButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
  },
  cancelText: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  saveButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    minWidth: 50,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary[600],
  },

  // Avatar
  avatarSection: {
    backgroundColor: colors.white,
    padding: spacing[6],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  avatarHint: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },

  // Form
  form: {
    backgroundColor: colors.white,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: fontSize.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing[3],
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },

  // Footer
  footer: {
    padding: spacing[4],
    marginTop: spacing[2],
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },

  // Error state
  errorText: {
    fontSize: fontSize.base,
    color: colors.error[600],
  },
});
