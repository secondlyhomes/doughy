// src/lib/rpc/mappers.ts
// Mappers to convert flat RPC results back to nested app types
// These maintain backward compatibility with existing code that expects nested objects

import type {
  DealWithLeadRPC,
  PropertyDealRPC,
  NudgeDealRPC,
  PropertyWithLeadRPC,
  InvestorConversationRPC,
  BookingWithContactRPC,
  LandlordConversationRPC,
  SkipTraceResultRPC,
  AccessCodeWithBookingRPC,
  CallWithContactRPC,
  MailHistoryRPC,
} from '@/types/rpc-types';

// ============================================================================
// Investor Mappers
// ============================================================================

/**
 * Map flat DealWithLeadRPC to nested Deal type expected by dealApi.ts
 * Fields match investor.get_deals_with_lead SQL return (migration 20260201100000_fix_rpc_schema_mismatch.sql)
 */
export function mapDealRPC(row: DealWithLeadRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    lead_id: row.lead_id,
    property_id: row.property_id,
    stage: row.stage || 'new',
    status: row.status,
    title: row.title,
    estimated_value: row.estimated_value,
    probability: row.probability,
    expected_close_date: row.expected_close_date,
    next_action: row.next_action,
    next_action_due: row.next_action_due,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lead: row.lead_id
      ? {
          id: row.lead_id,
          name: row.lead_name,
          phone: row.lead_phone,
          email: row.lead_email,
          status: row.lead_status,
          score: row.lead_score,
          tags: row.lead_tags,
        }
      : undefined,
    property: row.property_id
      ? {
          id: row.property_id,
          address: row.property_address_line_1,
          address_line_1: row.property_address_line_1,
          address_line_2: row.property_address_line_2,
          city: row.property_city,
          state: row.property_state,
          zip: row.property_zip,
          county: row.property_county,
          bedrooms: row.property_bedrooms,
          bathrooms: row.property_bathrooms,
          sqft: row.property_square_feet,
          square_feet: row.property_square_feet,
          lot_size: row.property_lot_size,
          lotSize: row.property_lot_size,
          year_built: row.property_year_built,
          yearBuilt: row.property_year_built,
          propertyType: row.property_type,
          property_type: row.property_type,
          arv: row.property_arv,
          purchase_price: row.property_purchase_price,
          notes: row.property_notes,
          status: row.property_status,
        }
      : undefined,
  };
}

/**
 * Map flat PropertyDealRPC to nested type expected by usePropertyDeals
 * Fields match investor.get_property_deals SQL return (migration 20260201100000_fix_rpc_schema_mismatch.sql)
 */
export function mapPropertyDealRPC(row: PropertyDealRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    lead_id: row.lead_id,
    property_id: row.property_id,
    stage: row.stage || 'new',
    status: row.status,
    title: row.title,
    next_action: row.next_action,
    next_action_due: row.next_action_due,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lead: row.lead_id
      ? {
          id: row.lead_id,
          name: row.lead_name,
          phone: row.lead_phone,
          email: row.lead_email,
        }
      : undefined,
  };
}

/**
 * Map flat NudgeDealRPC to structure expected by useNudges
 */
export function mapNudgeDealRPC(row: NudgeDealRPC) {
  return {
    id: row.id,
    stage: row.stage,
    next_action: row.next_action,
    next_action_due: row.next_action_due,
    updated_at: row.updated_at,
    lead: row.lead_id
      ? {
          id: row.lead_id,
          name: row.lead_name,
        }
      : null,
    property: row.property_id
      ? {
          id: row.property_id,
          address_line_1: row.property_address_line_1,
          city: row.property_city,
          state: row.property_state,
        }
      : null,
  };
}

/**
 * Map flat PropertyWithLeadRPC to FocusedProperty type
 */
export function mapPropertyWithLeadRPC(row: PropertyWithLeadRPC) {
  return {
    id: row.id,
    address: row.address_line_1,
    city: row.city,
    state: row.state,
    imageUrl: row.primary_image_url,
    leadName: row.lead_name,
    leadId: row.lead_id,
  };
}

/**
 * Map flat InvestorConversationRPC to nested conversation type
 */
export function mapInvestorConversationRPC(row: InvestorConversationRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    lead_id: row.lead_id,
    property_id: row.property_id,
    channel: row.channel,
    status: row.status,
    is_ai_enabled: row.is_ai_enabled,
    is_ai_auto_respond: row.is_ai_auto_respond,
    unread_count: row.unread_count,
    last_message_at: row.last_message_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lead: row.lead_id
      ? {
          id: row.lead_id,
          name: row.lead_name,
          phone: row.lead_phone,
          email: row.lead_email,
          status: row.lead_status,
          opt_status: row.lead_opt_status,
          tags: row.lead_tags,
        }
      : null,
    property: row.property_id
      ? {
          id: row.property_id,
          address_line_1: row.property_address_line_1,
          city: row.property_city,
          state: row.property_state,
        }
      : null,
    deal: row.deal_id
      ? {
          id: row.deal_id,
          title: row.deal_title,
          status: row.deal_status,
        }
      : null,
  };
}

