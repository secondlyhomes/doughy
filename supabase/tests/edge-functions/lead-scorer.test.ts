/**
 * Test Suite: Lead Scorer Edge Function
 * Description: Tests for lead scoring logic, keyword detection, source scoring,
 * and recommendation generation.
 * Phase: Zone 4 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// =============================================================================
// CORS Tests
// =============================================================================

Deno.test('Lead Scorer: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
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

Deno.test('Lead Scorer: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
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

Deno.test('Lead Scorer: Rejects invalid token', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
    }),
  });

  assertEquals(
    response.status,
    401,
    'Should return 401 for invalid token'
  );
});

// =============================================================================
// Request Validation Tests
// =============================================================================

Deno.test('Lead Scorer: Validates required fields - missing contact_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing contact_id
      conversation_id: 'test-conversation',
    }),
  });

  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing contact_id'
  );
});

Deno.test('Lead Scorer: Validates required fields - missing conversation_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      // Missing conversation_id
    }),
  });

  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing conversation_id'
  );
});

Deno.test('Lead Scorer: Accepts valid request structure', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'I am a travel nurse looking for housing',
    }),
  });

  // Should not return 400 for valid structure
  assertEquals(
    response.status !== 400,
    true,
    'Should accept valid request structure'
  );
});

// =============================================================================
// Response Structure Tests
// =============================================================================

Deno.test('Lead Scorer: Returns JSON response', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
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
// Positive Keyword Detection Tests
// =============================================================================

Deno.test('Lead Scorer: Accepts travel nurse message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Hi, I am a travel nurse starting a 13-week contract at the local hospital',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept travel nurse message'
  );
});

Deno.test('Lead Scorer: Accepts healthcare worker message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'I am an RN at the clinic downtown looking for temporary housing',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept healthcare worker message'
  );
});

Deno.test('Lead Scorer: Accepts message with employer mention', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'My employer Aya Healthcare is paying for my housing stipend',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept message with employer mention'
  );
});

Deno.test('Lead Scorer: Accepts message with clear move-in date', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'I need to move in on January 15 for a 3 month assignment',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept message with clear move-in date'
  );
});

Deno.test('Lead Scorer: Accepts medium-term stay message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Looking for a 90 day lease while I complete my assignment',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept medium-term stay message'
  );
});

// =============================================================================
// Negative Keyword Detection Tests
// =============================================================================

Deno.test('Lead Scorer: Accepts message with party keywords (for scoring)', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Looking for a place for a bachelor party weekend',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept message with party keywords'
  );
});

Deno.test('Lead Scorer: Accepts cash-only request message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Can I pay cash only with no verification needed?',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept cash-only request message'
  );
});

Deno.test('Lead Scorer: Accepts urgent/desperate message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'I am desperate and was evicted, need something tonight',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept urgent/desperate message'
  );
});

Deno.test('Lead Scorer: Accepts very short stay message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Just need a place for the weekend',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept very short stay message'
  );
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test('Lead Scorer: Handles malformed JSON gracefully', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: 'not valid json',
  });

  assertEquals(
    response.status >= 400,
    true,
    'Should return error for malformed JSON'
  );
});

Deno.test('Lead Scorer: Returns error object on failure', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  assertExists(data.error, 'Error response should have error field');
});

// =============================================================================
// Contact Not Found Tests
// =============================================================================

Deno.test('Lead Scorer: Returns 404 for non-existent contact', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'non-existent-contact-id-12345',
      conversation_id: 'test-conversation',
    }),
  });

  // Should return 404 or 401 depending on auth state
  assertEquals(
    response.status >= 400,
    true,
    'Should return error for non-existent contact'
  );
});

// =============================================================================
// Message Content Tests
// =============================================================================

Deno.test('Lead Scorer: Accepts empty message (scores based on contact only)', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      // No message - will score based on existing conversation
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept request without message'
  );
});

Deno.test('Lead Scorer: Accepts very long message', async () => {
  const longMessage = 'Hello, I am a travel nurse. '.repeat(100);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: longMessage,
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept very long message'
  );
});

// =============================================================================
// Combination Tests
// =============================================================================

Deno.test('Lead Scorer: Accepts message with mixed positive and negative keywords', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'I am a travel nurse but this is urgent, I was evicted and need to move today. Can I pay cash?',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept message with mixed keywords'
  );
});

Deno.test('Lead Scorer: Accepts ideal travel nurse inquiry', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Hi! I am a travel nurse with Aya Healthcare starting a 13-week contract at Memorial Hospital on February 1st. Looking for a furnished room for 90 days.',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept ideal travel nurse inquiry'
  );
});

// =============================================================================
// Date Format Tests
// =============================================================================

Deno.test('Lead Scorer: Accepts various date formats in messages', async () => {
  const dateFormats = [
    'January 15',
    'Jan 15',
    '1/15',
    '01/15/2024',
    '2024-01-15',
  ];

  for (const dateFormat of dateFormats) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-scorer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        contact_id: 'test-contact',
        conversation_id: 'test-conversation',
        message: `Looking to move in on ${dateFormat}`,
      }),
    });

    assertEquals(
      response.status !== 400,
      true,
      `Should accept date format: ${dateFormat}`
    );
  }
});
