// src/components/ui/message-bubble-styles.ts
// Styles for the unified MessageBubble component

import { StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';

export const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    maxWidth: '85%',
  },
  containerInbound: {
    alignSelf: 'flex-start',
    marginLeft: SPACING.md,
  },
  containerOutbound: {
    alignSelf: 'flex-end',
    marginRight: SPACING.md,
  },
  bubbleRow: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  avatar: {
    borderRadius: 999,
    padding: 6,
    marginBottom: SPACING.xs,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    minWidth: 60,
    flexShrink: 1,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    gap: 2,
  },
  aiIndicatorText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  metaInbound: {
    justifyContent: 'flex-start',
  },
  metaOutbound: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
  },
  senderLabel: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  systemText: {
    fontSize: FONT_SIZES.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
