// Base channel interface for OpenClaw multi-channel gateway
// All channels (Gmail, WhatsApp, Telegram, etc.) implement this interface

import type { IncomingEmail, WebhookResult } from '../types.js';

/**
 * Normalized message from any channel
 */
export interface IncomingMessage {
  // Source identification
  channel: ChannelType;
  channelMessageId: string;
  channelThreadId?: string;

  // Sender info
  from: string; // Email, phone number, or platform ID
  fromName?: string;

  // Recipient (the landlord)
  to: string;

  // Content
  subject?: string;
  body: string;
  attachments?: Attachment[];

  // Metadata
  receivedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Attachment {
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
  url?: string;
  data?: string; // Base64 encoded
  filename?: string;
  mimeType?: string;
}

export type ChannelType =
  | 'email'
  | 'whatsapp'
  | 'telegram'
  | 'imessage'
  | 'discord'
  | 'signal'
  | 'sms'
  | 'direct_mail'
  | 'meta_dm';

/**
 * Outgoing message to send via a channel
 */
export interface OutgoingMessage {
  channel: ChannelType;
  to: string;
  body: string;
  subject?: string; // For email
  replyToMessageId?: string;
  replyToThreadId?: string;
}

/**
 * Base interface for all channel adapters
 */
export interface ChannelAdapter {
  readonly channelType: ChannelType;

  /**
   * Initialize the channel (connect, authenticate, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Check if the channel is properly configured and ready
   */
  isConfigured(): boolean;

  /**
   * Send a message via this channel
   */
  sendMessage(message: OutgoingMessage, userCredentials: unknown): Promise<string>;

  /**
   * Convert channel-specific message format to normalized IncomingMessage
   */
  normalizeMessage(rawMessage: unknown): IncomingMessage | null;

  /**
   * Get user's channel-specific credentials/tokens
   */
  getUserCredentials?(userId: string): Promise<unknown>;
}

/**
 * Convert IncomingMessage to the IncomingEmail format used by the handler
 * This maintains backwards compatibility with existing edge functions
 */
export function messageToEmail(message: IncomingMessage): IncomingEmail {
  return {
    from: message.fromName ? `${message.fromName} <${message.from}>` : message.from,
    to: message.to,
    subject: message.subject || `${message.channel} message`,
    body: message.body,
    receivedAt: message.receivedAt,
    messageId: message.channelMessageId,
    threadId: message.channelThreadId,
  };
}

/**
 * Registry of all available channel adapters
 */
export class ChannelRegistry {
  private adapters = new Map<ChannelType, ChannelAdapter>();

  register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channelType, adapter);
  }

  get(channelType: ChannelType): ChannelAdapter | undefined {
    return this.adapters.get(channelType);
  }

  getConfigured(): ChannelAdapter[] {
    return Array.from(this.adapters.values()).filter((a) => a.isConfigured());
  }

  all(): ChannelAdapter[] {
    return Array.from(this.adapters.values());
  }
}

// Global channel registry
export const channelRegistry = new ChannelRegistry();
