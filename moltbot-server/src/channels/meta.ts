// Meta Channel Adapter for MoltBot
// Handles Facebook Messenger and Instagram DM communication

import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from './base.js';

/**
 * Meta webhook payload for incoming messages
 */
interface MetaWebhookPayload {
  object: 'page' | 'instagram';
  entry: Array<{
    id: string;
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: { url: string };
        }>;
      };
    }>;
  }>;
}

/**
 * User's Meta credentials
 */
export interface MetaCredentials {
  user_id: string;
  page_id: string;
  page_name?: string;
  page_access_token: string;
  instagram_account_id?: string;
  instagram_username?: string;
  permissions?: string[];
}

/**
 * Message types for outside 24-hour window
 */
export type MetaMessageType = 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';

/**
 * Valid message tags for MESSAGE_TAG type
 */
export const VALID_MESSAGE_TAGS = [
  'CONFIRMED_EVENT_UPDATE',
  'POST_PURCHASE_UPDATE',
  'ACCOUNT_UPDATE',
  'HUMAN_AGENT',
] as const;

export type MetaMessageTag = (typeof VALID_MESSAGE_TAGS)[number];

/**
 * Meta Channel Adapter
 * Uses Meta Graph API for Facebook Messenger and Instagram DM
 *
 * Setup per-user:
 * 1. User completes Facebook OAuth
 * 2. Grants pages_messaging and instagram_manage_messages permissions
 * 3. Store page access token in meta_dm_credentials
 *
 * Limitations:
 * - 200 DMs/hour per page
 * - 24-hour messaging window (use MESSAGE_TAG for outside window)
 * - Instagram requires Business account linked to FB Page
 */
export class MetaAdapter implements ChannelAdapter {
  readonly channelType = 'meta_dm' as const;

