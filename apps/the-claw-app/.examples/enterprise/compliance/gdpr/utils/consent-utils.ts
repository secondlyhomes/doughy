/**
 * Consent Utilities
 * Utility functions and constants for consent management
 */

import { ConsentDetails, ConsentPreferences, ConsentType } from '../types'

/**
 * GDPR consent type definitions with legal basis and data details
 */
export const CONSENT_TYPES: ConsentDetails[] = [
  {
    type: 'essential',
    title: 'Essential Cookies',
    description: 'Required for the app to function properly',
    required: true,
    legalBasis: 'Legitimate Interest',
    purpose: 'Authentication, security, and core functionality',
    dataCollected: ['Session ID', 'User ID', 'Authentication tokens'],
    retention: 'Until session ends or 30 days',
  },
  {
    type: 'analytics',
    title: 'Analytics & Performance',
    description: 'Help us understand how you use the app to improve performance',
    required: false,
    legalBasis: 'Consent',
    purpose: 'App analytics, crash reporting, performance monitoring',
    dataCollected: [
      'Device information',
      'App usage statistics',
      'Performance metrics',
      'Crash logs',
    ],
    retention: '13 months',
    thirdParties: ['PostHog', 'Sentry'],
  },
  {
    type: 'marketing',
    title: 'Marketing Communications',
    description: 'Receive promotional emails and product updates',
    required: false,
    legalBasis: 'Consent',
    purpose: 'Send marketing emails, promotional offers, product updates',
    dataCollected: ['Email address', 'Name', 'User preferences'],
    retention: 'Until consent withdrawn',
    thirdParties: ['SendGrid', 'Mailchimp'],
  },
  {
    type: 'personalization',
    title: 'Personalization',
    description: 'Customize your app experience based on your preferences',
    required: false,
    legalBasis: 'Consent',
    purpose: 'Personalized content, recommendations, UI customization',
    dataCollected: ['User preferences', 'Interaction history', 'Settings'],
    retention: '24 months',
  },
  {
    type: 'thirdParty',
    title: 'Third-Party Services',
    description: 'Enable third-party integrations and features',
    required: false,
    legalBasis: 'Consent',
    purpose: 'Third-party integrations, social media features',
    dataCollected: ['Integration tokens', 'Third-party IDs'],
    retention: 'Until integration disabled',
    thirdParties: ['Google', 'Facebook', 'Twitter'],
  },
]

/**
 * Apply consent changes to third-party services
 */
export function applyConsentChanges(type: ConsentType, granted: boolean): void {
  switch (type) {
    case 'analytics':
      if (granted) {
        // Enable analytics (e.g., PostHog)
        // PostHog.optIn()
      } else {
        // Disable analytics
        // PostHog.optOut()
      }
      break

    case 'marketing':
      // Update marketing preferences in backend
      break

    case 'personalization':
      // Enable/disable personalization features
      break

    case 'thirdParty':
      // Enable/disable third-party integrations
      break
  }
}

/**
 * Create preferences with all consents accepted
 */
export function createAcceptAllPreferences(): ConsentPreferences {
  return {
    essential: true,
    analytics: true,
    marketing: true,
    personalization: true,
    thirdParty: true,
  }
}

/**
 * Create preferences with only essential consent
 */
export function createRejectAllPreferences(): ConsentPreferences {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    thirdParty: false,
  }
}
