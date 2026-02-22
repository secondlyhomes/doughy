// Webhook Bridge — Ingress spoke for OpenClaw
// Validates incoming webhooks → normalizes → checks trust → forwards to OpenClaw gateway.
// Routes ONLY — no AI logic, no tool execution, no agent reasoning.

import express from "express";
import { handleTwilioWebhook } from "./channels/twilio.js";
import { handleGmailWebhook } from "./channels/gmail.js";
import { handleWhatsAppWebhook, handleWhatsAppVerify } from "./channels/whatsapp.js";
import { isKillSwitchActive, checkTrustLevel } from "./trust.js";

const app = express();
const PORT = parseInt(process.env.BRIDGE_PORT || "3001", 10);
const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

// Parse form-encoded (Twilio) and JSON (WhatsApp, Gmail)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "webhook-bridge" });
});

/**
 * Forward a normalized message to the OpenClaw gateway.
 * Returns the gateway response or an error message.
 */
async function forwardToGateway(agentId: string, message: string, metadata: Record<string, unknown> = {}): Promise<string> {
  const response = await fetch(`${OPENCLAW_URL}/api/agents/${agentId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({ message, metadata }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[Bridge] Gateway error: ${response.status} - ${text}`);
    throw new Error(`Gateway returned ${response.status}`);
  }

  const result = (await response.json()) as { response?: string };
  return result.response || "";
}

// ─── Twilio SMS Webhook ────────────────────────────────────────────
app.post("/webhooks/sms", async (req, res) => {
  try {
    // Check kill switch first
    if (await isKillSwitchActive()) {
      res.type("text/xml").send("<Response><Message>The Claw is paused.</Message></Response>");
      return;
    }

    const normalized = handleTwilioWebhook(req);
    if (!normalized) {
      res.status(400).send("Invalid SMS payload");
      return;
    }

    // Check trust level
    const trust = await checkTrustLevel(normalized.userId);
    if (trust === "locked") {
      res.type("text/xml").send("<Response><Message>Your account is currently locked.</Message></Response>");
      return;
    }

    const reply = await forwardToGateway("dispatch", normalized.body, {
      channel: "sms",
      from: normalized.from,
      userId: normalized.userId,
      trustLevel: trust,
    });

    // TwiML response
    res.type("text/xml").send(`<Response><Message>${escapeXml(reply)}</Message></Response>`);
  } catch (error) {
    console.error("[Bridge] SMS error:", error);
    res.type("text/xml").send("<Response><Message>Something went wrong. Try again shortly.</Message></Response>");
  }
});

// ─── WhatsApp Webhook ──────────────────────────────────────────────
app.get("/webhooks/whatsapp", (req, res) => {
  handleWhatsAppVerify(req, res);
});

app.post("/webhooks/whatsapp", async (req, res) => {
  try {
    if (await isKillSwitchActive()) {
      res.sendStatus(200);
      return;
    }

    const normalized = handleWhatsAppWebhook(req);
    if (!normalized) {
      res.sendStatus(200); // Acknowledge even if we can't process (status updates, etc.)
      return;
    }

    const trust = await checkTrustLevel(normalized.userId);
    if (trust === "locked") {
      res.sendStatus(200);
      return;
    }

    await forwardToGateway("dispatch", normalized.body, {
      channel: "whatsapp",
      from: normalized.from,
      userId: normalized.userId,
      trustLevel: trust,
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("[Bridge] WhatsApp error:", error);
    res.sendStatus(200); // Always 200 to Meta
  }
});

// ─── Gmail Pub/Sub Webhook ─────────────────────────────────────────
app.post("/webhooks/gmail", async (req, res) => {
  try {
    if (await isKillSwitchActive()) {
      res.sendStatus(200);
      return;
    }

    const normalized = handleGmailWebhook(req);
    if (!normalized) {
      res.sendStatus(200);
      return;
    }

    await forwardToGateway("dispatch", `New email notification: historyId=${normalized.historyId}`, {
      channel: "gmail",
      email: normalized.email,
      historyId: normalized.historyId,
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("[Bridge] Gmail error:", error);
    res.sendStatus(200);
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.listen(PORT, () => {
  console.log(`[Bridge] Listening on port ${PORT}`);
  console.log(`[Bridge] Forwarding to OpenClaw at ${OPENCLAW_URL}`);
});
