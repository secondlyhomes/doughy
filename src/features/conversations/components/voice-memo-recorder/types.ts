// src/features/conversations/components/voice-memo-recorder/types.ts
// Types for Voice Memo Recorder

export interface VoiceMemoSaveData {
  transcript: string;
  durationSeconds: number;
  audioUri?: string; // Only included if user chose to keep audio
  keepAudio: boolean;
}

export interface VoiceMemoRecorderProps {
  /** Callback when recording is saved (extended to include audio retention choice) */
  onSave: (data: VoiceMemoSaveData) => void;

  /** Callback when recording is cancelled */
  onCancel: () => void;

  /** Optional max duration in seconds (default: 300 = 5 minutes) */
  maxDuration?: number;

  /** Allow user to choose audio retention (default: true) */
  allowAudioRetention?: boolean;

  /** Lead ID for context */
  leadId?: string;

  /** Deal ID for context */
  dealId?: string;
}

export type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing' | 'transcribing';
