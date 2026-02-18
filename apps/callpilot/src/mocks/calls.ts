/**
 * Mock Call Records
 *
 * Fifteen realistic call records tied to mock contacts, spanning the last
 * two weeks with a mix of outcomes, durations, and memo/summary states.
 */

import type { Call } from '@/types';

export const mockCalls: Call[] = [
  // Call 1 - Mike Chen, recent, progressed, has memo + summary
  {
    id: 'call-1',
    contactId: 'contact-1',
    contactName: 'Mike Chen',
    startedAt: '2026-02-07T16:30:00Z',
    endedAt: '2026-02-07T16:52:00Z',
    duration: 1320,
    outcome: 'progressed',
    hasVoiceMemo: true,
    hasSummary: true,
  },
  // Call 2 - Sarah Rodriguez, quoted, has memo + summary
  {
    id: 'call-2',
    contactId: 'contact-2',
    contactName: 'Sarah Rodriguez',
    startedAt: '2026-02-06T14:00:00Z',
    endedAt: '2026-02-06T14:28:00Z',
    duration: 1680,
    outcome: 'progressed',
    hasVoiceMemo: true,
    hasSummary: true,
  },
  // Call 3 - James Thornton, short call, no memo
  {
    id: 'call-3',
    contactId: 'contact-3',
    contactName: 'James Thornton',
    startedAt: '2026-02-04T11:00:00Z',
    endedAt: '2026-02-04T11:08:00Z',
    duration: 480,
    outcome: 'follow_up',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 4 - Linda Patel, renewal discussion, has memo + summary
  {
    id: 'call-4',
    contactId: 'contact-4',
    contactName: 'Linda Patel',
    startedAt: '2026-02-08T10:15:00Z',
    endedAt: '2026-02-08T10:40:00Z',
    duration: 1500,
    outcome: 'progressed',
    hasVoiceMemo: true,
    hasSummary: true,
  },
  // Call 5 - David Kim, stalled deal, has memo + summary
  {
    id: 'call-5',
    contactId: 'contact-5',
    contactName: 'David Kim',
    startedAt: '2026-02-05T15:45:00Z',
    endedAt: '2026-02-05T16:15:00Z',
    duration: 1800,
    outcome: 'stalled',
    hasVoiceMemo: true,
    hasSummary: true,
  },
  // Call 6 - Rachel Simmons, initial cold call, short
  {
    id: 'call-6',
    contactId: 'contact-6',
    contactName: 'Rachel Simmons',
    startedAt: '2026-01-30T13:00:00Z',
    endedAt: '2026-01-30T13:04:00Z',
    duration: 240,
    outcome: 'follow_up',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 7 - Marcus Williams, quote presentation
  {
    id: 'call-7',
    contactId: 'contact-7',
    contactName: 'Marcus Williams',
    startedAt: '2026-02-03T09:30:00Z',
    endedAt: '2026-02-03T09:55:00Z',
    duration: 1500,
    outcome: 'progressed',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 8 - Angela Foster, renewal won
  {
    id: 'call-8',
    contactId: 'contact-8',
    contactName: 'Angela Foster',
    startedAt: '2026-02-09T11:00:00Z',
    endedAt: '2026-02-09T11:22:00Z',
    duration: 1320,
    outcome: 'won',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 9 - Mike Chen, earlier follow-up
  {
    id: 'call-9',
    contactId: 'contact-1',
    contactName: 'Mike Chen',
    startedAt: '2026-02-03T10:00:00Z',
    endedAt: '2026-02-03T10:18:00Z',
    duration: 1080,
    outcome: 'progressed',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 10 - Sarah Rodriguez, initial discovery
  {
    id: 'call-10',
    contactId: 'contact-2',
    contactName: 'Sarah Rodriguez',
    startedAt: '2026-01-31T11:00:00Z',
    endedAt: '2026-01-31T11:30:00Z',
    duration: 1800,
    outcome: 'progressed',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 11 - David Kim, earlier discussion
  {
    id: 'call-11',
    contactId: 'contact-5',
    contactName: 'David Kim',
    startedAt: '2026-01-29T14:00:00Z',
    endedAt: '2026-01-29T14:22:00Z',
    duration: 1320,
    outcome: 'progressed',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 12 - James Thornton, first cold call
  {
    id: 'call-12',
    contactId: 'contact-3',
    contactName: 'James Thornton',
    startedAt: '2026-01-28T15:30:00Z',
    endedAt: '2026-01-28T15:33:00Z',
    duration: 180,
    outcome: 'follow_up',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 13 - Linda Patel, check-in call
  {
    id: 'call-13',
    contactId: 'contact-4',
    contactName: 'Linda Patel',
    startedAt: '2026-01-31T09:00:00Z',
    endedAt: '2026-01-31T09:12:00Z',
    duration: 720,
    outcome: 'follow_up',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 14 - Marcus Williams, discovery call
  {
    id: 'call-14',
    contactId: 'contact-7',
    contactName: 'Marcus Williams',
    startedAt: '2026-01-29T10:00:00Z',
    endedAt: '2026-01-29T10:25:00Z',
    duration: 1500,
    outcome: 'progressed',
    hasVoiceMemo: false,
    hasSummary: false,
  },
  // Call 15 - Contact lost - a prospect that did not convert
  {
    id: 'call-15',
    contactId: 'contact-6',
    contactName: 'Rachel Simmons',
    startedAt: '2026-01-28T09:00:00Z',
    endedAt: '2026-01-28T09:03:00Z',
    duration: 180,
    outcome: 'lost',
    hasVoiceMemo: false,
    hasSummary: false,
  },
];
