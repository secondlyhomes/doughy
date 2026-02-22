// src/features/admin/utils/serviceHelpers.ts
// Utility functions for service management

import type { ServiceGroup, ApiKeyValidation } from '../types/integrations';

/**
 * Service name normalization map
 */
const SERVICE_NAME_MAP: Record<string, string> = {
  // OpenAI variations
  'openai-key': 'openai',
  'openai_key': 'openai',
  'openai_api_key': 'openai',

  // Stripe variations
  'stripe': 'stripe-secret',
  'stripe_key': 'stripe-secret',
  'stripe_api_key': 'stripe-secret',
  'stripe_public_key': 'stripe-public',

  // Perplexity variations
  'perplexity-api': 'perplexity',
  'perplexity_key': 'perplexity',

  // Bland AI variations
  'bland': 'bland-ai',
  'bland_ai': 'bland-ai',

  // Plaid variations
  'plaid_client': 'plaid-client-id',
  'plaid': 'plaid-secret',
  'plaid_secret_key': 'plaid-secret',

  // Netlify variations
  'netlify': 'netlify_api_token',
  'netlify_site': 'netlify_site_id',

  // Resend variations
  'resend_key': 'resend',
  'resend-key': 'resend',
};

/**
 * Service display name map
 */
const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic Claude',
  'perplexity': 'Perplexity',
  'google-maps-js': 'Google Maps',
  'google-street-view': 'Google Street View',
  'twilio': 'Twilio',
  'bland-ai': 'Bland.ai',
  'stripe-secret': 'Stripe Secret Key',
  'stripe-public': 'Stripe Public Key',
  'stripe-webhook': 'Stripe Webhook Secret',
  'plaid-client-id': 'Plaid Client ID',
  'plaid-secret': 'Plaid Secret',
  'netlify_api_token': 'Netlify API Token',
  'netlify_site_id': 'Netlify Site ID',
  'gmail': 'Gmail',
  'google-calendar': 'Google Calendar',
  'outlook-mail': 'Outlook Mail',
  'outlook-calendar': 'Outlook Calendar',
};

/**
 * Normalize service name to canonical form
 *
 * @param serviceName - Original service name
 * @returns Canonical service name
 */
export function normalizeServiceName(serviceName: string): string {
  return SERVICE_NAME_MAP[serviceName] || serviceName;
}

/**
 * Get service group based on service name
 *
 * @param service - Service name
 * @returns Service group category
 */
export function getGroupForService(service: string): ServiceGroup {
  const serviceLower = service.toLowerCase();

  // AI APIs
  if (
    serviceLower.includes('openai') ||
    serviceLower.includes('anthropic') ||
    serviceLower.includes('claude') ||
    serviceLower.includes('perplexity')
  ) {
    return 'AI';
  }

  // Communication APIs
  if (
    serviceLower.includes('bland') ||
    serviceLower.includes('twilio') ||
    serviceLower.includes('gmail') ||
    serviceLower.includes('outlook') ||
    serviceLower.includes('google-calendar') ||
    serviceLower.includes('docusign')
  ) {
    return 'Communication';
  }

  // Payment APIs
  if (
    serviceLower.includes('stripe') ||
    serviceLower.includes('paypal') ||
    serviceLower.includes('plaid')
  ) {
    return 'Payments';
  }

  // Map APIs
  if (
    serviceLower.includes('google-maps-js') ||
    serviceLower.includes('google-street-view') ||
    (serviceLower.includes('google') &&
      (serviceLower.includes('map') || serviceLower.includes('places')))
  ) {
    return 'Maps';
  }

  // Hosting
  if (serviceLower.includes('netlify') || serviceLower.includes('vercel')) {
    return 'Hosting';
  }

  return 'Other';
}

/**
 * Get human-readable display name for a service
 *
 * @param service - Service identifier
 * @returns Display name
 */
export function getServiceDisplayName(service: string): string {
  return SERVICE_DISPLAY_NAMES[service] || service;
}

/**
 * Validate API key format with flexible validation
 * Provides warnings but doesn't block saving
 *
 * @param key - API key to validate
 * @param service - Service name
 * @returns Validation result with optional warning
 */
export function validateApiKeyFormat(key: string, service: string): ApiKeyValidation {
  if (!key) return { isValid: false };

  // Basic check all keys should pass
  if (key.length < 10) {
    return { isValid: false, warning: 'API key is too short' };
  }

  // OpenAI validation - supports sk-, sk-proj-, sk-org- formats
  if (service.includes('openai')) {
    // Check for valid OpenAI key prefixes
    const validPrefixes = ['sk-', 'sk-proj-', 'sk-org-'];
    const hasValidPrefix = validPrefixes.some(prefix => key.startsWith(prefix));

    if (!hasValidPrefix) {
      return {
        isValid: true,
        warning: "OpenAI API keys typically start with 'sk-', 'sk-proj-', or 'sk-org-'",
      };
    }

    // Modern OpenAI keys can be 30-200 characters depending on type
    // Project keys (sk-proj-) are typically 50-100 characters
    // Older keys (sk-) were 40-60 characters
    if (key.length < 30 || key.length > 250) {
      return {
        isValid: true,
        warning: 'OpenAI API key length is outside typical range (30-250 characters)',
      };
    }

    // Passed all checks
    return { isValid: true };
  }

  // Anthropic validation
  if (service.includes('anthropic') || service.includes('claude')) {
    if (!key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
      return {
        isValid: true,
        warning: "Anthropic API keys typically start with 'sk-ant-' or 'sk-'",
      };
    }
    return { isValid: true };
  }

  // Stripe validation
  if (service.includes('stripe-secret')) {
    if (!key.startsWith('sk_')) {
      return {
        isValid: true,
        warning: "Stripe secret keys typically start with 'sk_'",
      };
    }
    return { isValid: true };
  }

  if (service.includes('stripe-public')) {
    if (!key.startsWith('pk_')) {
      return {
        isValid: true,
        warning: "Stripe publishable keys typically start with 'pk_'",
      };
    }
    return { isValid: true };
  }

  if (service.includes('stripe-webhook')) {
    if (!key.startsWith('whsec_')) {
      return {
        isValid: true,
        warning: "Stripe webhook secrets typically start with 'whsec_'",
      };
    }
    return { isValid: true };
  }

  // Default case - accept with no warning
  return { isValid: true };
}

/**
 * Sanitize input to prevent injection
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[^\w\s\-_.@]/g, '');
}
