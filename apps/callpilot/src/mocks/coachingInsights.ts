/**
 * Mock Coaching Insights
 *
 * A single CoachingInsight object with weekly statistics, top objections,
 * call outcome breakdowns, weekly volume, best call times, strengths,
 * and areas for improvement. All data is realistic for an insurance
 * sales agent's coaching dashboard.
 */

import type { CoachingInsight } from '@/types';

export const mockCoachingInsight: CoachingInsight = {
  weeklyStats: {
    callsThisWeek: 23,
    callsLastWeek: 19,
    winRate: 34,
    winRateChange: 5,
    avgFollowUpDays: 2.3,
    followUpsDue: 4,
    totalCalls: 47,
    memoCompletionRate: 72,
  },
  topObjections: [
    {
      text: 'Price too high compared to current carrier',
      count: 14,
      winRateWhenHandled: 42,
    },
    {
      text: 'Happy with existing coverage',
      count: 9,
      winRateWhenHandled: 28,
    },
    {
      text: 'Need to discuss with business partner',
      count: 7,
      winRateWhenHandled: 38,
    },
  ],
  callsByOutcome: {
    won: 8,
    progressed: 18,
    stalled: 6,
    lost: 4,
    followUp: 11,
  },
  weeklyCallVolume: [
    { day: 'Mon', count: 3 },
    { day: 'Tue', count: 5 },
    { day: 'Wed', count: 6 },
    { day: 'Thu', count: 4 },
    { day: 'Fri', count: 5 },
  ],
  bestCallTime: 'Tuesday-Thursday, 10am-11:30am',
  strengths: [
    'Excellent at building rapport during discovery calls - clients feel heard and understood',
    'Strong ability to explain complex coverage options in simple, relatable terms',
    'Consistent follow-up cadence keeps deals moving through the pipeline',
  ],
  areasToImprove: [
    'Price objection handling - tend to concede discounts too quickly instead of reinforcing value',
    'Voice memo completion rate could improve - missing memos on 28% of calls means lost context for follow-ups',
  ],
};
