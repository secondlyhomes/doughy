/**
 * Styles for FileUpload component and sub-components
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '@/theme/tokens';

export const styles = StyleSheet.create({
  // Container styles
  container: {
    width: '100%',
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    marginBottom: spacing[3],
  },
  errorText: {
    color: colors.error[600],
    fontSize: fontSize.sm,
    marginTop: spacing[2],
  },

  // FileSelector styles
  selectButton: {
    borderWidth: 2,
    borderColor: colors.neutral[300],
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    backgroundColor: colors.neutral[50],
  },
  selectButtonContent: {
    alignItems: 'center',
  },
  selectIcon: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  selectText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  selectHint: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },

  // FilePreview styles
  filePreview: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    backgroundColor: colors.white,
  },
  fileInfo: {
    marginBottom: spacing[3],
  },
  fileName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  fileSize: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  uploadButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[200],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.neutral[700],
    fontSize: fontSize.base,
    fontWeight: '600',
  },

  // UploadProgress styles
  uploadProgress: {
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  activityIndicator: {
    marginTop: spacing[2],
  },
});
