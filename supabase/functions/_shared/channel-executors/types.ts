/**
 * Channel Executor Types
 *
 * Shared types for multi-channel messaging.
 *
 * @module _shared/channel-executors/types
 */

// =============================================================================
// Channel Types
// =============================================================================

export type Channel = 'sms' | 'email' | 'direct_mail' | 'meta_dm' | 'phone_reminder';

export interface ChannelResult {
  success: boolean;
  messageId?: string;
  trackingNumber?: string;
  error?: string;
  rateLimitWarning?: boolean;
}

export interface ContactAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface ContactInfo {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address?: ContactAddress;
}

// =============================================================================
// Mail Pricing
// =============================================================================

export const MAIL_PRICING: Record<string, number> = {
  'postcard_4x6': 1.49,
  'postcard_6x9': 1.99,
  'postcard_6x11': 2.49,
  'yellow_letter': 2.99,
  'letter_1_page': 2.49,
  'letter_2_page': 3.49,
};

// =============================================================================
// Supabase Client Type
// =============================================================================

// Query result type for chained operations
interface QueryResult {
  single: () => Promise<{ data: Record<string, unknown> | null; error: { code?: string; message?: string } | null }>;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { code?: string; message?: string } | null }>;
  eq: (column: string, value: unknown) => QueryResult;
}

// deno-lint-ignore no-explicit-any
export type SupabaseClient = any;
