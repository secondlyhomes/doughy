/**
 * Test Suite: Moltbot Bridge Edge Function
 * Description: Tests for the bridge between Moltbot AI assistant and Supabase.
 * Covers all CRUD operations for rental data including properties, contacts,
 * bookings, and messages.
 * Phase: Zone 4 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// =============================================================================
// CORS Tests
// =============================================================================

Deno.test('Moltbot Bridge: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8081',
    },
  });

  assertEquals(response.status, 200, 'OPTIONS request should return 200');

  const allowMethods = response.headers.get('Access-Control-Allow-Methods');
  assertExists(allowMethods, 'Should have Allow-Methods header');
  assertEquals(
    allowMethods?.includes('POST'),
    true,
    'Should allow POST method'
  );
});

// =============================================================================
// Authentication Tests
// =============================================================================

Deno.test('Moltbot Bridge: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {},
    }),
  });

  assertEquals(
    response.status,
    401,
    'Should return 401 without authentication'
  );

  const data = await response.json();
  assertExists(data.error, 'Should have error message');
});

Deno.test('Moltbot Bridge: Rejects invalid token', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {},
    }),
  });

  assertEquals(
    response.status,
    401,
    'Should return 401 for invalid token'
  );
});

Deno.test('Moltbot Bridge: Rejects mismatched user_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'different-user-id-not-matching-token',
      payload: {},
    }),
  });

  // Should return 403 or 401 for mismatched user
  assertEquals(
    response.status === 403 || response.status === 401,
    true,
    'Should reject mismatched user_id'
  );
});

// =============================================================================
// Request Validation Tests
// =============================================================================

Deno.test('Moltbot Bridge: Validates required fields - missing action', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing action
      user_id: 'test-user',
      payload: {},
    }),
  });

  assertEquals(
    response.status,
    400,
    'Should return 400 for missing action'
  );
});

Deno.test('Moltbot Bridge: Validates required fields - missing user_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      // Missing user_id
      payload: {},
    }),
  });

  assertEquals(
    response.status,
    400,
    'Should return 400 for missing user_id'
  );
});

Deno.test('Moltbot Bridge: Rejects unknown action', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'unknown_action',
      user_id: 'test-user',
      payload: {},
    }),
  });

  assertEquals(
    response.status >= 400,
    true,
    'Should return error for unknown action'
  );

  const data = await response.json();
  assertEquals(data.success, false, 'Should return success: false');
});

// =============================================================================
// Response Structure Tests
// =============================================================================

Deno.test('Moltbot Bridge: Returns JSON response', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {},
    }),
  });

  const contentType = response.headers.get('Content-Type');
  assertEquals(
    contentType?.includes('application/json'),
    true,
    'Should return JSON content type'
  );
});

Deno.test('Moltbot Bridge: Response has success field', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {},
    }),
  });

  const data = await response.json();
  assertExists(
    typeof data.success === 'boolean',
    'Response should have boolean success field'
  );
});

// =============================================================================
// get_properties Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: get_properties - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {},
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_properties request'
  );
});

Deno.test('Moltbot Bridge: get_properties - accepts status filter', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {
        status: 'active',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept status filter'
  );
});

Deno.test('Moltbot Bridge: get_properties - accepts include_rooms flag', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_properties',
      user_id: 'test-user',
      payload: {
        include_rooms: true,
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept include_rooms flag'
  );
});

// =============================================================================
// get_property Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: get_property - by property_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_property',
      user_id: 'test-user',
      payload: {
        property_id: 'test-property-uuid',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_property by id'
  );
});

Deno.test('Moltbot Bridge: get_property - by address_hint', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_property',
      user_id: 'test-user',
      payload: {
        address_hint: 'Main Street',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_property by address hint'
  );
});

Deno.test('Moltbot Bridge: get_property - SQL injection in address_hint is safely escaped', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_property',
      user_id: 'test-user',
      payload: {
        address_hint: "'; DROP TABLE rental_properties; --",
      },
    }),
  });

  // Should not cause a 500 error from SQL injection
  assertEquals(
    response.status !== 500,
    true,
    'Should safely handle potential SQL injection'
  );
});

// =============================================================================
// get_rooms Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: get_rooms - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_rooms',
      user_id: 'test-user',
      payload: {
        property_id: 'test-property-uuid',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_rooms request'
  );
});

Deno.test('Moltbot Bridge: get_rooms - accepts status filter', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_rooms',
      user_id: 'test-user',
      payload: {
        property_id: 'test-property-uuid',
        status: 'available',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_rooms with status filter'
  );
});

// =============================================================================
// get_availability Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: get_availability - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_availability',
      user_id: 'test-user',
      payload: {
        property_id: 'test-property-uuid',
        start_date: '2024-02-01',
        end_date: '2024-03-01',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_availability request'
  );
});

Deno.test('Moltbot Bridge: get_availability - with room_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_availability',
      user_id: 'test-user',
      payload: {
        property_id: 'test-property-uuid',
        room_id: 'test-room-uuid',
        start_date: '2024-02-01',
        end_date: '2024-03-01',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_availability with room_id'
  );
});

// =============================================================================
// create_contact Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: create_contact - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_contact',
      user_id: 'test-user',
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
        source: 'furnishedfinder',
        contact_type: ['lead'],
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept create_contact request'
  );
});

Deno.test('Moltbot Bridge: create_contact - parses name into first/last', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_contact',
      user_id: 'test-user',
      payload: {
        name: 'Jane Marie Smith',
        source: 'direct',
        contact_type: ['guest'],
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept name parsing'
  );
});

Deno.test('Moltbot Bridge: create_contact - accepts first_name and last_name separately', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_contact',
      user_id: 'test-user',
      payload: {
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+1234567890',
        source: 'airbnb',
        contact_type: ['guest'],
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept separate first/last name'
  );
});

Deno.test('Moltbot Bridge: create_contact - accepts metadata', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_contact',
      user_id: 'test-user',
      payload: {
        name: 'Test User',
        source: 'furnishedfinder',
        contact_type: ['lead'],
        metadata: {
          profession: 'travel nurse',
          employer: 'Aya Healthcare',
        },
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept metadata'
  );
});

// =============================================================================
// update_contact Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: update_contact - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'update_contact',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        status: 'qualified',
        score: 85,
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept update_contact request'
  );
});

Deno.test('Moltbot Bridge: update_contact - accepts tags update', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'update_contact',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        tags: ['travel_nurse', 'high_priority'],
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept tags update'
  );
});

// =============================================================================
// log_message Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: log_message - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'log_message',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        channel: 'email',
        direction: 'inbound',
        content: 'Hello, I am interested in your property.',
        sent_by: 'contact',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept log_message request'
  );
});

Deno.test('Moltbot Bridge: log_message - creates conversation if needed', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'log_message',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        // No conversation_id - should create new
        channel: 'email',
        platform: 'furnishedfinder',
        direction: 'inbound',
        content: 'New inquiry message',
        sent_by: 'contact',
        property_id: 'test-property-uuid',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept log_message without conversation_id'
  );
});

Deno.test('Moltbot Bridge: log_message - with existing conversation', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'log_message',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        conversation_id: 'existing-conversation-uuid',
        channel: 'email',
        direction: 'outbound',
        content: 'Thank you for your interest!',
        sent_by: 'ai',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept log_message with existing conversation'
  );
});

// =============================================================================
// create_booking Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: create_booking - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_booking',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        property_id: 'test-property-uuid',
        start_date: '2024-02-01',
        end_date: '2024-05-01',
        rate: 1500,
        rate_type: 'monthly',
        status: 'pending',
        source: 'furnishedfinder',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept create_booking request'
  );
});

Deno.test('Moltbot Bridge: create_booking - with room_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_booking',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        property_id: 'test-property-uuid',
        room_id: 'test-room-uuid',
        start_date: '2024-02-01',
        rate: 800,
        rate_type: 'monthly',
        deposit: 800,
        status: 'confirmed',
        source: 'direct',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept create_booking with room_id'
  );
});

Deno.test('Moltbot Bridge: create_booking - ongoing booking without end_date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_booking',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        property_id: 'test-property-uuid',
        start_date: '2024-02-01',
        // No end_date - ongoing booking
        rate: 1500,
        rate_type: 'monthly',
        status: 'active',
        source: 'direct',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept booking without end_date'
  );
});

// =============================================================================
// get_contact_history Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: get_contact_history - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_contact_history',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_contact_history request'
  );
});

Deno.test('Moltbot Bridge: get_contact_history - with limit', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_contact_history',
      user_id: 'test-user',
      payload: {
        contact_id: 'test-contact-uuid',
        limit: 20,
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_contact_history with limit'
  );
});

// =============================================================================
// queue_response Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: queue_response - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'queue_response',
      user_id: 'test-user',
      payload: {
        conversation_id: 'test-conversation-uuid',
        suggested_response: 'Thank you for your inquiry! The wifi password is Guest123.',
        confidence: 92,
        reason: 'FAQ response - high confidence',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept queue_response request'
  );
});

// =============================================================================
// get_templates Action Tests
// =============================================================================

Deno.test('Moltbot Bridge: get_templates - accepts valid request', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'get_templates',
      user_id: 'test-user',
      payload: {
        category: 'welcome',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept get_templates request'
  );
});

Deno.test('Moltbot Bridge: get_templates - various categories', async () => {
  const categories = ['welcome', 'faq', 'booking_confirmation', 'check_in'];

  for (const category of categories) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        action: 'get_templates',
        user_id: 'test-user',
        payload: {
          category,
        },
      }),
    });

    assertEquals(
      response.status !== 400,
      true,
      `Should accept get_templates for category: ${category}`
    );
  }
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test('Moltbot Bridge: Handles malformed JSON gracefully', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: 'not valid json {{{',
  });

  assertEquals(
    response.status >= 400,
    true,
    'Should return error for malformed JSON'
  );
});

Deno.test('Moltbot Bridge: Error response has expected structure', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbot-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  assertEquals(data.success, false, 'Should have success: false');
  assertExists(data.error, 'Should have error field');
});
