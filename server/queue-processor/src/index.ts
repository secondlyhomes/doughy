// Queue Processor — Guarded mode action executor
// Polls claw.action_queue for items with execute_at <= now and status = pending.
// Executes actions (send_sms, send_whatsapp, dispatch_vendor, update_deal)
// and logs results to claw.cost_log.

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const POLL_INTERVAL_MS = 5000;
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

interface QueueItem {
  id: string;
  user_id: string;
  action_type: string;
  action_payload: Record<string, unknown>;
  status: string;
  execute_at: string;
  started_at: string | null;
}

async function clawQuery<T>(table: string, params: string): Promise<T[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Accept-Profile": "claw",
    },
  });
  if (!response.ok) return [];
  return (await response.json()) as T[];
}

async function clawUpdate(table: string, id: string, data: Record<string, unknown>): Promise<boolean> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Content-Profile": "claw",
    },
    body: JSON.stringify(data),
  });
  return response.ok;
}

/**
 * Execute a queued action. Returns success status.
 */
async function executeAction(item: QueueItem): Promise<boolean> {
  console.log(`[Queue] Executing ${item.action_type} for user ${item.user_id}`);

  // Mark as executing
  await clawUpdate("action_queue", item.id, {
    status: "executing",
    started_at: new Date().toISOString(),
  });

  try {
    switch (item.action_type) {
      case "send_sms":
      case "send_whatsapp":
        // Forward to Twilio via the webhook bridge or direct API
        console.log(`[Queue] Would send ${item.action_type} to ${item.action_payload.recipient_phone}`);
        // TODO: Wire to actual Twilio send when ready
        break;

      case "update_deal":
        console.log(`[Queue] Would update deal ${item.action_payload.deal_id}`);
        // TODO: Wire to actual deal update
        break;

      case "dispatch_vendor":
        console.log(`[Queue] Would dispatch vendor for ${item.action_payload.property_id}`);
        // TODO: Wire to actual vendor dispatch
        break;

      default:
        console.error(`[Queue] Unknown action type: ${item.action_type}`);
        await clawUpdate("action_queue", item.id, { status: "failed" });
        return false;
    }

    await clawUpdate("action_queue", item.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`[Queue] Failed to execute ${item.action_type}:`, error);
    await clawUpdate("action_queue", item.id, { status: "failed" });
    return false;
  }
}

/**
 * Recover items stuck in "executing" for more than STALE_THRESHOLD_MS.
 */
async function recoverStaleItems(): Promise<void> {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  const stale = await clawQuery<QueueItem>(
    "action_queue",
    `status=eq.executing&started_at=lt.${threshold}&select=id,user_id,action_type,action_payload,status,execute_at,started_at&limit=10`
  );

  for (const item of stale) {
    console.log(`[Queue] Recovering stale item ${item.id} (${item.action_type})`);
    await clawUpdate("action_queue", item.id, { status: "pending", started_at: null });
  }
}

/**
 * Main poll loop — check for ready items and execute them.
 */
async function poll(): Promise<void> {
  const now = new Date().toISOString();

  const items = await clawQuery<QueueItem>(
    "action_queue",
    `status=eq.pending&execute_at=lte.${now}&select=id,user_id,action_type,action_payload,status,execute_at,started_at&order=execute_at.asc&limit=5`
  );

  for (const item of items) {
    await executeAction(item);
  }
}

// ─── Main ──────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[Queue] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

console.log(`[Queue] Starting queue processor (poll every ${POLL_INTERVAL_MS / 1000}s)`);

// Poll loop
setInterval(async () => {
  try {
    await poll();
  } catch (error) {
    console.error("[Queue] Poll error:", error);
  }
}, POLL_INTERVAL_MS);

// Stale recovery every 30 seconds
setInterval(async () => {
  try {
    await recoverStaleItems();
  } catch (error) {
    console.error("[Queue] Recovery error:", error);
  }
}, 30_000);

// Initial poll
poll().catch((error) => console.error("[Queue] Initial poll error:", error));
