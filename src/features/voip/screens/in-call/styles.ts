// src/features/voip/screens/in-call/styles.ts
// Styles for InCallScreen components

import { StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  durationText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    minHeight: 58,
  },
  durationPlaceholder: {
    opacity: 0.3,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'flex-end',
  },
  suggestionsWrapper: {
    flex: 1,
    maxHeight: 350,
  },
  suggestionsScroll: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  suggestionsContent: {
    paddingBottom: SPACING.md,
  },
  bottomSection: {
    paddingBottom: SPACING.md,
  },
  disclosureContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  disclosureText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
