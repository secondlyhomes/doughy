// Telegram Channel Adapter for MoltBot
// Handles Telegram Bot API communication

import { config } from '../config.js';
import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from './base.js';

/**
 * Telegram webhook update payload
 */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    photo?: Array<{ file_id: string; file_size: number }>;
    document?: { file_id: string; file_name: string; mime_type: string };
  };
}

/**
 * User's Telegram bot credentials
 */
export interface TelegramCredentials {
  user_id: string;
  bot_token: string;
  bot_username: string;
}

/**
 * Telegram Channel Adapter
 * Uses Telegram Bot API
 *
 * Setup required:
 * 1. Create bot via @BotFather
 * 2. Get bot token
 * 3. Set webhook: https://api.telegram.org/bot<token>/setWebhook?url=https://moltbot.doughy.app/webhooks/telegram
 */
export class TelegramAdapter implements ChannelAdapter {
  readonly channelType = 'telegram' as const;

  private readonly baseUrl = 'https://api.telegram.org';

  initialize(): Promise<void> {
    console.log('[Telegram] Adapter initialized');
    return Promise.resolve();
  }

  isConfigured(): boolean {
    return true; // Per-user configuration
  }

  /**
   * Normalize Telegram update to IncomingMessage
   */
  normalizeMessage(update: TelegramUpdate): IncomingMessage | null {
    const message = update.message;

    if (!message?.text) {
      console.log('[Telegram] Ignoring non-text message');
      return null;
    }

    const fromName = [message.from.first_name, message.from.last_name]
      .filter(Boolean)
      .join(' ');

    return {
      channel: 'telegram',
      channelMessageId: message.message_id.toString(),
      from: message.from.id.toString(),
      fromName: fromName || message.from.username,
      to: message.chat.id.toString(),
      body: message.text,
      receivedAt: new Date(message.date * 1000).toISOString(),
      metadata: {
        chat_id: message.chat.id,
        chat_type: message.chat.type,
        username: message.from.username,
        update_id: update.update_id,
      },
    };
  }

  /**
   * Send a message via Telegram Bot API
   */
  async sendMessage(
    message: OutgoingMessage,
    credentials: TelegramCredentials
  ): Promise<string> {
    const url = `${this.baseUrl}/bot${credentials.bot_token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.to,
        text: message.body,
        reply_to_message_id: message.replyToMessageId
          ? parseInt(message.replyToMessageId, 10)
          : undefined,
        parse_mode: 'HTML', // Supports <b>, <i>, <code>, etc.
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as {
      ok: boolean;
      result: { message_id: number };
    };

    const messageId = result.result.message_id.toString();
    console.log(`[Telegram] Message sent: ${messageId}`);
    return messageId;
  }

  /**
   * Set webhook URL for a bot
   */
  async setWebhook(
    botToken: string,
    webhookUrl: string
  ): Promise<boolean> {
    const url = `${this.baseUrl}/bot${botToken}/setWebhook`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    });

    const result = (await response.json()) as { ok: boolean };
    return result.ok;
  }

  /**
   * Get bot info
   */
  async getBotInfo(botToken: string): Promise<{ id: number; username: string }> {
    const url = `${this.baseUrl}/bot${botToken}/getMe`;
    const response = await fetch(url);
    const result = (await response.json()) as {
      ok: boolean;
      result: { id: number; username: string };
    };
    return result.result;
  }
}

// Export singleton instance
export const telegramAdapter = new TelegramAdapter();
