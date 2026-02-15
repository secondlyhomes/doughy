// SMS Channel Adapter for OpenClaw
// Handles SMS communication via Twilio

import { config } from '../config.js';
import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from './base.js';

/**
 * Twilio webhook payload for incoming SMS
 */
interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
}

/**
 * User's Twilio credentials
 */
export interface SMSCredentials {
  user_id: string;
  account_sid: string;
  auth_token: string;
  phone_number: string; // The Twilio number
}

/**
 * SMS Channel Adapter
 * Uses Twilio Programmable SMS
 *
 * Setup required:
 * 1. Create Twilio account
 * 2. Get phone number
 * 3. Set webhook URL: https://openclaw.doughy.app/webhooks/sms
 */
export class SMSAdapter implements ChannelAdapter {
  readonly channelType = 'sms' as const;

  private readonly baseUrl = 'https://api.twilio.com/2010-04-01';

  initialize(): Promise<void> {
    console.log('[SMS] Adapter initialized');
    return Promise.resolve();
  }

  isConfigured(): boolean {
    return true; // Per-user configuration
  }

  /**
   * Normalize Twilio webhook to IncomingMessage
   */
  normalizeMessage(payload: TwilioWebhookPayload): IncomingMessage | null {
    if (!payload.Body && parseInt(payload.NumMedia || '0', 10) === 0) {
      console.log('[SMS] Ignoring empty message');
      return null;
    }

    return {
      channel: 'sms',
      channelMessageId: payload.MessageSid,
      from: payload.From,
      to: payload.To,
      body: payload.Body || '[Media message]',
      receivedAt: new Date().toISOString(),
      metadata: {
        account_sid: payload.AccountSid,
        num_media: parseInt(payload.NumMedia || '0', 10),
        media_url: payload.MediaUrl0,
        media_type: payload.MediaContentType0,
      },
    };
  }

  /**
   * Send SMS via Twilio
   */
  async sendMessage(
    message: OutgoingMessage,
    credentials: SMSCredentials
  ): Promise<string> {
    const url = `${this.baseUrl}/Accounts/${credentials.account_sid}/Messages.json`;

    const auth = Buffer.from(
      `${credentials.account_sid}:${credentials.auth_token}`
    ).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: credentials.phone_number,
        To: message.to,
        Body: message.body,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as { sid: string };
    console.log(`[SMS] Message sent: ${result.sid}`);
    return result.sid;
  }

  /**
   * Validate Twilio webhook signature
   */
  validateWebhook(
    signature: string,
    url: string,
    params: Record<string, string>,
    authToken: string
  ): boolean {
    // TODO: Implement Twilio signature validation
    // See: https://www.twilio.com/docs/usage/security#validating-requests
    return true;
  }
}

// Export singleton instance
export const smsAdapter = new SMSAdapter();
