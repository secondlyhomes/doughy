// Queue Processor — Guarded mode action executor
// Polls claw.action_queue for items with execute_at <= now and status = pending.
// Executes actions (send_sms, send_whatsapp, dispatch_vendor, update_deal)
// and logs results to claw.cost_log.

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";
const POLL_INTERVAL_MS = 5000;
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string): string {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid ${label}: must be a valid UUID`);
  }
  return value;
}

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
  assertUuid(id, "id");
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
  assertUuid(item.user_id, "user_id");
  console.log(`[Queue] Executing ${item.action_type} for user ${item.user_id}`);

  // Mark as executing
  await clawUpdate("action_queue", item.id, {
    status: "executing",
    started_at: new Date().toISOString(),
  });

  try {
    let cost = 0;

    switch (item.action_type) {
      case "send_sms":
        cost = await executeSendSms(item);
        break;

      case "send_whatsapp":
        cost = await executeSendWhatsApp(item);
        break;

      case "update_deal":
        await executeUpdateDeal(item);
        break;

      case "dispatch_vendor":
        cost = await executeDispatchVendor(item);
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

    // Log cost if any
    if (cost > 0) {
      await logCost(item, cost);
    }

    return true;
  } catch (error) {
    console.error(`[Queue] Failed to execute ${item.action_type}:`, error);
    await clawUpdate("action_queue", item.id, { status: "failed" });
    return false;
  }
}

// ─── Action Handlers ─────────────────────────────────────────────

/**
 * Send SMS via Twilio REST API.
 * Returns estimated cost per segment ($0.0083).
 */
async function executeSendSms(item: QueueItem): Promise<number> {
  const { recipient_phone, message } = item.action_payload as { recipient_phone?: string; message?: string };
  if (!recipient_phone || !message) throw new Error("Missing recipient_phone or message");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: TWILIO_FROM_NUMBER,
        To: recipient_phone,
        Body: message,
      }).toString(),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Twilio SMS failed: ${response.status} - ${text}`);
  }

  const result = await response.json() as { sid?: string; num_segments?: string };
  console.log(`[Queue] SMS sent: ${result.sid}`);
  const segments = parseInt(result.num_segments || "1", 10);
  return segments * 0.0083;
}

/**
 * Send WhatsApp message via Twilio WhatsApp API.
 * Uses whatsapp: prefix on From/To numbers.
 * Returns estimated cost ($0.005 per message).
 */
async function executeSendWhatsApp(item: QueueItem): Promise<number> {
  const { recipient_phone, message } = item.action_payload as { recipient_phone?: string; message?: string };
  if (!recipient_phone || !message) throw new Error("Missing recipient_phone or message");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const whatsappFrom = `whatsapp:${TWILIO_FROM_NUMBER}`;
  const whatsappTo = recipient_phone.startsWith("whatsapp:") ? recipient_phone : `whatsapp:${recipient_phone}`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: whatsappFrom,
        To: whatsappTo,
        Body: message,
      }).toString(),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Twilio WhatsApp failed: ${response.status} - ${text}`);
  }

  const result = await response.json() as { sid?: string };
  console.log(`[Queue] WhatsApp sent: ${result.sid}`);
  return 0.005;
}

/**
 * Update a deal in investor.deals_pipeline via PostgREST.
 */
async function executeUpdateDeal(item: QueueItem): Promise<void> {
  const { deal_id, ...updates } = item.action_payload as { deal_id?: string; [key: string]: unknown };
  if (!deal_id) throw new Error("Missing deal_id");
  assertUuid(deal_id, "deal_id");

  // Only allow safe fields to be updated
  const allowedFields = new Set(["stage", "status", "next_action", "next_action_due", "probability", "notes"]);
  const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.has(key)) {
      safeUpdates[key] = value;
    }
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/deals_pipeline?id=eq.${deal_id}&user_id=eq.${item.user_id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Content-Profile": "investor",
      },
      body: JSON.stringify(safeUpdates),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Deal update failed: ${response.status} - ${text}`);
  }

  console.log(`[Queue] Deal ${deal_id} updated`);
}

/**
 * Dispatch a vendor for a maintenance task.
 * Creates a maintenance record and optionally sends SMS to vendor.
 * Returns SMS cost if vendor was notified.
 */
async function executeDispatchVendor(item: QueueItem): Promise<number> {
  const {
    property_id, title, description, priority, category,
    vendor_name, vendor_phone,
  } = item.action_payload as {
    property_id?: string; title?: string; description?: string;
    priority?: string; category?: string;
    vendor_name?: string; vendor_phone?: string;
  };

  if (!property_id || !title) throw new Error("Missing property_id or title");
  assertUuid(property_id, "property_id");

  // Create maintenance record
  const response = await fetch(`${SUPABASE_URL}/rest/v1/maintenance_records`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Content-Profile": "landlord",
      "Accept-Profile": "landlord",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: item.user_id,
      property_id,
      title,
      description: description || null,
      priority: priority || "medium",
      category: category || "general",
      status: "reported",
      vendor_name: vendor_name || null,
      vendor_phone: vendor_phone || null,
      reported_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Maintenance record creation failed: ${response.status} - ${text}`);
  }

  const record = await response.json() as Array<{ id: string }>;
  const recordId = Array.isArray(record) ? record[0]?.id : (record as { id: string }).id;
  console.log(`[Queue] Maintenance record created: ${recordId}`);

  // Optionally notify vendor via SMS
  if (vendor_phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
    const vendorMessage = `New maintenance request: ${title}${description ? ` - ${description}` : ""}. Priority: ${priority || "medium"}. Please reply to confirm availability.`;

    const smsItem: QueueItem = {
      ...item,
      action_type: "send_sms",
      action_payload: { recipient_phone: vendor_phone, message: vendorMessage },
    };

    try {
      return await executeSendSms(smsItem);
    } catch (error) {
      console.error(`[Queue] Vendor SMS notification failed (non-fatal):`, error);
      // Non-fatal: maintenance record was created, SMS is optional
    }
  }

  return 0;
}

/**
 * Log action cost to claw.cost_log.
 */
async function logCost(item: QueueItem, cost: number): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cost_log`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Content-Profile": "claw",
      },
      body: JSON.stringify({
        user_id: item.user_id,
        action_type: item.action_type,
        action_id: item.id,
        cost_usd: cost,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error(`[Queue] Failed to log cost:`, error);
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
