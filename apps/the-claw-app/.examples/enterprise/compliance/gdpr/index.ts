/**
 * GDPR Consent Management Module
 * Clean re-exports for public API
 */

// Main component
export { ConsentManager } from './ConsentManager'

// Types
export type {
  ConsentPreferences,
  ConsentDetails,
  ConsentType,
} from './types'
export { DEFAULT_PREFERENCES } from './types'

// Hook
export { useConsent } from './hooks/useConsent'

// Components
export { ConsentBanner } from './components/ConsentBanner'
export { ConsentSettings } from './components/ConsentSettings'
export { ConsentDetailsModal } from './components/ConsentDetailsModal'

// Utilities
export {
  CONSENT_TYPES,
  applyConsentChanges,
  createAcceptAllPreferences,
  createRejectAllPreferences,
} from './utils/consent-utils'
