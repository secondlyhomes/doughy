/**
 * TypeScript types for the Landlord Platform (rental tables)
 * Generated from Zone 2 database schema
 *
 * These types are the interface contract between all zones.
 * DO NOT modify without coordinating with other zones.
 */

// ============================================================================
// ENUM TYPES
// ============================================================================

export type RentalType = 'str' | 'mtr' | 'ltr';

export type RentalPropertyType =
  | 'single_family'
  | 'multi_family'
  | 'condo'
  | 'apartment'
  | 'townhouse'
  | 'room';

export type RentalRateType = 'nightly' | 'weekly' | 'monthly';

export type RentalPropertyStatus = 'active' | 'inactive' | 'maintenance';

export type RentalRoomStatus = 'available' | 'occupied' | 'maintenance' | 'unavailable';

export type RentalBookingStatus =
  | 'inquiry'
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled';

export type RentalBookingType = 'reservation' | 'lease';

export type RentalChannel =
  | 'whatsapp'
  | 'telegram'
  | 'email'
  | 'sms'
  | 'imessage'
  | 'discord'
  | 'webchat'
  | 'phone';

export type RentalPlatform =
  | 'furnishedfinder'
  | 'airbnb'
  | 'turbotenant'
  | 'zillow'
  | 'facebook'
  | 'craigslist'
  | 'direct'
  | 'referral'
  | 'other';

export type RentalConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived';

export type RentalMessageDirection = 'inbound' | 'outbound';

export type RentalMessageContentType = 'text' | 'image' | 'file' | 'voice' | 'video';

export type RentalMessageSender = 'contact' | 'ai' | 'user';

export type RentalAIQueueStatus =
  | 'pending'
  | 'approved'
  | 'edited'
  | 'rejected'
  | 'expired'
  | 'sent';

export type UserPlatform = 'investor' | 'landlord';

export type ContactType = 'lead' | 'guest' | 'tenant' | 'vendor' | 'personal';

export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'active' | 'inactive' | 'archived';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

// ============================================================================
// TABLE TYPES
// ============================================================================

/**
 * Rental property for Landlord platform
 * Distinct from re_properties (RE Investor platform)
 */
