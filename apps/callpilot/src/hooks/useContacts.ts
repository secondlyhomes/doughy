/**
 * Contacts Hook
 *
 * Production hook that loads contacts from contactsService.
 * Supports module filtering (investor/landlord) and temperature grouping.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Contact, ContactTemperature, ContactModule, LandlordContactType } from '@/types'
import * as contactsService from '@/services/contactsService'

export type TemperatureFilter = ContactTemperature | 'all'
export type ModuleFilter = ContactModule | 'all'
export type ContactTypeFilter = LandlordContactType | 'all'

export interface UseContactsReturn {
  contacts: Contact[]
  filteredContacts: Contact[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterTemperature: TemperatureFilter
  setFilterTemperature: (temp: TemperatureFilter) => void
  filterModule: ModuleFilter
  setFilterModule: (mod: ModuleFilter) => void
  filterContactType: ContactTypeFilter
  setFilterContactType: (type: ContactTypeFilter) => void
  temperatureGroups: { hot: Contact[]; warm: Contact[]; cold: Contact[] }
  getContact: (id: string) => Contact | undefined
  overdueFollowUps: Contact[]
  refresh: () => void
  isLoading: boolean
  error: string | null
}

const TEMP_ORDER: Record<ContactTemperature, number> = { hot: 0, warm: 1, cold: 2 }

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTemperature, setFilterTemperature] = useState<TemperatureFilter>('all')
  const [filterModule, setFilterModule] = useState<ModuleFilter>('all')
  const [filterContactType, setFilterContactType] = useState<ContactTypeFilter>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        setIsLoading(true)
        setError(null)
        // Load all contacts (both modules) so we can filter client-side
        const [investorData, landlordData] = await Promise.all([
          contactsService.getContacts('investor'),
          contactsService.getContacts('landlord'),
        ])
        if (!cancelled) {
          setContacts([...investorData, ...landlordData])
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load contacts')
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredContacts = useMemo(() => {
    let result = contacts

    // Module filter
    if (filterModule !== 'all') {
      result = result.filter((c) => c.module === filterModule)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query) ||
          c.address.toLowerCase().includes(query)
      )
    }

    // Temperature filter (only applies when not in landlord-only mode)
    if (filterTemperature !== 'all' && filterModule !== 'landlord') {
      result = result.filter((c) => c.temperature === filterTemperature)
    }

    // Contact type filter (only applies when in landlord mode — not 'all')
    if (filterContactType !== 'all' && filterModule === 'landlord') {
      result = result.filter((c) => c.contactType === filterContactType)
    }

    // Sort hot → warm → cold, then by score descending
    return [...result].sort((a, b) => {
      const tempDiff = TEMP_ORDER[a.temperature] - TEMP_ORDER[b.temperature]
      if (tempDiff !== 0) return tempDiff
      return (b.score ?? 0) - (a.score ?? 0)
    })
  }, [contacts, searchQuery, filterTemperature, filterModule, filterContactType])

  const temperatureGroups = useMemo(() => ({
    hot: contacts.filter((c) => c.temperature === 'hot'),
    warm: contacts.filter((c) => c.temperature === 'warm'),
    cold: contacts.filter((c) => c.temperature === 'cold'),
  }), [contacts])

  const getContact = useCallback(
    (id: string): Contact | undefined => contacts.find((c) => c.id === id),
    [contacts]
  )

  const overdueFollowUps = useMemo(() => {
    const now = new Date()
    return contacts.filter((c) => c.nextFollowUp && new Date(c.nextFollowUp) < now)
  }, [contacts])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return {
    contacts,
    filteredContacts,
    searchQuery,
    setSearchQuery,
    filterTemperature,
    setFilterTemperature,
    filterModule,
    setFilterModule,
    filterContactType,
    setFilterContactType,
    temperatureGroups,
    getContact,
    overdueFollowUps,
    refresh,
    isLoading,
    error,
  }
}
