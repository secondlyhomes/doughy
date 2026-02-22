// Webhook Bridge — Gmail Pub/Sub channel validator
// Decodes Gmail Pub/Sub push notifications.
// The actual email fetching happens in the OpenClaw agent via Gmail API tools.

import type { Request } from "express";

export interface NormalizedGmailNotification {
  email: string;
  historyId: string;
}

/**
 * Handle a Gmail Pub/Sub push notification.
 * Decodes the base64 message data and extracts email + historyId.
 */
export function handleGmailWebhook(req: Request): NormalizedGmailNotification | null {
  try {
    const body = req.body as { message?: { data?: string } };
    const data = body?.message?.data;

    if (!data) {
      console.error("[Gmail] Missing message.data in Pub/Sub notification");
      return null;
    }

    // Decode base64 message
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as {
      emailAddress?: string;
      historyId?: number;
    };

    if (!decoded.emailAddress || !decoded.historyId) {
      console.error("[Gmail] Missing emailAddress or historyId in decoded data");
      return null;
    }

    return {
      email: decoded.emailAddress,
      historyId: String(decoded.historyId),
    };
  } catch (error) {
    console.error("[Gmail] Failed to decode Pub/Sub notification:", error);
    return null;
  }
}
