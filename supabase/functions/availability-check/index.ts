/**
 * Availability Check Edge Function
 *
 * Dedicated endpoint for checking property/room availability.
 * Handles complex availability logic including:
 * - Date range conflicts
 * - Room-by-room availability
 * - Maintenance blocks
 * - Suggested alternative dates
 *
 * @see /docs/doughy-architecture-refactor.md for API contracts
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface AvailabilityRequest {
  property_id: string;
  room_id?: string;
  start_date: string;
  end_date: string;
  user_id?: string; // Optional for authenticated requests
}

interface Booking {
  id: string;
  property_id: string;
  room_id: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  contact_name?: string;
}

interface AvailabilityResponse {
  available: boolean;
  property_id: string;
  room_id?: string;
  requested_dates: {
    start: string;
    end: string;
  };
  conflicts?: Booking[];
  suggested_dates?: { start: string; end: string }[];
  rooms_available?: {
    room_id: string;
    room_name: string;
    available: boolean;
  }[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if two date ranges overlap
 */
function datesOverlap(
  start1: Date, end1: Date,
  start2: Date, end2: Date | null
): boolean {
  // If end2 is null, treat as ongoing (indefinite end)
  const effectiveEnd2 = end2 || new Date('2099-12-31');
  return start1 <= effectiveEnd2 && end1 >= start2;
}

/**
 * Find gaps in bookings for suggested dates
 */
