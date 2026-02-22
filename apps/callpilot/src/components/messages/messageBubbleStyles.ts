/**
 * Shared styles and helpers for MessageBubble variants.
 *
 * Extracted from MessageBubble.tsx to keep each variant file under 200 lines.
 */

import { StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { MessageSender } from '@/types'
import type { CommunicationChannel } from '@/types/communication'

export function getChannelIconName(channel: CommunicationChannel): keyof typeof Ionicons.glyphMap | null {
  switch (channel) {
    case 'email':
      return 'mail-outline'
    case 'whatsapp':
      return 'logo-whatsapp'
    case 'call':
      return 'call-outline'
    case 'transcript':
      return 'document-text-outline'
    case 'sms':
    default:
      return null // SMS is the default, no icon needed
  }
}

export function getSenderIconName(sentBy: MessageSender) {
  switch (sentBy) {
    case 'ai':
      return 'sparkles' as const
    case 'contact':
    case 'user':
    default:
      return 'person' as const
  }
}

// Hardcoded values matching Doughy's design tokens exactly:
// SPACING: xs=4, sm=8, md=12, lg=16
// BORDER_RADIUS: sm=6, lg=12, full=9999
// FONT_SIZES: 2xs=10, xs=12, base=16
// LINE_HEIGHTS: normal=1.5 -> 16*1.5=24
export const bubbleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 12,
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
    marginRight: 8,
    alignItems: 'flex-end',
  },
  inboundBubbleContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  outboundStatusRow: {
    justifyContent: 'flex-end',
  },
  inboundStatusRow: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 10,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  feedbackLabel: {
    fontSize: 10,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  feedbackButton: {
    padding: 6,
    borderRadius: 9999,
  },
})
