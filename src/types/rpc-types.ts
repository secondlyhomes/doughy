// src/types/rpc-types.ts
// Type definitions for RPC function return types
// These match the flattened column structure from database RPC functions

// ============================================================================
// Investor Domain Types
// ============================================================================

/**
 * Deal with flattened lead and property data from investor.get_deals_with_lead
 * Types match actual SQL RPC function return columns (verified against migration 20260201100000_fix_rpc_schema_mismatch.sql)
 */
export interface DealWithLeadRPC {
  // Deal columns (matches investor.get_deals_with_lead return from fix migration)
  id: string;
  user_id: string;
  lead_id: string | null;
  property_id: string | null;
  stage: string;
  status: string;
  title: string;
  estimated_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  next_action: string | null;
  next_action_due: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Flattened lead columns
  lead_name: string | null;
  lead_phone: string | null;
  lead_email: string | null;
  lead_status: string | null;
  lead_score: number | null; // NUMERIC in DB
  lead_tags: string[] | null;
  // Flattened property columns
  property_address_line_1: string | null;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_county: string | null;
  property_bedrooms: number | null; // NUMERIC in DB
  property_bathrooms: number | null; // NUMERIC in DB
  property_square_feet: number | null; // INTEGER in DB
  property_lot_size: number | null; // INTEGER in DB
  property_year_built: number | null; // INTEGER in DB
  property_type: string | null;
  property_arv: number | null;
  property_purchase_price: number | null;
  property_notes: string | null;
  property_status: string | null;
}

/**
 * Property deal with minimal lead data from investor.get_property_deals
 * Types match actual SQL RPC function return columns (verified against migration 20260201100000_fix_rpc_schema_mismatch.sql)
 */
export interface PropertyDealRPC {
  id: string;
  user_id: string;
  lead_id: string | null;
  property_id: string | null;
  stage: string;
  status: string;
  title: string;
  next_action: string | null;
  next_action_due: string | null;
  created_at: string;
  updated_at: string;
  // Lead fields
  lead_name: string | null;
  lead_phone: string | null;
  lead_email: string | null;
}

/**
 * Deal data for nudge calculations from investor.get_nudge_deals
 */
export interface NudgeDealRPC {
  id: string;
  stage: string;
  next_action: string | null;
  next_action_due: string | null;
  updated_at: string | null;
  lead_id: string | null;
  lead_name: string | null;
  property_id: string | null;
  property_address_line_1: string | null;
  property_city: string | null;
  property_state: string | null;
}

/**
 * Property with lead data from investor.get_properties_with_lead
 */
export interface PropertyWithLeadRPC {
  id: string;
  address_line_1: string;
  city: string;
  state: string;
  lead_id: string | null;
  lead_name: string | null;
  primary_image_url: string | null;
}

/**
 * Investor conversation with lead/property/deal from investor.get_conversations_with_lead
 */
export interface InvestorConversationRPC {
  id: string;
  user_id: string;
  lead_id: string | null;
  property_id: string | null;
  channel: string;
  status: string;
  is_ai_enabled: boolean;
  is_ai_auto_respond: boolean;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Lead fields
  lead_name: string | null;
  lead_phone: string | null;
  lead_email: string | null;
  lead_status: string | null;
  lead_opt_status: string | null;
  lead_tags: string[] | null;
  // Property fields
  property_address_line_1: string | null;
  property_city: string | null;
  property_state: string | null;
  // Deal fields
  deal_id: string | null;
  deal_title: string | null;
  deal_status: string | null;
}

/**
 * Mail history entry from investor.get_mail_history
 */
export interface MailHistoryRPC {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  step_id: string | null;
  channel: string;
  status: string;
  executed_at: string | null;
  response_at: string | null;
  error_message: string | null;
  mail_piece_type: string | null;
  mail_cost: number | null;
  mail_tracking_id: string | null;
  mail_carrier: string | null;
  mail_expected_delivery: string | null;
  postgrid_letter_id: string | null;
  created_at: string;
  updated_at: string;
  // Contact fields
  contact_id: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
}

/**
 * Mail history stats from investor.get_mail_history_stats
 */
export interface MailHistoryStatsRPC {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_pending: number;
  total_cost: number;
}

// ============================================================================
// Landlord Domain Types
// ============================================================================

/**
 * Booking with contact/property/room from landlord.get_bookings_with_contact
 */
export interface BookingWithContactRPC {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string;
  room_id: string | null;
  booking_type: string;
  start_date: string;
  end_date: string | null;
  rate: number;
  rate_type: string;
  deposit: number | null;
  total_amount: number | null;
  status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  // Contact fields
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  // Property fields
  property_name: string | null;
  property_address: string | null;
  // Room fields
  room_name: string | null;
}

/**
 * Landlord conversation with contact/property from landlord.get_conversations_with_contact
 */
export interface LandlordConversationRPC {
  id: string;
  user_id: string;
  contact_id: string | null;
  property_id: string | null;
  channel: string;
  platform: string | null;
  status: string;
  is_ai_enabled: boolean;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Contact fields
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_types: string[] | null;
  // Property fields
  property_name: string | null;
  property_address: string | null;
}

// ============================================================================
// CRM Domain Types
// ============================================================================

/**
 * Skip trace result with relations from crm.get_skip_trace_results
 */
export interface SkipTraceResultRPC {
  id: string;
  user_id: string;
  contact_id: string | null;
  lead_id: string | null;
  property_id: string | null;
  matched_property_id: string | null;
  status: string;
  input_first_name: string | null;
  input_last_name: string | null;
  input_address: string | null;
  input_city: string | null;
  input_state: string | null;
  input_zip: string | null;
  phones: unknown[] | null;
  emails: unknown[] | null;
  addresses: unknown[] | null;
  properties_owned: unknown[] | null;
  data_points: unknown[] | null;
  match_confidence: number | null;
  credits_used: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Contact fields
  contact_first_name: string | null;
  contact_last_name: string | null;
  // Lead fields
  lead_name: string | null;
  // Property fields
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  // Matched property fields
  matched_property_address: string | null;
  matched_property_city: string | null;
  matched_property_state: string | null;
}

// ============================================================================
// Integrations Domain Types
// ============================================================================

/**
 * Access code with device/booking from integrations.get_access_codes_with_booking
 */
export interface AccessCodeWithBookingRPC {
  id: string;
  user_id: string;
  device_id: string;
  booking_id: string | null;
  seam_access_code_id: string | null;
  code: string;
  name: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  // Device fields
  device_seam_device_id: string | null;
  device_name: string | null;
  device_type: string | null;
  device_model: string | null;
  device_property_id: string | null;
  device_lock_state: string | null;
  device_connection_status: string | null;
  device_battery_level: number | null;
  // Booking fields
  booking_start_date: string | null;
  booking_end_date: string | null;
  // Contact fields
  contact_first_name: string | null;
  contact_last_name: string | null;
}

// ============================================================================
// Public Domain Types
// ============================================================================

/**
 * Call with contact data from public.get_recent_calls
 */
export interface CallWithContactRPC {
  id: string;
  user_id: string;
  contact_id: string | null;
  phone_number: string;
  direction: string;
  status: string;
  twilio_call_sid: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
  // Contact fields
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}
