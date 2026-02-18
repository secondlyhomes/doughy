/**
 * Communications Service
 *
 * Unified communication retrieval across channels.
 *
 * // TODO: Phase 2 — replace mock imports with Supabase queries
 * // TODO: Phase 3 — add sendSMS (Twilio)
 * // TODO: Phase 4 — add sendEmail, syncEmails (Gmail)
 */

import type { Communication } from '@/types'
import { mockCommunications } from '@/mocks'

export async function getCommunications(): Promise<Communication[]> {
  return mockCommunications
}

export async function getByContact(
  contactId: string
): Promise<Communication[]> {
  return mockCommunications.filter((c) => c.contactId === contactId)
}

export async function getRecent(limit: number): Promise<Communication[]> {
  return [...mockCommunications]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit)
}
