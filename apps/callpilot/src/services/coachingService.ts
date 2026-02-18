/**
 * Coaching Service
 *
 * Merges data from briefs, contacts, and mock suggestions
 * to produce CallCoaching data for the active call screen.
 */

import type { CallCoaching } from '@/types'
import * as briefsService from './briefsService'
import * as contactsService from './contactsService'
import { getMockSuggestionsForContact } from '@/mocks/callCoachingSuggestions'

function deduplicateStrings(items: string[]): string[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const lower = item.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
}

export async function getCoachingForContact(
  contactId: string
): Promise<CallCoaching> {
  const [brief, contact] = await Promise.all([
    briefsService.getBriefForContact(contactId),
    contactsService.getContact(contactId),
  ])

  const briefKeyFacts = brief?.keyFacts ?? []
  const contactKeyFacts = contact?.keyFacts ?? []
  const keyFacts = deduplicateStrings([...briefKeyFacts, ...contactKeyFacts])

  const result: CallCoaching = {
    contactId,
    suggestedApproach:
      brief?.suggestedApproach ?? 'No brief available — focus on discovery and relationship building.',
    watchOutFor: brief?.watchOutFor ?? [],
    keyFacts,
    objections: contact?.objections ?? [],
    suggestions: getMockSuggestionsForContact(contactId),
  }

  if (brief?.relationshipStrength) {
    result.relationshipStrength = brief.relationshipStrength
  }

  return result
}
