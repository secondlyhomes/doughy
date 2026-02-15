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
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseAnonKey: optionalEnv('SUPABASE_ANON_KEY', ''),

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

  // Twilio (for The Claw SMS)
  twilioAccountSid: optionalEnv('TWILIO_ACCOUNT_SID', ''),
  twilioAuthToken: optionalEnv('TWILIO_AUTH_TOKEN', ''),
  twilioPhoneNumber: optionalEnv('TWILIO_PHONE_NUMBER', ''),

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
    } catch {
      return {};
    }
  },
} as const;

export default config;
