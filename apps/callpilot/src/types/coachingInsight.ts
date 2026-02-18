export interface WeeklyStats {
  callsThisWeek: number;
  callsLastWeek: number;
  winRate: number;
  winRateChange: number;
  avgFollowUpDays: number;
  followUpsDue: number;
  totalCalls: number;
  memoCompletionRate: number;
}

export interface TopObjection {
  text: string;
  count: number;
  winRateWhenHandled: number;
}

export interface CoachingInsight {
  weeklyStats: WeeklyStats;
  topObjections: TopObjection[];
  callsByOutcome: {
    won: number;
    progressed: number;
    stalled: number;
    lost: number;
    followUp: number;
  };
  weeklyCallVolume: { day: string; count: number }[];
  bestCallTime: string;
  strengths: string[];
  areasToImprove: string[];
}
