/**
 * StyleSheet definitions for AvatarUpload component
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme/tokens';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
  },
  placeholderText: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: colors.white,
    marginTop: spacing[2],
    fontSize: 12,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  editIcon: {
    color: colors.white,
  },
  optionsMenu: {
    marginTop: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  optionButton: {
    padding: spacing[3],
  },
  optionButtonBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  optionText: {
    fontSize: 16,
    color: colors.neutral[900],
    fontWeight: '500',
  },
  optionTextDanger: {
    fontSize: 16,
    color: colors.error[600],
    fontWeight: '500',
  },
  optionTextSecondary: {
    fontSize: 16,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  errorText: {
    color: colors.error[600],
    marginTop: spacing[2],
    fontSize: 12,
    textAlign: 'center',
  },
});
