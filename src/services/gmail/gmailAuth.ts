/**
 * Gmail OAuth Authentication Service
 *
 * @deprecated This module is deprecated. Use @/services/google instead.
 *
 * This file re-exports from the new unified Google services for backward compatibility.
 * New code should import directly from '@/services/google'.
 *
 * @see @/services/google/googleAuth.ts
 */

// Re-export everything from the new google auth service
export {
  // Types (mapped to old names for compatibility)
  type GoogleAuthResult as GmailAuthResult,
  type GoogleConnection as GmailConnection,

  // Functions (legacy names)
  getRedirectUri,
  isGoogleAuthConfigured as isGmailAuthConfigured,
  useGmailAuth,
  handleGmailAuthCallback,
  getGmailConnection,
  disconnectGmail,
  triggerGmailSync,
  formatLastSyncTime,
} from '@/services/google/googleAuth';
