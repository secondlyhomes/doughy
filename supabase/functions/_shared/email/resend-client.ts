/**
 * Resend Client Module
 *
 * Utilities for interacting with the Resend email API.
 *
 * @module _shared/email/resend-client
 */

import { decryptServer } from "../crypto-server.ts";
import type { EmailType, EmailLogParams } from "./types.ts";

// =============================================================================
// Types
// =============================================================================

interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      };
      or: (filter: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      };
    };
    insert: (data: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
}

// =============================================================================
// API Key Management
// =============================================================================

/**
 * Get Resend API key from database
 *
 * @param supabase - Supabase client
 * @returns Decrypted Resend API key
 * @throws Error if key not configured or decryption fails
 */
export async function getResendApiKey(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from('security_api_keys')
    .select('key_ciphertext')
    .or('service.eq.resend,service.eq.resend-key')
    .single();

  if (error || !data?.key_ciphertext) {
    console.error('Error fetching Resend API key:', error);
    throw new Error('Resend API key not configured');
  }

  try {
    const decryptedKey = await decryptServer(data.key_ciphertext as string);
    console.log('Successfully retrieved and decrypted Resend API key from database');
    return decryptedKey;
  } catch (decryptError) {
    console.error('Error decrypting Resend API key:', decryptError);
    throw new Error('Failed to decrypt Resend API key');
  }
}

/**
 * Get Resend email domain from system settings
 *
 * @param supabase - Supabase client
 * @returns Email domain (defaults to 'doughy.ai')
 */
export async function getResendEmailDomain(supabase: SupabaseClient): Promise<string> {
  const DEFAULT_DOMAIN = 'doughy.ai';

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'resend_email_domain')
      .single();

    if (error) throw error;

    if (data?.value) {
      let domainValue = data.value;

      // Log the raw value for debugging
      console.log('Raw domain value:', JSON.stringify(data.value));

      // If value is a string that might be JSON
      if (typeof domainValue === 'string') {
        try {
          const parsedValue = JSON.parse(domainValue);
          if (typeof parsedValue === 'string') {
            console.log('Using parsed JSON string domain:', parsedValue);
            return parsedValue;
          }
        } catch {
          // Not JSON, use as is
          console.log('Using string domain (not JSON):', domainValue);
          return domainValue;
        }
      } else if (typeof domainValue === 'object') {
        console.log('Using object domain:', String(domainValue));
        return String(domainValue);
      }

      return String(domainValue);
    }

    console.log('No domain found, using default:', DEFAULT_DOMAIN);
    return DEFAULT_DOMAIN;
  } catch (error) {
    console.error('Error fetching Resend email domain:', error);
    return DEFAULT_DOMAIN;
  }
}

// =============================================================================
// Email Logging
// =============================================================================

/**
 * Log email to database
 *
 * @param supabase - Supabase client
 * @param params - Email log parameters
 * @returns Email log ID or null if logging failed
 */
export async function logEmail(
  supabase: SupabaseClient,
  params: EmailLogParams
): Promise<string | null> {
  const { userId, type, recipient, subject, templateId, status, resendId, metadata } = params;

  try {
    const { data, error } = await supabase
      .from('comms_email_logs')
      .insert({
        user_id: userId,
        email_type: type,
        recipient,
        subject,
        template_id: templateId,
        status,
        external_id: resendId,
        metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging email:', error);
      return null;
    }

    return (data?.id as string) || null;
  } catch (error) {
    console.error('Exception logging email:', error);
    return null;
  }
}

/**
 * Update email log status
 *
 * @param supabase - Supabase client
 * @param emailLogId - Email log ID
 * @param status - New status
 * @param externalId - External message ID (optional)
 * @param errorMessage - Error message if failed (optional)
 */
export async function updateEmailLogStatus(
  supabase: SupabaseClient,
  emailLogId: string,
  status: 'sent' | 'failed',
  externalId?: string,
  errorMessage?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (externalId) {
    updateData.external_id = externalId;
  }

  if (errorMessage) {
    updateData.metadata = { error: errorMessage };
  }

  const { error } = await supabase
    .from('comms_email_logs')
    .update(updateData)
    .eq('id', emailLogId);

  if (error) {
    console.error('Error updating email log:', error);
  }
}
