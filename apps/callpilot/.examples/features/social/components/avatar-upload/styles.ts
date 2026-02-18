/**
 * Avatar Upload Styles
 *
 * StyleSheet definitions for the AvatarUpload component and sub-components.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme/tokens';

/**
 * Main container styles
 */
export const containerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

/**
 * Avatar preview styles
 */
export const avatarStyles = StyleSheet.create({
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
  editText: {
    color: colors.white,
    fontWeight: '600',
  },
});

/**
 * Options menu styles
 */
export const optionsStyles = StyleSheet.create({
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
});

/**
 * Theme colors export for dynamic styling
 */
export { colors };
