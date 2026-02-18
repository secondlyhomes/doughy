export type CommunicationChannel = 'sms' | 'email' | 'call' | 'transcript';
export type CommunicationDirection = 'incoming' | 'outgoing';
export type CommunicationStatus = 'sent' | 'delivered' | 'read' | 'error';

export interface Communication {
  id: string;
  contactId: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  body: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  duration: number | null;
  outcome: string | null;
  recordingUrl: string | null;
  transcriptText: string | null;
  aiAnalysis: CommunicationAnalysis | null;
}

export interface CommunicationAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  nextStepSuggestion: string | null;
}
