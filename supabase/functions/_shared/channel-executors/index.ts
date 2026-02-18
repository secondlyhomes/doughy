/**
 * Channel Executors Module
 *
 * Re-exports all channel execution utilities for edge functions.
 *
 * @module _shared/channel-executors
 */

// Types
export type {
  Channel,
  ChannelResult,
  ContactAddress,
  ContactInfo,
  SupabaseClient,
} from "./types.ts";

export { MAIL_PRICING } from "./types.ts";

// SMS
export { sendSMS } from "./sms.ts";

// Email
export { sendEmail } from "./email.ts";

// Direct Mail
export { sendDirectMail } from "./direct-mail.ts";

// Meta DM
export { sendMetaDM } from "./meta-dm.ts";

// Phone Reminder
export { createPhoneReminder } from "./phone-reminder.ts";

// Personalization
export { personalizeMessage } from "./personalization.ts";
