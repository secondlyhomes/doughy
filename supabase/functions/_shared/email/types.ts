/**
 * Email Module Types
 *
 * Shared types for email functionality across edge functions.
 *
 * @module _shared/email/types
 */

// =============================================================================
// Email Types
// =============================================================================

export type EmailType = 'welcome' | 'security' | 'reminder' | 'marketing' | 'test';

export interface EmailRequestPayload {
  type: EmailType;
  recipient: string;
  recipient_name?: string;
  subject?: string;
  template_data: Record<string, unknown>;
  user_id?: string;
  reply_to?: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id?: string;
    email_id?: string;
  };
}

export interface EmailPreferences {
  welcome_emails: boolean;
  security_emails: boolean;
  reminder_emails: boolean;
  marketing_emails: boolean;
  unsubscribed_all: boolean;
}

export interface EmailLogParams {
  userId: string | undefined;
  type: EmailType;
  recipient: string;
  subject: string;
  templateId: string;
  status: string;
  resendId?: string;
  metadata?: Record<string, unknown>;
}
