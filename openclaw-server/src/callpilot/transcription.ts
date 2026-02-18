// CallPilot — Deepgram Transcription Service
// Transcribes call recordings via Deepgram REST API, stores chunks in DB

import { config } from '../config.js';
import { cpQuery, cpInsert, cpUpdate } from './db.js';

// ============================================================================
// Config
// ============================================================================

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

function getDeepgramKey(): string {
  const key = config.deepgramApiKey;
  if (!key) throw new Error('DEEPGRAM_API_KEY not configured');
  return key;
}

// ============================================================================
// Types
// ============================================================================

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

interface DeepgramUtterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: DeepgramWord[];
  speaker: number;
  id: string;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: DeepgramWord[];
      }>;
    }>;
    utterances?: DeepgramUtterance[];
  };
  metadata?: {
    duration?: number;
    channels?: number;
  };
}

export interface TranscriptChunk {
  id: string;
  call_id: string;
  speaker: 'agent' | 'contact' | 'unknown';
  content: string;
  timestamp_ms: number;
  duration_ms: number;
  confidence: number;
}

// ============================================================================
// Transcribe from Recording URL
// ============================================================================

/**
 * Transcribe a call recording from URL via Deepgram REST API.
 * Uses diarization to separate speakers (agent vs contact).
 * Stores transcript chunks in callpilot.transcript_chunks.
 */
export async function transcribeRecording(callId: string, recordingUrl: string): Promise<TranscriptChunk[]> {
  const apiKey = getDeepgramKey();

  console.log(`[Transcription] Starting transcription for call ${callId}`);

  // Deepgram needs authenticated access to Twilio recordings
  // Add Twilio auth to the recording URL
  const authenticatedUrl = addTwilioAuth(recordingUrl);

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 120_000); // 2 min for long calls

  try {
    const response = await fetch(`${DEEPGRAM_API_URL}?${new URLSearchParams({
      model: 'nova-2',
      language: 'en-US',
      smart_format: 'true',
      diarize: 'true',
      utterances: 'true',
      punctuate: 'true',
    })}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: authenticatedUrl }),
      signal: abortController.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Deepgram ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = (await response.json()) as DeepgramResponse;

    // Parse utterances into transcript chunks
    const utterances = data.results?.utterances || [];
    const chunks: TranscriptChunk[] = [];

    for (const utterance of utterances) {
      // Speaker 0 = first speaker (usually caller/agent), Speaker 1 = second (contact)
      const speaker = utterance.speaker === 0 ? 'agent' : utterance.speaker === 1 ? 'contact' : 'unknown';

      const saved = await cpInsert<{ id: string }>('transcript_chunks', {
        call_id: callId,
        speaker,
        content: utterance.transcript,
        timestamp_ms: Math.round(utterance.start * 1000),
        duration_ms: Math.round((utterance.end - utterance.start) * 1000),
        confidence: utterance.confidence,
      });

      chunks.push({
        id: saved.id,
        call_id: callId,
        speaker: speaker as 'agent' | 'contact' | 'unknown',
        content: utterance.transcript,
        timestamp_ms: Math.round(utterance.start * 1000),
        duration_ms: Math.round((utterance.end - utterance.start) * 1000),
        confidence: utterance.confidence,
      });
    }

    // If no utterances but there's a full transcript, store as single chunk
    if (chunks.length === 0 && data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      const alt = data.results.channels[0].alternatives[0];
      const saved = await cpInsert<{ id: string }>('transcript_chunks', {
        call_id: callId,
        speaker: 'unknown',
        content: alt.transcript,
        timestamp_ms: 0,
        duration_ms: (data.metadata?.duration || 0) * 1000,
        confidence: alt.confidence || 0,
      });

      chunks.push({
        id: saved.id,
        call_id: callId,
        speaker: 'unknown',
        content: alt.transcript || '',
        timestamp_ms: 0,
        duration_ms: (data.metadata?.duration || 0) * 1000,
        confidence: alt.confidence || 0,
      });
    }

    console.log(`[Transcription] Stored ${chunks.length} chunks for call ${callId}`);

    // Update call record with transcription status
    await cpUpdate('calls', callId, {
      transcription_status: 'completed',
      transcript_chunk_count: chunks.length,
    });

    return chunks;
  } catch (error) {
    clearTimeout(timeout);
    console.error(`[Transcription] Failed for call ${callId}:`, error);

    await cpUpdate('calls', callId, {
      transcription_status: 'failed',
    }).catch(() => {}); // Don't throw on update failure

    throw error;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Add Twilio Basic Auth to a recording URL so Deepgram can fetch it.
 */
function addTwilioAuth(url: string): string {
  if (!config.twilioAccountSid || !config.twilioAuthToken) return url;

  try {
    const parsed = new URL(url);
    parsed.username = config.twilioAccountSid;
    parsed.password = config.twilioAuthToken;
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Get the full transcript text for a call (for post-call summary).
 */
export async function getCallTranscript(callId: string): Promise<string> {
  const chunks = await cpQuery<{ speaker: string; content: string; timestamp_ms: number }>(
    'transcript_chunks',
    `call_id=eq.${callId}&select=speaker,content,timestamp_ms&order=timestamp_ms.asc`
  );

  if (chunks.length === 0) return '';

  return chunks
    .map((c) => `[${c.speaker.toUpperCase()}]: ${c.content}`)
    .join('\n');
}
