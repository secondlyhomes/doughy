// The Claw — Action Queue Executor
// Processes queued actions (guarded mode) when their countdown expires.
// Runs on a setInterval loop, checking every 5 seconds.

import { clawQuery, clawUpdate } from './db.js';
import { sendWhatsApp, sendSms } from './twilio.js';
import { logCost } from './costs.js';

interface QueueItem {
  id: string;
  user_id: string;
  action_type: string;
  description: string | null;
  preview: string | null;
  target_channel: string | null;
  target_lead_id: string | null;
  target_contact_id: string | null;
  module: string | null;
  execute_at: string;
  status: string;
  action_payload: Record<string, unknown>;
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let isProcessing = false;

/** Max age (ms) before an 'executing' item is considered stale and reset to error. */
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Recover stale items stuck in 'executing' state (e.g., server crashed mid-execution).
 */
async function recoverStaleItems(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
    const staleItems = await clawQuery<QueueItem>(
      'action_queue',
      `status=eq.executing&updated_at=lte.${cutoff}&limit=10`
    );

    for (const item of staleItems) {
      console.warn(`[Queue] Recovering stale item ${item.id} (${item.action_type})`);
      await clawUpdate('action_queue', item.id, {
        status: 'error',
        error_message: 'Stale: server may have restarted during execution',
      });
    }

    if (staleItems.length > 0) {
      console.log(`[Queue] Recovered ${staleItems.length} stale items`);
    }
  } catch (err) {
    console.error('[Queue] Stale item recovery failed:', err);
  }
}

/**
 * Process all ready queue items (execute_at <= now, status = 'pending').
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return; // Prevent concurrent runs
  isProcessing = true;

  try {
    // Recover any stale items first
    await recoverStaleItems();

    const now = new Date().toISOString();
    const readyItems = await clawQuery<QueueItem>(
      'action_queue',
      `status=eq.pending&execute_at=lte.${now}&order=execute_at.asc&limit=10`
    );

    if (readyItems.length === 0) return;

    console.log(`[Queue] Processing ${readyItems.length} ready items`);

    for (const item of readyItems) {
      // Mark as executing to prevent double-processing
      await clawUpdate('action_queue', item.id, { status: 'executing' });

      try {
        await executeQueueItem(item);
        await clawUpdate('action_queue', item.id, {
          status: 'executed',
          executed_at: new Date().toISOString(),
        });
        console.log(`[Queue] Executed: ${item.action_type} (${item.id})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await clawUpdate('action_queue', item.id, {
          status: 'error',
          error_message: errorMsg,
        });
        console.error(`[Queue] Failed: ${item.action_type} (${item.id}):`, error);
      }
    }
  } catch (err) {
    console.error('[Queue] processQueue error:', err);
  } finally {
    isProcessing = false;
  }
}

/**
 * Execute a single queue item based on its action_type.
 */
async function executeQueueItem(item: QueueItem): Promise<void> {
  const payload = item.action_payload || {};

  switch (item.action_type) {
    case 'send_followup':
    case 'send_whatsapp': {
      const phone = (payload.recipient_phone as string) || '';
      const body = item.preview || (payload.draft_content as string) || '';
      if (!phone || !body) throw new Error('Missing phone or body for WhatsApp send');
      const result = await sendWhatsApp(phone, body);
      if (!result.success) throw new Error(`WhatsApp send failed: ${result.error}`);
      await logCost(item.user_id, 'twilio', 'whatsapp_queue', 1);
      break;
    }

    case 'send_sms': {
      const phone = (payload.recipient_phone as string) || '';
      const body = item.preview || (payload.draft_content as string) || '';
      if (!phone || !body) throw new Error('Missing phone or body for SMS send');
      const result = await sendSms(phone, body);
      if (!result.success) throw new Error(`SMS send failed: ${result.error}`);
      await logCost(item.user_id, 'twilio', 'sms_queue', 1);
      break;
    }

    case 'dispatch_vendor': {
      const vendorPhone = (payload.vendor_phone as string) || '';
      const dispatchMsg = item.preview || (payload.message as string) || '';
      if (!vendorPhone || !dispatchMsg) throw new Error('Missing vendor phone or message');
      const result = await sendWhatsApp(vendorPhone, dispatchMsg);
      if (!result.success) throw new Error(`Vendor dispatch failed: ${result.error}`);
      await logCost(item.user_id, 'twilio', 'whatsapp_dispatch', 1);
      break;
    }

    case 'reply_to_tenant': {
      const tenantPhone = (payload.tenant_phone as string) || '';
      const replyMsg = item.preview || (payload.message as string) || '';
      if (!tenantPhone || !replyMsg) throw new Error('Missing tenant phone or message');
      const result = await sendWhatsApp(tenantPhone, replyMsg);
      if (!result.success) throw new Error(`Tenant reply failed: ${result.error}`);
      await logCost(item.user_id, 'twilio', 'whatsapp_tenant_reply', 1);
      break;
    }

    default:
      throw new Error(`Unknown action_type: ${item.action_type}`);
  }
}

/**
 * Start the queue processor (call once on server boot).
 */
export function startQueueProcessor(): void {
  if (intervalId) {
    console.warn('[Queue] Already running');
    return;
  }

  console.log('[Queue] Starting action queue processor (5s interval)');
  intervalId = setInterval(processQueue, 5000);

  // Run once immediately
  processQueue().catch((err) => console.error('[Queue] Initial run failed:', err));
}

/**
 * Stop the queue processor (for graceful shutdown).
 */
export function stopQueueProcessor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Queue] Stopped');
  }
}
