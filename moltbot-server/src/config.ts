// MoltBot Server Configuration
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
    'https://moltbot.doughy.app/oauth/callback'
  ),

  // Google Cloud
  googleCloudProjectId: requireEnv('GOOGLE_CLOUD_PROJECT_ID'),
  gmailPubSubTopic: optionalEnv('GMAIL_PUBSUB_TOPIC', 'gmail-notifications'),

  // Anthropic
  anthropicApiKey: optionalEnv('ANTHROPIC_API_KEY', ''),

  // Derived
  get pubSubTopicName(): string {
    return `projects/${this.googleCloudProjectId}/topics/${this.gmailPubSubTopic}`;
  },
} as const;

export default config;
