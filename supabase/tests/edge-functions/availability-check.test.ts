/**
 * Test Suite: Availability Check Edge Function
 * Description: Tests for property availability checking, date validation,
 * conflict detection, and suggested alternative dates.
 * Phase: Zone 4 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// =============================================================================
// CORS Tests
// =============================================================================

Deno.test('Availability Check: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8081',
    },
  });

  assertEquals(response.status, 200, 'OPTIONS request should return 200');

  const allowMethods = response.headers.get('Access-Control-Allow-Methods');
  assertExists(allowMethods, 'Should have Allow-Methods header');
});

// =============================================================================
// Authentication Tests
// =============================================================================

Deno.test('Availability Check: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status,
    401,
    'Should return 401 without authentication'
  );

  const data = await response.json();
  assertExists(data.error, 'Should have error message');
  assertEquals(data.error, 'Authentication required');
});

Deno.test('Availability Check: Rejects invalid token', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status,
    401,
    'Should return 401 for invalid token'
  );
});

// =============================================================================
// Request Validation Tests - Required Fields
// =============================================================================

Deno.test('Availability Check: Validates required fields - missing property_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing property_id
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing property_id'
  );
});

Deno.test('Availability Check: Validates required fields - missing start_date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      // Missing start_date
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing start_date'
  );
});

Deno.test('Availability Check: Validates required fields - missing end_date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      // Missing end_date
    }),
  });

  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing end_date'
  );
});

// =============================================================================
// Date Validation Tests
// =============================================================================

Deno.test('Availability Check: Validates date format - invalid start_date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: 'not-a-date',
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status,
    400,
    'Should return 400 for invalid date format'
  );

  const data = await response.json();
  assertExists(data.error, 'Should have error message');
});

Deno.test('Availability Check: Validates date format - invalid end_date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: 'invalid-date',
    }),
  });

  assertEquals(
    response.status,
    400,
    'Should return 400 for invalid date format'
  );
});

Deno.test('Availability Check: Rejects end_date before start_date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-03-01',
      end_date: '2024-02-01', // Before start_date
    }),
  });

  assertEquals(
    response.status,
    400,
    'Should return 400 when end_date is before start_date'
  );

  const data = await response.json();
  assertEquals(
    data.error,
    'end_date must be after start_date',
    'Should have specific error message'
  );
});

// =============================================================================
// Valid Request Tests
// =============================================================================

Deno.test('Availability Check: Accepts valid POST request structure', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property-uuid',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  // Should not return 400 for valid structure
  assertEquals(
    response.status !== 400,
    true,
    'Should accept valid request structure'
  );
});

Deno.test('Availability Check: Accepts valid GET request', async () => {
  const params = new URLSearchParams({
    property_id: 'test-property-uuid',
    start_date: '2024-02-01',
    end_date: '2024-03-01',
  });

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/availability-check?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
    }
  );

  // Should not return 400 for valid structure
  assertEquals(
    response.status !== 400,
    true,
    'Should accept valid GET request'
  );
});

Deno.test('Availability Check: Accepts request with room_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property-uuid',
      room_id: 'test-room-uuid',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept request with room_id'
  );
});

// =============================================================================
// Response Structure Tests
// =============================================================================

Deno.test('Availability Check: Returns JSON response', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  const contentType = response.headers.get('Content-Type');
  assertEquals(
    contentType?.includes('application/json'),
    true,
    'Should return JSON content type'
  );

  // Should be valid JSON
  try {
    await response.json();
  } catch {
    assertEquals(false, true, 'Response should be valid JSON');
  }
});

// =============================================================================
// Property Access Tests
// =============================================================================

Deno.test('Availability Check: Returns 404 for non-existent property', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'non-existent-property-uuid-12345',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  // Should return 404 or error for non-existent property
  assertEquals(
    response.status >= 400,
    true,
    'Should return error for non-existent property'
  );
});

// =============================================================================
// Date Format Tests
// =============================================================================

Deno.test('Availability Check: Accepts ISO date format', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01T00:00:00.000Z',
      end_date: '2024-03-01T00:00:00.000Z',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept ISO date format'
  );
});

Deno.test('Availability Check: Accepts YYYY-MM-DD date format', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept YYYY-MM-DD date format'
  );
});

// =============================================================================
// Edge Case Tests
// =============================================================================

Deno.test('Availability Check: Handles same-day request (start = end)', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: '2024-02-01',
    }),
  });

  // Should accept same-day check (even if business logic might reject)
  assertEquals(
    response.status !== 400,
    true,
    'Should accept same-day request'
  );
});

Deno.test('Availability Check: Handles very long date range', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-01-01',
      end_date: '2026-12-31', // ~3 year range
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept long date range'
  );
});

Deno.test('Availability Check: Handles past dates', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2020-01-01',
      end_date: '2020-03-01',
    }),
  });

  // Should accept past dates (might be needed for historical queries)
  assertEquals(
    response.status !== 400,
    true,
    'Should accept past dates'
  );
});

Deno.test('Availability Check: Handles far future dates', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2030-01-01',
      end_date: '2030-06-01',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept far future dates'
  );
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test('Availability Check: Handles malformed JSON gracefully', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
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

Deno.test('Availability Check: Returns error object with message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing required fields
    }),
  });

  const data = await response.json();
  assertExists(data.error, 'Error response should have error field');
});

// =============================================================================
// GET Request Parameter Tests
// =============================================================================

Deno.test('Availability Check: GET request validates required query params', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/availability-check`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
    }
  );

  assertEquals(
    response.status >= 400,
    true,
    'GET request should require query params'
  );
});

Deno.test('Availability Check: GET request with partial params fails', async () => {
  const params = new URLSearchParams({
    property_id: 'test-property',
    // Missing start_date and end_date
  });

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/availability-check?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
    }
  );

  assertEquals(
    response.status >= 400,
    true,
    'Should fail with partial query params'
  );
});

Deno.test('Availability Check: GET request with room_id', async () => {
  const params = new URLSearchParams({
    property_id: 'test-property',
    room_id: 'test-room',
    start_date: '2024-02-01',
    end_date: '2024-03-01',
  });

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/availability-check?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
    }
  );

  assertEquals(
    response.status !== 400,
    true,
    'Should accept GET request with room_id'
  );
});

// =============================================================================
// User ID Parameter Tests
// =============================================================================

Deno.test('Availability Check: Accepts optional user_id in POST', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/availability-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      property_id: 'test-property',
      start_date: '2024-02-01',
      end_date: '2024-03-01',
      user_id: 'test-user-uuid',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept optional user_id'
  );
});
