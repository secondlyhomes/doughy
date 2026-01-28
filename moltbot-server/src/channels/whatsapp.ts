// WhatsApp Channel Adapter for MoltBot
// Handles WhatsApp Business API communication

import { config } from '../config.js';
import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from './base.js';

/**
 * WhatsApp webhook payload from Meta Cloud API
 */
interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
          text?: { body: string };
          image?: { id: string; mime_type: string; caption?: string };
          document?: { id: string; mime_type: string; filename: string };
        }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * User's WhatsApp Business credentials
 */
export interface WhatsAppCredentials {
  user_id: string;
  phone_number_id: string;
  access_token: string;
  business_account_id: string;
  verify_token: string;
}

/**
 * WhatsApp Channel Adapter
 * Uses WhatsApp Business Cloud API (Meta)
 *
 * Setup required:
 * 1. Create Meta Business account
 * 2. Set up WhatsApp Business API
 * 3. Get phone_number_id and access_token
 * 4. Configure webhook URL: https://moltbot.doughy.app/webhooks/whatsapp
 */
export class WhatsAppAdapter implements ChannelAdapter {
  readonly channelType = 'whatsapp' as const;

  private readonly apiVersion = 'v18.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  initialize(): Promise<void> {
    console.log('[WhatsApp] Adapter initialized');
    return Promise.resolve();
  }

  isConfigured(): boolean {
    // WhatsApp is configured per-user, not globally
    // Return true if the channel is available for use
    return true;
  }

  /**
   * Normalize WhatsApp webhook payload to IncomingMessage
   */
  normalizeMessage(payload: WhatsAppWebhookPayload): IncomingMessage | null {
    try {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      if (!value?.messages?.[0]) {
        return null; // Status update or other non-message event
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];

      // Only handle text messages for now
      if (message.type !== 'text' || !message.text?.body) {
        console.log(`[WhatsApp] Ignoring ${message.type} message`);
        return null;
      }

      return {
        channel: 'whatsapp',
        channelMessageId: message.id,
        from: message.from, // Phone number
        fromName: contact?.profile?.name,
        to: value.metadata.display_phone_number,
        body: message.text.body,
        receivedAt: new Date(parseInt(message.timestamp, 10) * 1000).toISOString(),
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          wa_id: contact?.wa_id,
        },
      };
    } catch (error) {
      console.error('[WhatsApp] Failed to normalize message:', error);
      return null;
    }
  }

  /**
   * Send a message via WhatsApp Business API
   */
  async sendMessage(
    message: OutgoingMessage,
    credentials: WhatsAppCredentials
  ): Promise<string> {
    const url = `${this.baseUrl}/${this.apiVersion}/${credentials.phone_number_id}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        type: 'text',
        text: { body: message.body },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as { messages: Array<{ id: string }> };
    const messageId = result.messages[0].id;

    console.log(`[WhatsApp] Message sent: ${messageId}`);
    return messageId;
  }

  /**
   * Verify webhook callback from Meta
   */
  verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WhatsApp] Webhook verified');
      return challenge;
    }
    return null;
  }

  /**
   * Mark message as read
   */
  async markAsRead(
    messageId: string,
    credentials: WhatsAppCredentials
  ): Promise<void> {
    const url = `${this.baseUrl}/${this.apiVersion}/${credentials.phone_number_id}/messages`;

    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  }
}

// Export singleton instance
export const whatsappAdapter = new WhatsAppAdapter();
