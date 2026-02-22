/**
 * MessageBubble
 *
 * Dispatcher component that delegates to the appropriate bubble variant
 * based on message sender and direction.
 *
 * Variants:
 * - UserBubble: outbound messages from the user
 * - AIBubble: outbound messages sent by AI
 * - ContactBubble: inbound messages from a contact
 *
 * Originally copied from Doughy's LeadMessageBubble.tsx, then split
 * into variant files to stay under the 200-line project rule.
 *
 * Doughy source: src/features/lead-inbox/components/LeadMessageBubble.tsx
 */

import { memo } from 'react'
import { AICallResultCard } from './AICallResultCard'
import { UserBubble } from './UserBubble'
import { ContactBubble } from './ContactBubble'
import { AIBubble } from './AIBubble'
import type { Message } from '@/types'

export interface MessageBubbleProps {
  message: Message
  onFeedback?: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => void
  showFeedback?: boolean
  contactName?: string
}

export const MessageBubble = memo(function MessageBubble(props: MessageBubbleProps) {
  const { message } = props

  // Delegate AI call results to dedicated card
  if (message.type === 'ai_call' && message.aiCallMeta) {
    return <AICallResultCard message={message} />
  }

  const isOutbound = message.direction === 'outgoing'
  const isAI = message.sentBy === 'ai'

  if (isOutbound && isAI) {
    return <AIBubble {...props} />
  }

  if (isOutbound) {
    return <UserBubble {...props} />
  }

  return <ContactBubble {...props} />
})
