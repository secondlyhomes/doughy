// CallPilot — API Routes
// Express router for /api/calls: history, pre-call, active call, post-call, voice, session

import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { cpQuery, cpInsert, cpUpdate } from './db.js';
import { schemaQuery, schemaUpdate, clawInsert } from '../claw/db.js';
import { broadcastMessage } from '../claw/broadcast.js';
import { generatePreCallBriefing, generateCoachingCard, generatePostCallSummary } from './engines.js';
import { initiateOutboundCall } from './voice.js';
import { startCallSession, stopCallSession, endCallSession, getSessionInfo } from './session.js';
import { transcribeRecording, getCallTranscript } from './transcription.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Extract a route param as string (Express types allow string | string[]) */
function param(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

// ============================================================================
// Auth Middleware (same pattern as claw routes)
// ============================================================================

async function requireAuth(req: Request, res: Response, next: () => void): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    if (!config.supabasePublishableKey) {
      res.status(500).json({ error: 'Server misconfiguration' });
      return;
    }

    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const user = (await response.json()) as { id: string };
    if (!user.id || !UUID_RE.test(user.id)) {
      res.status(401).json({ error: 'Invalid user identity' });
      return;
    }

    (req as any).userId = user.id;
    next();
  } catch (err) {
    console.error('[CallPilot] Auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// ============================================================================
// GET /api/calls — Call history
// ============================================================================

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limitParam = parseInt(req.query.limit as string);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;

    const calls = await cpQuery('calls', `user_id=eq.${userId}&deleted_at=is.null&select=*&order=created_at.desc&limit=${String(limit)}`);
    res.json({ calls });
  } catch (error) {
    console.error('[CallPilot] List calls error:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// ============================================================================
// POST /api/calls/pre-call — Generate pre-call briefing + create call record
// ============================================================================

router.post('/pre-call', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { contact_id, lead_id, deal_id, phone_number, script_template_id } = req.body;

    // Create call record
    const call = await cpInsert<{ id: string }>('calls', {
      user_id: userId,
      lead_id: lead_id || null,
      contact_id: contact_id || null,
      deal_id: deal_id || null,
      direction: 'outbound',
      phone_number: phone_number || '',
      script_template_id: script_template_id || null,
      status: 'initiated',
    });

    // Generate briefing
    const briefing = await generatePreCallBriefing(userId, {
      call_id: call.id,
      lead_id,
      contact_id,
      deal_id,
    });

    res.json({ call, briefing });
  } catch (error) {
    console.error('[CallPilot] Pre-call error:', error);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

// ============================================================================
// GET /api/calls/history/:leadId — Call history for a specific lead
// (registered BEFORE /:id routes to avoid Express param matching conflicts)
// ============================================================================

router.get('/history/:leadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const leadId = param(req, 'leadId');
    if (!UUID_RE.test(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }

    const calls = await cpQuery(
      'calls',
      `user_id=eq.${userId}&lead_id=eq.${leadId}&deleted_at=is.null&select=*&order=created_at.desc&limit=50`
    );

    // Also fetch summaries for completed calls
    const callIds = (calls as any[]).map((c: any) => c.id);
    let summaries: any[] = [];
    if (callIds.length > 0) {
      summaries = await cpQuery(
        'call_summaries',
        `call_id=in.(${callIds.join(',')})&select=call_id,summary,key_points,sentiment,next_steps`
      );
    }

    res.json({ calls, summaries });
  } catch (error) {
    console.error('[CallPilot] Call history error:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// ============================================================================
// GET /api/calls/messages/:leadId — Message history for a lead (from crm.messages)
// ============================================================================

router.get('/messages/:leadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const leadId = param(req, 'leadId');
    if (!UUID_RE.test(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }

    const limitParam = parseInt(req.query.limit as string);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    const messages = await schemaQuery(
      'crm',
      'messages',
      `user_id=eq.${userId}&lead_id=eq.${leadId}&select=*&order=created_at.desc&limit=${limit}`
    );

    res.json({ messages });
  } catch (error) {
    console.error('[CallPilot] Message history error:', error);
    res.status(500).json({ error: 'Failed to fetch message history' });
  }
});

// ============================================================================
// POST /api/calls/:id/start — Mark call as in-progress
// ============================================================================

router.post('/:id/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership
    const calls = await cpQuery('calls', `id=eq.${callId}&user_id=eq.${userId}&limit=1`);
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    await cpUpdate('calls', callId, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    // Start coaching session for manual calls (non-Twilio)
    startCallSession(callId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('[CallPilot] Start call error:', error);
    res.status(500).json({ error: 'Failed to start call' });
  }
});

// ============================================================================
// POST /api/calls/:id/end — End call + generate summary
// ============================================================================

router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Full post-call pipeline: stop coaching, transcribe, summarize, create Claw task
    const result = await endCallSession(callId, userId);
    res.json(result);
  } catch (error) {
    console.error('[CallPilot] End call error:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// ============================================================================
// GET /api/calls/:id/coaching — Get coaching cards for a call
// ============================================================================

router.get('/:id/coaching', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    const sinceMs = parseInt(req.query.since_ms as string) || 0;

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership
    const calls = await cpQuery('calls', `id=eq.${callId}&user_id=eq.${userId}&select=id&limit=1`);
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    let params = `call_id=eq.${callId}&select=*&order=created_at.asc`;
    if (sinceMs > 0) {
      params += `&timestamp_ms=gt.${sinceMs}`;
    }

    const cards = await cpQuery('coaching_cards', params);
    res.json({ cards });
  } catch (error) {
    console.error('[CallPilot] Get coaching cards error:', error);
    res.status(500).json({ error: 'Failed to fetch coaching cards' });
  }
});

// ============================================================================
// POST /api/calls/:id/coaching — Generate a new coaching card
// ============================================================================

router.post('/:id/coaching', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    const { elapsed_seconds, phase, call_context } = req.body;

    const card = await generateCoachingCard(userId, callId, {
      elapsed_seconds: elapsed_seconds || 0,
      phase: phase || 'opening',
      call_context,
    });

    res.json({ card }); // null if no card needed
  } catch (error) {
    console.error('[CallPilot] Generate coaching card error:', error);
    res.status(500).json({ error: 'Failed to generate coaching card' });
  }
});

// ============================================================================
// POST /api/calls/:id/coaching/:cardId/dismiss — Dismiss a coaching card
// ============================================================================

router.post('/:id/coaching/:cardId/dismiss', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    const cardId = param(req, 'cardId');
    if (!UUID_RE.test(callId) || !UUID_RE.test(cardId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Verify call ownership
    const calls = await cpQuery('calls', `id=eq.${callId}&user_id=eq.${userId}&limit=1`);
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    await cpUpdate('coaching_cards', cardId, { was_dismissed: true });
    res.json({ success: true });
  } catch (error) {
    console.error('[CallPilot] Dismiss card error:', error);
    res.status(500).json({ error: 'Failed to dismiss card' });
  }
});

// ============================================================================
// GET /api/calls/:id/summary — Get post-call summary
// ============================================================================

router.get('/:id/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership
    const calls = await cpQuery('calls', `id=eq.${callId}&user_id=eq.${userId}&select=id&limit=1`);
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const [summaries, items] = await Promise.all([
      cpQuery('call_summaries', `call_id=eq.${callId}&limit=1`),
      cpQuery('action_items', `call_id=eq.${callId}&deleted_at=is.null&order=created_at.asc`),
    ]);

    res.json({
      summary: summaries[0] || null,
      action_items: items,
    });
  } catch (error) {
    console.error('[CallPilot] Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// ============================================================================
// POST /api/calls/:id/actions/:actionId/approve — Approve action item
// ============================================================================

router.post('/:id/actions/:actionId/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    const actionId = param(req, 'actionId');
    if (!UUID_RE.test(callId) || !UUID_RE.test(actionId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Verify call ownership
    const calls = await cpQuery('calls', `id=eq.${callId}&user_id=eq.${userId}&limit=1`);
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    await cpUpdate('action_items', actionId, {
      status: 'approved',
      approved_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error('[CallPilot] Approve action error:', error);
    res.status(500).json({ error: 'Failed to approve action' });
  }
});

// ============================================================================
// POST /api/calls/:id/actions/:actionId/dismiss — Dismiss action item
// ============================================================================

router.post('/:id/actions/:actionId/dismiss', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    const actionId = param(req, 'actionId');
    if (!UUID_RE.test(callId) || !UUID_RE.test(actionId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Verify call ownership
    const calls = await cpQuery('calls', `id=eq.${callId}&user_id=eq.${userId}&limit=1`);
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    await cpUpdate('action_items', actionId, { status: 'dismissed' });
    res.json({ success: true });
  } catch (error) {
    console.error('[CallPilot] Dismiss action error:', error);
    res.status(500).json({ error: 'Failed to dismiss action' });
  }
});

// ============================================================================
// GET /api/calls/templates — List script templates
// ============================================================================

router.get('/templates', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const templates = await cpQuery('script_templates', `user_id=eq.${userId}&deleted_at=is.null&select=id,name,description,category,opening_script,starter_questions,required_questions,is_default&order=is_default.desc,name.asc`);
    res.json({ templates });
  } catch (error) {
    console.error('[CallPilot] Fetch templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ============================================================================
// POST /api/calls/:id/connect — Initiate outbound voice call via Twilio
// ============================================================================

router.post('/:id/connect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership and get phone number
    const calls = await cpQuery<{ id: string; phone_number: string; status: string }>(
      'calls',
      `id=eq.${callId}&user_id=eq.${userId}&select=id,phone_number,status&limit=1`
    );
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const call = calls[0];
    if (call.status !== 'initiated') {
      return res.status(400).json({ error: `Cannot connect call in "${call.status}" status` });
    }

    const phoneNumber = req.body.phone_number || call.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'No phone number available' });
    }

    const result = await initiateOutboundCall(callId, phoneNumber);

    if (!result.success) {
      return res.status(502).json({ error: result.error });
    }

    // Start coaching session
    startCallSession(callId, userId);

    res.json({ success: true, twilio_call_sid: result.twilioCallSid });
  } catch (error) {
    console.error('[CallPilot] Connect call error:', error);
    res.status(500).json({ error: 'Failed to connect call' });
  }
});

// ============================================================================
// GET /api/calls/:id/session — Get active session info
// ============================================================================

router.get('/:id/session', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership
    const calls = await cpQuery<{ id: string }>('calls', `id=eq.${callId}&user_id=eq.${userId}&select=id&limit=1`);
    if (calls.length === 0) return res.status(404).json({ error: 'Call not found' });

    const info = getSessionInfo(callId);
    res.json({ session: info });
  } catch (error) {
    console.error('[CallPilot] Get session error:', error);
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

// ============================================================================
// GET /api/calls/:id/transcript — Get call transcript
// ============================================================================

router.get('/:id/transcript', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership
    const calls = await cpQuery<{ id: string }>('calls', `id=eq.${callId}&user_id=eq.${userId}&select=id&limit=1`);
    if (calls.length === 0) return res.status(404).json({ error: 'Call not found' });

    const chunks = await cpQuery(
      'transcript_chunks',
      `call_id=eq.${callId}&select=id,speaker,content,timestamp_ms,duration_ms,confidence&order=timestamp_ms.asc`
    );
    const fullText = await getCallTranscript(callId);

    res.json({ chunks, full_text: fullText });
  } catch (error) {
    console.error('[CallPilot] Get transcript error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

// ============================================================================
// POST /api/calls/:id/transcribe — Trigger transcription for a completed call
// ============================================================================

router.post('/:id/transcribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership and get recording URL
    const calls = await cpQuery<{ id: string; recording_url: string | null }>(
      'calls',
      `id=eq.${callId}&user_id=eq.${userId}&select=id,recording_url&limit=1`
    );
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (!calls[0].recording_url) {
      return res.status(400).json({ error: 'No recording available for this call' });
    }

    const chunks = await transcribeRecording(callId, calls[0].recording_url);
    res.json({ success: true, chunk_count: chunks.length });
  } catch (error) {
    console.error('[CallPilot] Transcribe error:', error);
    res.status(500).json({ error: 'Failed to transcribe recording' });
  }
});

// ============================================================================
// POST /api/calls/:id/approve-all — Batch approve action items + suggested CRM updates
// ============================================================================

router.post('/:id/approve-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify call ownership
    const calls = await cpQuery<{ id: string; lead_id: string | null }>(
      'calls',
      `id=eq.${callId}&user_id=eq.${userId}&select=id,lead_id&limit=1`
    );
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const { approved_action_items = [], approved_updates = [] } = req.body;

    // Validate all IDs are UUIDs
    const allIds = [...approved_action_items, ...approved_updates];
    if (allIds.some((id: string) => !UUID_RE.test(id))) {
      return res.status(400).json({ error: 'Invalid ID in approval list' });
    }

    const now = new Date().toISOString();
    let actionCount = 0;
    let updateCount = 0;
    const errors: string[] = [];

    // 1. Approve action items
    for (const actionId of approved_action_items) {
      try {
        await cpUpdate('action_items', actionId, {
          status: 'approved',
          approved_at: now,
        });
        actionCount++;
      } catch (err) {
        errors.push(`action_item ${actionId}: ${(err as Error).message}`);
      }
    }

    // 2. Approve and apply suggested CRM updates
    for (const updateId of approved_updates) {
      try {
        // Fetch the suggested update to get target info
        const updates = await cpQuery<{
          id: string;
          target_table: string;
          target_record_id: string;
          field_name: string;
          suggested_value: string;
          status: string;
        }>(
          'suggested_updates',
          `id=eq.${updateId}&call_id=eq.${callId}&deleted_at=is.null&limit=1`
        );

        if (updates.length === 0) {
          errors.push(`suggested_update ${updateId}: not found`);
          continue;
        }

        const update = updates[0];
        if (update.status !== 'pending') {
          errors.push(`suggested_update ${updateId}: already ${update.status}`);
          continue;
        }

        // Parse target_table into schema.table
        const [targetSchema, targetTable] = update.target_table.includes('.')
          ? update.target_table.split('.')
          : ['public', update.target_table];

        // Apply the update to the target record
        await schemaUpdate(
          targetSchema,
          targetTable,
          update.target_record_id,
          { [update.field_name]: update.suggested_value }
        );

        // Mark as approved
        await cpUpdate('suggested_updates', updateId, {
          status: 'approved',
          approved_at: now,
        });

        updateCount++;
      } catch (err) {
        errors.push(`suggested_update ${updateId}: ${(err as Error).message}`);
      }
    }

    // 3. Log activity to cost_log
    try {
      await clawInsert('cost_log', {
        user_id: userId,
        service: 'callpilot',
        action: 'approve_all',
        input_tokens: 0,
        output_tokens: 0,
        duration_seconds: 0,
        cost_cents: 0,
        metadata: {
          call_id: callId,
          action_items_approved: actionCount,
          updates_applied: updateCount,
          errors: errors.length,
        },
      });
    } catch (err) {
      console.error('[CallPilot] Failed to log cost:', err);
    }

    // 4. Broadcast notification
    if (actionCount + updateCount > 0) {
      try {
        await broadcastMessage(userId, {
          content: `Call summary approved: ${actionCount} action items, ${updateCount} CRM updates applied.`,
        });
      } catch (err) {
        console.error('[CallPilot] Broadcast failed:', err);
      }
    }

    res.json({
      success: true,
      action_items_approved: actionCount,
      updates_applied: updateCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[CallPilot] Approve-all error:', error);
    res.status(500).json({ error: 'Failed to process approvals' });
  }
});

// ============================================================================
// GET /api/calls/:id/suggested-updates — Get suggested CRM updates for a call
// ============================================================================

router.get('/:id/suggested-updates', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');
    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify ownership
    const calls = await cpQuery<{ id: string }>('calls', `id=eq.${callId}&user_id=eq.${userId}&select=id&limit=1`);
    if (calls.length === 0) return res.status(404).json({ error: 'Call not found' });

    const updates = await cpQuery(
      'suggested_updates',
      `call_id=eq.${callId}&deleted_at=is.null&order=created_at.asc`
    );

    res.json({ suggested_updates: updates });
  } catch (error) {
    console.error('[CallPilot] Get suggested updates error:', error);
    res.status(500).json({ error: 'Failed to fetch suggested updates' });
  }
});

// ============================================================================
// POST /api/calls/:id/push-extractions — Push transcript extractions to Doughy via The Claw
// Creates claw.transcript_extractions record for human review in Doughy
// ============================================================================

router.post('/:id/push-extractions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const callId = param(req, 'id');

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
    }

    // Verify call ownership
    const calls = await cpQuery<{ id: string; lead_id: string | null; deal_id: string | null }>(
      'calls',
      `id=eq.${callId}&user_id=eq.${userId}&select=id,lead_id,deal_id&limit=1`
    );
    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const call = calls[0];
    const { extractions, lead_id, property_id, deal_id } = req.body;

    if (!extractions || !Array.isArray(extractions)) {
      return res.status(400).json({ error: 'extractions must be an array' });
    }

    // Validate optional IDs
    if (lead_id && !UUID_RE.test(lead_id)) {
      return res.status(400).json({ error: 'Invalid lead_id' });
    }
    if (property_id && !UUID_RE.test(property_id)) {
      return res.status(400).json({ error: 'Invalid property_id' });
    }
    if (deal_id && !UUID_RE.test(deal_id)) {
      return res.status(400).json({ error: 'Invalid deal_id' });
    }

    // Insert into claw.transcript_extractions
    const extraction = await clawInsert<{ id: string }>('transcript_extractions', {
      user_id: userId,
      call_id: callId,
      lead_id: lead_id || call.lead_id || null,
      property_id: property_id || null,
      deal_id: deal_id || call.deal_id || null,
      extractions,
      status: 'pending_review',
    });

    // Broadcast notification
    try {
      await broadcastMessage(userId, {
        content: `New call extractions ready for review (${extractions.length} fields). Open Doughy to approve.`,
      });
    } catch (err) {
      console.error('[CallPilot] Broadcast failed:', err);
    }

    res.json({
      success: true,
      extraction_id: extraction.id,
      fields_count: extractions.length,
    });
  } catch (error) {
    console.error('[CallPilot] Push extractions error:', error);
    res.status(500).json({ error: 'Failed to push extractions' });
  }
});