/**
 * Map flat MailHistoryRPC to nested MailHistoryEntry type
 */
export function mapMailHistoryRPC(row: MailHistoryRPC) {
  return {
    ...row,
    enrollment: row.contact_id
      ? {
          contact: {
            id: row.contact_id,
            first_name: row.contact_first_name,
            last_name: row.contact_last_name,
          },
        }
      : undefined,
  };
}

// ============================================================================
// Landlord Mappers
// ============================================================================

/**
 * Map flat BookingWithContactRPC to nested BookingWithRelations type
 */
export function mapBookingRPC(row: BookingWithContactRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    contact_id: row.contact_id,
    property_id: row.property_id,
    room_id: row.room_id,
    booking_type: row.booking_type,
    start_date: row.start_date,
    end_date: row.end_date,
    rate: row.rate,
    rate_type: row.rate_type,
    deposit: row.deposit,
    total_amount: row.total_amount,
    status: row.status,
    source: row.source,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    confirmed_at: row.confirmed_at,
    cancelled_at: row.cancelled_at,
    contact: {
      id: row.contact_id,
      first_name: row.contact_first_name,
      last_name: row.contact_last_name,
      email: row.contact_email,
      phone: row.contact_phone,
    },
    property: row.property_name
      ? {
          id: row.property_id,
          name: row.property_name,
          address: row.property_address,
        }
      : null,
    room: row.room_id
      ? {
          id: row.room_id,
          name: row.room_name,
        }
      : null,
  };
}

/**
 * Map flat LandlordConversationRPC to nested conversation type
 */
export function mapLandlordConversationRPC(row: LandlordConversationRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    contact_id: row.contact_id,
    property_id: row.property_id,
    channel: row.channel,
    platform: row.platform,
    status: row.status,
    is_ai_enabled: row.is_ai_enabled,
    unread_count: row.unread_count,
    last_message_at: row.last_message_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    contact: row.contact_id
      ? {
          id: row.contact_id,
          first_name: row.contact_first_name,
          last_name: row.contact_last_name,
          email: row.contact_email,
          phone: row.contact_phone,
          contact_types: row.contact_types,
        }
      : null,
    property: row.property_id
      ? {
          id: row.property_id,
          name: row.property_name,
          address: row.property_address,
        }
      : null,
  };
}

// ============================================================================
// CRM Mappers
// ============================================================================

/**
 * Map flat SkipTraceResultRPC to nested type
 */
export function mapSkipTraceResultRPC(row: SkipTraceResultRPC) {
  return {
    ...row,
    contact: row.contact_id
      ? {
          id: row.contact_id,
          first_name: row.contact_first_name,
          last_name: row.contact_last_name,
        }
      : null,
    lead: row.lead_id
      ? {
          id: row.lead_id,
          name: row.lead_name,
        }
      : null,
    property: row.property_id
      ? {
          id: row.property_id,
          address: row.property_address,
          city: row.property_city,
          state: row.property_state,
        }
      : null,
    matched_property: row.matched_property_id
      ? {
          id: row.matched_property_id,
          address: row.matched_property_address,
          city: row.matched_property_city,
          state: row.matched_property_state,
        }
      : null,
  };
}

// ============================================================================
// Integrations Mappers
// ============================================================================

/**
 * Map flat AccessCodeWithBookingRPC to nested type
 */
export function mapAccessCodeRPC(row: AccessCodeWithBookingRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    device_id: row.device_id,
    booking_id: row.booking_id,
    seam_access_code_id: row.seam_access_code_id,
    code: row.code,
    name: row.name,
    status: row.status,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    device: {
      id: row.device_id,
      seam_device_id: row.device_seam_device_id,
      name: row.device_name,
      device_type: row.device_type,
      model: row.device_model,
      property_id: row.device_property_id,
      lock_state: row.device_lock_state,
      connection_status: row.device_connection_status,
      battery_level: row.device_battery_level,
    },
    booking: row.booking_id
      ? {
          id: row.booking_id,
          start_date: row.booking_start_date,
          end_date: row.booking_end_date,
          contact: {
            first_name: row.contact_first_name,
            last_name: row.contact_last_name,
          },
        }
      : null,
  };
}

// ============================================================================
// Public Mappers
// ============================================================================

/**
 * Map flat CallWithContactRPC to nested Call type
 */
export function mapCallRPC(row: CallWithContactRPC) {
  return {
    id: row.id,
    user_id: row.user_id,
    contact_id: row.contact_id,
    phone_number: row.phone_number,
    direction: row.direction,
    status: row.status,
    twilio_call_sid: row.twilio_call_sid,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_seconds: row.duration_seconds,
    recording_url: row.recording_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    contact: row.contact_id
      ? {
          id: row.contact_id,
          first_name: row.contact_first_name,
          last_name: row.contact_last_name,
          phone: row.contact_phone,
          email: row.contact_email,
        }
      : null,
  };
}
