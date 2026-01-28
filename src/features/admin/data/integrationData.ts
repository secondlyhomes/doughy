// src/features/admin/data/integrationData.ts
// Configuration data for all supported integrations

import type { Integration } from '../types/integrations';

/**
 * All supported integrations with their configuration
 */
export const INTEGRATIONS: Integration[] = [
  // ===== HOSTING SERVICES (Primary) =====
  {
    id: 'netlify',
    name: 'Netlify',
    service: 'netlify',
    description: 'Deployment and hosting management',
    icon: 'cloud',
    group: 'Hosting',
    docsUrl: 'https://docs.netlify.com',
    fields: [
      {
        key: 'netlify_api_token',
        label: 'API Token',
        type: 'password',
        required: true,
        description: 'Netlify personal access token',
      },
      {
        key: 'netlify_site_id',
        label: 'Site ID',
        type: 'text',
        required: true,
        description: 'Production site ID',
      },
      {
        key: 'netlify_stage_site_id',
        label: 'Staging Site ID',
        type: 'text',
        required: false,
        description: 'Staging site ID (optional)',
      },
    ],
  },

  // ===== AI SERVICES =====
  {
    id: 'openai',
    name: 'OpenAI',
    service: 'openai',
    description: 'GPT models and AI completions',
    icon: 'cpu',
    group: 'AI',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    fields: [
      {
        key: 'openai',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...',
        description: 'OpenAI API key from platform.openai.com',
      },
      {
        key: 'openai-org-id',
        label: 'Organization ID',
        type: 'text',
        required: false,
        placeholder: 'org-...',
        description: 'Optional organization ID',
      },
      {
        key: 'openai-model',
        label: 'Preferred Model',
        type: 'select',
        required: false,
        options: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        description: 'Default model for completions',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    service: 'anthropic',
    description: 'Claude AI models',
    icon: 'message-square',
    group: 'AI',
    docsUrl: 'https://docs.anthropic.com',
    fields: [
      {
        key: 'anthropic',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-ant-...',
        description: 'Anthropic API key from console.anthropic.com',
      },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    service: 'perplexity',
    description: 'Perplexity AI search and completions',
    icon: 'search',
    group: 'AI',
    docsUrl: 'https://docs.perplexity.ai',
    fields: [
      {
        key: 'perplexity',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'pplx-...',
        description: 'Perplexity API key',
      },
    ],
  },

  // ===== MAPS SERVICES =====
  {
    id: 'google-maps-js',
    name: 'Google Maps',
    service: 'google-maps-js',
    description: 'Maps, geocoding, and places',
    icon: 'map',
    group: 'Maps',
    docsUrl: 'https://developers.google.com/maps',
    fields: [
      {
        key: 'google-maps-js',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Google Maps JavaScript API key',
      },
    ],
  },
  {
    id: 'google-street-view',
    name: 'Google Street View',
    service: 'google-street-view',
    description: 'Street view imagery',
    icon: 'camera',
    group: 'Maps',
    docsUrl: 'https://developers.google.com/maps/documentation/streetview',
    fields: [
      {
        key: 'google-street-view',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Google Street View API key',
      },
    ],
  },

  // ===== COMMUNICATION SERVICES =====
  {
    id: 'twilio',
    name: 'Twilio',
    service: 'twilio',
    description: 'SMS and voice communications',
    icon: 'phone',
    group: 'Communication',
    docsUrl: 'https://www.twilio.com/docs',
    fields: [
      {
        key: 'twilio-account-sid',
        label: 'Account SID',
        type: 'text',
        required: true,
        placeholder: 'AC...',
        description: 'Twilio Account SID',
      },
      {
        key: 'twilio-auth-token',
        label: 'Auth Token',
        type: 'password',
        required: true,
        description: 'Twilio Auth Token',
      },
      {
        key: 'twilio-phone-number',
        label: 'Phone Number',
        type: 'text',
        required: true,
        placeholder: '+1234567890',
        description: 'Twilio phone number',
      },
    ],
  },
  {
    id: 'bland-ai',
    name: 'Bland.ai',
    service: 'bland-ai',
    description: 'AI phone call automation',
    icon: 'phone-call',
    group: 'Communication',
    docsUrl: 'https://docs.bland.ai',
    fields: [
      {
        key: 'bland-ai',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Bland.ai API key',
      },
    ],
  },
  {
    id: 'moltbot',
    name: 'MoltBot',
    service: 'moltbot',
    description: 'AI-powered email automation for landlords',
    icon: 'bot',
    group: 'Communication',
    requiresOAuth: true, // Uses Gmail OAuth through MoltBot server
    docsUrl: '/docs/MOLTBOT_LANDLORD_INTEGRATION.md',
    fields: [
      {
        key: 'moltbot-server-url',
        label: 'Server URL',
        type: 'text',
        required: true,
        placeholder: 'https://your-moltbot-server.com',
        description: 'MoltBot server endpoint URL',
      },
      {
        key: 'moltbot-webhook-secret',
        label: 'Webhook Secret',
        type: 'password',
        required: true,
        description: 'Secret for validating webhook requests from MoltBot',
      },
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    service: 'gmail',
    description: 'Email integration via OAuth',
    icon: 'mail',
    group: 'Communication',
    requiresOAuth: true,
    docsUrl: 'https://developers.google.com/gmail/api',
    fields: [
      {
        key: 'gmail-client-id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Google OAuth Client ID',
      },
    ],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    service: 'google-calendar',
    description: 'Calendar integration via OAuth',
    icon: 'calendar',
    group: 'Communication',
    requiresOAuth: true,
    docsUrl: 'https://developers.google.com/calendar',
    fields: [
      {
        key: 'google-calendar-client-id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Google OAuth Client ID',
      },
    ],
  },
  {
    id: 'outlook-mail',
    name: 'Outlook Mail',
    service: 'outlook-mail',
    description: 'Outlook email via OAuth',
    icon: 'mail',
    group: 'Communication',
    requiresOAuth: true,
    docsUrl: 'https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview',
    fields: [
      {
        key: 'outlook-mail-client-id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Microsoft OAuth Client ID',
      },
    ],
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    service: 'outlook-calendar',
    description: 'Outlook calendar via OAuth',
    icon: 'calendar',
    group: 'Communication',
    requiresOAuth: true,
    docsUrl: 'https://docs.microsoft.com/en-us/graph/api/resources/calendar',
    fields: [
      {
        key: 'outlook-calendar-client-id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Microsoft OAuth Client ID',
      },
    ],
  },

  // ===== PAYMENT SERVICES =====
  {
    id: 'stripe',
    name: 'Stripe',
    service: 'stripe',
    description: 'Payment processing and subscriptions',
    icon: 'credit-card',
    group: 'Payments',
    docsUrl: 'https://stripe.com/docs/api',
    fields: [
      {
        key: 'stripe-secret',
        label: 'Secret Key',
        type: 'password',
        required: true,
        placeholder: 'sk_...',
        description: 'Stripe secret key',
      },
      {
        key: 'stripe-public',
        label: 'Publishable Key',
        type: 'password',
        required: false,
        placeholder: 'pk_...',
        description: 'Stripe publishable key',
      },
      {
        key: 'stripe-webhook',
        label: 'Webhook Secret',
        type: 'password',
        required: false,
        placeholder: 'whsec_...',
        description: 'Stripe webhook signing secret',
      },
    ],
  },
  {
    id: 'plaid',
    name: 'Plaid',
    service: 'plaid',
    description: 'Bank account verification',
    icon: 'building',
    group: 'Payments',
    docsUrl: 'https://plaid.com/docs',
    fields: [
      {
        key: 'plaid-client-id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Plaid Client ID',
      },
      {
        key: 'plaid-secret',
        label: 'Secret Key',
        type: 'password',
        required: true,
        description: 'Plaid Secret Key',
      },
    ],
  },

];

/**
 * Get integration by service name
 */
export function getIntegrationByService(service: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.service === service || i.id === service);
}

/**
 * Get integrations by group
 */
export function getIntegrationsByGroup(group: string): Integration[] {
  return INTEGRATIONS.filter((i) => i.group === group);
}

/**
 * Get all integration groups
 */
export function getIntegrationGroups(): string[] {
  return Array.from(new Set(INTEGRATIONS.map((i) => i.group)));
}
