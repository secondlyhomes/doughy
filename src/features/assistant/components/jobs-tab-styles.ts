// src/features/assistant/components/jobs-tab-styles.ts
// Styles for JobsTab and its sub-components

import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: TAB_BAR_SAFE_PADDING,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['36'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS['10'],
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS['10'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    width: 32,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: 8,
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS['14'],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS['10'],
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
