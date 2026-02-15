// OpenClaw Gateway Server - Multi-Channel AI Property Manager
// Handles Gmail, WhatsApp, Telegram, SMS, and more
// Enhanced with security scanning and rate limiting

import express, { Request, Response, NextFunction } from 'express';
import { config } from './config.js';
import { handleIncomingEmail } from './handler.js';
import {
  registerAllChannels,
  initializeChannels,
  channelRegistry,
  messageToEmail,
  gmailAdapter,
  whatsappAdapter,
  telegramAdapter,
  smsAdapter,
  type IncomingMessage,
} from './channels/index.js';
import {
  getUserByGmailEmail,
  getUserGmailTokens,
  saveUserGmailTokens,
  getUsersNeedingWatchRenewal,
} from './supabase.js';
import {
  scanForThreats,
  quickThreatCheck,
  checkRateLimit,
  logSecurityEvent,
  type SecurityScanResult,
} from './services/security.js';
import type { GmailPubSubMessage, GmailNotification, UserGmailTokens } from './types.js';
import { handleClawSms } from './claw/controller.js';
import clawRoutes from './claw/routes.js';

const app = express();

/** Escape special characters for safe XML/TwiML embedding */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\]\]>/g, ']]&gt;')
    .replace(/<\?/g, '&lt;?');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// CORS — restrict to known origins
const ALLOWED_ORIGINS = [
  'https://openclaw.doughy.app',
  'https://doughy.app',
  'http://localhost:8081',  // Expo dev
  'http://localhost:19006', // Expo web
];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// Security Middleware
// =============================================================================

/**
 * Security scanning middleware for webhook endpoints
 * Scans incoming message content for threats before processing
 */
function securityMiddleware(channel: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract message content based on channel
      let messageContent = '';
      let userId: string | null = null;

      if (channel === 'gmail') {
        // Gmail content is base64 encoded, will be processed later
        // Just do basic check on the raw body
        messageContent = JSON.stringify(req.body);
      } else if (channel === 'whatsapp') {
        // WhatsApp message structure
        const entry = req.body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];
        messageContent = message?.text?.body || message?.caption || '';
      } else if (channel === 'telegram') {
        messageContent = req.body?.message?.text || '';
      } else if (channel === 'sms') {
        messageContent = req.body?.Body || '';
      }

      // Quick threat check for obvious attacks
      if (messageContent && quickThreatCheck(messageContent)) {
        console.log(`[Security] Quick threat detected on ${channel} channel`);

        // Full scan for detailed analysis
        const scanResult = scanForThreats(messageContent);

        if (scanResult.action === 'blocked') {
          // Log the security event
          await logSecurityEvent(userId, scanResult, channel, messageContent);

          console.log(`[Security] Blocked message on ${channel}: ${scanResult.threats.join(', ')}`);

          // Return success to acknowledge webhook but don't process
          if (channel === 'sms') {
            return res.type('text/xml').send('<Response></Response>');
          }
          return res.sendStatus(200);
        }

        // Store scan result for later use
        (req as any).securityScan = scanResult;
      }

      next();
    } catch (error) {
      console.error(`[Security] Middleware error:`, error);
      // Don't block on security errors, let the request through
      next();
    }
  };
}

/**
 * Rate limiting middleware
 */
function rateLimitMiddleware(channel: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For webhooks, we need to extract user ID from the message context
      // This is a simplified version - full implementation would look up user from email/phone
      const userId = 'webhook'; // Placeholder - actual implementation needs user lookup

      // Check burst limit first
      const burstCheck = checkRateLimit(userId, channel, 'burst');
      if (!burstCheck.allowed) {
        console.log(`[RateLimit] Burst limit exceeded for ${channel}`);
        // Return success to acknowledge webhook but log the event
        if (channel === 'sms') {
          return res.type('text/xml').send('<Response></Response>');
        }
        return res.sendStatus(200);
      }

      // Check channel limit
      const channelCheck = checkRateLimit(userId, channel, 'channel');
      if (!channelCheck.allowed) {
        console.log(`[RateLimit] Channel limit exceeded for ${channel}`);
        if (channel === 'sms') {
          return res.type('text/xml').send('<Response></Response>');
        }
        return res.sendStatus(200);
      }

      // Store rate limit info for logging
      (req as any).rateLimit = {
        burst: burstCheck,
        channel: channelCheck,
      };

      next();
    } catch (error) {
      console.error(`[RateLimit] Middleware error:`, error);
      next();
    }
  };
}

// ============================================================================
// Health & Status Endpoints
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

