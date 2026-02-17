// CallPilot — Call Session Manager
// Manages active call sessions: coaching card generation at intervals,
// transcription triggering, and post-call processing

import { cpQuery, cpUpdate } from './db.js';
import { generateCoachingCard, generatePostCallSummary } from './engines.js';
import { transcribeRecording, getCallTranscript } from './transcription.js';
import { clawInsert } from '../claw/db.js';

// ============================================================================
// Active Session Tracking
// ============================================================================

interface ActiveSession {
  callId: string;
  userId: string;
  startedAt: number;
  coachingInterval: ReturnType<typeof setInterval> | null;
  lastCoachingAt: number;
  phase: string;
}

const activeSessions = new Map<string, ActiveSession>();

// ============================================================================
// Start Session
// ============================================================================

/**
 * Start tracking an active call session.
 * Begins coaching card generation every 25 seconds.
 */
export function startCallSession(callId: string, userId: string): void {
  // Clean up if session already exists
  stopCallSession(callId);

  const session: ActiveSession = {
    callId,
    userId,
    startedAt: Date.now(),
    coachingInterval: null,
    lastCoachingAt: 0,
    phase: 'opening',
  };

  // Generate coaching cards every 25 seconds
  session.coachingInterval = setInterval(async () => {
    try {
      const elapsed = Math.round((Date.now() - session.startedAt) / 1000);
      session.phase = getCallPhase(elapsed);

      // Get recent transcript for context
      const recentTranscript = await getRecentTranscript(callId);

      const card = await generateCoachingCard(userId, callId, {
        elapsed_seconds: elapsed,
        phase: session.phase,
        recent_transcript: recentTranscript,
        call_context: { session_duration: elapsed },
      });

      if (card) {
        session.lastCoachingAt = Date.now();
        console.log(`[Session] Coaching card generated for call ${callId}: ${(card as any).card_type}`);
      }
    } catch (error) {
      console.error(`[Session] Coaching error for call ${callId}:`, error);
    }
  }, 25_000);

  activeSessions.set(callId, session);
  console.log(`[Session] Started for call ${callId}`);
}

// ============================================================================
// Stop Session
// ============================================================================

/**
 * Stop tracking a call session and clean up resources.
 */
export function stopCallSession(callId: string): void {
  const session = activeSessions.get(callId);
  if (!session) return;

  if (session.coachingInterval) {
    clearInterval(session.coachingInterval);
  }

  activeSessions.delete(callId);
  console.log(`[Session] Stopped for call ${callId}`);
}

// ============================================================================
// End Call: Transcription + Summary + Claw Integration
// ============================================================================

/**
 * Full post-call processing pipeline:
 * 1. Stop coaching session
 * 2. Transcribe recording (if available)
 * 3. Generate post-call summary
 * 4. Create Claw task for integration
 */
export async function endCallSession(callId: string, userId: string): Promise<{
  summary: Record<string, unknown>;
  action_items: Record<string, unknown>[];
  transcript_chunks: number;
}> {
  // 1. Stop coaching
  stopCallSession(callId);

  // 2. Check for recording and transcribe
  let transcriptChunks = 0;
  const calls = await cpQuery<{ recording_url: string | null }>(
    'calls',
    `id=eq.${callId}&select=recording_url&limit=1`
  );

  if (calls[0]?.recording_url) {
    try {
      const chunks = await transcribeRecording(callId, calls[0].recording_url);
      transcriptChunks = chunks.length;
    } catch (error) {
      console.error(`[Session] Transcription failed for ${callId}, continuing with summary:`, error);
    }
  }

  // 3. Generate post-call summary (works with or without transcript)
  const result = await generatePostCallSummary(userId, callId);

  // 4. Create Claw task for integration loop (B7)
  try {
    await createClawTask(callId, userId, result.summary);
  } catch (error) {
    console.error(`[Session] Failed to create Claw task for call ${callId}:`, error);
  }

  return {
    ...result,
    transcript_chunks: transcriptChunks,
  };
}

// ============================================================================
// Claw Integration (B7)
// ============================================================================

/**
 * After a call ends, create a task in claw.tasks so The Claw
 * can include it in briefings and follow-up nudges.
 */
async function createClawTask(
  callId: string,
  userId: string,
  summary: Record<string, unknown>
): Promise<void> {
  const actionCount = Array.isArray(summary.action_items) ? summary.action_items.length : 0;
  const sentiment = (summary.sentiment as string) || 'neutral';
  const leadTemp = (summary.lead_temperature as string) || 'unknown';

  await clawInsert('tasks', {
    user_id: userId,
    type: 'call_completed',
    title: `Call completed — ${sentiment} sentiment, ${leadTemp} lead`,
    description: `Post-call summary generated with ${actionCount} action items. ${summary.closing_recommendation || ''}`.trim(),
    status: 'completed',
    metadata: {
      call_id: callId,
      sentiment,
      lead_temperature: leadTemp,
      action_item_count: actionCount,
    },
  });

  console.log(`[Session] Created Claw task for completed call ${callId}`);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determine call phase based on elapsed seconds.
 */
function getCallPhase(elapsed: number): string {
  if (elapsed < 60) return 'opening';
  if (elapsed < 180) return 'rapport';
  if (elapsed < 360) return 'discovery';
  if (elapsed < 600) return 'negotiation';
  return 'closing';
}

/**
 * Get recent transcript text for coaching context.
 */
async function getRecentTranscript(callId: string): Promise<string> {
  try {
    const chunks = await cpQuery<{ speaker: string; content: string }>(
      'transcript_chunks',
      `call_id=eq.${callId}&select=speaker,content&order=timestamp_ms.desc&limit=5`
    );
    if (chunks.length === 0) return '';

    return chunks
      .reverse()
      .map((c) => `[${c.speaker.toUpperCase()}]: ${c.content}`)
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * Get active session info (for API responses).
 */
export function getSessionInfo(callId: string): {
  active: boolean;
  elapsed_seconds: number;
  phase: string;
  coaching_count: number;
} | null {
  const session = activeSessions.get(callId);
  if (!session) return null;

  return {
    active: true,
    elapsed_seconds: Math.round((Date.now() - session.startedAt) / 1000),
    phase: session.phase,
    coaching_count: 0, // Will be populated from DB if needed
  };
}
