// src/features/settings/components/platform-settings-styles.ts
// Styles for PlatformSettingsSection and its sub-components

import { StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

export const styles = StyleSheet.create({
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  dismissText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformInfo: {
    flex: 1,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  platformLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  activeBadgeText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  platformDescription: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  switcherContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  switcherLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  smallIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectableLabel: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
});
