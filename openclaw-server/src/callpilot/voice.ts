// CallPilot — Twilio Voice Integration
// Outbound calls via Twilio REST API + status/recording webhooks

import { config } from '../config.js';
import { cpQuery, cpUpdate } from './db.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VoiceCallResult {
  success: boolean;
  twilioCallSid?: string;
  error?: string;
}

// ============================================================================
// Initiate Outbound Call
// ============================================================================

/**
 * Start an outbound voice call via Twilio REST API.
 * The call connects to the user's phone, then bridges to the lead's phone.
 * Status updates come via the webhook callback.
 */
export async function initiateOutboundCall(
  callId: string,
  toPhone: string,
  fromPhone?: string
): Promise<VoiceCallResult> {
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    return { success: false, error: 'Missing Twilio credentials' };
  }

  const from = fromPhone || config.twilioPhoneNumber;
  if (!from) {
    return { success: false, error: 'No From number configured' };
  }

  // Clean phone number — ensure E.164 format
  const cleanTo = toPhone.replace(/[^+\d]/g, '');
  if (!cleanTo || cleanTo.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  const statusCallback = `${config.serverUrl}/webhooks/voice/status`;
  const recordingCallback = `${config.serverUrl}/webhooks/voice/recording`;

  // TwiML that plays a brief connecting message, then records the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call. This call may be recorded for coaching purposes.</Say>
  <Dial record="record-from-answer-dual" recordingStatusCallback="${recordingCallback}" recordingStatusCallbackMethod="POST">
    <Number statusCallback="${statusCallback}" statusCallbackEvent="initiated ringing answered completed" statusCallbackMethod="POST">${cleanTo}</Number>
  </Dial>
</Response>`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Calls.json`;
  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 15_000);

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        // Call the USER's phone first — they answer, then TwiML dials the lead
        To: cleanTo,
        From: from,
        Twiml: twiml,
        StatusCallback: statusCallback,
        StatusCallbackEvent: 'initiated ringing answered completed',
        StatusCallbackMethod: 'POST',
        // Store callId in custom param for webhook correlation
        MachineDetection: 'Enable',
      }).toString(),
      signal: abortController.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const error = `Twilio ${response.status}: code=${result.code} message=${result.message}`;
      console.error('[Voice] Call initiation failed:', error);
      return { success: false, error };
    }

    const result = (await response.json()) as Record<string, unknown>;
    const twilioCallSid = result.sid as string;

    // Update call record with Twilio SID
    await cpUpdate('calls', callId, {
      twilio_call_sid: twilioCallSid,
      status: 'ringing',
    });

    console.log(`[Voice] Call initiated: ${twilioCallSid} for call ${callId}`);
    return { success: true, twilioCallSid };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Twilio request timed out (15s)' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// Webhook: Call Status Updates
// ============================================================================

interface TwilioStatusPayload {
  CallSid?: string;
  CallStatus?: string;
  CallDuration?: string;
  Timestamp?: string;
  AnsweredBy?: string;
}

/**
 * Maps Twilio call status events to our internal status.
 * Updates callpilot.calls record accordingly.
 */
export async function handleVoiceStatus(payload: TwilioStatusPayload): Promise<void> {
  const { CallSid, CallStatus, CallDuration } = payload;

  if (!CallSid) {
    console.warn('[Voice] Status webhook missing CallSid');
    return;
  }

  console.log(`[Voice] Status update: ${CallSid} → ${CallStatus}`);

  // Find call by Twilio SID
  const calls = await cpQuery<{ id: string; status: string }>(
    'calls',
    `twilio_call_sid=eq.${CallSid}&select=id,status&limit=1`
  );

  if (calls.length === 0) {
    console.warn(`[Voice] No call found for SID: ${CallSid}`);
    return;
  }

  const call = calls[0];
  const updates: Record<string, unknown> = {};

  switch (CallStatus) {
    case 'ringing':
      updates.status = 'ringing';
      break;
    case 'in-progress':
      updates.status = 'in_progress';
      updates.started_at = new Date().toISOString();
      break;
    case 'completed':
      updates.status = 'completed';
      updates.ended_at = new Date().toISOString();
      if (CallDuration) {
        updates.duration_seconds = parseInt(CallDuration, 10) || 0;
      }
      break;
    case 'busy':
    case 'no-answer':
    case 'canceled':
    case 'failed':
      updates.status = 'failed';
      updates.ended_at = new Date().toISOString();
      updates.failure_reason = CallStatus;
      break;
    default:
      console.log(`[Voice] Unhandled status: ${CallStatus}`);
      return;
  }

  await cpUpdate('calls', call.id, updates);
}

// ============================================================================
// Webhook: Recording Available
// ============================================================================

interface TwilioRecordingPayload {
  CallSid?: string;
  RecordingSid?: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  RecordingStatus?: string;
}

/**
 * Called by Twilio when a call recording is ready.
 * Stores the recording URL in the call record for later transcription.
 */
export async function handleVoiceRecording(payload: TwilioRecordingPayload): Promise<void> {
  const { CallSid, RecordingSid, RecordingUrl, RecordingDuration } = payload;

  if (!CallSid || !RecordingUrl) {
    console.warn('[Voice] Recording webhook missing CallSid or RecordingUrl');
    return;
  }

  console.log(`[Voice] Recording ready: ${RecordingSid} for call ${CallSid} (${RecordingDuration}s)`);

  // Find call by Twilio SID
  const calls = await cpQuery<{ id: string }>(
    'calls',
    `twilio_call_sid=eq.${CallSid}&select=id&limit=1`
  );

  if (calls.length === 0) {
    console.warn(`[Voice] No call found for recording SID: ${CallSid}`);
    return;
  }

  // Twilio recording URLs require auth to access — store the authenticated URL
  const authenticatedUrl = `${RecordingUrl}.mp3`;

  await cpUpdate('calls', calls[0].id, {
    recording_url: authenticatedUrl,
    recording_sid: RecordingSid,
    recording_duration_seconds: parseInt(RecordingDuration || '0', 10),
  });
}

// ============================================================================
// Express route handlers (to be mounted in server.ts)
// ============================================================================

import { Request, Response, Router } from 'express';

export const voiceWebhookRouter = Router();

// POST /webhooks/voice/status — Twilio call status callback
voiceWebhookRouter.post('/status', async (req: Request, res: Response) => {
  try {
    await handleVoiceStatus(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('[Voice] Status webhook error:', error);
    res.sendStatus(500);
  }
});

// POST /webhooks/voice/recording — Twilio recording callback
voiceWebhookRouter.post('/recording', async (req: Request, res: Response) => {
  try {
    await handleVoiceRecording(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('[Voice] Recording webhook error:', error);
    res.sendStatus(500);
  }
});