export interface RentalProperty {
  id: string;
  user_id: string;
  name: string;
  address: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  property_type: RentalPropertyType;
  rental_type: RentalType;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  base_rate: number;
  rate_type: RentalRateType;
  cleaning_fee: number | null;
  security_deposit: number | null;
  room_by_room_enabled: boolean;
  amenities: string[];
  house_rules: Record<string, unknown>;
  listing_urls: {
    furnishedfinder?: string;
    airbnb?: string;
    turbotenant?: string;
    zillow?: string;
    [key: string]: string | undefined;
  };
  status: RentalPropertyStatus;
  description: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Individual room for room-by-room rentals
 */
export interface RentalRoom {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  size_sqft: number | null;
  has_private_bath: boolean;
  has_private_entrance: boolean;
  amenities: string[];
  weekly_rate: number | null;
  monthly_rate: number;
  utilities_included: boolean;
  status: RentalRoomStatus;
  available_date: string | null;
  current_booking_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Booking (reservation or lease)
 */
export interface RentalBooking {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string;
  room_id: string | null;
  booking_type: RentalBookingType;
  start_date: string;
  end_date: string | null;
  check_in_time: string;
  check_out_time: string;
  rate: number;
  rate_type: RentalRateType;
  total_amount: number | null;
  deposit: number | null;
  deposit_status: 'pending' | 'received' | 'returned' | 'forfeited';
  status: RentalBookingStatus;
  source: string | null;
  external_booking_id: string | null;
  notes: string | null;
  guest_notes: string | null;
  internal_notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Conversation thread with a contact
 */
export interface RentalConversation {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string | null;
  booking_id: string | null;
  channel: RentalChannel;
  platform: RentalPlatform | null;
  status: RentalConversationStatus;
  ai_enabled: boolean;
  ai_auto_respond: boolean;
  ai_confidence_threshold: number;
  ai_personality: string | null;
  subject: string | null;
  message_count: number;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  external_thread_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Individual message in a conversation
 */
export interface RentalMessage {
  id: string;
  conversation_id: string;
  direction: RentalMessageDirection;
  content: string;
  content_type: RentalMessageContentType;
  sent_by: RentalMessageSender;
  ai_confidence: number | null;
  ai_model: string | null;
  ai_prompt_tokens: number | null;
  ai_completion_tokens: number | null;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  edited_content: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  attachments: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * AI response awaiting human review
 */
export interface RentalAIQueue {
  id: string;
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  sent_message_id: string | null;
  suggested_response: string;
  confidence: number;
  reasoning: string | null;
  intent: string | null;
  detected_topics: string[] | null;
  alternatives: Array<{
    response: string;
    confidence: number;
  }>;
  status: RentalAIQueueStatus;
  final_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * Response template
 */
export interface RentalTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  subject: string | null;
  content: string;
  channel: RentalChannel | null;
  is_default: boolean;
  is_active: boolean;
  use_count: number;
  last_used_at: string | null;
  ai_use_as_example: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * External platform integration
 */
export interface RentalIntegration {
  id: string;
  user_id: string;
  platform: RentalPlatform;
  name: string | null;
  status: IntegrationStatus;
  credentials: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  messages_synced: number;
  contacts_synced: number;
  bookings_synced: number;
  connected_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User platform settings
 */
export interface UserPlatformSettings {
  id: string;
  user_id: string;
  enabled_platforms: UserPlatform[];
  active_platform: UserPlatform;
  completed_investor_onboarding: boolean;
  completed_landlord_onboarding: boolean;
  landlord_settings: {
    default_ai_enabled?: boolean;
    auto_respond_threshold?: number;
    notification_preferences?: Record<string, boolean>;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Extended Contact type (crm_contacts with Landlord platform fields)
 */
export interface Contact {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  emails: Record<string, unknown> | null;
  phone: string | null;
  phones: Record<string, unknown> | null;
  company: string | null;
  job_title: string | null;
  address: Record<string, unknown> | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  // Landlord platform extensions
  contact_types: ContactType[];
  source: RentalPlatform | null;
  status: ContactStatus;
  score: number | null;
  tags: string[];
  metadata: Record<string, unknown>;
  sms_opt_status: 'opted_in' | 'opted_out' | 'pending' | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Availability check result
 */
export interface AvailabilityResult {
  available: boolean;
  conflict_count: number;
  conflicts: Array<{
    id: string;
    contact_id: string;
    guest_name: string;
    start_date: string;
    end_date: string | null;
    status: RentalBookingStatus;
  }>;
}

/**
 * Property occupancy stats
 */
export interface OccupancyStats {
  total_days: number;
  occupied_days: number;
  occupancy_rate: number;
  revenue: number;
  booking_count: number;
}

/**
 * Conversation summary
 */
export interface ConversationSummary {
  total_conversations: number;
  active_conversations: number;
  escalated_conversations: number;
  pending_ai_responses: number;
  unread_messages: number;
}

/**
 * Conversation with related data (for UI display)
 */
export interface ConversationWithDetails extends RentalConversation {
  contact: Contact;
  property?: RentalProperty;
  booking?: RentalBooking;
  last_message?: RentalMessage;
  pending_ai_response?: RentalAIQueue;
}

/**
 * Booking with related data (for UI display)
 */
export interface BookingWithDetails extends RentalBooking {
  contact: Contact;
  property: RentalProperty;
  room?: RentalRoom;
}

/**
 * Property with related data (for UI display)
 */
export interface PropertyWithDetails extends RentalProperty {
  rooms: RentalRoom[];
  active_bookings: RentalBooking[];
  occupancy_rate?: number;
}

// ============================================================================
// INSERT/UPDATE TYPES
// ============================================================================

export type RentalPropertyInsert = Omit<RentalProperty, 'id' | 'created_at' | 'updated_at'>;
export type RentalPropertyUpdate = Partial<Omit<RentalProperty, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type RentalRoomInsert = Omit<RentalRoom, 'id' | 'created_at' | 'updated_at'>;
export type RentalRoomUpdate = Partial<Omit<RentalRoom, 'id' | 'property_id' | 'created_at' | 'updated_at'>>;

export type RentalBookingInsert = Omit<RentalBooking, 'id' | 'total_amount' | 'confirmed_at' | 'cancelled_at' | 'created_at' | 'updated_at'>;
export type RentalBookingUpdate = Partial<Omit<RentalBooking, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type RentalConversationInsert = Omit<RentalConversation, 'id' | 'message_count' | 'unread_count' | 'last_message_at' | 'last_message_preview' | 'created_at' | 'updated_at'>;
export type RentalConversationUpdate = Partial<Omit<RentalConversation, 'id' | 'user_id' | 'contact_id' | 'created_at' | 'updated_at'>>;

export type RentalMessageInsert = Omit<RentalMessage, 'id' | 'created_at'>;

export type RentalAIQueueInsert = Omit<RentalAIQueue, 'id' | 'created_at'>;
export type RentalAIQueueUpdate = Partial<Pick<RentalAIQueue, 'status' | 'final_response' | 'reviewed_by' | 'reviewed_at' | 'review_notes'>>;

export type RentalTemplateInsert = Omit<RentalTemplate, 'id' | 'use_count' | 'last_used_at' | 'created_at' | 'updated_at'>;
export type RentalTemplateUpdate = Partial<Omit<RentalTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type UserPlatformSettingsUpdate = Partial<Pick<UserPlatformSettings, 'enabled_platforms' | 'active_platform' | 'completed_investor_onboarding' | 'completed_landlord_onboarding' | 'landlord_settings'>>;
