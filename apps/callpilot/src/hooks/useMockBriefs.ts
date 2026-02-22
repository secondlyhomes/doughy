/**
 * Mock Briefs Hook
 *
 * Provides pre-call brief data for contacts.
 * Will be replaced with real AI-generated briefs in Phase 2.
 */

import { useCallback } from 'react'
import type { PreCallBrief } from '@/types'
import { mockPreBriefs } from '@/mocks'

export interface UseMockBriefsReturn {
  briefs: PreCallBrief[]
  getBriefForContact: (contactId: string) => PreCallBrief | undefined
}

export function useMockBriefs(): UseMockBriefsReturn {
  const briefs = mockPreBriefs

  const getBriefForContact = useCallback(
    (contactId: string) => briefs.find((b) => b.contactId === contactId),
    [briefs]
  )

  return {
    briefs,
    getBriefForContact,
  }
}
