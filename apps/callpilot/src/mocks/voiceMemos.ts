/**
 * Mock Voice Memos
 *
 * Five voice memos tied to calls that have hasVoiceMemo: true (calls 1-5).
 * Each includes a first-person conversational transcript, sentiment analysis,
 * action items, key moments, and next step suggestions.
 */

import type { VoiceMemo } from '@/types';

export const mockVoiceMemos: VoiceMemo[] = [
  {
    id: 'memo-1',
    callId: 'call-1',
    duration: 45,
    recordedAt: '2026-02-07T16:55:00Z',
    transcript:
      'Just got off the phone with Mike Chen at Acme Manufacturing. Good call overall. He said he presented our proposal to the CFO last Thursday and the CFO is open to it but wants to see if we can sharpen the pencil on the premium a bit. Mike mentioned the two new vans they added are costing more than expected. I told him I would look into the fleet safety discount since they have GPS tracking on all vehicles. He seemed positive about that. Need to get the revised numbers from underwriting by Wednesday so I can call him back before the weekend.',
    analysis: {
      sentiment: 'positive',
      outcome: 'progressed',
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
      nextStepSuggestion:
        'Get revised quote from underwriting with the GPS safety discount applied, then schedule a call with Mike for Thursday to present the updated numbers.',
      followUpDate: '2026-02-12T10:00:00Z',
    },
  },
  {
    id: 'memo-2',
    callId: 'call-2',
    duration: 52,
    recordedAt: '2026-02-06T14:32:00Z',
    transcript:
      'Finished my call with Sarah Rodriguez at Pacific Coast Distributors. She is under real pressure because her current workers comp carrier is non-renewing them March first. She was very engaged and asked a lot of questions about our safety training program. I walked her through how we pair each client with a loss control specialist and she really liked that. She needs a formal written proposal by Tuesday. The big thing is she wants the safety program included at no extra charge. I need to check with our loss control team if we can bundle that. This is a $52k account so it should be worth the investment.',
    analysis: {
      sentiment: 'positive',
      outcome: 'progressed',
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
      nextStepSuggestion:
        'Complete the written proposal and confirm the safety program bundling with loss control. Deliver the proposal by Tuesday morning and schedule a follow-up call for Wednesday.',
      followUpDate: '2026-02-11T09:00:00Z',
    },
  },
  {
    id: 'memo-3',
    callId: 'call-4',
    duration: 38,
    recordedAt: '2026-02-08T10:45:00Z',
    transcript:
      'Quick memo after my call with Linda Patel at Sunrise Senior Living. Great relationship here, she is one of my best clients. We talked about her GL renewal coming up on the 28th and she is definitely renewing. The new topic is cyber coverage - she has been reading about data breaches at other senior care facilities and wants to protect resident information. She asked me to put together a bundled quote. She also wants a loyalty discount, mentioned five percent. I am going to counter with a three percent multi-policy discount since we are adding cyber. I think she will go for it. Need to get the cyber quote from underwriting this week.',
    analysis: {
      sentiment: 'positive',
      outcome: 'progressed',
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
          description:
            'Linda confirmed she will renew the GL policy - committed',
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
      nextStepSuggestion:
        'Get the cyber quote and prepare the bundled package. Present to Linda by Thursday with the 3% multi-policy discount positioned as better overall value.',
      followUpDate: '2026-02-12T11:00:00Z',
    },
  },
  {
    id: 'memo-4',
    callId: 'call-5',
    duration: 62,
    recordedAt: '2026-02-05T16:20:00Z',
    transcript:
      'Tough call with David Kim at TechVault. I presented our five million dollar cyber liability proposal and he pushed back hard on the premium. He said it is fifteen thousand more than what they are paying now. I tried to explain that their current coverage is only two million which is way too low for a company handling financial data, but he kept coming back to the dollar amount. He also asked about retroactive coverage for that data breach they had last year and I had to tell him we cannot do that. He said he needs to talk to his co-founder and the board before making a decision. I am worried this one is stalling. I need to find a way to reframe this around risk rather than cost. Maybe I can put together a breach cost analysis to show what a major incident would cost them versus the premium difference.',
    analysis: {
      sentiment: 'negative',
      outcome: 'stalled',
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
          description:
            'Strong price objection - $15k more than current premium',
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
      nextStepSuggestion:
        'Prepare a breach cost analysis showing the financial risk of being underinsured at $2M. Request a three-way call with the co-founder to move this forward before it stalls further.',
      followUpDate: '2026-02-10T15:00:00Z',
    },
  },
  {
    id: 'memo-5',
    callId: 'call-8',
    duration: 30,
    recordedAt: '2026-02-09T11:25:00Z',
    transcript:
      'Great news, just closed the renewal with Angela Foster at Bright Horizons Daycare. She signed for another year on the general liability and we added a one million dollar umbrella policy on top. She is really happy with our claims service, mentioned she has never had to wait more than a day for a callback. She also said she knows a couple of other daycare operators in the Denver area who might need coverage. I asked if she would be open to making introductions and she said absolutely. I need to follow up with her next week to get those referral names. This is a great client, low maintenance, always pays on time, and now a potential referral source.',
    analysis: {
      sentiment: 'positive',
      outcome: 'won',
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
      nextStepSuggestion:
        'Send a thank-you note this week, then follow up next week to get the referral introductions. These warm referrals could be high-value prospects.',
      followUpDate: '2026-02-14T10:00:00Z',
    },
  },
];
