// The Claw — Voice Notes Processing
// Middleware that intercepts WhatsApp audio messages, transcribes via Deepgram,
// and feeds the transcribed text into the message pipeline.
// Silently skips if DEEPGRAM_API_KEY is not configured.

import { config } from '../config.js';
import { logCost } from './costs.js';

/**
 * Check if an incoming Twilio message contains audio media.
 */
export function hasAudioMedia(reqBody: Record<string, string>): boolean {
  const numMedia = parseInt(reqBody.NumMedia || '0', 10);
  if (numMedia === 0) return false;

  // Check media content types for audio
  for (let i = 0; i < numMedia; i++) {
    const contentType = reqBody[`MediaContentType${i}`] || '';
    if (contentType.startsWith('audio/')) return true;
  }
  return false;
}

/**
 * Download audio from Twilio media URL (requires authentication).
 */
async function downloadTwilioMedia(mediaUrl: string): Promise<ArrayBuffer | null> {
  if (!config.twilioAccountSid || !config.twilioAuthToken) return null;

  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

  try {
    const response = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[VoiceNotes] Failed to download media: ${response.status}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    console.error('[VoiceNotes] Download error:', err);
    return null;
  }
}

/**
 * Transcribe audio via Deepgram Nova-2.
 * Returns the transcription text and confidence score.
 */
async function transcribeWithDeepgram(
  audioBuffer: ArrayBuffer,
  contentType: string
): Promise<{ text: string; confidence: number } | null> {
  if (!config.deepgramApiKey) return null;

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.deepgramApiKey}`,
        'Content-Type': contentType,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[VoiceNotes] Deepgram error: ${response.status} ${errText}`);
      return null;
    }

    const result = await response.json() as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{
            transcript?: string;
            confidence?: number;
          }>;
        }>;
      };
      metadata?: {
        duration?: number;
      };
    };

    const alternative = result.results?.channels?.[0]?.alternatives?.[0];
    if (!alternative?.transcript) return null;

    return {
      text: alternative.transcript,
      confidence: alternative.confidence || 0,
    };
  } catch (err) {
    console.error('[VoiceNotes] Transcription error:', err);
    return null;
  }
}

/**
 * Process a voice note from an incoming message.
 * Returns the transcribed text, or null if processing failed/skipped.
 */
export async function processVoiceNote(
  reqBody: Record<string, string>,
  userId?: string
): Promise<{ text: string; prefix: string } | null> {
  // Skip if Deepgram is not configured
  if (!config.deepgramApiKey) return null;

  // Find the first audio media
  const numMedia = parseInt(reqBody.NumMedia || '0', 10);
  let mediaUrl: string | null = null;
  let contentType: string = 'audio/ogg';

  for (let i = 0; i < numMedia; i++) {
    const ct = reqBody[`MediaContentType${i}`] || '';
    if (ct.startsWith('audio/')) {
      mediaUrl = reqBody[`MediaUrl${i}`] || null;
      contentType = ct;
      break;
    }
  }

  if (!mediaUrl) return null;

  console.log(`[VoiceNotes] Processing audio: ${contentType} from ${mediaUrl}`);

  // Download audio
  const audioBuffer = await downloadTwilioMedia(mediaUrl);
  if (!audioBuffer) return null;

  // Transcribe
  const result = await transcribeWithDeepgram(audioBuffer, contentType);
  if (!result) return null;

  // Log Deepgram cost (estimate ~$0.0043/min for Nova-2)
  // Audio length is unknown at this point, estimate 30s average
  if (userId) {
    logCost(userId, 'deepgram', 'voice_note_transcription', 1, {
      confidence: result.confidence,
    }).catch(() => {});
  }

  // Check confidence
  if (result.confidence < 0.7) {
    console.log(`[VoiceNotes] Low confidence (${result.confidence.toFixed(2)}), returning error`);
    return null; // Caller should handle low-confidence case
  }

  console.log(`[VoiceNotes] Transcribed (${result.confidence.toFixed(2)}): "${result.text.slice(0, 100)}"`);
  return { text: result.text, prefix: 'Heard you!' };
}
