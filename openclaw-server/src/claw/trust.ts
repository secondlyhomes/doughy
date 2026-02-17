// The Claw — Trust Level Enforcement
// Every outbound action goes through enforceAction() before execution.
// Supports 4 levels: locked → manual → guarded → autonomous

import { clawQuery, clawInsert, schemaQuery } from './db.js';

export type TrustLevel = 'locked' | 'manual' | 'guarded' | 'autonomous';
export type EnforcementResult = 'execute' | 'queue' | 'approval' | 'blocked';

export interface TrustConfig {
  id: string;
  user_id: string;
  global_level: TrustLevel;
  action_overrides: Record<string, TrustLevel>;
  queue_delay_seconds: number;
  daily_spend_limit_cents: number;
  daily_call_limit: number;
  daily_sms_limit: number;
  push_drafts_whatsapp: boolean;
  push_drafts_sms: boolean;
  metadata: Record<string, unknown>;
}

interface ActionDetails {
  description: string;
  preview?: string;
  channel?: string;
  leadId?: string;
  contactId?: string;
  module?: string;
  actionPayload?: Record<string, unknown>;
}

const DEFAULT_TRUST_CONFIG: Omit<TrustConfig, 'id' | 'user_id'> = {
  global_level: 'manual',
  action_overrides: {},
  queue_delay_seconds: 30,
  daily_spend_limit_cents: 500,
  daily_call_limit: 10,
  daily_sms_limit: 50,
  push_drafts_whatsapp: false,
  push_drafts_sms: false,
  metadata: {},
};

/**
 * Load trust config for a user. Returns defaults if no config exists.
 */
export async function getTrustConfig(userId: string): Promise<TrustConfig> {
  try {
    const rows = await clawQuery<TrustConfig>(
      'trust_config',
      `user_id=eq.${userId}&limit=1`
    );
    if (rows.length > 0) return rows[0];
  } catch (err) {
    console.warn('[Trust] Failed to load trust config, using defaults:', err);
  }
  return { id: '', user_id: userId, ...DEFAULT_TRUST_CONFIG };
}

/**
 * Check if kill switch is active for a specific user.
 */
async function isKillSwitchActive(userId: string): Promise<boolean> {
  try {
    const logs = await clawQuery<{ action: string }>(
      'kill_switch_log',
      `user_id=eq.${userId}&action=in.(activate_global,deactivate_global)&order=created_at.desc&limit=1`
    );
    return logs.length > 0 && logs[0].action === 'activate_global';
  } catch (err) {
    console.error('[Trust] Kill switch check failed — assuming active for safety:', err);
    return true; // Fail closed: block actions when safety can't be verified
  }
}

/**
 * Check daily spending limits.
 * Returns true if within limits, false if exceeded.
 */
