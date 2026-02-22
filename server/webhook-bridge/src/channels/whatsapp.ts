// Webhook Bridge — WhatsApp (Meta Cloud API) channel validator
// Handles webhook verification and message extraction.

import type { Request, Response } from "express";

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";

// Phone → user_id mapping (reuse same env var as SMS)
const PHONE_USER_MAP: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.CLAW_PHONE_USER_MAP || "{}");
  } catch {
    return {};
  }
})();

export interface NormalizedWhatsApp {
  from: string;
  body: string;
  messageId: string;
  userId: string | undefined;
}

/**
 * Handle Meta webhook verification (GET request).
 * Meta sends hub.mode, hub.verify_token, hub.challenge.
 */
export function handleWhatsAppVerify(req: Request, res: Response): void {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN && challenge) {
    res.status(200).send(challenge);
  } else {
    console.error("[WhatsApp] Webhook verification failed");
    res.sendStatus(403);
  }
}

/**
 * Handle an inbound WhatsApp message webhook (POST request).
 * Extracts the first text message from the webhook payload.
 * Returns null for status updates, non-text messages, or invalid payloads.
 */
export function handleWhatsAppWebhook(req: Request): NormalizedWhatsApp | null {
  try {
    const body = req.body as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              id?: string;
              type?: string;
              text?: { body?: string };
            }>;
          };
        }>;
      }>;
    };

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return null; // Status update or empty
    if (message.type !== "text") return null; // Non-text (image, audio, etc.)

    const from = message.from;
    const text = message.text?.body;
    const messageId = message.id;

    if (!from || !text) return null;

    // WhatsApp numbers come without + prefix, add it for lookup
    const normalizedPhone = from.startsWith("+") ? from : `+${from}`;
    const userId = PHONE_USER_MAP[normalizedPhone];

    return {
      from: normalizedPhone,
      body: text,
      messageId: messageId || "",
      userId,
    };
  } catch (error) {
    console.error("[WhatsApp] Failed to parse webhook:", error);
    return null;
  }
}
