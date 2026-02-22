/**
 * Google Services
 *
 * Unified service layer for Google integrations including Gmail and Calendar.
 * Uses shared OAuth credentials stored in rental_email_connections.
 */

// Auth service (OAuth flow, connection management)
export {
  // Types
  type GoogleServiceType,
  type GoogleAuthResult,
  type GoogleConnection,
  type GoogleAuthOptions,
  GOOGLE_SCOPES,

  // Auth functions
  getRedirectUri,
  isGoogleAuthConfigured,
  useGoogleAuth,
  handleGoogleAuthCallback,
  getGoogleConnection,
  isServiceEnabled,
  disconnectGoogle,

  // Gmail-specific functions
  triggerGmailSync,
  formatLastSyncTime,

  // Legacy exports (deprecated, for backward compatibility)
  useGmailAuth,
  handleGmailAuthCallback,
  getGmailConnection,
  disconnectGmail,
} from './googleAuth';

// Calendar service
export {
  // Types
  type CalendarEvent,
  type EventDateTime,
  type CreateEventInput,
  type UpdateEventInput,
  type CalendarListOptions,
  type CalendarSyncResult,

  // Functions
  isCalendarConnected,
  listCalendarEvents,
  listUpcomingEvents,
  syncCalendarEvents,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,

  // Helpers
  createAllDayEvent,
  createTimedEvent,
  formatEventTime,
} from './googleCalendar';
