// src/features/conversations/components/call-logger-types.ts
// Types for CallLogger component

export interface CallLogData {
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  notes: string;
  outcome?: 'answered' | 'voicemail' | 'no_answer' | 'busy';
  followUpRequired?: boolean;
}

export interface CallLoggerProps {
  /** Contact name */
  contactName: string;

  /** Contact phone number */
  phoneNumber: string;

  /** Callback when call is logged */
  onSave: (data: CallLogData) => void;

  /** Callback when cancelled */
  onCancel: () => void;

  /** Pre-fill direction */
  initialDirection?: 'inbound' | 'outbound';
}

export type CallOutcome = 'answered' | 'voicemail' | 'no_answer' | 'busy';
