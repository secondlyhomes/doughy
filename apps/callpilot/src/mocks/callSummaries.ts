/**
 * Mock Call Summaries
 *
 * Five call summaries matching the five calls that have voice memos
 * (call-1, call-2, call-4, call-5, call-8). Each includes bullet points,
 * narrative summary, sentiment, action items, key moments, and CRM sync status.
 */

import type { CallSummary } from '@/types';

export const mockCallSummaries: CallSummary[] = [
  {
    id: 'summary-1',
    callId: 'call-1',
    contactId: 'contact-1',
    contactName: 'Mike Chen',
    date: '2026-02-07T16:30:00Z',
    duration: 1320,
    summaryText:
      'Productive follow-up call with Mike Chen regarding the Acme Manufacturing commercial auto fleet policy. The CFO has reviewed the proposal and is open to moving forward but wants to see if the premium can be reduced. Mike mentioned the two new vans added in January are driving costs up. A GPS safety discount opportunity was identified which could bring the premium closer to their target. Next step is to get revised numbers from underwriting and present them before the end of the week.',
    bulletPoints: [
      'CFO reviewed the proposal and is open to proceeding with some price adjustment',
      'Two new vans added in January are increasing the overall fleet premium',
      'GPS tracking on all 12 vehicles qualifies them for a fleet safety discount',
      'Need revised quote from underwriting by Wednesday to call Mike back Thursday',
    ],
    sentiment: 'positive',
    actionItems: [
      {
        id: 'action-1',
        text: 'Request revised fleet quote with GPS safety discount from underwriting',
        completed: false,
        dueDate: '2026-02-12T17:00:00Z',
      },
      {
        id: 'action-2',
        text: 'Call Mike back with updated numbers before Friday',
        completed: false,
        dueDate: '2026-02-13T17:00:00Z',
      },
      {
        id: 'action-3',
        text: 'Send Mike the claims turnaround comparison data he asked about',
        completed: true,
        dueDate: '2026-02-10T17:00:00Z',
      },
    ],
    keyMoments: [
      {
        id: 'km-1',
        timestamp: '00:03:24',
        description:
          'CFO is open to the proposal - deal is alive and progressing',
        type: 'commitment',
      },
      {
        id: 'km-2',
        timestamp: '00:08:15',
        description:
          'Mike raised cost concern about the two new vans added in January',
        type: 'objection',
      },
      {
        id: 'km-3',
        timestamp: '00:14:30',
        description:
          'GPS tracking on all vehicles opens opportunity for safety discount',
        type: 'interest',
      },
    ],
    nextStep:
      'Get revised quote from underwriting with GPS safety discount, then call Mike Thursday to present updated numbers.',
    followUpDate: '2026-02-12T10:00:00Z',
    crmSynced: true,
  },
  {
    id: 'summary-2',
    callId: 'call-2',
    contactId: 'contact-2',
    contactName: 'Sarah Rodriguez',
    date: '2026-02-06T14:00:00Z',
    duration: 1680,
    summaryText:
      'Detailed conversation with Sarah Rodriguez about workers compensation coverage for Pacific Coast Distributors. With her current carrier non-renewing effective March 1, there is strong urgency to finalize coverage. Sarah was very engaged and particularly interested in our loss control specialist program. She needs a formal written proposal by Tuesday and wants the safety training program included at no additional cost. This is a high-priority account given the timeline and $52k estimated premium.',
    bulletPoints: [
      'Current workers comp carrier non-renewing March 1 - urgent coverage need',
      'Sarah highly interested in our dedicated loss control specialist program',
      'Formal written proposal needed by Tuesday with bundled safety training',
      'Need to confirm with loss control team that safety program can be included at no charge',
    ],
    sentiment: 'positive',
    actionItems: [
      {
        id: 'action-4',
        text: 'Prepare formal written proposal with coverage details and pricing',
        completed: false,
        dueDate: '2026-02-11T17:00:00Z',
      },
      {
        id: 'action-5',
        text: 'Confirm with loss control team that safety program can be bundled at no charge',
        completed: false,
        dueDate: '2026-02-10T17:00:00Z',
      },
    ],
    keyMoments: [
      {
        id: 'km-4',
        timestamp: '00:05:10',
        description:
          'Sarah expressed urgency - current carrier non-renewing March 1',
        type: 'concern',
      },
      {
        id: 'km-5',
        timestamp: '00:12:45',
        description:
          'Strong interest in the dedicated loss control specialist program',
        type: 'interest',
      },
      {
        id: 'km-6',
        timestamp: '00:22:00',
        description:
          'Asked for safety program at no cost - potential sticking point',
        type: 'objection',
      },
    ],
    nextStep:
      'Complete written proposal and confirm safety program bundling. Deliver proposal Tuesday morning and schedule follow-up for Wednesday.',
    followUpDate: '2026-02-11T09:00:00Z',
    crmSynced: true,
  },
  {
    id: 'summary-3',
    callId: 'call-4',
    contactId: 'contact-4',
    contactName: 'Linda Patel',
    date: '2026-02-08T10:15:00Z',
    duration: 1500,
    summaryText:
      'Renewal discussion with long-time client Linda Patel at Sunrise Senior Living. The GL renewal is confirmed for another year. The new development is her interest in adding cyber liability coverage to protect resident data, driven by recent breaches at other senior care facilities. She requested a 5% loyalty discount on the renewal. The plan is to counter with a 3% multi-policy discount on the bundled GL and cyber package, which provides better overall value. Need to get the cyber quote from underwriting this week.',
    bulletPoints: [
      'GL renewal confirmed - Linda committed to another year with Secondly Homes',
      'New opportunity to add cyber liability coverage for resident data protection',
      'Linda requested 5% loyalty discount - will counter with 3% multi-policy discount',
      'Cyber quote needed from underwriting to prepare bundled package by Thursday',
    ],
    sentiment: 'positive',
    actionItems: [
      {
        id: 'action-6',
        text: 'Request cyber liability quote from underwriting for senior care operations',
        completed: false,
        dueDate: '2026-02-12T17:00:00Z',
      },
      {
        id: 'action-7',
        text: 'Prepare bundled GL renewal and cyber package with 3% multi-policy discount',
        completed: false,
        dueDate: '2026-02-13T17:00:00Z',
      },
      {
        id: 'action-8',
        text: 'Send Linda the cyber coverage overview brochure she requested',
        completed: true,
        dueDate: '2026-02-09T17:00:00Z',
      },
    ],
    keyMoments: [
      {
        id: 'km-7',
        timestamp: '00:02:00',
        description: 'Linda confirmed she will renew the GL policy - committed',
        type: 'commitment',
      },
      {
        id: 'km-8',
        timestamp: '00:10:30',
        description:
          'Strong interest in cyber coverage driven by industry breach concerns',
        type: 'interest',
      },
      {
        id: 'km-9',
        timestamp: '00:18:00',
        description:
          'Requested 5% loyalty discount - will need to negotiate to 3%',
        type: 'objection',
      },
    ],
    nextStep:
      'Get cyber quote and prepare bundled package. Present to Linda by Thursday with 3% multi-policy discount.',
    followUpDate: '2026-02-12T11:00:00Z',
    crmSynced: false,
  },
  {
    id: 'summary-4',
    callId: 'call-5',
    contactId: 'contact-5',
    contactName: 'David Kim',
    date: '2026-02-05T15:45:00Z',
    duration: 1800,
    summaryText:
      'Challenging call with David Kim at TechVault Solutions regarding the $5M cyber liability proposal. David pushed back strongly on the premium, citing a $15k increase over their current coverage. However, their current $2M limit is significantly inadequate for a company processing financial data for 500+ clients. He also asked about retroactive coverage for a prior breach which is not available. David deferred the decision to his co-founder and board. The deal is at risk of stalling. A breach cost analysis showing the financial exposure of being underinsured may help reframe the conversation around risk rather than cost.',
    bulletPoints: [
      'Strong price objection - our $5M premium is $15k more than their current $2M coverage',
      'David asked about retroactive coverage for Q3 2025 breach - not available',
      'Decision deferred to co-founder and board - risk of deal stalling',
      'Need to reframe conversation around risk exposure vs. premium cost',
    ],
    sentiment: 'negative',
    actionItems: [
      {
        id: 'action-9',
        text: 'Create breach cost analysis comparing potential incident costs to premium difference',
        completed: false,
        dueDate: '2026-02-11T17:00:00Z',
      },
      {
        id: 'action-10',
        text: 'Request a three-way call with David and his co-founder to address all concerns',
        completed: false,
        dueDate: '2026-02-10T17:00:00Z',
      },
    ],
    keyMoments: [
      {
        id: 'km-10',
        timestamp: '00:06:00',
        description: 'Strong price objection - $15k more than current premium',
        type: 'objection',
      },
      {
        id: 'km-11',
        timestamp: '00:18:30',
        description:
          'Asked about retroactive coverage for prior breach - not available',
        type: 'question',
      },
      {
        id: 'km-12',
        timestamp: '00:25:00',
        description:
          'Deferred decision to co-founder and board - possible stall tactic',
        type: 'concern',
      },
    ],
    nextStep:
      'Prepare breach cost analysis and request three-way call with co-founder. Need to move quickly before this stalls permanently.',
    followUpDate: '2026-02-10T15:00:00Z',
    crmSynced: false,
  },
  {
    id: 'summary-5',
    callId: 'call-8',
    contactId: 'contact-8',
    contactName: 'Angela Foster',
    date: '2026-02-09T11:00:00Z',
    duration: 1320,
    summaryText:
      'Excellent outcome - closed the renewal with Angela Foster at Bright Horizons Daycare. She renewed the general liability policy for another year and added a $1M umbrella policy. Angela is very satisfied with our claims service and mentioned she never waits more than a day for a callback. She offered to introduce other daycare operators in the Denver area who may need coverage. This client is low-maintenance, always pays on time, and is now a valuable referral source. Follow up next week to get the referral introductions.',
    bulletPoints: [
      'GL renewal signed for another year plus new $1M umbrella policy added',
      'Angela praised our claims service - never waits more than a day for callback',
      'She offered to refer other daycare operators in the Denver area',
      'Follow up next week to get referral introductions - high-value warm leads',
    ],
    sentiment: 'positive',
    actionItems: [
      {
        id: 'action-11',
        text: 'Follow up with Angela to get referral introductions to other daycare operators',
        completed: false,
        dueDate: '2026-02-14T17:00:00Z',
      },
      {
        id: 'action-12',
        text: 'Send Angela a thank-you note for the renewal and umbrella addition',
        completed: false,
        dueDate: '2026-02-11T17:00:00Z',
      },
    ],
    keyMoments: [
      {
        id: 'km-13',
        timestamp: '00:01:30',
        description:
          'Angela signed the GL renewal and added $1M umbrella policy',
        type: 'commitment',
      },
      {
        id: 'km-14',
        timestamp: '00:12:00',
        description:
          'Offered to introduce other daycare operators as referrals',
        type: 'interest',
      },
    ],
    nextStep:
      'Send thank-you note this week, then follow up next week for referral introductions.',
    followUpDate: '2026-02-14T10:00:00Z',
    crmSynced: true,
  },
];
