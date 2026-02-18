/**
 * GDPR Consent Types
 * Type definitions for consent management
 */

export interface ConsentPreferences {
  essential: boolean // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
  personalization: boolean
  thirdParty: boolean
}

export interface ConsentDetails {
  type: keyof ConsentPreferences
  title: string
  description: string
  required: boolean
  legalBasis: string
  purpose: string
  dataCollected: string[]
  retention: string
  thirdParties?: string[]
}

export type ConsentType = keyof ConsentPreferences

export const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  personalization: false,
  thirdParty: false,
}
