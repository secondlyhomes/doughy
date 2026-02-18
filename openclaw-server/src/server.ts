// OpenClaw Gateway Server - Multi-Channel AI Property Manager
// Handles Gmail, WhatsApp, Telegram, SMS, and more
// Enhanced with security scanning and rate limiting

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
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
import { handleClawSms, handleClawMessage } from './claw/controller.js';
import { routeInboundMessage } from './claw/router.js';
import { lookupUserByChannel } from './claw/db.js';
import { sendTwilioMessage } from './claw/twilio.js';
import { logCost } from './claw/costs.js';
import clawRoutes from './claw/routes.js';
import callpilotRoutes from './callpilot/routes.js';
import messageRoutes from './messages/routes.js';
import { voiceWebhookRouter } from './callpilot/voice.js';
import { initDiscordBot } from './claw/discord.js';
import { startQueueProcessor, stopQueueProcessor } from './claw/queue.js';
import { hasAudioMedia, processVoiceNote } from './claw/voicenotes.js';
import { runMorningBriefings, runFollowUpNudges } from './claw/scheduler.js';
import { captureInboundEmail } from './services/email-capture.js';
import { demoDataRouter } from './demo-data.js';

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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // For Twilio webhooks

// CORS — restrict to known origins
const ALLOWED_ORIGINS = [
  'https://openclaw.doughy.app',
  'https://doughy.app',
  'http://localhost:8081',  // Expo dev
  'http://localhost:19006', // Expo web
];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
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
      // Extract sender identifier from the request body per channel
      let userId = 'unknown';
      if (channel === 'sms') {
        userId = req.body?.From || 'unknown-sms';
      } else if (channel === 'whatsapp') {
        const entry = req.body?.entry?.[0];
        const msg = entry?.changes?.[0]?.value?.messages?.[0];
        userId = msg?.from || 'unknown-whatsapp';
      } else if (channel === 'telegram') {
        userId = String(req.body?.message?.from?.id || 'unknown-telegram');
      } else if (channel === 'gmail') {
        // Gmail Pub/Sub doesn't carry sender info in the webhook — use email address from decoded data
        try {
          const data = req.body?.message?.data
            ? JSON.parse(Buffer.from(req.body.message.data, 'base64').toString())
            : null;
          userId = data?.emailAddress || 'unknown-gmail';
        } catch {
          userId = 'unknown-gmail';
        }
      }

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
// Twilio Webhook Signature Validation
// ============================================================================

/**
 * Validate that an inbound request actually came from Twilio.
 * Uses HMAC-SHA1 of (URL + sorted POST params) with the auth token as key.
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Sort POST params by key, append key+value to URL
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * Express middleware to reject requests without valid Twilio signatures.
 * Skips validation if no auth token is configured (dev mode).
 */
function twilioSignatureMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip validation if no auth token configured (local dev)
    if (!config.twilioAuthToken) {
      return next();
    }

    const signature = req.headers['x-twilio-signature'] as string;
    if (!signature) {
      console.warn('[Security] Missing X-Twilio-Signature header — rejecting webhook');
      return res.type('text/xml').status(403).send('<Response></Response>');
    }

    // Reconstruct the full public URL that Twilio signed against.
    // Behind nginx SSL termination, Express sees http:// but Twilio used https://
    const publicUrl = config.serverUrl + req.originalUrl;
    const params = req.body as Record<string, string>;

    if (!validateTwilioSignature(config.twilioAuthToken, signature, publicUrl, params)) {
      console.warn('[Security] Invalid Twilio signature — rejecting webhook');
      console.warn(`[Security] Validated against URL: ${publicUrl} — ensure SERVER_URL matches public URL`);
      return res.type('text/xml').status(403).send('<Response></Response>');
    }

    next();
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

      // Capture inbound email in CRM (async, non-blocking)
      captureInboundEmail(user.user_id, {
        from: message.from,
        fromName: message.fromName || message.from,
        to: data.emailAddress,
        subject: message.subject || '',
        body: message.body,
        receivedAt: new Date().toISOString(),
        messageId: message.channelMessageId,
        threadId: message.channelThreadId,
      }).catch((err) => {
        console.error('[Gmail] Email capture failed:', err);
      });
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