  private readonly apiVersion = 'v18.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  initialize(): Promise<void> {
    console.log('[Meta] Adapter initialized');
    return Promise.resolve();
  }

  isConfigured(): boolean {
    return true; // Per-user configuration
  }

  /**
   * Normalize Meta webhook to IncomingMessage
   */
  normalizeMessage(payload: MetaWebhookPayload): IncomingMessage | null {
    // Find the first message in the webhook
    for (const entry of payload.entry) {
      if (!entry.messaging) continue;

      for (const messaging of entry.messaging) {
        if (!messaging.message) continue;

        const platform = payload.object === 'instagram' ? 'instagram' : 'facebook';

        return {
          channel: 'meta_dm',
          channelMessageId: messaging.message.mid,
          from: messaging.sender.id,
          to: messaging.recipient.id,
          body: messaging.message.text || '[Media message]',
          receivedAt: new Date(messaging.timestamp).toISOString(),
          metadata: {
            platform,
            page_id: entry.id,
            has_attachments: !!messaging.message.attachments?.length,
            attachments: messaging.message.attachments,
          },
        };
      }
    }

    console.log('[Meta] No message found in webhook payload');
    return null;
  }

  /**
   * Send message via Meta Graph API
   */
  async sendMessage(
    message: OutgoingMessage & {
      platform?: 'facebook' | 'instagram';
      messageType?: MetaMessageType;
      tag?: MetaMessageTag;
    },
    credentials: MetaCredentials
  ): Promise<string> {
    if (!credentials.page_access_token) {
      throw new Error('Meta page access token not configured');
    }

    const platform = message.platform || 'facebook';

    // For Instagram, need instagram_account_id
    if (platform === 'instagram' && !credentials.instagram_account_id) {
      throw new Error('Instagram account not connected');
    }

    // Build endpoint
    const pageId = platform === 'instagram'
      ? credentials.instagram_account_id
      : credentials.page_id;

    const endpoint = `${this.baseUrl}/${this.apiVersion}/${pageId}/messages`;

    // Build message payload
    const messagePayload: Record<string, unknown> = {
      recipient: { id: message.to },
      message: { text: message.body },
    };

    // Add messaging type for Facebook (not needed for Instagram)
    if (platform === 'facebook') {
      messagePayload.messaging_type = message.messageType || 'UPDATE';

      // Add tag if using MESSAGE_TAG type
      if (message.messageType === 'MESSAGE_TAG' && message.tag) {
        if (!VALID_MESSAGE_TAGS.includes(message.tag)) {
          throw new Error(`Invalid message tag: ${message.tag}`);
        }
        messagePayload.tag = message.tag;
      }
    }

    // Send access token in body instead of URL for security (prevents token appearing in logs)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...messagePayload,
        access_token: credentials.page_access_token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorCode = data.error?.code;
      const errorMessage = data.error?.message || 'Unknown error';

      // Handle specific error codes
      if (errorCode === 10) {
        throw new Error('Permissions error. Please reconnect your Facebook Page.');
      } else if (errorCode === 551) {
        throw new Error('User has not initiated conversation. They must message your page first.');
      } else if (errorCode === 230) {
        throw new Error('Outside 24-hour messaging window. Use MESSAGE_TAG for follow-ups.');
      } else if (errorCode === 190) {
        throw new Error('Access token expired. Please reconnect your Facebook Page.');
      }

      throw new Error(`Meta API error: ${errorMessage}`);
    }

    console.log(`[Meta] Message sent: ${data.message_id} via ${platform}`);
    return data.message_id;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifyWebhookSignature(
    signature: string,
    payload: string,
    appSecret: string
  ): boolean {
    if (!signature || !payload || !appSecret) {
      console.error('[Meta] Missing signature, payload, or appSecret for verification');
      return false;
    }

    try {
      // Import crypto for Node.js environment
      const crypto = require('crypto');

      // Meta sends signature as "sha256=<hash>"
      const signatureParts = signature.split('=');
      if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
        console.error('[Meta] Invalid signature format');
        return false;
      }

      const receivedHash = signatureParts[1];

      // Calculate expected hash
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isValid) {
        console.error('[Meta] Webhook signature mismatch');
      }

      return isValid;
    } catch (error) {
      console.error('[Meta] Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle webhook verification challenge
   */
  handleVerificationChallenge(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Get user profile from Meta
   */
  async getUserProfile(
    userId: string,
    accessToken: string,
    fields: string[] = ['first_name', 'last_name', 'profile_pic']
  ): Promise<{ data: Record<string, string> | null; error?: string; errorCode?: number }> {
    try {
      // Note: GET requests with Graph API require access_token in URL
      // This is acceptable for read-only profile requests as it doesn't modify state
      // and the token exposure risk is lower than for write operations
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${userId}?fields=${fields.join(',')}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.error?.code;
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        // Distinguish between "not found" and auth errors
        if (errorCode === 190) {
          return { data: null, error: 'Access token expired', errorCode };
        }
        if (errorCode === 10) {
          return { data: null, error: 'Permission denied', errorCode };
        }
        if (response.status === 404) {
          return { data: null, error: 'User not found', errorCode: 404 };
        }

        return { data: null, error: errorMessage, errorCode };
      }

      return { data: await response.json() };
    } catch (error) {
      console.error('[Meta] Error fetching user profile:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Subscribe to webhook events
   */
  async subscribeToWebhook(
    pageId: string,
    accessToken: string,
    _callbackUrl: string,
    _verifyToken: string
  ): Promise<{ success: boolean; error?: string; errorCode?: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${pageId}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
            subscribed_fields: ['messages', 'messaging_optins', 'messaging_postbacks'],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        const errorCode = data.error?.code;
        const errorMessage = data.error?.message || 'Subscription failed';

        if (errorCode === 190) {
          return { success: false, error: 'Access token expired. Please reconnect your Facebook Page.', errorCode };
        }
        if (errorCode === 10) {
          return { success: false, error: 'Permission denied. Please grant the required permissions.', errorCode };
        }

        return { success: false, error: errorMessage, errorCode };
      }

      return { success: true };
    } catch (error) {
      console.error('[Meta] Error subscribing to webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }
}

// Export singleton instance
export const metaAdapter = new MetaAdapter();
