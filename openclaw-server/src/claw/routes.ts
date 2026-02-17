// The Claw — API Routes
// Express router for /api/claw: message, briefing, tasks, approvals

import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { handleClawMessage } from './controller.js';
import { generateBriefingData, formatBriefing } from './briefing.js';
import { clawQuery, clawUpdate, clawInsert, publicInsert } from './db.js';
import { callEdgeFunction } from './edge.js';
import type { ApprovalDecision } from './types.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// Auth Middleware — verify Supabase JWT
// ============================================================================

async function requireAuth(req: Request, res: Response, next: () => void): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Verify token with Supabase auth — always use anon key, never service key
    if (!config.supabaseAnonKey) {
      console.error('[ClawAPI] SUPABASE_ANON_KEY not configured');
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

    const user = (await response.json()) as { id: string; email?: string };

    // Validate userId is a UUID — defense against injection into PostgREST queries
    if (!user.id || !UUID_RE.test(user.id)) {
      res.status(401).json({ error: 'Invalid user identity' });
      return;
    }

    (req as any).userId = user.id;
    (req as any).userEmail = user.email;
    next();
  } catch (error) {
    console.error('[ClawAPI] Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// ============================================================================
// POST /api/claw/message — Send a message to The Claw
// ============================================================================

router.post('/message', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid message' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long. Maximum 2000 characters.' });
    }

    const result = await handleClawMessage(userId, message, 'app');
    res.json(result);
  } catch (error) {
    console.error('[ClawAPI] Message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ============================================================================
// GET /api/claw/briefing — Get a fresh briefing
// ============================================================================

router.get('/briefing', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = await generateBriefingData(userId);
    const text = await formatBriefing(data, config.anthropicApiKey);

    res.json({ briefing: text, data });
  } catch (error) {
    console.error('[ClawAPI] Briefing error:', error);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

// ============================================================================
// GET /api/claw/tasks — List user's tasks
// ============================================================================

router.get('/tasks', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    let params = `user_id=eq.${userId}&select=id,type,status,title,output,error,created_at,completed_at&order=created_at.desc&limit=${limit}`;
    if (status) {
      params += `&status=eq.${encodeURIComponent(status)}`;
    }

    const tasks = await clawQuery('tasks', params);
    res.json({ tasks });
  } catch (error) {
    console.error('[ClawAPI] Tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ============================================================================
// GET /api/claw/approvals — List approvals (pending by default)
// ============================================================================

router.get('/approvals', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const status = (req.query.status as string) || 'pending';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const params = `user_id=eq.${userId}&status=eq.${encodeURIComponent(status)}&select=id,task_id,status,action_type,title,description,draft_content,recipient_name,recipient_phone,recipient_email,action_payload,expires_at,created_at,decided_at&order=created_at.desc&limit=${limit}`;

    const approvals = await clawQuery('approvals', params);
    res.json({ approvals });
  } catch (error) {
    console.error('[ClawAPI] Approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// ============================================================================
// POST /api/claw/approvals/:id/decide — Approve or reject an approval
// ============================================================================

router.post('/approvals/:id/decide', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const approvalId = req.params.id as string;
    const { action, edited_content } = req.body as ApprovalDecision;

    if (!UUID_RE.test(approvalId)) {
      return res.status(400).json({ error: 'Invalid approval ID format' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject".' });
    }

    if (edited_content && (typeof edited_content !== 'string' || edited_content.length > 2000)) {
      return res.status(400).json({ error: 'edited_content must be a string of 2000 characters or less.' });
    }

    // Verify the approval belongs to this user and is pending
    const approvals = await clawQuery<{
      id: string;
      user_id: string;
      status: string;
      task_id: string;
      action_type: string;
      draft_content: string;
      recipient_phone: string | null;
      recipient_name: string | null;
      action_payload: Record<string, unknown>;
    }>(
      'approvals',
      `id=eq.${approvalId}&user_id=eq.${userId}&status=eq.pending&limit=1`
    );

    if (approvals.length === 0) {
      return res.status(404).json({ error: 'Approval not found or already decided' });
    }

    const approval = approvals[0];
    const now = new Date().toISOString();

    if (action === 'reject') {
      await clawUpdate('approvals', approvalId, {
        status: 'rejected',
        decided_at: now,
      });
      return res.json({ success: true, status: 'rejected' });
    }

    // Approve: update the approval status
    const finalContent = edited_content || approval.draft_content;
    await clawUpdate('approvals', approvalId, {
      status: 'approved',
      draft_content: finalContent,
      decided_at: now,
    });

    // Execute the approved action
    let executed = false;
    if (approval.action_type === 'send_sms' && approval.recipient_phone) {
      executed = await executeSmsApproval(userId, approval.recipient_phone, finalContent);
    }

    // Update to executed if the action was performed
    if (executed) {
      await clawUpdate('approvals', approvalId, {
        status: 'executed',
        executed_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      status: executed ? 'executed' : 'approved',
    });
  } catch (error) {
    console.error('[ClawAPI] Decide error:', error);
    res.status(500).json({ error: 'Failed to process decision' });
  }
});

// ============================================================================
// POST /api/claw/approvals/batch — Batch approve/reject
// ============================================================================

router.post('/approvals/batch', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { decisions } = req.body as { decisions: ApprovalDecision[] };

    if (!Array.isArray(decisions) || decisions.length === 0) {
      return res.status(400).json({ error: 'Missing or empty decisions array' });
    }

    if (decisions.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 decisions per batch' });
    }

    // Validate all approval IDs are UUIDs
    const invalidIds = decisions.filter((d) => !UUID_RE.test(d.approval_id || ''));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: 'Invalid approval ID format in batch' });
    }

    // Validate edited_content lengths
    const tooLong = decisions.filter((d) => d.edited_content && d.edited_content.length > 2000);
    if (tooLong.length > 0) {
      return res.status(400).json({ error: 'edited_content must be 2000 characters or less.' });
    }

    const results: Array<{ approval_id: string; success: boolean; status?: string; error?: string }> = [];

    for (const decision of decisions) {
      try {
        const approvals = await clawQuery<{
          id: string;
          user_id: string;
          status: string;
          action_type: string;
          draft_content: string;
          recipient_phone: string | null;
        }>(
          'approvals',
          `id=eq.${decision.approval_id}&user_id=eq.${userId}&status=eq.pending&limit=1`
        );

        if (approvals.length === 0) {
          results.push({ approval_id: decision.approval_id, success: false, error: 'Not found or already decided' });
          continue;
        }

        const approval = approvals[0];
        const now = new Date().toISOString();

        if (decision.action === 'reject') {
          await clawUpdate('approvals', decision.approval_id, { status: 'rejected', decided_at: now });
          results.push({ approval_id: decision.approval_id, success: true, status: 'rejected' });
          continue;
        }

        const finalContent = decision.edited_content || approval.draft_content;
        await clawUpdate('approvals', decision.approval_id, {
          status: 'approved',
          draft_content: finalContent,
          decided_at: now,
        });

        let executed = false;
        if (approval.action_type === 'send_sms' && approval.recipient_phone) {
          executed = await executeSmsApproval(userId, approval.recipient_phone, finalContent);
        }

        if (executed) {
          await clawUpdate('approvals', decision.approval_id, {
            status: 'executed',
            executed_at: new Date().toISOString(),
          });
        }

        results.push({
          approval_id: decision.approval_id,
          success: true,
          status: executed ? 'executed' : 'approved',
        });
      } catch (err) {
        results.push({
          approval_id: decision.approval_id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    res.json({
      results,
      approved: results.filter((r) => r.status === 'approved' || r.status === 'executed').length,
      rejected: results.filter((r) => r.status === 'rejected').length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('[ClawAPI] Batch error:', error);
    res.status(500).json({ error: 'Failed to process batch decisions' });
  }
});

// ============================================================================
// GET /api/claw/activity — Combined activity feed (tasks + approvals)
// ============================================================================

router.get('/activity', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);

    // Fetch tasks and approvals in parallel
    const [tasks, approvals] = await Promise.all([
      clawQuery<{
        id: string;
        type: string;
        status: string;
        title: string;
        output: Record<string, unknown> | null;
        error: string | null;
        created_at: string;
        completed_at: string | null;
      }>('tasks', `user_id=eq.${userId}&select=id,type,status,title,output,error,created_at,completed_at&order=created_at.desc&limit=${limit}`),
      clawQuery<{
        id: string;
        task_id: string | null;
        status: string;
        action_type: string;
        title: string;
        description: string | null;
        draft_content: string;
        recipient_name: string | null;
        recipient_phone: string | null;
        created_at: string;
        decided_at: string | null;
        executed_at: string | null;
      }>('approvals', `user_id=eq.${userId}&select=id,task_id,status,action_type,title,description,draft_content,recipient_name,recipient_phone,created_at,decided_at,executed_at&order=created_at.desc&limit=${limit}`),
    ]);

    // Merge into a unified timeline
    const activity = [
      ...tasks.map((t) => ({
        id: t.id,
        kind: 'task' as const,
        type: t.type,
        status: t.status,
        title: t.title,
        summary: typeof t.output === 'object' && t.output?.response
          ? String(t.output.response).slice(0, 200)
          : t.error || t.status,
        created_at: t.created_at,
        resolved_at: t.completed_at,
      })),
      ...approvals.map((a) => ({
        id: a.id,
        kind: 'approval' as const,
        type: a.action_type,
        status: a.status,
        title: a.title,
        summary: (a.draft_content || '').slice(0, 200),
        recipient_name: a.recipient_name,
        recipient_phone: a.recipient_phone,
        created_at: a.created_at,
        resolved_at: a.decided_at || a.executed_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, limit);

    res.json({ activity });
  } catch (error) {
    console.error('[ClawAPI] Activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// ============================================================================
// GET /api/claw/messages — Recent conversation history
// ============================================================================

router.get('/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const channel = req.query.channel as string | undefined;

    let params = `user_id=eq.${userId}&select=id,channel,role,content,task_id,created_at&order=created_at.desc&limit=${limit}`;
    if (channel) {
      params += `&channel=eq.${encodeURIComponent(channel)}`;
    }

    const messages = await clawQuery('messages', params);
    res.json({ messages });
  } catch (error) {
    console.error('[ClawAPI] Messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============================================================================
// GET /api/claw/agent-profiles — List agent profiles and capabilities
// ============================================================================

router.get('/agent-profiles', requireAuth, async (req: Request, res: Response) => {
  try {
    const profiles = await clawQuery<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      model: string;
      tools: string[] | null;
      requires_approval: boolean;
      is_active: boolean;
      created_at: string;
    }>('agent_profiles', 'deleted_at=is.null&select=id,name,slug,description,model,tools,requires_approval,is_active,created_at&order=name.asc');

    res.json({ profiles });
  } catch (error) {
    console.error('[ClawAPI] Agent profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch agent profiles' });
  }
});

// ============================================================================
// PATCH /api/claw/agent-profiles/:id — Enable/disable an agent
// ============================================================================

router.patch('/agent-profiles/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const profileId = req.params.id as string;
    if (!UUID_RE.test(profileId)) {
      return res.status(400).json({ error: 'Invalid profile ID' });
    }

    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // Verify profile exists before updating (agent_profiles are system-wide, not per-user)
    const profiles = await clawQuery<{ id: string }>('agent_profiles', `id=eq.${profileId}&deleted_at=is.null&select=id&limit=1`);
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Agent profile not found' });
    }

    await clawUpdate('agent_profiles', profileId, { is_active });
    res.json({ success: true, is_active });
  } catch (error) {
    console.error('[ClawAPI] Update agent profile error:', error);
    res.status(500).json({ error: 'Failed to update agent profile' });
  }
});

// ============================================================================
// GET /api/claw/kill-switch — Check kill switch status
// ============================================================================

router.get('/kill-switch', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Check for most recent global activate/deactivate
    const logs = await clawQuery<{
      id: string;
      action: string;
      reason: string;
      created_at: string;
    }>('kill_switch_log', `user_id=eq.${userId}&select=id,action,reason,created_at&action=in.(activate_global,deactivate_global)&order=created_at.desc&limit=1`);

    const active = logs.length > 0 && logs[0].action === 'activate_global';

    res.json({
      active,
      last_event: logs[0] || null,
    });
  } catch (error) {
    console.error('[ClawAPI] Kill switch status error:', error);
    res.status(500).json({ error: 'Failed to check kill switch' });
  }
});

// ============================================================================
// POST /api/claw/kill-switch — Activate kill switch
// ============================================================================

router.post('/kill-switch', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'reason is required' });
    }

    // Deactivate all agent profiles
    const profiles = await clawQuery<{ id: string }>('agent_profiles', 'is_active=eq.true&select=id');
    for (const p of profiles) {
      await clawUpdate('agent_profiles', p.id, { is_active: false });
    }

    // Log the kill switch activation
    await clawInsert('kill_switch_log', {
      user_id: userId,
      action: 'activate_global',
      reason: reason.slice(0, 500),
      agents_affected: profiles.length,
      tasks_paused: 0,
    });

    console.log(`[ClawAPI] Kill switch ACTIVATED by ${userId}: ${reason}`);

    res.json({
      success: true,
      agents_disabled: profiles.length,
    });
  } catch (error) {
    console.error('[ClawAPI] Kill switch activate error:', error);
    res.status(500).json({ error: 'Failed to activate kill switch' });
  }
});

// ============================================================================
// DELETE /api/claw/kill-switch — Deactivate kill switch (restore agents)
// ============================================================================

router.delete('/kill-switch', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Re-activate all agent profiles (except deleted ones)
    const profiles = await clawQuery<{ id: string }>('agent_profiles', 'deleted_at=is.null&is_active=eq.false&select=id');
    for (const p of profiles) {
      await clawUpdate('agent_profiles', p.id, { is_active: true });
    }

    // Log the deactivation
    await clawInsert('kill_switch_log', {
      user_id: userId,
      action: 'deactivate_global',
      reason: 'Kill switch deactivated — agents restored',
      agents_affected: profiles.length,
    });

    console.log(`[ClawAPI] Kill switch DEACTIVATED by ${userId}, ${profiles.length} agents restored`);

    res.json({
      success: true,
      agents_restored: profiles.length,
    });
  } catch (error) {
    console.error('[ClawAPI] Kill switch deactivate error:', error);
    res.status(500).json({ error: 'Failed to deactivate kill switch' });
  }
});

// ============================================================================
// Approval Execution — Send SMS via Twilio edge function
// ============================================================================

async function executeSmsApproval(
  userId: string,
  recipientPhone: string,
  content: string
): Promise<boolean> {
  try {
    const result = await callEdgeFunction('twilio-sms', {
      user_id: userId,
      to: recipientPhone,
      body: content,
    });

    if (!result.ok) {
      console.error(`[ClawAPI] SMS send failed: ${result.error}`);
      return false;
    }

    console.log(`[ClawAPI] SMS sent to ${recipientPhone}`);

    // Log to conversation_items for unified timeline
    await publicInsert('conversation_items', {
      user_id: userId,
      type: 'sms_sent',
      channel: 'sms',
      direction: 'outbound',
      content,
      metadata: { recipient_phone: recipientPhone, source: 'claw_approval' },
    });

    return true;
  } catch (error) {
    console.error('[ClawAPI] SMS execution error:', error);
    return false;
  }
}

export default router;
