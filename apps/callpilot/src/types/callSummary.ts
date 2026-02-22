import type { ActionItem, KeyMoment, CallSentiment } from './voiceMemo';

export interface CallSummary {
  id: string;
  callId: string;
  contactId: string;
  contactName: string;
  date: string;
  duration: number;
  summaryText: string;
  bulletPoints: string[];
  sentiment: CallSentiment;
  actionItems: ActionItem[];
  keyMoments: KeyMoment[];
  nextStep: string;
  followUpDate: string;
  crmSynced: boolean;
}
