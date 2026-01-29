// MoltBot Multi-Channel Gateway
// Central export for all channel adapters

export * from './base.js';
export { gmailAdapter, GmailAdapter } from './gmail.js';
export { whatsappAdapter, WhatsAppAdapter, type WhatsAppCredentials } from './whatsapp.js';
export { telegramAdapter, TelegramAdapter, type TelegramCredentials } from './telegram.js';
export { smsAdapter, SMSAdapter, type SMSCredentials } from './sms.js';
export { postgridAdapter, PostGridAdapter, type PostGridCredentials, type MailPieceType } from './postgrid.js';
export { metaAdapter, MetaAdapter, type MetaCredentials, type MetaMessageType, type MetaMessageTag, VALID_MESSAGE_TAGS } from './meta.js';

import { channelRegistry } from './base.js';
import { gmailAdapter } from './gmail.js';
import { whatsappAdapter } from './whatsapp.js';
import { telegramAdapter } from './telegram.js';
import { smsAdapter } from './sms.js';
import { postgridAdapter } from './postgrid.js';
import { metaAdapter } from './meta.js';

/**
 * Register all channel adapters
 * Call this during server startup
 */
export function registerAllChannels(): void {
  channelRegistry.register(gmailAdapter);
  channelRegistry.register(whatsappAdapter);
  channelRegistry.register(telegramAdapter);
  channelRegistry.register(smsAdapter);
  channelRegistry.register(postgridAdapter);
  channelRegistry.register(metaAdapter);

  console.log('[Channels] Registered adapters:',
    channelRegistry.all().map(a => a.channelType).join(', ')
  );
}

/**
 * Initialize all configured channels
 */
export async function initializeChannels(): Promise<void> {
  const configured = channelRegistry.getConfigured();

  console.log('[Channels] Initializing configured channels:',
    configured.map(a => a.channelType).join(', ')
  );

  await Promise.all(configured.map(adapter => adapter.initialize()));
}

// Future channel stubs (not yet implemented):
//
// iMessage via BlueBubbles:
//   - Requires Mac server running BlueBubbles
//   - REST API for sending/receiving
//   - Webhook support for incoming messages
//
// Discord:
//   - Discord Bot API
//   - Per-server (guild) configuration
//   - Slash commands + message events
//
// Signal via signal-cli:
//   - Requires signal-cli daemon
//   - REST API wrapper
//   - Phone number registration required
