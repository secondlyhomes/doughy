// The Claw — Broadcast System
// Generate a response ONCE, deliver to all user-enabled channels
// Saves tokens and ensures consistent messaging

import { config } from '../config.js';
import { clawQuery } from './db.js';

export interface ChannelPreference {
  id: string;
  user_id: string;
  channel: string;
  is_enabled: boolean;
  is_primary: boolean;
  channel_config: Record<string, unknown>;
}

export interface BroadcastMessage {
  content: string;
  richContent?: {
    title?: string;
    description?: string;
    color?: string; // hex color for Discord embeds
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: string;
  };
  approvals?: Array<{
    id: string;
    title: string;
    draft_content: string;
    recipient_name?: string;
  }>;
}

/**
 * Get all enabled channels for a user
 */
export async function getUserEnabledChannels(userId: string): Promise<ChannelPreference[]> {
  return clawQuery<ChannelPreference>(
    'channel_preferences',
    `user_id=eq.${userId}&is_enabled=eq.true&select=id,user_id,channel,is_enabled,is_primary,channel_config`
  );
}

/**
 * Get the user's primary channel
 */
export async function getUserPrimaryChannel(userId: string): Promise<string> {
  const channels = await clawQuery<ChannelPreference>(
    'channel_preferences',
    `user_id=eq.${userId}&is_primary=eq.true&limit=1`
  );
  return channels[0]?.channel || 'whatsapp';
}

/**
 * Format a message for a specific channel
 */
function formatForChannel(message: BroadcastMessage, channel: string): string {
  switch (channel) {
    case 'discord':
      // Discord supports longer, richer messages
      return message.content;

    case 'whatsapp':
      // WhatsApp supports full message length
      return message.content;

    case 'sms':
      // SMS: truncate to 1500 chars, add app link if truncated
      if (message.content.length > 1500) {
        return message.content.slice(0, 1450) + '\n\n[Open the app for full details.]';
      }
      return message.content;

    case 'email':
      return message.content;

    case 'app':
      return message.content;

    default:
      return message.content;
  }
}

/**
 * Send a message to a specific channel
 */
async function sendToChannel(
  content: string,
  channel: string,
  userId: string,
  channelConfig: Record<string, unknown>
): Promise<boolean> {
  try {
    switch (channel) {
      case 'whatsapp':
        return await sendViaWhatsApp(content, channelConfig);

      case 'sms':
        return await sendViaSms(content, channelConfig);

      case 'discord':
        return await sendViaDiscord(content, userId, channelConfig);

      case 'email':
        // TODO: Implement email sending via edge function
        console.log(`[Broadcast] Email sending not yet implemented`);
        return false;

      case 'app':
        // In-app messages are delivered via Supabase Realtime
        // The message is already saved to claw.messages, so the app picks it up
        return true;

      default:
        console.log(`[Broadcast] Unknown channel: ${channel}`);
        return false;
    }
  } catch (error) {
    console.error(`[Broadcast] Failed to send to ${channel}:`, error);
    return false;
  }
}

/**
 * Send via WhatsApp (Twilio)
 */
async function sendViaWhatsApp(content: string, channelConfig: Record<string, unknown>): Promise<boolean> {
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    console.error('[Broadcast] Missing Twilio credentials for WhatsApp');
    return false;
  }

  const phone = channelConfig.phone as string;
  if (!phone) {
    console.error('[Broadcast] No phone number in WhatsApp channel config');
    return false;
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: config.twilioWhatsAppNumber,
      To: `whatsapp:${phone}`,
      Body: content,
    }).toString(),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    console.error('[Broadcast] WhatsApp send failed:', JSON.stringify(result));
    return false;
  }

  console.log(`[Broadcast] WhatsApp sent to ${phone}`);
  return true;
}

/**
 * Send via SMS (Twilio) — expensive, only when explicitly requested
 */
async function sendViaSms(content: string, channelConfig: Record<string, unknown>): Promise<boolean> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    console.error('[Broadcast] Missing Twilio credentials for SMS');
    return false;
  }

  const phone = channelConfig.phone as string;
  if (!phone) {
    console.error('[Broadcast] No phone number in SMS channel config');
    return false;
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

  // SMS: truncate to 1500 chars
  const body = content.length > 1500
    ? content.slice(0, 1450) + '\n\n[Open the app for full details.]'
    : content;

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: config.twilioPhoneNumber,
      To: phone,
      Body: body,
    }).toString(),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    console.error('[Broadcast] SMS send failed:', JSON.stringify(result));
    return false;
  }

  console.log(`[Broadcast] SMS sent to ${phone}`);
  return true;
}

/**
 * Send via Discord (uses Discord bot if configured)
 * Discord sending is handled by the Discord adapter module
 */
let discordSendFn: ((content: string, userId: string, config: Record<string, unknown>) => Promise<boolean>) | null = null;

export function registerDiscordSender(fn: (content: string, userId: string, config: Record<string, unknown>) => Promise<boolean>): void {
  discordSendFn = fn;
}

async function sendViaDiscord(content: string, userId: string, channelConfig: Record<string, unknown>): Promise<boolean> {
  if (!discordSendFn) {
    console.log('[Broadcast] Discord sender not registered');
    return false;
  }
  return discordSendFn(content, userId, channelConfig);
}

/**
 * Broadcast a message to all user's enabled channels
 * The originating channel is skipped (already handled by the reply flow)
 */
export async function broadcastMessage(
  userId: string,
  message: BroadcastMessage,
  originChannel?: string
): Promise<{ sent: string[]; failed: string[] }> {
  const enabledChannels = await getUserEnabledChannels(userId);
  const sent: string[] = [];
  const failed: string[] = [];

  for (const pref of enabledChannels) {
    // Skip the originating channel — it already got the response
    if (pref.channel === originChannel) continue;

    // Skip 'app' — delivered via Supabase Realtime automatically
    if (pref.channel === 'app') continue;

    const formatted = formatForChannel(message, pref.channel);

    // For echoed messages from other channels, prefix with source
    const echoPrefix = originChannel
      ? `[via ${originChannel}] `
      : '';
    const finalContent = echoPrefix + formatted;

    const success = await sendToChannel(finalContent, pref.channel, userId, pref.channel_config);
    if (success) {
      sent.push(pref.channel);
    } else {
      failed.push(pref.channel);
    }
  }

  if (sent.length > 0) {
    console.log(`[Broadcast] Delivered to: ${sent.join(', ')}`);
  }
  if (failed.length > 0) {
    console.log(`[Broadcast] Failed for: ${failed.join(', ')}`);
  }

  return { sent, failed };
}

/**
 * Send a proactive message to a user (e.g., morning briefing)
 * Sends to ALL enabled channels (no origin channel to skip)
 */
export async function sendProactiveMessage(
  userId: string,
  message: BroadcastMessage
): Promise<{ sent: string[]; failed: string[] }> {
  const enabledChannels = await getUserEnabledChannels(userId);
  const sent: string[] = [];
  const failed: string[] = [];

  for (const pref of enabledChannels) {
    // Skip 'app' — proactive messages are pushed via notification
    if (pref.channel === 'app') continue;

    const formatted = formatForChannel(message, pref.channel);
    const success = await sendToChannel(formatted, pref.channel, userId, pref.channel_config);
    if (success) {
      sent.push(pref.channel);
    } else {
      failed.push(pref.channel);
    }
  }

  return { sent, failed };
}