export async function checkLimits(userId: string, actionType: string): Promise<boolean> {
  const config = await getTrustConfig(userId);
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check daily spend
    const todayCosts = await clawQuery<{ cost_cents: number }>(
      'cost_log',
      `user_id=eq.${userId}&created_at=gte.${today}&select=cost_cents`
    );
    const totalToday = todayCosts.reduce((sum, c) => sum + (c.cost_cents || 0), 0);
    if (totalToday >= config.daily_spend_limit_cents) {
      console.log(`[Trust] Daily spend limit reached for ${userId}: ${totalToday}c / ${config.daily_spend_limit_cents}c`);
      return false;
    }

    // Check SMS/WhatsApp limit
    if (actionType === 'send_followup' || actionType === 'send_sms' || actionType === 'send_whatsapp') {
      const todayMessages = await clawQuery<{ id: string }>(
        'cost_log',
        `user_id=eq.${userId}&service=eq.twilio&created_at=gte.${today}&select=id`
      );
      if (todayMessages.length >= config.daily_sms_limit) {
        console.log(`[Trust] Daily SMS limit reached for ${userId}: ${todayMessages.length} / ${config.daily_sms_limit}`);
        return false;
      }
    }

    // Check call limit for Bland actions
    if (actionType.startsWith('bland_')) {
      const todayCalls = await clawQuery<{ id: string }>(
        'cost_log',
        `user_id=eq.${userId}&service=eq.bland&created_at=gte.${today}&select=id`
      );
      if (todayCalls.length >= config.daily_call_limit) {
        console.log(`[Trust] Daily call limit reached for ${userId}: ${todayCalls.length} / ${config.daily_call_limit}`);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('[Trust] Limit check failed — blocking for safety:', err);
    return false; // Fail closed: require approval when limits can't be verified
  }
}

/**
 * Add an action to the guarded queue with a delay.
 */
export async function addToQueue(
  userId: string,
  actionType: string,
  details: ActionDetails,
  delaySeconds: number
): Promise<string> {
  const executeAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
  const item = await clawInsert<{ id: string }>('action_queue', {
    user_id: userId,
    action_type: actionType,
    description: details.description,
    preview: details.preview || null,
    target_channel: details.channel || null,
    target_lead_id: details.leadId || null,
    target_contact_id: details.contactId || null,
    module: details.module || null,
    delay_seconds: delaySeconds,
    execute_at: executeAt,
    status: 'pending',
    action_payload: details.actionPayload || {},
  });
  console.log(`[Trust] Queued action ${actionType} for ${userId}, executes at ${executeAt}`);
  return item.id;
}

/**
 * Create an approval request (for manual mode or when limits are exceeded).
 */
async function createTrustApproval(
  userId: string,
  actionType: string,
  details: ActionDetails
): Promise<string> {
  // Create a task for context
  const task = await clawInsert<{ id: string }>('tasks', {
    user_id: userId,
    type: 'custom',
    status: 'awaiting_approval',
    title: details.description,
    input: { actionType, ...details },
  });

  const approval = await clawInsert<{ id: string }>('approvals', {
    user_id: userId,
    task_id: task.id,
    action_type: actionType === 'send_followup' || actionType === 'send_whatsapp' ? 'send_sms' : 'custom',
    title: details.description,
    description: details.preview || details.description,
    draft_content: details.preview || '',
    action_payload: details.actionPayload || {},
    metadata: { trust_enforced: true, original_action: actionType },
  });

  console.log(`[Trust] Created approval ${approval.id} for ${actionType} (user: ${userId})`);
  return approval.id;
}

/**
 * Main enforcement function. Every outbound action MUST go through this.
 *
 * Returns:
 * - 'execute': action can proceed immediately
 * - 'queue': action was queued with a countdown (guarded mode)
 * - 'approval': action requires manual approval
 * - 'blocked': action cannot proceed (kill switch or locked mode)
 */
export async function enforceAction(
  userId: string,
  actionType: string,
  details: ActionDetails
): Promise<{ result: EnforcementResult; queueId?: string; approvalId?: string }> {
  // 1. Check kill switch (user-scoped)
  if (await isKillSwitchActive(userId)) {
    console.log(`[Trust] Kill switch active — blocking ${actionType} for ${userId}`);
    return { result: 'blocked' };
  }

  // 2. Load trust config
  const trustConfig = await getTrustConfig(userId);

  // 3. Determine effective trust level (action override or global)
  const effectiveLevel: TrustLevel =
    trustConfig.action_overrides[actionType] ||
    trustConfig.global_level ||
    'manual';

  console.log(`[Trust] Enforcing ${actionType} for ${userId}: level=${effectiveLevel}`);

  switch (effectiveLevel) {
    case 'locked':
      return { result: 'blocked' };

    case 'manual': {
      const approvalId = await createTrustApproval(userId, actionType, details);
      return { result: 'approval', approvalId };
    }

    case 'guarded': {
      const delay = trustConfig.queue_delay_seconds || 30;
      const queueId = await addToQueue(userId, actionType, details, delay);
      return { result: 'queue', queueId };
    }

    case 'autonomous': {
      // Check daily limits first
      const withinLimits = await checkLimits(userId, actionType);
      if (!withinLimits) {
        const approvalId = await createTrustApproval(userId, actionType, {
          ...details,
          description: `${details.description} (daily limit reached)`,
        });
        return { result: 'approval', approvalId };
      }
      return { result: 'execute' };
    }

    default:
      // Unknown level → safest option
      const approvalId = await createTrustApproval(userId, actionType, details);
      return { result: 'approval', approvalId };
  }
}