function findAvailableGaps(
  bookings: Booking[],
  requestedStart: Date,
  requestedEnd: Date,
  minDays: number = 7
): { start: string; end: string }[] {
  const gaps: { start: string; end: string }[] = [];

  // Sort bookings by start date
  const sortedBookings = bookings
    .filter(b => b.start_date)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  if (sortedBookings.length === 0) {
    return [];
  }

  // Look for gaps within a reasonable range (90 days from requested dates)
  const searchStart = new Date(requestedStart);
  searchStart.setDate(searchStart.getDate() - 30);
  const searchEnd = new Date(requestedEnd);
  searchEnd.setDate(searchEnd.getDate() + 60);

  // Check gap before first booking
  const firstBookingStart = new Date(sortedBookings[0].start_date);
  if (firstBookingStart > searchStart) {
    const gapEnd = new Date(firstBookingStart);
    gapEnd.setDate(gapEnd.getDate() - 1);
    const gapDays = Math.floor((gapEnd.getTime() - searchStart.getTime()) / (1000 * 60 * 60 * 24));
    if (gapDays >= minDays) {
      gaps.push({
        start: formatDate(searchStart),
        end: formatDate(gapEnd)
      });
    }
  }

  // Check gaps between bookings
  for (let i = 0; i < sortedBookings.length - 1; i++) {
    const currentEnd = sortedBookings[i].end_date
      ? new Date(sortedBookings[i].end_date!)
      : null;

    if (!currentEnd) continue;

    const nextStart = new Date(sortedBookings[i + 1].start_date);
    const gapStart = new Date(currentEnd);
    gapStart.setDate(gapStart.getDate() + 1);

    if (gapStart < nextStart) {
      const gapEnd = new Date(nextStart);
      gapEnd.setDate(gapEnd.getDate() - 1);
      const gapDays = Math.floor((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60 * 24));

      if (gapDays >= minDays && gapStart <= searchEnd && gapEnd >= searchStart) {
        gaps.push({
          start: formatDate(gapStart),
          end: formatDate(gapEnd)
        });
      }
    }
  }

  // Check gap after last booking
  const lastBooking = sortedBookings[sortedBookings.length - 1];
  if (lastBooking.end_date) {
    const lastEnd = new Date(lastBooking.end_date);
    const gapStart = new Date(lastEnd);
    gapStart.setDate(gapStart.getDate() + 1);

    if (gapStart < searchEnd) {
      const gapDays = Math.floor((searchEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60 * 24));
      if (gapDays >= minDays) {
        gaps.push({
          start: formatDate(gapStart),
          end: formatDate(searchEnd)
        });
      }
    }
  }

  // Return up to 3 suggestions, sorted by proximity to requested dates
  return gaps
    .sort((a, b) => {
      const distA = Math.abs(new Date(a.start).getTime() - requestedStart.getTime());
      const distB = Math.abs(new Date(b.start).getTime() - requestedStart.getTime());
      return distA - distB;
    })
    .slice(0, 3);
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request (support both GET and POST)
    let requestData: AvailabilityRequest;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      requestData = {
        property_id: url.searchParams.get('property_id') || '',
        room_id: url.searchParams.get('room_id') || undefined,
        start_date: url.searchParams.get('start_date') || '',
        end_date: url.searchParams.get('end_date') || '',
        user_id: url.searchParams.get('user_id') || undefined
      };
    } else {
      requestData = await req.json();
    }

    const { property_id, room_id, start_date, end_date, user_id } = requestData;

    // Validate required fields
    if (!property_id || !start_date || !end_date) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            error: 'Missing required fields: property_id, start_date, end_date'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Validate dates
    const requestedStart = parseDate(start_date);
    const requestedEnd = parseDate(end_date);

    if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    if (requestedEnd < requestedStart) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'end_date must be after start_date' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch property details
    const { data: property, error: propError } = await supabase
      .from('rental_properties')
      .select('id, name, room_by_room_enabled')
      .eq('id', property_id)
      .single();

    if (propError || !property) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Property not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Build booking query
    let bookingQuery = supabase
      .from('rental_bookings')
      .select(`
        id,
        property_id,
        room_id,
        start_date,
        end_date,
        status,
        contact:crm_contacts(first_name, last_name)
      `)
      .eq('property_id', property_id)
      .not('status', 'in', '("cancelled","completed")');

    // Filter by room if specified
    if (room_id) {
      bookingQuery = bookingQuery.eq('room_id', room_id);
    }

    const { data: bookings, error: bookingsError } = await bookingQuery;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      throw new Error('Failed to fetch bookings');
    }

    // Check for conflicts
    const conflicts: Booking[] = [];

    for (const booking of bookings || []) {
      const bookingStart = parseDate(booking.start_date);
      const bookingEnd = booking.end_date ? parseDate(booking.end_date) : null;

      if (datesOverlap(requestedStart, requestedEnd, bookingStart, bookingEnd)) {
        conflicts.push({
          id: booking.id,
          property_id: booking.property_id,
          room_id: booking.room_id,
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status,
          contact_name: booking.contact ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() : undefined
        });
      }
    }

    const isAvailable = conflicts.length === 0;

    // Build response
    const response: AvailabilityResponse = {
      available: isAvailable,
      property_id,
      room_id,
      requested_dates: {
        start: start_date,
        end: end_date
      }
    };

    // Add conflicts if not available
    if (!isAvailable) {
      response.conflicts = conflicts;

      // Find suggested alternative dates
      response.suggested_dates = findAvailableGaps(
        bookings || [],
        requestedStart,
        requestedEnd
      );
    }

    // If room-by-room property and no specific room requested,
    // check availability for all rooms
    if (property.room_by_room_enabled && !room_id) {
      const { data: rooms, error: roomsError } = await supabase
        .from('rental_rooms')
        .select('id, name')
        .eq('property_id', property_id)
        .eq('status', 'available');

      if (!roomsError && rooms) {
        const roomsAvailability = await Promise.all(
          rooms.map(async (room) => {
            // Check bookings for this specific room
            const { data: roomBookings } = await supabase
              .from('rental_bookings')
              .select('start_date, end_date')
              .eq('room_id', room.id)
              .not('status', 'in', '("cancelled","completed")');

            let roomAvailable = true;
            for (const booking of roomBookings || []) {
              const bookingStart = parseDate(booking.start_date);
              const bookingEnd = booking.end_date ? parseDate(booking.end_date) : null;
              if (datesOverlap(requestedStart, requestedEnd, bookingStart, bookingEnd)) {
                roomAvailable = false;
                break;
              }
            }

            return {
              room_id: room.id,
              room_name: room.name,
              available: roomAvailable
            };
          })
        );

        response.rooms_available = roomsAvailability;

        // If at least one room is available, mark property as available
        if (roomsAvailability.some(r => r.available)) {
          response.available = true;
        }
      }
    }

    // TODO: Check for maintenance blocks
    // TODO: Check for owner holds/blocks

    return addCorsHeaders(
      new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('Availability check error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
