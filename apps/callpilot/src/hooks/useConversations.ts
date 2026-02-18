/**
 * Conversations Hook
 *
 * Groups communications by contact into conversations for the Messages inbox.
 * Supports module filtering (investor/landlord).
 */

import { useState, useMemo, useCallback } from 'react'
import { useCommunications } from './useCommunications'
import { useContacts } from './useContacts'
import { convertCommunicationToMessage } from '@/types/message'
import type { Conversation, Message, ContactModule } from '@/types'

type InboxFilter = 'all' | 'sms' | 'email'
type ConversationModuleFilter = ContactModule | 'all'

export interface UseConversationsReturn {
  conversations: Conversation[]
  filteredConversations: Conversation[]
  inboxFilter: InboxFilter
  setInboxFilter: (filter: InboxFilter) => void
  moduleFilter: ConversationModuleFilter
  setModuleFilter: (filter: ConversationModuleFilter) => void
  getMessagesForContact: (contactId: string) => Message[]
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function useConversations(): UseConversationsReturn {
  const { communications } = useCommunications()
  const { getContact } = useContacts()
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
  const [moduleFilter, setModuleFilter] = useState<ConversationModuleFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Build conversations: group by contact, pick latest message-type comm (sms/email only)
  const conversations: Conversation[] = useMemo(() => {
    const map = new Map<string, typeof communications>()

    // Only sms and email go into the messaging inbox
    const messageable = communications.filter(
      (c) => c.channel === 'sms' || c.channel === 'email'
    )

    for (const comm of messageable) {
      const existing = map.get(comm.contactId)
      if (existing) {
        existing.push(comm)
      } else {
        map.set(comm.contactId, [comm])
      }
    }

    const result: Conversation[] = []

    for (const [contactId, comms] of map) {
      // Sort newest first
      const sorted = [...comms].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      const latest = sorted[0]
      if (!latest) continue

      const contact = getContact(contactId)
      const contactName = contact
        ? `${contact.firstName} ${contact.lastName}`
        : 'Unknown'

      // Mock unread: incoming messages that are 'delivered' (not yet 'read')
      const unreadCount = comms.filter(
        (c) => c.direction === 'incoming' && c.status === 'delivered'
      ).length

      result.push({
        id: `conv-${contactId}`,
        contactId,
        contactName,
        lastMessage: latest.subject
          ? `${latest.subject}: ${latest.body.slice(0, 60)}`
          : latest.body.slice(0, 80),
        lastMessageDate: latest.createdAt,
        lastMessageChannel: latest.channel as 'sms' | 'email',
        lastMessageDirection: latest.direction,
        unreadCount,
        module: contact?.module ?? null,
      })
    }

    // Sort by most recent first
    return result.sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    )
  }, [communications, getContact])

  const filteredConversations = useMemo(() => {
    let result = conversations

    if (moduleFilter !== 'all') {
      result = result.filter((c) => c.module === moduleFilter)
    }

    if (inboxFilter !== 'all') {
      result = result.filter((c) => c.lastMessageChannel === inboxFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.contactName.toLowerCase().includes(query) ||
          c.lastMessage.toLowerCase().includes(query)
      )
    }

    return result
  }, [conversations, inboxFilter, moduleFilter, searchQuery])

  const getMessagesForContact = useCallback(
    (contactId: string): Message[] => {
      return communications
        .filter(
          (c) =>
            c.contactId === contactId &&
            (c.channel === 'sms' || c.channel === 'email')
        )
        .sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .map(convertCommunicationToMessage)
    },
    [communications]
  )

  return {
    conversations,
    filteredConversations,
    inboxFilter,
    setInboxFilter,
    moduleFilter,
    setModuleFilter,
    getMessagesForContact,
    searchQuery,
    setSearchQuery,
  }
}
