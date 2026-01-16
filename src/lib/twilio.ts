// src/lib/twilio.ts
// Twilio SMS client wrapper for sending and parsing SMS messages

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from './supabase';
import { extractPropertyData, ExtractedPropertyData } from './openai';

/**
 * SMS message response from Twilio
 */
export interface SMSResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: string;
}

/**
 * Configuration for SMS sending
 */
export interface SMSConfig {
  to: string;
  body: string;
  /** Optional media URLs to attach (MMS) */
  mediaUrls?: string[];
}

/**
 * SMS send result
 */
export interface SMSSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send an SMS message via Twilio
 * Uses Supabase edge function to securely access Twilio credentials
 *
 * @example
 * ```typescript
 * const result = await sendSMS({
 *   to: '+15551234567',
 *   body: 'Your offer has been accepted!'
 * });
 *
 * if (result.success) {
 *   console.log('SMS sent:', result.sid);
 * }
 * ```
 */
export async function sendSMS(config: SMSConfig): Promise<SMSSendResult> {
  const { to, body, mediaUrls } = config;

  // Validate phone number format
  if (!to.match(/^\+?[1-9]\d{1,14}$/)) {
    return {
      success: false,
      error: 'Invalid phone number format. Use E.164 format (e.g., +15551234567)',
    };
  }

  // In mock mode, simulate sending
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('[Twilio Mock] SMS sent to:', to, 'Body:', body.substring(0, 50));
    return {
      success: true,
      sid: `MOCK_SID_${Date.now()}`,
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();

    const functionUrl = `${SUPABASE_URL}/functions/v1/twilio-sms`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to,
        body,
        mediaUrls,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `SMS API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      sid: data.sid,
    };
  } catch (error) {
    console.error('[Twilio] Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * Convenience function for simple SMS sending
 *
 * @example
 * ```typescript
 * await sendSMSSimple('+15551234567', 'Hello from Doughy!');
 * ```
 */
export async function sendSMSSimple(
  to: string,
  message: string
): Promise<SMSSendResult> {
  return sendSMS({ to, body: message });
}

/**
 * Parse SMS text into structured lead data using AI
 * Delegates to OpenAI's extractPropertyData function
 *
 * @example
 * ```typescript
 * // Incoming SMS: "Hey I have a 3/2 at 456 Oak St, needs roof, asking 180k"
 * const leadData = await parseSMSToLead(smsBody);
 * // { address: "456 Oak St", bedrooms: 3, bathrooms: 2, askingPrice: 180000, ... }
 * ```
 */
export async function parseSMSToLead(
  smsBody: string
): Promise<ExtractedPropertyData> {
  return extractPropertyData(smsBody);
}

/**
 * Format a phone number to E.164 format
 * Assumes US numbers if no country code provided
 *
 * @example
 * ```typescript
 * formatPhoneNumber('555-123-4567') // '+15551234567'
 * formatPhoneNumber('(555) 123-4567') // '+15551234567'
 * formatPhoneNumber('+1 555 123 4567') // '+15551234567'
 * ```
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If starts with +, preserve it (already formatted)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove leading 1 if present (US country code without +)
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Add US country code for 10-digit numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // For 11-digit numbers starting with 1, format as US
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // For other lengths, only add + if we have enough digits for a valid number
  // E.164 requires minimum 7 digits (country code + local number)
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  // Return with + prefix anyway, validation will catch invalid numbers
  return `+${cleaned}`;
}

/**
 * Validate a phone number format
 * Requires at least 10 digits for US numbers or 7 digits minimum for international
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: + followed by 7-15 digits (minimum 7 for valid phone number)
  // US numbers must have 11 digits (+1 plus 10 digit number)
  if (!formatted.match(/^\+[1-9]\d{6,14}$/)) {
    return false;
  }
  // Additional check: US numbers (+1) must have exactly 11 digits
  if (formatted.startsWith('+1') && formatted.length !== 12) {
    return false;
  }
  return true;
}

/**
 * SMS template types for common messages
 */
export type SMSTemplateType =
  | 'follow_up'
  | 'appointment_reminder'
  | 'offer_sent'
  | 'document_ready'
  | 'custom';

/**
 * Generate SMS text from a template
 *
 * @example
 * ```typescript
 * const message = generateSMSFromTemplate('follow_up', {
 *   sellerName: 'John',
 *   propertyAddress: '123 Main St',
 *   userName: 'Jane'
 * });
 * ```
 */
export function generateSMSFromTemplate(
  template: SMSTemplateType,
  variables: Record<string, string>
): string {
  const templates: Record<SMSTemplateType, string> = {
    follow_up: `Hi ${variables.sellerName || 'there'}, this is ${variables.userName || 'your Doughy agent'} following up about ${variables.propertyAddress || 'your property'}. Are you still interested in selling? Reply YES to continue or STOP to opt out.`,

    appointment_reminder: `Reminder: You have an appointment scheduled for ${variables.date || 'soon'} at ${variables.time || ''} to view ${variables.propertyAddress || 'the property'}. Reply CONFIRM to confirm or RESCHEDULE to reschedule.`,

    offer_sent: `Great news! An offer has been submitted for ${variables.propertyAddress || 'your property'} at $${variables.offerAmount || ''}. Your agent ${variables.userName || ''} will follow up with details shortly.`,

    document_ready: `Your ${variables.documentType || 'document'} for ${variables.propertyAddress || 'your property'} is ready for review. Log in to your Doughy account to view and sign.`,

    custom: variables.message || '',
  };

  return templates[template];
}

/**
 * Send SMS using a template
 *
 * @example
 * ```typescript
 * await sendTemplatedSMS('+15551234567', 'follow_up', {
 *   sellerName: 'John',
 *   propertyAddress: '123 Main St',
 *   userName: 'Jane'
 * });
 * ```
 */
export async function sendTemplatedSMS(
  to: string,
  template: SMSTemplateType,
  variables: Record<string, string>
): Promise<SMSSendResult> {
  const message = generateSMSFromTemplate(template, variables);
  return sendSMS({ to, body: message });
}
