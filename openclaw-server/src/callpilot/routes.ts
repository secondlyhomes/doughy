// CallPilot — API Routes
// Express router for /api/calls: history, pre-call, active call, post-call

import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { cpQuery, cpInsert, cpUpdate } from './db.js';
import { generatePreCallBriefing, generateCoachingCard, generatePostCallSummary } from './engines.js';

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
    if (!config.supabaseAnonKey) {
      res.status(500).json({ error: 'Server misconfiguration' });
      return;
    }

    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabaseAnonKey,
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
  } catch {
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

    const result = await generatePostCallSummary(userId, callId);
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
    const callId = param(req, 'id');
    const sinceMs = parseInt(req.query.since_ms as string) || 0;

    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
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
    res.status(500).json({ error: 'Failed to dismiss card' });
  }
});

// ============================================================================
// GET /api/calls/:id/summary — Get post-call summary
// ============================================================================

router.get('/:id/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const callId = param(req, 'id');
    if (!UUID_RE.test(callId)) {
      return res.status(400).json({ error: 'Invalid call ID' });
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
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

export default router;
