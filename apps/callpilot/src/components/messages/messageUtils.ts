/**
 * Message utility functions shared by MessageBubble and AICallResultCard.
 */

import type { Message, MessageSender } from '@/types'

export function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    if (__DEV__) console.warn(`[messageUtils] Invalid timestamp: "${dateStr}"`)
    return '---'
  }
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function getSenderLabel(message: Message, contactName: string): string {
  const labels: Record<MessageSender, string> = {
    ai: 'AI Assistant',
    user: 'You',
    contact: contactName,
  }
  return labels[message.sentBy] ?? message.sender
}