// Message webhook (direct Meta WhatsApp Business API — not via Twilio)
app.post('/webhooks/whatsapp', rateLimitMiddleware('whatsapp'), securityMiddleware('whatsapp'), async (req: Request, res: Response) => {
  try {
    const message = whatsappAdapter.normalizeMessage(req.body);

    if (!message) {
      return res.sendStatus(200); // Acknowledge non-message events
    }

    console.log(`[WhatsApp] Message from ${message.from}: ${message.body}`);

    // Respond immediately so Meta doesn't retry
    res.sendStatus(200);

    if (!config.clawEnabled) return;

    // Look up user by WhatsApp phone number in claw.channel_preferences
    const match = await lookupUserByChannel('whatsapp', 'phone_number', message.from);

    if (!match) {
      console.log(`[WhatsApp] No registered user for phone ${message.from}`);
      return;
    }

    const response = await handleClawMessage(match.user_id, message.body, 'whatsapp');
    console.log(`[WhatsApp] Reply to ${message.from}: ${response.message.slice(0, 100)}...`);

    // Reply via Meta WhatsApp API if configured and credentials available
    if (whatsappAdapter.isConfigured() && match.channel_config) {
      await whatsappAdapter.sendMessage(
        { channel: 'whatsapp', to: message.from, body: response.message },
        match.channel_config as unknown as import('./channels/whatsapp.js').WhatsAppCredentials
      );
    }
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
    if (!res.headersSent) res.sendStatus(200);
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

    // Respond immediately so Telegram doesn't retry
    res.sendStatus(200);

    if (!config.clawEnabled) return;

    // Look up user by Telegram chat_id in claw.channel_preferences
    const match = await lookupUserByChannel('telegram', 'chat_id', message.from);

    if (!match) {
      console.log(`[Telegram] No registered user for chat ${message.from}`);
      return;
    }

    const response = await handleClawMessage(match.user_id, message.body, 'telegram');
    console.log(`[Telegram] Reply to ${message.fromName}: ${response.message.slice(0, 100)}...`);

    // Reply via Telegram Bot API if configured and credentials available
    if (telegramAdapter.isConfigured() && match.channel_config) {
      await telegramAdapter.sendMessage(
        { channel: 'telegram', to: message.from, body: response.message },
        match.channel_config as unknown as import('./channels/telegram.js').TelegramCredentials
      );
    }
  } catch (error) {
    console.error('[Telegram] Webhook error:', error);
    if (!res.headersSent) res.sendStatus(200);
  }
});

// ============================================================================
// SMS Webhook (Twilio)
// ============================================================================

