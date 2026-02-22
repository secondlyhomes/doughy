// OpenClaw Server Configuration
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  // Server
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  serverUrl: optionalEnv('SERVER_URL', 'http://localhost:3000'),

  // Supabase
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceKey: requireEnv('SUPABASE_SECRET_KEY'),
  supabasePublishableKey: optionalEnv('SUPABASE_PUBLISHABLE_KEY', optionalEnv('SUPABASE_ANON_KEY', '')),

  // Google OAuth
  googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  googleRedirectUri: optionalEnv(
    'GOOGLE_REDIRECT_URI',
    'https://openclaw.doughy.app/oauth/callback'
  ),

  // Google Cloud
  googleCloudProjectId: requireEnv('GOOGLE_CLOUD_PROJECT_ID'),
  gmailPubSubTopic: optionalEnv('GMAIL_PUBSUB_TOPIC', 'gmail-notifications'),

  // Anthropic
  anthropicApiKey: optionalEnv('ANTHROPIC_API_KEY', ''),

  // Encryption (for decrypting per-user API keys from security_api_keys)
  keySecret: optionalEnv('KEY_SECRET', ''),

  // Twilio (for The Claw SMS)
  twilioAccountSid: optionalEnv('TWILIO_ACCOUNT_SID', ''),
  twilioAuthToken: optionalEnv('TWILIO_AUTH_TOKEN', ''),
  twilioPhoneNumber: optionalEnv('TWILIO_PHONE_NUMBER', ''),
  twilioWhatsAppNumber: optionalEnv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886'), // Sandbox default

  // Deepgram (for CallPilot transcription)
  deepgramApiKey: optionalEnv('DEEPGRAM_API_KEY', ''),

  // Discord
  discordBotToken: optionalEnv('DISCORD_BOT_TOKEN', ''),
  discordChannelId: optionalEnv('DISCORD_CHANNEL_ID', ''),

  // Bland AI (for AI calling)
  blandApiKey: optionalEnv('BLAND_API_KEY', ''),

  // WhatsApp (Meta)
  whatsappVerifyToken: optionalEnv('WHATSAPP_VERIFY_TOKEN', 'openclaw-verify'),

  // Cron
  cronSecret: optionalEnv('CRON_SECRET', ''),

  // The Claw
  clawEnabled: optionalEnv('CLAW_ENABLED', 'true') === 'true',
  clawDefaultModel: optionalEnv('CLAW_DEFAULT_MODEL', 'claude-sonnet-4-5-20250929'),
  clawPhoneUserMap: optionalEnv('CLAW_PHONE_USER_MAP', '{}'), // JSON: { "+1234567890": "user-uuid" }

  // Derived
  get pubSubTopicName(): string {
    return `projects/${this.googleCloudProjectId}/topics/${this.gmailPubSubTopic}`;
  },

  get phoneUserMap(): Record<string, string> {
    try {
      return JSON.parse(this.clawPhoneUserMap);
    } catch (e) {
      console.error('[Config] Failed to parse CLAW_PHONE_USER_MAP — no phone mappings will work:', e);
      return {};
    }
  },
} as const;

// Production environment validation — fail fast at startup
if (config.nodeEnv === 'production') {
  const missing: string[] = [];
  if (!config.supabasePublishableKey) missing.push('SUPABASE_PUBLISHABLE_KEY');
  if (!config.cronSecret) missing.push('CRON_SECRET');
  if (!config.keySecret) missing.push('KEY_SECRET');
  if (missing.length > 0) {
    throw new Error(`FATAL: Missing required production env vars: ${missing.join(', ')}`);
  }
}

// Warn if Claw is enabled but no API key source is available
if (config.clawEnabled && !config.anthropicApiKey && !config.keySecret) {
  console.warn('[Config] WARNING: CLAW_ENABLED=true but neither ANTHROPIC_API_KEY nor KEY_SECRET is set. AI features will not work (no way to obtain API keys).');
}

export default config;
