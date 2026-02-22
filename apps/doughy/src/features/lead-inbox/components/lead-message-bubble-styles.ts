// src/features/lead-inbox/components/lead-message-bubble-styles.ts
// Styles for LeadMessageBubble and related sub-components

import { StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  outboundContainer: {
    justifyContent: 'flex-end',
  },
  inboundContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  outboundBubbleContainer: {
    marginRight: SPACING.sm,
    alignItems: 'flex-end',
  },
  inboundBubbleContainer: {
    marginLeft: SPACING.sm,
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  senderLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  bubble: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 4,
  },
  outboundStatusRow: {
    justifyContent: 'flex-end',
  },
  inboundStatusRow: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: FONT_SIZES['2xs'],
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  failedText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '500',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  feedbackLabel: {
    fontSize: FONT_SIZES['2xs'],
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  feedbackButton: {
    padding: 6,
    borderRadius: BORDER_RADIUS.full,
  },
});
