export type CallSentiment = 'positive' | 'neutral' | 'negative';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface KeyMoment {
  id: string;
  timestamp: string;
  description: string;
  type: 'objection' | 'interest' | 'commitment' | 'concern' | 'question';
}

export interface VoiceMemo {
  id: string;
  callId: string;
  duration: number;
  recordedAt: string;
  transcript: string;
  analysis: {
    sentiment: CallSentiment;
    outcome: 'won' | 'progressed' | 'stalled' | 'lost' | 'follow_up';
    actionItems: ActionItem[];
    keyMoments: KeyMoment[];
    nextStepSuggestion: string;
    followUpDate: string;
  };
}
