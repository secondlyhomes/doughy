/**
 * Parser Types
 *
 * Shared types for email parsing across edge functions.
 *
 * @module _shared/parsers/types
 */

// =============================================================================
// Platform Types
// =============================================================================

export type Platform =
  | 'airbnb'
  | 'furnishedfinder'
  | 'turbotenant'
  | 'facebook_marketplace'
  | 'zillow'
  | 'hotpads'
  | 'craigslist'
  | 'apartments_com'
  | 'direct_email'
  | 'unknown';

export type ReplyMethod =
  | 'email_reply'
  | 'direct_email'
  | 'platform_only'
  | 'messenger'
  | 'sms'
  | 'unknown';

export type InquiryType =
  | 'availability_check'
  | 'booking_request'
  | 'question'
  | 'tour_request'
  | 'price_negotiation'
  | 'general_inquiry'
  | 'application_submitted'
  | 'booking_confirmation'
  | 'cancellation'
  | 'review'
  | 'unknown';

export type Profession =
  | 'travel_nurse'
  | 'healthcare_worker'
  | 'contractor'
  | 'corporate_relocator'
  | 'student'
  | 'military'
  | 'digital_nomad'
  | 'remote_worker'
  | 'other'
  | 'unknown';

// =============================================================================
// Data Types
// =============================================================================

export interface ParsedContact {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  profession?: Profession;
  employer?: string;
  hospital?: string;
}

export interface DateRange {
  start_date?: string;
  end_date?: string;
  duration_weeks?: number;
  duration_months?: number;
  flexible?: boolean;
}

export interface PropertyHint {
  address_hint?: string;
  listing_url?: string;
  listing_id?: string;
  property_name?: string;
}

export interface ParsedEmailResult {
  platform: Platform;
  reply_method: ReplyMethod;
  inquiry_type: InquiryType;
  contact: ParsedContact;
  dates: DateRange;
  property_hint: PropertyHint;
  message_content: string;
  original_subject: string;
  thread_id?: string;
  external_conversation_id?: string;
  guests?: number;
  pets?: boolean;
  budget?: number;
  special_requests?: string[];
  confidence: number;
  raw_metadata: Record<string, unknown>;
}

export interface ParseEmailRequest {
  from: string;
  to: string;
  subject: string;
  body_text: string;
  body_html?: string;
  received_at?: string;
  headers?: Record<string, string>;
}
