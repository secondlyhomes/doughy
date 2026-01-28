/**
 * Moltbot Bridge Edge Function
 *
 * Bridge between Moltbot AI assistant and Doughy's Supabase database.
 * Provides a unified API for all CRUD operations on rental data.
 *
 * @see /docs/doughy-architecture-refactor.md for API contracts
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

type MoltbotAction =
  | 'get_properties'
  | 'get_property'
  | 'get_rooms'
  | 'get_availability'
  | 'create_contact'
  | 'update_contact'
  | 'log_message'
  | 'create_booking'
  | 'get_contact_history'
  | 'queue_response'
  | 'get_templates';

interface MoltbotBridgeRequest {
  action: MoltbotAction;
  user_id: string;
  payload: Record<string, any>;
}

interface MoltbotBridgeResponse {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Get all properties for a user
 */
async function handleGetProperties(
  supabase: any,
  userId: string,
  payload: { status?: string; include_rooms?: boolean }
): Promise<MoltbotBridgeResponse> {
  // TODO: Implement query to rental_properties table
  // TODO: If include_rooms is true, join with rental_rooms table

  let query = supabase
    .from('rental_properties')
    .select('*')
    .eq('user_id', userId);

  if (payload.status) {
    query = query.eq('status', payload.status);
  }

  const { data: properties, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Fetch rooms if include_rooms is true
  const warnings: string[] = [];
  if (payload.include_rooms) {
    for (const property of properties || []) {
      const { data: rooms, error: roomsError } = await supabase
        .from('rental_rooms')
        .select('*')
        .eq('property_id', property.id);

      if (roomsError) {
        console.error(`[moltbot-bridge] Failed to fetch rooms for property ${property.id}:`, roomsError.message);
        property.rooms = [];
        property.rooms_fetch_error = roomsError.message;
        warnings.push(`Failed to fetch rooms for property ${property.id}: ${roomsError.message}`);
      } else {
        property.rooms = rooms || [];
      }
    }
  }

  return {
    success: true,
    data: { properties },
    ...(warnings.length > 0 && { warnings }),
  };
}

/**
 * Get a specific property by ID or address hint
 */
async function handleGetProperty(
  supabase: any,
  userId: string,
  payload: { property_id?: string; address_hint?: string }
): Promise<MoltbotBridgeResponse> {
  // TODO: Implement fuzzy matching for address_hint

  let query = supabase
    .from('rental_properties')
    .select('*')
    .eq('user_id', userId);

  if (payload.property_id) {
    query = query.eq('id', payload.property_id);
  } else if (payload.address_hint) {
    // Sanitize input to prevent SQL injection - escape special LIKE characters
    const sanitizedHint = payload.address_hint
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/%/g, '\\%')    // Escape percent signs
      .replace(/_/g, '\\_');   // Escape underscores
    // Fuzzy match on name, address, or city
    query = query.or(
      `name.ilike.%${sanitizedHint}%,address.ilike.%${sanitizedHint}%,city.ilike.%${sanitizedHint}%`
    );
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: 'Property not found' };
  }

  return { success: true, data: { property: data } };
}

/**
 * Get rooms for a property
 */
async function handleGetRooms(
  supabase: any,
  userId: string,
  payload: { property_id: string; status?: string }
): Promise<MoltbotBridgeResponse> {
  // Verify property belongs to user first
  const { data: property, error: propError } = await supabase
    .from('rental_properties')
    .select('id')
    .eq('id', payload.property_id)
    .eq('user_id', userId)
    .single();

  if (propError || !property) {
    return { success: false, error: 'Property not found or access denied' };
  }

  let query = supabase
    .from('rental_rooms')
    .select('*')
    .eq('property_id', payload.property_id);

  if (payload.status) {
    query = query.eq('status', payload.status);
  }

  const { data: rooms, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { rooms } };
}

/**
 * Check availability for a property/room
 */