// ============================================================================
// Bland AI Endpoints (stubs — gracefully skip if BLAND_API_KEY not configured)
// ============================================================================

router.post('/bland/call', requireAuth, async (req: Request, res: Response) => {
  if (!config.blandApiKey) {
    return res.status(501).json({
      error: 'Bland AI not configured',
      message: 'Add BLAND_API_KEY to enable AI calling',
    });
  }

  try {
    const userId = (req as any).userId;
    const { lead_id, call_type, objective } = req.body;

    if (!lead_id || !UUID_RE.test(lead_id)) {
      return res.status(400).json({ error: 'Invalid lead_id' });
    }

    // TODO: Implement Bland API call when key is configured
    // 1. Load lead data
    // 2. Check daily limits via enforceAction()
    // 3. Call Bland API with lead context
    // 4. Return Bland call_id

    res.status(501).json({
      error: 'Bland AI call initiation not yet implemented',
      message: 'API key is configured but call logic is pending',
    });
  } catch (error) {
    console.error('[CallPilot] Bland call error:', error);
    res.status(500).json({ error: 'Failed to initiate Bland call' });
  }
});

router.post('/bland/webhook', async (req: Request, res: Response) => {
  // Bland calls this endpoint after every AI call completes
  // No auth required — Bland sends the webhook directly
  try {
    const {
      call_id: blandCallId,
      transcript,
      summary,
      duration,
      status,
      recording_url,
      from,
      to,
    } = req.body;

    console.log(`[Bland] Webhook received: call=${blandCallId} status=${status} duration=${duration}`);

    if (!blandCallId) {
      return res.status(400).json({ error: 'Missing call_id' });
    }

    // TODO: When Bland is fully configured:
    // 1. Match to lead via phone number
    // 2. Create callpilot.calls record (caller_type='ai_bland')
    // 3. Generate enriched summary via Sonnet
    // 4. Log cost to cost_log
    // 5. Broadcast result to user via Discord + push notification
    // 6. Create draft follow-up suggestion

    res.json({ received: true });
  } catch (error) {
    console.error('[Bland] Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/bland/missed', requireAuth, async (req: Request, res: Response) => {
  if (!config.blandApiKey) {
    return res.status(501).json({
      error: 'Bland AI not configured',
      message: 'Add BLAND_API_KEY to enable AI calling',
    });
  }

  try {
    const userId = (req as any).userId;
    const { from_number } = req.body;

    // TODO: When Bland is configured:
    // 1. Check trust config for auto-answer setting
    // 2. If enabled: trigger Bland callback
    // 3. If disabled: notify user "Missed call from X, want Bland to call back?"

    res.status(501).json({
      error: 'Missed call handling not yet implemented',
      message: 'Bland AI auto-callback is pending implementation',
    });
  } catch (error) {
    console.error('[CallPilot] Bland missed call error:', error);
    res.status(500).json({ error: 'Failed to handle missed call' });
  }
});

export default router;