app.post('/webhooks/sms', twilioSignatureMiddleware(), rateLimitMiddleware('sms'), securityMiddleware('sms'), async (req: Request, res: Response) => {
  try {
    const message = smsAdapter.normalizeMessage(req.body);

    if (!message) {
      return res.type('text/xml').send('<Response></Response>');
    }

    // Detect WhatsApp messages (From field has "whatsapp:" prefix)
    const isWhatsApp = message.from.startsWith('whatsapp:');
    const channel = isWhatsApp ? 'whatsapp' : 'sms';
    // Strip whatsapp: prefix for phone→user lookup and logging
    const phoneNumber = isWhatsApp ? message.from.replace('whatsapp:', '') : message.from;

    console.log(`[${channel.toUpperCase()}] Message from ${phoneNumber}: ${message.body}`);

    // Respond immediately with empty TwiML so Twilio doesn't timeout
    res.type('text/xml').send('<Response></Response>');

    // Smart message routing — handles Claw users, lead replies, and unknown senders
    if (config.clawEnabled) {
      // Check for voice notes (WhatsApp/SMS audio attachments)
      let messageBody = message.body;
      if (hasAudioMedia(req.body)) {
        const clawUserId = config.phoneUserMap[phoneNumber];
        const transcription = await processVoiceNote(req.body, clawUserId);
        if (transcription) {
          // Use transcribed text instead of (or alongside) the body
          messageBody = messageBody
            ? `${messageBody}\n\n[Voice note]: ${transcription.text}`
            : transcription.text;
          console.log(`[${channel.toUpperCase()}] Voice note transcribed for ${phoneNumber}`);
        } else {
          console.log(`[${channel.toUpperCase()}] Voice note from ${phoneNumber} could not be transcribed`);
        }
      }

      const routingResult = await routeInboundMessage(
        phoneNumber,
        message.to.replace('whatsapp:', ''),
        messageBody,
        channel as any,
        message.channelMessageId
      );

      // Only send a reply for Claw responses (lead replies get notifications, not auto-replies)
      if (routingResult.type === 'claw_response' && routingResult.reply) {
        const reply = routingResult.reply;

        if (!config.twilioAccountSid || !config.twilioAuthToken) {
          console.error(`[${channel.toUpperCase()}] Reply generated but cannot send — missing Twilio credentials`);
        } else {
          // WhatsApp supports longer messages; SMS needs truncation
          const body = isWhatsApp
            ? reply
            : (reply.length > 1500
              ? reply.slice(0, 1450) + '\n\n[Open the app for full details.]'
              : reply);

          const fromNumber = isWhatsApp
            ? config.twilioWhatsAppNumber
            : config.twilioPhoneNumber;
          const toNumber = message.from; // whatsapp: prefix preserved for WhatsApp, plain for SMS

          const result = await sendTwilioMessage({ from: fromNumber, to: toNumber, body });
          if (result.success) {
            console.log(`[${channel.toUpperCase()}] Reply sent to ${phoneNumber}, SID: ${result.sid}`);
            // Log Twilio cost
            const costCents = isWhatsApp ? 0.5 : 0.75; // WhatsApp ~$0.005/msg, SMS ~$0.0075/segment
            logCost(routingResult.userId || 'system', 'twilio', channel, costCents)
              .catch((err) => console.error('[SMS] Cost logging failed:', err));
          } else {
            console.error(`[${channel.toUpperCase()}] Twilio send failed: ${result.error}`);
          }
        }
      } else if (routingResult.type !== 'claw_response') {
        console.log(`[${channel.toUpperCase()}] Routed as ${routingResult.type} for ${phoneNumber}`);
      }
    }
  } catch (error) {
    console.error('[SMS] Webhook error:', error);
    if (!res.headersSent) {
      res.type('text/xml').send('<Response></Response>');
    }
  }
});

// ============================================================================
// OAuth Flows
// ============================================================================

// Gmail OAuth
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