app.get('/status', async (_req: Request, res: Response) => {
  try {
    const supabaseOk = await fetch(`${config.supabaseUrl}/rest/v1/`, {
      headers: { apikey: config.supabaseServiceKey },
    })
      .then((r) => r.ok)
      .catch(() => false);

    const channels = channelRegistry.all().map((adapter) => ({
      channel: adapter.channelType,
      configured: adapter.isConfigured(),
    }));

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseOk ? 'connected' : 'error',
      },
      channels,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Unified Message Processing
// ============================================================================

/**
 * Process an incoming message from any channel
 */
async function processMessage(
  message: IncomingMessage,
  userId: string
): Promise<{ success: boolean; action: string; error?: string }> {
  // Convert to email format for existing handler (maintains compatibility)
  const email = messageToEmail(message);

  // Add channel info to the email body for platform detection
  if (message.channel !== 'email') {
    email.from = `[${message.channel.toUpperCase()}] ${email.from}`;
  }

  console.log(`[Gateway] Processing ${message.channel} message from ${message.from}`);

  const result = await handleIncomingEmail(email, userId);

  // If auto-sent, send via the original channel
  if (result.action === 'auto_sent' && result.aiResponse) {
    const adapter = channelRegistry.get(message.channel);
    if (adapter) {
      try {
        // TODO: Get user credentials for this channel
        // For now, only Gmail has full implementation
        if (message.channel === 'email') {
          const userTokens = await getUserGmailTokens(userId);
          if (userTokens) {
            await adapter.sendMessage(
              {
                channel: message.channel,
                to: message.from,
                body: result.aiResponse.suggestedResponse,
                subject: message.subject?.startsWith('Re:')
                  ? message.subject
                  : `Re: ${message.subject || 'Your inquiry'}`,
                replyToMessageId: message.channelMessageId,
                replyToThreadId: message.channelThreadId,
              },
              userTokens
            );
          }
        }
      } catch (err) {
        console.error(`[Gateway] Failed to send reply via ${message.channel}:`, err);
      }
    }
  }

  return {
    success: result.success,
    action: result.action,
    error: result.error,
  };
}

// ============================================================================
// Gmail Webhook (Pub/Sub)
// ============================================================================

app.post('/webhooks/gmail', rateLimitMiddleware('gmail'), securityMiddleware('gmail'), async (req: Request, res: Response) => {
  try {
    const pubsubMessage = req.body as GmailPubSubMessage;

    if (!pubsubMessage.message?.data) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    const data = JSON.parse(
      Buffer.from(pubsubMessage.message.data, 'base64').toString()
    ) as GmailNotification;

    console.log(`[Gmail] Notification for ${data.emailAddress}`);

    const user = await getUserByGmailEmail(data.emailAddress);
    if (!user) {
      return res.sendStatus(200);
    }

    const userTokens = await getUserGmailTokens(user.user_id);
    if (!userTokens) {
      return res.sendStatus(200);
    }

    const { messages } = await gmailAdapter.getNewMessages(
      userTokens,
      userTokens.history_id
    );

    for (const gmailMessage of messages) {
      const message = gmailAdapter.normalizeMessage(gmailMessage);
      if (!message) continue;

      // Skip sent messages
      if (message.from.includes(data.emailAddress)) continue;

      await processMessage(message, user.user_id);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Gmail] Webhook error:', error);
    res.sendStatus(200);
  }
});

// ============================================================================
// WhatsApp Webhook
// ============================================================================

// Verification endpoint for Meta
app.get('/webhooks/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  // TODO: Get verify token from user settings
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'openclaw-verify';

  const result = whatsappAdapter.verifyWebhook(mode, token, challenge, verifyToken);
  if (result) {
    res.status(200).send(result);
  } else {
    res.sendStatus(403);
  }
});

// Message webhook
app.post('/webhooks/whatsapp', rateLimitMiddleware('whatsapp'), securityMiddleware('whatsapp'), async (req: Request, res: Response) => {
  try {
    const message = whatsappAdapter.normalizeMessage(req.body);

    if (!message) {
      return res.sendStatus(200); // Acknowledge non-message events
    }

    // TODO: Look up user by WhatsApp phone number
    // For now, this is a placeholder
    console.log(`[WhatsApp] Message from ${message.from}: ${message.body}`);

    // const user = await getUserByWhatsAppNumber(message.to);
    // if (user) {
    //   await processMessage(message, user.user_id);
    // }

    res.sendStatus(200);
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
    res.sendStatus(200);
  }
});

// ============================================================================
// Telegram Webhook
// ============================================================================

app.post('/webhooks/telegram', rateLimitMiddleware('telegram'), securityMiddleware('telegram'), async (req: Request, res: Response) => {
  try {
    const message = telegramAdapter.normalizeMessage(req.body);

    if (!message) {
      return res.sendStatus(200);
    }

    console.log(`[Telegram] Message from ${message.fromName}: ${message.body}`);

    // TODO: Look up user by Telegram bot/chat configuration
    // const user = await getUserByTelegramChat(message.to);
    // if (user) {
    //   await processMessage(message, user.user_id);
    // }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Telegram] Webhook error:', error);
    res.sendStatus(200);
  }
});

// ============================================================================
// SMS Webhook (Twilio)
// ============================================================================

app.post('/webhooks/sms', rateLimitMiddleware('sms'), securityMiddleware('sms'), async (req: Request, res: Response) => {
  try {
    const message = smsAdapter.normalizeMessage(req.body);

    if (!message) {
      return res.type('text/xml').send('<Response></Response>');
    }

    console.log(`[SMS] Message from ${message.from}: ${message.body}`);

    // Route to The Claw controller if enabled
    if (config.clawEnabled) {
      const reply = await handleClawSms({
        from: message.from,
        to: message.to,
        body: message.body,
        messageSid: message.channelMessageId,
      });

      if (reply) {
        // Truncate for SMS limit
        const truncated = reply.length > 1500
          ? reply.slice(0, 1450) + '\n\n[Open the app for full details.]'
          : reply;

        return res.type('text/xml').send(
          `<Response><Message>${escapeXml(truncated)}</Message></Response>`
        );
      }
    }

    // Twilio expects TwiML response
    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('[SMS] Webhook error:', error);
    res.type('text/xml').send('<Response></Response>');
  }
});

// ============================================================================
// OAuth Flows
// ============================================================================

// Gmail OAuth
app.get('/oauth/gmail/start', (req: Request, res: Response) => {
  const userId = req.query.user_id as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  res.redirect(gmailAdapter.getAuthUrl(userId));
});

app.get('/oauth/gmail/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const userId = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      return res.redirect(`doughy://settings/openclaw?error=${encodeURIComponent(error)}`);
    }

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const tokens = await gmailAdapter.exchangeCodeForTokens(code);

    const userTokens: UserGmailTokens = {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      gmail_email: tokens.email,
      history_id: '0',
      watch_expiration: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveUserGmailTokens(userTokens);
    await gmailAdapter.startWatch(userTokens);

    res.redirect('doughy://settings/openclaw?success=true&channel=gmail');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.redirect(`doughy://settings/openclaw?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Legacy route (backwards compatibility)
app.get('/oauth/start', (req: Request, res: Response) => {
  req.query.user_id
    ? res.redirect(`/oauth/gmail/start?user_id=${req.query.user_id}`)
    : res.status(400).json({ error: 'Missing user_id' });
});

app.get('/oauth/callback', (req: Request, res: Response) => {
  // Forward to Gmail callback
  const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
  res.redirect(`/oauth/gmail/callback?${queryString}`);
});

// Disconnect channel
app.post('/oauth/disconnect', async (req: Request, res: Response) => {
  try {
    const { user_id, channel = 'gmail' } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    if (channel === 'gmail') {
      const userTokens = await getUserGmailTokens(user_id);
      if (userTokens) {
        try {
          await gmailAdapter.stopWatch(userTokens);
        } catch (err) {
          console.log('[OAuth] Could not stop watch');
        }

        await fetch(
          `${config.supabaseUrl}/rest/v1/user_gmail_tokens?user_id=eq.${user_id}`,
          {
            method: 'DELETE',
            headers: {
              apikey: config.supabaseServiceKey,
              Authorization: `Bearer ${config.supabaseServiceKey}`,
            },
          }
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Cron Endpoints
// ============================================================================

app.post('/cron/renew-watches', async (req: Request, res: Response) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (config.nodeEnv === 'production' && cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = await getUsersNeedingWatchRenewal();
    const results: Array<{ userId: string; success: boolean; error?: string }> = [];

    for (const userTokens of users) {
      try {
        await gmailAdapter.startWatch(userTokens);
        results.push({ userId: userTokens.user_id, success: true });
      } catch (error) {
        results.push({
          userId: userTokens.user_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      renewed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Development/Testing Endpoints
// ============================================================================

if (config.nodeEnv !== 'production') {
  app.post('/test/process-message', async (req: Request, res: Response) => {
    try {
      const { message, user_id } = req.body;
      if (!message || !user_id) {
        return res.status(400).json({ error: 'Missing message or user_id' });
      }
      const result = await processMessage(message, user_id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/test/channels', (_req: Request, res: Response) => {
    res.json({
      registered: channelRegistry.all().map((a) => a.channelType),
      configured: channelRegistry.getConfigured().map((a) => a.channelType),
    });
  });
}

// ============================================================================
// The Claw API Routes
// ============================================================================

app.use('/api/claw', clawRoutes);

// ============================================================================
// Error Handling
// ============================================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================================================
// Start Server
// ============================================================================

async function start() {
  // Register and initialize channels
  registerAllChannels();
  await initializeChannels();

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🤖 OpenClaw Gateway - Multi-Channel AI Property Manager     ║
║                                                              ║
║   Environment: ${config.nodeEnv.padEnd(44)}║
║   Port: ${config.port.toString().padEnd(51)}║
║                                                              ║
║   Channels:                                                  ║
║   ├─ 📧 Gmail     → /webhooks/gmail                          ║
║   ├─ 💬 WhatsApp  → /webhooks/whatsapp                       ║
║   ├─ ✈️  Telegram  → /webhooks/telegram                       ║
║   └─ 📱 SMS       → /webhooks/sms                            ║
║                                                              ║
║   The Claw: ${config.clawEnabled ? 'ENABLED ' : 'DISABLED'}                                         ║
║   └─ API: /api/claw/*                                        ║
║                                                              ║
║   OAuth:                                                     ║
║   └─ Gmail: /oauth/gmail/start?user_id=...                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);

export default app;
