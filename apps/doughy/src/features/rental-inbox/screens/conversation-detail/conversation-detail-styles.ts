// Conversation detail styles

import { StyleSheet, Platform } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  LINE_HEIGHTS,
} from '@/constants/design-tokens';

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    paddingTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    transform: [{ scaleY: -1 }], // Flip because list is inverted
  },
  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
