// Webhook Bridge — Twilio SMS channel validator
// Extracts and validates inbound SMS webhooks from Twilio.
// Signature validation requires SERVER_URL env var.

import type { Request } from "express";
import crypto from "node:crypto";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const SERVER_URL = process.env.SERVER_URL || "";

// Phone → user_id mapping (from env JSON)
const PHONE_USER_MAP: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.CLAW_PHONE_USER_MAP || "{}");
  } catch {
    return {};
  }
})();

export interface NormalizedSms {
  from: string;
  to: string;
  body: string;
  messageSid: string;
  userId: string | undefined;
}

/**
 * Validate Twilio signature using HMAC-SHA1.
 * Returns false if SERVER_URL or auth token not configured.
 */
function validateTwilioSignature(req: Request): boolean {
  if (!TWILIO_AUTH_TOKEN || !SERVER_URL) {
    console.error("[Twilio] Missing TWILIO_AUTH_TOKEN or SERVER_URL — cannot validate");
    return false;
  }

  const signature = req.headers["x-twilio-signature"] as string | undefined;
  if (!signature) return false;

  // Build the validation URL
  const url = `${SERVER_URL}${req.originalUrl}`;

  // Sort body params and concatenate
  const params = req.body as Record<string, string>;
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((key) => `${key}${params[key]}`).join("");

  const expected = crypto
    .createHmac("sha1", TWILIO_AUTH_TOKEN)
    .update(url + paramString)
    .digest("base64");

  return signature === expected;
}

/**
 * Handle an inbound Twilio SMS webhook.
 * Validates signature, extracts fields, resolves user.
 */
export function handleTwilioWebhook(req: Request): NormalizedSms | null {
  // Validate signature
  if (TWILIO_AUTH_TOKEN && !validateTwilioSignature(req)) {
    console.error("[Twilio] Invalid signature — rejecting");
    return null;
  }

  const body = req.body as Record<string, string>;
  const from = body.From;
  const to = body.To;
  const text = body.Body;
  const messageSid = body.MessageSid;

  if (!from || !text) {
    console.error("[Twilio] Missing From or Body in webhook");
    return null;
  }

  // Resolve user from phone mapping
  const userId = PHONE_USER_MAP[from];

  return {
    from,
    to: to || "",
    body: text,
    messageSid: messageSid || "",
    userId,
  };
}
