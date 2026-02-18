/**
 * Transcript Types
 *
 * Maps to callpilot.transcript_chunks table.
 * Speaker diarization: 'user', 'lead', 'ai_bland'
 */

export type TranscriptSpeaker = 'user' | 'lead' | 'ai_bland';

export interface TranscriptChunk {
  id: string;
  callId: string;
  speaker: TranscriptSpeaker;
  text: string;
  startTime: number | null;
  endTime: number | null;
  confidence: number | null;
  createdAt: string;
}

/** Formatted full transcript line for display */
export interface TranscriptLine {
  speaker: TranscriptSpeaker;
  text: string;
  timestamp: number | null;
}

export type TranscriptRetention = 'full' | 'summary_only' | 'deleted';

/** Extended call fields for transcript storage */
export interface CallTranscriptFields {
  fullTranscript: string | null;
  transcriptWordCount: number | null;
  transcriptRetention: TranscriptRetention;
  transcriptExpiresAt: string | null;
}
