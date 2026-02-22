// src/features/assistant/components/ask-tab-styles.ts
// Styles for the AskTab component and its sub-components

import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, SPACING, FONT_SIZES, LINE_HEIGHTS, FONT_WEIGHTS } from '@/constants/design-tokens';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

export const askTabStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.lg,
    paddingBottom: TAB_BAR_SAFE_PADDING,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
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
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    marginBottom: SPACING['2xl'],
  },
  suggestionsContainer: {
    width: '100%',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    maxWidth: '90%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: SPACING.xs,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: SPACING.xs,
  },
  avatarContainer: {
    marginHorizontal: SPACING.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS['14'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: SPACING.xs,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  inputContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BORDER_RADIUS['24'],
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS['18'],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});
