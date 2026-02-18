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
        label: 'Site ID (Prod)',
        type: 'text',
        required: true,
        description: 'Production site ID',
      },
      {
        key: 'netlify_stage_site_id',
        label: 'Site ID (Stage)',
        type: 'text',
        required: false,
        description: 'Staging site ID (optional)',
      },
    ],
  },

  // ===== AI SERVICES =====
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
    id: 'openclaw',
    name: 'OpenClaw',
    service: 'openclaw',
    description: 'AI-powered email automation for landlords',
    icon: 'bot',
    group: 'Communication',
    requiresOAuth: true, // Uses Gmail OAuth through OpenClaw server
    docsUrl: '/docs/MOLTBOT_LANDLORD_INTEGRATION.md',
    fields: [
      {
        key: 'openclaw-server-url',
        label: 'Server URL',
        type: 'text',
        required: true,
        placeholder: 'https://openclaw.doughy.app',
        description: 'OpenClaw server endpoint URL',
      },
      {
        key: 'openclaw-webhook-secret',
        label: 'Webhook Secret',
        type: 'password',
        required: true,
        description: 'Secret for validating webhook requests from OpenClaw',
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

  // ===== PROPERTY MANAGEMENT / LANDLORD =====
  {
    id: 'seam',
    name: 'Seam (Smart Locks)',
    service: 'seam',
    description: 'Smart lock integration for Schlage, Yale, August, etc.',
    icon: 'lock',
    group: 'Property Management',
    docsUrl: 'https://docs.seam.co',
    fields: [
      {
        key: 'seam-api-key',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'seam_...',
        description: 'Seam API key from console.seam.co',
      },
      {
        key: 'seam-workspace-id',
        label: 'Workspace ID',
        type: 'text',
        required: false,
        description: 'Optional workspace ID (for multi-workspace setups)',
      },
    ],
  },
  {
    id: 'tracerfy',
    name: 'Tracerfy (Skip Tracing)',
    service: 'tracerfy',
    description: 'Skip tracing for property owner lookup',
    icon: 'search',
    group: 'Property Management',
    docsUrl: 'https://tracerfy.com/api-docs',
    fields: [
      {
        key: 'tracerfy-api-key',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Tracerfy API key from your account dashboard',
      },
      {
        key: 'tracerfy-auto-trace',
        label: 'Auto Skip Trace',
        type: 'select',
        required: false,
        options: ['disabled', 'new_leads_only', 'all_leads'],
        description: 'Automatically skip trace new leads without contact info',
      },
      {
        key: 'tracerfy-auto-match',
        label: 'Auto Match to Property',
        type: 'select',
        required: false,
        options: ['disabled', 'enabled'],
        description: 'Automatically match leads to properties by address',
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
