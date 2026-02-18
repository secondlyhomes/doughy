export type CallOutcome = 'won' | 'progressed' | 'stalled' | 'lost' | 'follow_up';

export interface Call {
  id: string;
  contactId: string;
  contactName: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  outcome: CallOutcome;
  hasVoiceMemo: boolean;
  hasSummary: boolean;
}
