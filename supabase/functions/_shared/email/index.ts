/**
 * Email Module
 *
 * Re-exports all email-related utilities for edge functions.
 *
 * @module _shared/email
 */

// Types
export type {
  EmailType,
  EmailRequestPayload,
  EmailResponse,
  EmailPreferences,
  EmailLogParams,
} from "./types.ts";

// Preferences
export {
  getUserEmailPreferences,
  canReceiveEmail,
} from "./preferences.ts";

// Resend Client
export {
  getResendApiKey,
  getResendEmailDomain,
  logEmail,
  updateEmailLogStatus,
} from "./resend-client.ts";

// Templates
export type {
  SecurityEmailData,
  WelcomeEmailData,
  ReminderEmailData,
  TestEmailData,
} from "./templates.ts";

export {
  generateSecurityEmailHtml,
  generateWelcomeEmailHtml,
  generateReminderEmailHtml,
  generateTestEmailHtml,
  getReminderTitle,
} from "./templates.ts";
