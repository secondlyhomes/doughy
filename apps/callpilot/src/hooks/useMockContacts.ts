/**
 * Mock Contacts Hook
 *
 * Provides contact data from mock store with search/filter capabilities.
 * Will be replaced with real Supabase hook in Phase 1.
 */

import { useState, useMemo, useCallback } from 'react'
import type { Contact, ContactStatus } from '@/types'
import { mockContacts } from '@/mocks'

export interface UseMockContactsReturn {
  contacts: Contact[]
  filteredContacts: Contact[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterStatus: ContactStatus | 'all'
  setFilterStatus: (status: ContactStatus | 'all') => void
  getContact: (id: string) => Contact | undefined
  overdueFollowUps: Contact[]
}

export function useMockContacts(): UseMockContactsReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all')

  const contacts = mockContacts

  const filteredContacts = useMemo(() => {
    let result = contacts

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query)
      )
    }

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus)
    }

    // Sort by next follow-up date (soonest first)
    return [...result].sort(
      (a, b) => new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime()
    )
  }, [contacts, searchQuery, filterStatus])

  const getContact = useCallback(
    (id: string) => contacts.find((c) => c.id === id),
    [contacts]
  )

  const overdueFollowUps = useMemo(() => {
    const now = new Date()
    return contacts.filter((c) => new Date(c.nextFollowUp) < now)
  }, [contacts])

  return {
    contacts,
    filteredContacts,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    getContact,
    overdueFollowUps,
  }
}
