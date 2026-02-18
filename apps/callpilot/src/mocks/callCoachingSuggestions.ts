import type { TalkingPointSuggestion } from '@/types'

const genericSuggestions: TalkingPointSuggestion[] = [
  {
    id: 'generic-1',
    text: 'Ask about any recent changes to their business or risk profile',
    category: 'discovery',
    priority: 'medium',
    used: false,
  },
  {
    id: 'generic-2',
    text: 'Mention our claims response time advantage over industry average',
    category: 'value_prop',
    priority: 'medium',
    used: false,
  },
  {
    id: 'generic-3',
    text: 'Ask what they value most in their current coverage',
    category: 'discovery',
    priority: 'high',
    used: false,
  },
  {
    id: 'generic-4',
    text: 'Propose a follow-up meeting with their decision-maker',
    category: 'closing',
    priority: 'low',
    used: false,
  },
]

const contactSuggestions: Record<string, TalkingPointSuggestion[]> = {
  'contact-1': [
    {
      id: 'c1-1',
      text: 'Ask how the CFO presentation went last week — this determines your next move',
      category: 'opener',
      priority: 'high',
      used: false,
    },
    {
      id: 'c1-2',
      text: 'If CFO pushed back on price, offer the safety program discount (up to 7%)',
      category: 'objection_response',
      priority: 'high',
      used: false,
    },
    {
      id: 'c1-3',
      text: 'Ask about the two new vans — confirm they need to be on the policy from day one',
      category: 'discovery',
      priority: 'medium',
      used: false,
    },
    {
      id: 'c1-4',
      text: 'Highlight our 48-hour claims turnaround vs State National\'s 2-week average',
      category: 'value_prop',
      priority: 'high',
      used: false,
    },
    {
      id: 'c1-5',
      text: 'If positive, ask to schedule the policy binding call this week',
      category: 'closing',
      priority: 'medium',
      used: false,
    },
  ],
  'contact-2': [
    {
      id: 'c2-1',
      text: 'Reference the written proposal she requested — confirm she received it',
      category: 'opener',
      priority: 'high',
      used: false,
    },
    {
      id: 'c2-2',
      text: 'Emphasize the March 1 deadline — a coverage gap puts 85 employees at risk',
      category: 'value_prop',
      priority: 'high',
      used: false,
    },
    {
      id: 'c2-3',
      text: 'Walk through the safety program outline — this was her key ask',
      category: 'discovery',
      priority: 'high',
      used: false,
    },
    {
      id: 'c2-4',
      text: 'Address non-renewal concern: our program reduces injuries, making future renewals easier',
      category: 'objection_response',
      priority: 'medium',
      used: false,
    },
    {
      id: 'c2-5',
      text: 'Push for signed application today — frame it as protecting her team',
      category: 'closing',
      priority: 'high',
      used: false,
    },
  ],
  'contact-4': [
    {
      id: 'c4-1',
      text: 'Open by thanking her for the long relationship — she values loyalty',
      category: 'opener',
      priority: 'medium',
      used: false,
    },
    {
      id: 'c4-2',
      text: 'Present the bundled GL + cyber package with 3% multi-policy discount',
      category: 'value_prop',
      priority: 'high',
      used: false,
    },
    {
      id: 'c4-3',
      text: 'Ask what the other cyber quotes cover — find gaps in their proposals',
      category: 'discovery',
      priority: 'high',
      used: false,
    },
    {
      id: 'c4-4',
      text: 'Frame 3% discount as better than 5% on GL alone because she gets two coverages cheaper',
      category: 'objection_response',
      priority: 'high',
      used: false,
    },
    {
      id: 'c4-5',
      text: 'Ask for commitment before the Feb 28 deadline to avoid any coverage lapse',
      category: 'closing',
      priority: 'medium',
      used: false,
    },
  ],
  'contact-5': [
    {
      id: 'c5-1',
      text: 'Ask if he was able to discuss with his co-founder — get a read on where they stand',
      category: 'opener',
      priority: 'high',
      used: false,
    },
    {
      id: 'c5-2',
      text: 'Reframe cost: a major breach could cost $5-10M vs the $15k premium difference',
      category: 'objection_response',
      priority: 'high',
      used: false,
    },
    {
      id: 'c5-3',
      text: 'Point out Series C investors will scrutinize the current $2M limit as inadequate',
      category: 'value_prop',
      priority: 'high',
      used: false,
    },
    {
      id: 'c5-4',
      text: 'Ask about their incident response plan and how coverage integrates with it',
      category: 'discovery',
      priority: 'medium',
      used: false,
    },
    {
      id: 'c5-5',
      text: 'Propose a three-way call with the co-founder to address all concerns at once',
      category: 'closing',
      priority: 'medium',
      used: false,
    },
  ],
  'contact-7': [
    {
      id: 'c7-1',
      text: 'Lead with the side-by-side comparison he requested — show you followed through',
      category: 'opener',
      priority: 'high',
      used: false,
    },
    {
      id: 'c7-2',
      text: 'Highlight the three areas where our coverage is broader, especially theft protection',
      category: 'value_prop',
      priority: 'high',
      used: false,
    },
    {
      id: 'c7-3',
      text: 'Address the $7k premium difference with better theft and liability coverage',
      category: 'objection_response',
      priority: 'high',
      used: false,
    },
    {
      id: 'c7-4',
      text: 'Ask about transition timeline — when do current policies expire at each location?',
      category: 'discovery',
      priority: 'medium',
      used: false,
    },
  ],
}

export function getMockSuggestionsForContact(
  contactId: string
): TalkingPointSuggestion[] {
  return contactSuggestions[contactId] ?? genericSuggestions
}

export const mockCallCoachingSuggestions = contactSuggestions
