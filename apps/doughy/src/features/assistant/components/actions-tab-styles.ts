// src/features/assistant/components/actions-tab-styles.ts
// Styles for ActionsTab and its sub-components

import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, FONT_SIZES, LINE_HEIGHTS, FONT_WEIGHTS } from '@/constants/design-tokens';
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
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  nbaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  nbaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  nbaText: {
    flex: 1,
  },
  nbaAction: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  nbaMeta: {
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: '47%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    minHeight: 90,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS['10'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  asyncBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  asyncBadgeText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: FONT_WEIGHTS.semibold,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS['10'],
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS['10'],
  },
  showMoreText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