app.get('/oauth/gmail/start', (req: Request, res: Response) => {
  const userId = req.query.user_id as string;
  if (!userId || !UUID_RE.test(userId)) {
    return res.status(400).json({ error: 'Invalid or missing user_id' });
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

    if (!code || !userId || !UUID_RE.test(userId)) {
      return res.status(400).json({ error: 'Missing or invalid code/state' });
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
  const userId = req.query.user_id as string;
  userId && UUID_RE.test(userId)
    ? res.redirect(`/oauth/gmail/start?user_id=${userId}`)
    : res.status(400).json({ error: 'Invalid or missing user_id' });
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

    if (!user_id || !UUID_RE.test(user_id)) {
      return res.status(400).json({ error: 'Invalid or missing user_id' });
    }

    if (channel === 'gmail') {
      const userTokens = await getUserGmailTokens(user_id);
      if (userTokens) {
        try {
          await gmailAdapter.stopWatch(userTokens);
        } catch (err) {
          console.log('[OAuth] Could not stop watch');
        }

        const delRes = await fetch(
          `${config.supabaseUrl}/rest/v1/user_gmail_tokens?user_id=eq.${user_id}`,
          {
            method: 'DELETE',
            headers: {
              apikey: config.supabaseServiceKey,
              Authorization: `Bearer ${config.supabaseServiceKey}`,
            },
          }
        );
        if (!delRes.ok) {
          console.error(`[OAuth] Failed to delete Gmail tokens: ${delRes.status}`);
          return res.status(500).json({ error: 'Failed to disconnect channel' });
        }
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

app.post('/cron/morning-briefing', async (req: Request, res: Response) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (config.nodeEnv === 'production' && (!config.cronSecret || cronSecret !== config.cronSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await runMorningBriefings();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] Morning briefing error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/cron/follow-up-nudges', async (req: Request, res: Response) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (config.nodeEnv === 'production' && (!config.cronSecret || cronSecret !== config.cronSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await runFollowUpNudges();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] Follow-up nudges error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/cron/renew-watches', async (req: Request, res: Response) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (config.nodeEnv === 'production' && (!config.cronSecret || cronSecret !== config.cronSecret)) {
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
// Demo Endpoints (simulate external integrations for demos)
// ============================================================================

app.post('/api/demo/simulate-email', async (req: Request, res: Response) => {
  try {
    const { from, from_name, subject, body, user_id } = req.body;

    if (!from || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: from, subject, body' });
    }

    // Use provided user_id or default demo user
    const userId = user_id || '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce';

    const result = await captureInboundEmail(userId, {
      from,
      fromName: from_name || from.split('@')[0],
      to: 'admin@doughy.app',
      subject,
      body,
      receivedAt: new Date().toISOString(),
      messageId: `demo-${Date.now()}`,
    });

    res.json({
      success: true,
      ...result,
      message: `Email from ${from_name || from} captured. Contact ${result.is_new_contact ? 'created' : 'matched'}. Sentiment: ${result.sentiment || 'unknown'}.`,
    });
  } catch (error) {
    console.error('[Demo] Simulate email error:', error);
    res.status(500).json({ error: 'Failed to process simulated email' });
  }
});

app.post('/api/demo/simulate-sms', async (req: Request, res: Response) => {
  try {
    const { message, user_id, channel } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing required field: message' });
    }

    const userId = user_id || '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce';
    const result = await handleClawMessage(userId, message, channel || 'app');

    res.json({
      success: true,
      response: result.message,
      task_id: result.task_id,
      approvals_created: result.approvals_created,
    });
  } catch (error) {
    console.error('[Demo] Simulate SMS error:', error);
    res.status(500).json({ error: 'Failed to process simulated message' });
  }
});

// ============================================================================
// Demo Data Management (dev only — seed/reset/delete/verify)
// ============================================================================

app.use('/api/demo/seed-data', (req: Request, res: Response, next: NextFunction) => {
  // Require DEMO_SEED_ENABLED=true on the server to allow seed operations
  if (process.env.DEMO_SEED_ENABLED !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}, demoDataRouter);

// ============================================================================
// The Claw API Routes
// ============================================================================

app.use('/api/claw', clawRoutes);
app.use('/api/calls', callpilotRoutes);
app.use('/api/messages', messageRoutes);
app.use('/webhooks/voice', voiceWebhookRouter);

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

  // Initialize Discord bot (non-blocking)
  initDiscordBot().catch((err) => {
    console.error('[Server] Discord bot init failed:', err);
  });

  // Start the action queue processor (5s interval)
  startQueueProcessor();

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
║   CallPilot: ENABLED                                          ║
║   └─ API: /api/calls/*                                        ║
║                                                              ║
║   OAuth:                                                     ║
║   └─ Gmail: /oauth/gmail/start?user_id=...                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully...`);
  stopQueueProcessor();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
