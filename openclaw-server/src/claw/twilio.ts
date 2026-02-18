// The Claw — Twilio REST API helper
// Single place for all Twilio message sending (SMS + WhatsApp)

import { config } from '../config.js';

export interface TwilioSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send a message via Twilio REST API (SMS or WhatsApp).
 * Includes a 10s timeout to prevent hung connections.
 */
export async function sendTwilioMessage(opts: {
  from: string;
  to: string;
  body: string;
}): Promise<TwilioSendResult> {
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    return { success: false, error: 'Missing Twilio credentials' };
  }

  if (!opts.from) {
    return { success: false, error: 'No From number configured' };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10_000);

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: opts.from,
        To: opts.to,
        Body: opts.body,
      }).toString(),
      signal: abortController.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as Record<string, unknown>;
      const error = `${response.status} code=${result.code} message=${result.message}`;
      return { success: false, error };
    }

    const result = await response.json() as Record<string, unknown>;
    return { success: true, sid: result.sid as string };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Twilio request timed out (10s)' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send an SMS message (auto-truncates to 1500 chars).
 */
export function sendSms(phone: string, content: string): Promise<TwilioSendResult> {
  const body = content.length > 1500
    ? content.slice(0, 1450) + '\n\n[Open the app for full details.]'
    : content;

  return sendTwilioMessage({
    from: config.twilioPhoneNumber,
    to: phone,
    body,
  });
}

/**
 * Send a WhatsApp message via Twilio.
 */
export function sendWhatsApp(phone: string, content: string): Promise<TwilioSendResult> {
  return sendTwilioMessage({
    from: config.twilioWhatsAppNumber,
    to: `whatsapp:${phone}`,
    body: content,
  });
}
