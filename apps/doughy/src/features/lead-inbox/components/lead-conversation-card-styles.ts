// src/features/lead-inbox/components/lead-conversation-card-styles.ts
// Styles for LeadConversationCard and its sub-components

import { StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  name: {
    fontSize: FONT_SIZES.base,
    flex: 1,
    marginRight: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  time: {
    fontSize: FONT_SIZES.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 6,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.sm,
  },
  channelText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.sm,
  },
  sourceText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  preview: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  pendingRow: {
    marginTop: SPACING.xs,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  pendingText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
    alignSelf: 'center',
  },
  unreadText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '700',
  },
});
