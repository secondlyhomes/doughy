/**
 * Mock Pre-Call Briefs
 *
 * Five pre-call briefs for upcoming conversations with insurance contacts.
 * Each includes conversation history, key facts, suggested approach,
 * warnings, and relationship strength assessment.
 */

import type { PreCallBrief } from '@/types';

export const mockPreBriefs: PreCallBrief[] = [
  {
    id: 'brief-1',
    contactId: 'contact-1',
    contactName: 'Mike Chen',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 7)',
      items: [
        'Discussed fleet coverage details for all 12 vehicles including two new vans added in January',
        'Mike expressed concern about the 10% premium increase over his current carrier but acknowledged our claims handling is faster',
        'He agreed to present our proposal to his CFO by end of week and scheduled a follow-up for Monday',
      ],
    },
    keyFacts: [
      'Fleet expanded from 10 to 12 vehicles in January 2026',
      'Two at-fault accidents in the last 18 months increased their risk profile',
      'CFO approval needed for any premium above $30,000',
      'Current carrier State National has slow claims processing - a pain point',
      'Referred by Tom Bradley who is a satisfied client',
    ],
    suggestedApproach:
      'Open by asking how the CFO conversation went. If positive, move to finalizing terms. If CFO pushed back on price, offer the safety program discount (up to 7%) as a concession.',
    watchOutFor: [
      'Mike may try to use the CFO as leverage to negotiate a lower rate - hold firm on the value proposition around claims speed',
      'Do not discount below $32,000 without manager approval',
    ],
    relationshipStrength: 'building',
  },
  {
    id: 'brief-2',
    contactId: 'contact-2',
    contactName: 'Sarah Rodriguez',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 6)',
      items: [
        'Reviewed the workers comp quote and safety program details for both warehouse locations',
        'Sarah was relieved we can provide coverage given her experience mod rate of 1.15 and recent carrier non-renewal',
        'She wants a written proposal by Tuesday that includes the safety training program at no additional cost',
      ],
    },
    keyFacts: [
      'Current carrier is non-renewing effective March 1, 2026 - urgent timeline',
      'Experience modification rate of 1.15 due to three lost-time injuries in 2025',
      'Needs coverage for 85 employees across two warehouse facilities',
      'Safety program is a key differentiator for us - she values loss prevention',
    ],
    suggestedApproach:
      'Lead with the completed written proposal and safety program outline. Emphasize the urgency of the March 1 deadline and position signing this week as protecting her employees from a coverage gap.',
    watchOutFor: [
      'She may ask for the safety program to be guaranteed in writing - confirm with underwriting first before committing',
    ],
    relationshipStrength: 'building',
  },
  {
    id: 'brief-3',
    contactId: 'contact-4',
    contactName: 'Linda Patel',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 8)',
      items: [
        'Discussed renewal terms for general liability across all three senior care facilities',
        'Linda is very happy with claims service and wants to continue the relationship',
        'She asked for a cyber liability quote to bundle with the GL renewal and requested a 5% loyalty discount',
      ],
    },
    keyFacts: [
      'Client since 2023 with zero claims filed - excellent loss history',
      'Renewal deadline is February 28, 2026',
      'Interested in adding cyber liability coverage for resident data protection',
      'Three facilities with a total of 120 beds',
      'Price-sensitive but values the relationship highly',
    ],
    suggestedApproach:
      'Present the bundled GL and cyber package with a 3% multi-policy discount instead of the 5% loyalty discount she requested. Frame it as a better deal because she gets two coverages for less than buying separately.',
    watchOutFor: [
      'She is comparing cyber quotes from two other brokers - be prepared to justify our cyber pricing with coverage comparison',
      'Do not exceed 3% discount without approval as her GL premium is already competitive',
    ],
    relationshipStrength: 'strong',
  },
  {
    id: 'brief-4',
    contactId: 'contact-5',
    contactName: 'David Kim',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 5)',
      items: [
        'Presented the $5M cyber liability proposal but David pushed back on the premium being $15k higher than their current coverage',
        'He raised the prior data breach and asked about retroactive coverage which we cannot offer',
        'David said he needs to discuss the decision with his co-founder and board before proceeding',
      ],
    },
    keyFacts: [
      'SaaS company processing financial data for 500+ clients - high risk profile',
      'SOC 2 Type II certified which should help with underwriting',
      'Had a contained data breach in Q3 2025',
      'Board requires cyber coverage in place before Series C closing',
      'Current coverage is only $2M - significantly underinsured',
    ],
    suggestedApproach:
      'Reframe the conversation around risk exposure rather than premium cost. Calculate what a major breach would cost them versus the premium difference. Mention that their Series C investors will scrutinize the $2M limit.',
    watchOutFor: [
      'David may use the co-founder as a stall tactic - ask for a three-way call to address all concerns at once',
      'Do not offer retroactive coverage for the prior breach under any circumstances',
    ],
    relationshipStrength: 'building',
  },
  {
    id: 'brief-5',
    contactId: 'contact-7',
    contactName: 'Marcus Williams',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 3)',
      items: [
        'Walked Marcus through our commercial auto and garage keepers liability quote for all four dealership locations',
        'He liked the consolidated single-policy approach but expressed concern about coverage gaps during the transition period',
        'Requested a side-by-side comparison of our coverage versus his expiring policy before committing',
      ],
    },
    keyFacts: [
      'Four auto dealership locations in metro Atlanta',
      '45 dealer plates plus 8 owned commercial vehicles',
      'Previous carrier cancelled after two large theft claims totaling $180k',
      'Current combined premium is $82k - our quote is at $89k but with broader coverage',
      'Needs garage keepers liability bundled in',
    ],
    suggestedApproach:
      'Bring the completed side-by-side coverage comparison he requested. Highlight the three areas where our coverage is broader, especially the theft coverage improvements that directly address why his last carrier dropped him.',
    watchOutFor: [
      'Marcus is price-focused - be ready to show that the $7k difference buys significantly better theft and liability protection',
    ],
    relationshipStrength: 'new',
  },
  {
    id: 'brief-6',
    contactId: 'contact-3',
    contactName: 'James Thornton',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 8)',
      items: [
        'Met James at the local REIA meeting — he specializes in REO and short sale listings in Loudoun County',
        'He mentioned having 3 pocket listings coming soon and is looking for a reliable investor buyer',
        'Wants exclusivity in exchange for first look at off-market deals',
      ],
    },
    keyFacts: [
      'Keller Williams agent, Loudoun and western Fairfax',
      'Specializes in REO and short sale listings',
      '3 pocket listings coming soon',
      'Skeptical of our closing timeline claims',
    ],
    suggestedApproach:
      'Show proof of recent closings with timelines to build credibility. Propose a trial period — first 2 deals as exclusive, then evaluate the relationship.',
    watchOutFor: [
      'He wants full exclusivity upfront — negotiate a trial period instead',
      'May test your seriousness by sending a marginal deal first',
    ],
    relationshipStrength: 'new',
  },
  {
    id: 'brief-7',
    contactId: 'contact-8',
    contactName: 'Angela Foster',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 13)',
      items: [
        'Angela reported a leaky kitchen faucet — sent Mike Torres to fix it same day',
        'She was happy with the quick response and mentioned the garbage disposal is also making a noise',
        'Lease renewal coming up next month — good time to discuss terms',
      ],
    },
    keyFacts: [
      'Tenant since August 2025 at 789 Elm St, Fairfax',
      'Two kids and a dog',
      'Works as a nurse — available mornings',
      'Lease ends July 2026',
      'Happy with maintenance response time',
    ],
    suggestedApproach:
      'Ask about the garbage disposal issue and schedule a repair. Use the positive interaction to start the lease renewal conversation early.',
    watchOutFor: [
      'May ask for rent reduction in exchange for renewal — our area rents have gone up 3%',
    ],
    relationshipStrength: 'established',
  },
  {
    id: 'brief-8',
    contactId: 'contact-9',
    contactName: 'Mike Torres',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 13)',
      items: [
        'Dispatched Mike to fix the leaky faucet at Angela Foster\'s unit in Fairfax',
        'He completed the repair in under an hour and invoiced $280',
        'Mentioned he\'s booked solid next week but can handle emergencies',
      ],
    },
    keyFacts: [
      'Owner of Mike\'s Plumbing — licensed and insured',
      'Handles all plumbing across our properties',
      'Usually responds within 2 hours',
      'Gives us a 10% landlord discount',
      '12 completed jobs, average cost $340',
    ],
    suggestedApproach:
      'Check if he can handle the garbage disposal issue at Angela\'s unit. Discuss scheduling a preventive inspection across all properties before spring.',
    watchOutFor: [
      'He\'s getting busier — may need to lock in a preferred vendor agreement to guarantee response times',
    ],
    relationshipStrength: 'strong',
  },
  {
    id: 'brief-9',
    contactId: 'contact-10',
    contactName: 'Tom Bradley',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last conversation (Feb 1)',
      items: [
        'Tom completed the electrical panel upgrade at 789 Elm St in Fairfax',
        'Work passed inspection on first try — very clean install',
        'He mentioned he can also do smart home wiring if we\'re interested',
      ],
    },
    keyFacts: [
      'Licensed master electrician at Bradley Electric',
      'Referred by Mike Torres',
      'Did panel upgrade at Fairfax property',
      'Average job cost $580, responds within 1 day',
    ],
    suggestedApproach:
      'Thank him for the clean panel work. Ask about smart home wiring options and pricing for our properties.',
    watchOutFor: [
      'His rates are slightly higher than average — worth it for quality but negotiate on multi-property packages',
    ],
    relationshipStrength: 'building',
  },
  {
    id: 'brief-10',
    contactId: 'contact-11',
    contactName: 'Jessica Park',
    generatedAt: '2026-02-10T08:00:00Z',
    lastConversation: {
      title: 'Last contact (Feb 9)',
      items: [
        'Jessica submitted a rental application for Unit 1 at 456 Oak Ave',
        'Credit check came back clean — score 720+, income verified at $75k/yr',
        'She\'s currently in an apartment in DC and wants to move to the suburbs',
      ],
    },
    keyFacts: [
      'Applied for Unit 1 at 456 Oak Ave, Woodbridge',
      'Credit score 720+, income $75k/yr',
      'Moving from DC apartment',
      'No pets mentioned on application',
    ],
    suggestedApproach:
      'Schedule an in-person showing this week. She looks like a strong applicant — move quickly before she finds another place.',
    watchOutFor: [
      'She may be looking at multiple properties — emphasize our responsive management and the neighborhood',
    ],
    relationshipStrength: 'new',
  },
];