async function handleGetAvailability(
  supabase: any,
  userId: string,
  payload: { property_id: string; room_id?: string; start_date: string; end_date: string }
): Promise<MoltbotBridgeResponse> {
  // Verify property belongs to user first
  const { data: property, error: propError } = await supabase
    .from('rental_properties')
    .select('id')
    .eq('id', payload.property_id)
    .eq('user_id', userId)
    .single();

  if (propError || !property) {
    return { success: false, error: 'Property not found or access denied' };
  }

  // Query rental_bookings for conflicts
  // TODO: Consider room status (maintenance, unavailable, etc.)

  let query = supabase
    .from('rental_bookings')
    .select('*')
    .eq('property_id', payload.property_id)
    .not('status', 'in', '("cancelled","completed")')
    .or(`start_date.lte.${payload.end_date},end_date.gte.${payload.start_date}`);

  if (payload.room_id) {
    query = query.eq('room_id', payload.room_id);
  }

  const { data: conflicts, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const available = !conflicts || conflicts.length === 0;

  // TODO: Calculate suggested alternative dates if not available
  const suggestedDates: { start: string; end: string }[] = [];

  return {
    success: true,
    data: {
      available,
      conflicts: available ? undefined : conflicts,
      suggested_dates: available ? undefined : suggestedDates
    }
  };
}

/**
 * Create or update a contact
 */
async function handleCreateContact(
  supabase: any,
  userId: string,
  payload: {
    name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    source: string;
    contact_type: string[];
    metadata?: Record<string, any>;
  }
): Promise<MoltbotBridgeResponse> {
  // Parse name into first/last if not provided separately
  let firstName = payload.first_name;
  let lastName = payload.last_name;
  if (!firstName && !lastName && payload.name) {
    const parts = payload.name.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  const contactData = {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email: payload.email,
    phone: payload.phone,
    source: payload.source,
    contact_types: payload.contact_type,
    metadata: payload.metadata || {},
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Try to find existing contact by email or phone
  let existingContact = null;
  if (payload.email) {
    const { data } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('email', payload.email)
      .maybeSingle();
    existingContact = data;
  }
  if (!existingContact && payload.phone) {
    const { data } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('phone', payload.phone)
      .maybeSingle();
    existingContact = data;
  }

  let result;
  if (existingContact) {
    // Update existing contact
    const { data, error } = await supabase
      .from('crm_contacts')
      .update({
        ...contactData,
        created_at: undefined // Don't update created_at
      })
      .eq('id', existingContact.id)
      .select()
      .single();
    result = { data, error };
  } else {
    // Create new contact
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contactData)
      .select()
      .single();
    result = { data, error };
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: { contact: result.data } };
}

/**
 * Update an existing contact
 */
async function handleUpdateContact(
  supabase: any,
  userId: string,
  payload: {
    contact_id: string;
    status?: string;
    score?: number;
    contact_type?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
  }
): Promise<MoltbotBridgeResponse> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (payload.status) updateData.status = payload.status;
  if (payload.score !== undefined) updateData.score = payload.score;
  if (payload.contact_type) updateData.contact_types = payload.contact_type;
  if (payload.tags) updateData.tags = payload.tags;
  if (payload.metadata) updateData.metadata = payload.metadata;

  const { data, error } = await supabase
    .from('crm_contacts')
    .update(updateData)
    .eq('id', payload.contact_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { contact: data } };
}

/**
 * Log a message to a conversation
 */
async function handleLogMessage(
  supabase: any,
  userId: string,
  payload: {
    contact_id: string;
    conversation_id?: string;
    channel: string;
    platform?: string;
    direction: 'inbound' | 'outbound';
    content: string;
    sent_by: 'contact' | 'ai' | 'user';
    property_id?: string;
  }
): Promise<MoltbotBridgeResponse> {
  // TODO: Create conversation if conversation_id is null
  // TODO: Insert message into messages table

  let conversationId = payload.conversation_id;

  // Create conversation if needed
  if (!conversationId) {
    const { data: conversation, error: convError } = await supabase
      .from('rental_conversations')
      .insert({
        user_id: userId,
        contact_id: payload.contact_id,
        property_id: payload.property_id,
        channel: payload.channel,
        platform: payload.platform,
        status: 'active',
        ai_enabled: true,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (convError) {
      return { success: false, error: convError.message };
    }
    conversationId = conversation.id;
  }

  // Insert message
  const { data: message, error: msgError } = await supabase
    .from('rental_messages')
    .insert({
      conversation_id: conversationId,
      direction: payload.direction,
      content: payload.content,
      content_type: 'text',
      sent_by: payload.sent_by,
      metadata: {},
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (msgError) {
    return { success: false, error: msgError.message };
  }

  // Update conversation last_message_at
  const { error: updateError } = await supabase
    .from('rental_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  const warnings: string[] = [];
  if (updateError) {
    console.error('[moltbot-bridge] Failed to update conversation timestamp:', updateError.message);
    warnings.push('Failed to update conversation timestamp');
  }

  return {
    success: true,
    data: { message, conversation_id: conversationId },
    ...(warnings.length > 0 && { warnings }),
  };
}

/**
 * Create a booking
 */
async function handleCreateBooking(
  supabase: any,
  userId: string,
  payload: {
    contact_id: string;
    property_id: string;
    room_id?: string;
    start_date: string;
    end_date?: string;
    rate: number;
    rate_type: string;
    deposit?: number;
    status: string;
    source: string;
  }
): Promise<MoltbotBridgeResponse> {
  const { data, error } = await supabase
    .from('rental_bookings')
    .insert({
      user_id: userId,
      contact_id: payload.contact_id,
      property_id: payload.property_id,
      room_id: payload.room_id,
      start_date: payload.start_date,
      end_date: payload.end_date,
      rate: payload.rate,
      rate_type: payload.rate_type,
      deposit: payload.deposit,
      status: payload.status,
      source: payload.source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { booking: data } };
}

/**
 * Get contact conversation history
 */
async function handleGetContactHistory(
  supabase: any,
  userId: string,
  payload: { contact_id: string; limit?: number }
): Promise<MoltbotBridgeResponse> {
  const limit = payload.limit || 50;

  // Get conversations for this contact
  const { data: conversations, error: convError } = await supabase
    .from('rental_conversations')
    .select('id')
    .eq('contact_id', payload.contact_id)
    .eq('user_id', userId);

  if (convError) {
    return { success: false, error: convError.message };
  }

  if (!conversations || conversations.length === 0) {
    return { success: true, data: { messages: [] } };
  }

  const conversationIds = conversations.map((c: any) => c.id);

  // Get messages from these conversations
  const { data: messages, error: msgError } = await supabase
    .from('rental_messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (msgError) {
    return { success: false, error: msgError.message };
  }

  return { success: true, data: { messages } };
}

/**
 * Queue an AI response for human review
 */
async function handleQueueResponse(
  supabase: any,
  userId: string,
  payload: {
    conversation_id: string;
    suggested_response: string;
    confidence: number;
    reason: string;
  }
): Promise<MoltbotBridgeResponse> {
  // TODO: Insert into ai_response_queue table
  // TODO: Set expiration time (24 hours default)

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabase
    .from('rental_ai_queue')
    .insert({
      user_id: userId,
      conversation_id: payload.conversation_id,
      suggested_response: payload.suggested_response,
      confidence: payload.confidence,
      reason: payload.reason,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // TODO: Send push notification to owner

  return { success: true, data: { queued_response: data } };
}

/**
 * Get response templates
 */
async function handleGetTemplates(
  supabase: any,
  userId: string,
  payload: { category: string }
): Promise<MoltbotBridgeResponse> {
  // TODO: Query templates table by category
  // TODO: Fall back to system-wide templates if user has none

  const { data, error } = await supabase
    .from('rental_templates')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('category', payload.category)
    .eq('is_active', true);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { templates: data || [] } };
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Parse request
    const body: MoltbotBridgeRequest = await req.json();
    const { action, user_id, payload } = body;

    // Validate required fields
    if (!action || !user_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing action or user_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // SECURITY: Authentication is MANDATORY
    // Verify user_id matches the authenticated user from JWT
    // This prevents users from accessing other users' data
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Verify the requested user_id matches the authenticated user
    if (authUser.id !== user_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'User ID mismatch - unauthorized access' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Route to appropriate handler
    let result: MoltbotBridgeResponse;

    switch (action) {
      case 'get_properties':
        result = await handleGetProperties(supabase, user_id, payload);
        break;
      case 'get_property':
        result = await handleGetProperty(supabase, user_id, payload);
        break;
      case 'get_rooms':
        result = await handleGetRooms(supabase, user_id, payload);
        break;
      case 'get_availability':
        result = await handleGetAvailability(supabase, user_id, payload);
        break;
      case 'create_contact':
        result = await handleCreateContact(supabase, user_id, payload);
        break;
      case 'update_contact':
        result = await handleUpdateContact(supabase, user_id, payload);
        break;
      case 'log_message':
        result = await handleLogMessage(supabase, user_id, payload);
        break;
      case 'create_booking':
        result = await handleCreateBooking(supabase, user_id, payload);
        break;
      case 'get_contact_history':
        result = await handleGetContactHistory(supabase, user_id, payload);
        break;
      case 'queue_response':
        result = await handleQueueResponse(supabase, user_id, payload);
        break;
      case 'get_templates':
        result = await handleGetTemplates(supabase, user_id, payload);
        break;
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    const status = result.success ? 200 : 400;
    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('Moltbot bridge error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
