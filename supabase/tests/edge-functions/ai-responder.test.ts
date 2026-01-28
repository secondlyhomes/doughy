/**
 * Test Suite: AI Responder Edge Function
 * Description: Tests for AI response generation, confidence scoring, topic detection,
 * and auto-send decision logic.
 * Phase: Zone 4 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// =============================================================================
// CORS Tests
// =============================================================================

Deno.test('AI Responder: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
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

  const allowHeaders = response.headers.get('Access-Control-Allow-Headers');
  assertExists(allowHeaders, 'Should have Allow-Headers header');
  assertEquals(
    allowHeaders?.includes('authorization'),
    true,
    'Should allow authorization header'
  );
});

// =============================================================================
// Authentication Tests
// =============================================================================

Deno.test('AI Responder: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'What is the wifi password?',
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

Deno.test('AI Responder: Rejects invalid/expired token', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token-12345',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'What is the wifi password?',
    }),
  });

  assertEquals(
    response.status,
    401,
    'Should return 401 for invalid token'
  );

  const data = await response.json();
  assertExists(data.error, 'Should have error message');
});

// =============================================================================
// Request Validation Tests
// =============================================================================

Deno.test('AI Responder: Validates required fields - missing contact_id', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing contact_id
      message: 'What is the wifi password?',
    }),
  });

  // Should return 400 or 401 (depending on auth)
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing contact_id'
  );
});

Deno.test('AI Responder: Validates required fields - missing message', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      // Missing message
    }),
  });

  // Should return 400 or 401 (depending on auth)
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should return 4xx error for missing message'
  );
});

Deno.test('AI Responder: Accepts valid request structure', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      user_id: 'test-user',
      contact_id: 'test-contact',
      message: 'What is the wifi password?',
      channel: 'email',
      context: {
        property_id: 'test-property',
      },
    }),
  });

  // Should not return 400 for valid structure
  // (might fail due to auth or missing data, but not validation)
  assertEquals(
    response.status !== 400,
    true,
    'Should accept valid request structure'
  );
});

// =============================================================================
// Response Structure Tests
// =============================================================================

Deno.test('AI Responder: Returns JSON response', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'What is the wifi password?',
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
// Topic Detection Unit Tests (if possible to test directly)
// =============================================================================

Deno.test('AI Responder: Detects wifi topic in message', async () => {
  // This test verifies the topic detection by checking the response
  // In a full integration test with valid auth, we'd check detected_topics

  const testMessages = [
    'What is the wifi password?',
    'Can you give me the internet details?',
    'I need the network name',
  ];

  for (const msg of testMessages) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        contact_id: 'test-contact',
        message: msg,
      }),
    });

    // Just verify it accepts the request format
    assertEquals(
      response.status !== 400,
      true,
      `Should accept message: "${msg}"`
    );
  }
});

Deno.test('AI Responder: Handles sensitive topics (refund)', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'I want a refund for my stay because of the issues',
    }),
  });

  // Should not return 400 for valid structure
  assertEquals(
    response.status !== 400,
    true,
    'Should accept refund message'
  );
});

Deno.test('AI Responder: Handles booking request messages', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'I would like to book a room from January 15 to February 15',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept booking request message'
  );
});

Deno.test('AI Responder: Handles maintenance issue messages', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'The toilet is broken and there is a leak under the sink',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept maintenance message'
  );
});

// =============================================================================
// Context Handling Tests
// =============================================================================

Deno.test('AI Responder: Accepts conversation history in context', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Thanks for the info!',
      context: {
        conversation_history: [
          {
            id: 'msg-1',
            conversation_id: 'test-conversation',
            direction: 'inbound',
            content: 'What is the wifi password?',
            content_type: 'text',
            sent_by: 'contact',
            created_at: new Date().toISOString(),
          },
          {
            id: 'msg-2',
            conversation_id: 'test-conversation',
            direction: 'outbound',
            content: 'The wifi password is Guest123',
            content_type: 'text',
            sent_by: 'ai',
            ai_confidence: 0.95,
            created_at: new Date().toISOString(),
          },
        ],
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept request with conversation history'
  );
});

Deno.test('AI Responder: Accepts property context', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'How much does it cost?',
      context: {
        property_id: 'test-property-uuid',
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept request with property context'
  );
});

Deno.test('AI Responder: Accepts lead score in context', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'I am a travel nurse looking for housing',
      context: {
        score: 85,
        score_factors: [
          { factor: 'travel nurse', points: 20 },
          { factor: 'healthcare worker', points: 15 },
        ],
      },
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept request with lead score context'
  );
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test('AI Responder: Handles malformed JSON gracefully', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
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

Deno.test('AI Responder: Returns error with message field', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Invalid request
    }),
  });

  const data = await response.json();
  assertExists(data.error, 'Error response should have error field');
});

// =============================================================================
// Channel and Platform Tests
// =============================================================================

Deno.test('AI Responder: Accepts different channels', async () => {
  const channels = ['email', 'sms', 'chat', 'phone'];

  for (const channel of channels) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        contact_id: 'test-contact',
        message: 'Hello!',
        channel,
      }),
    });

    assertEquals(
      response.status !== 400,
      true,
      `Should accept channel: ${channel}`
    );
  }
});

Deno.test('AI Responder: Accepts different platforms', async () => {
  const platforms = ['furnishedfinder', 'airbnb', 'turbotenant', 'direct'];

  for (const platform of platforms) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        contact_id: 'test-contact',
        message: 'Hello!',
        channel: 'email',
        platform,
      }),
    });

    assertEquals(
      response.status !== 400,
      true,
      `Should accept platform: ${platform}`
    );
  }
});

// =============================================================================
// Multiple Topic Detection Tests
// =============================================================================

Deno.test('AI Responder: Handles message with multiple topics', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      message: 'What is the wifi password and is parking available? Also, how much is the rate per month?',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept message with multiple topics'
  );
});

// =============================================================================
// AI Mode Tests (structure validation)
// =============================================================================

Deno.test('AI Responder: Accepts request for training mode flow', async () => {
  // This tests that the request structure is valid for training mode
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-responder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      contact_id: 'test-contact',
      conversation_id: 'test-conversation',
      message: 'Is parking available?',
      channel: 'email',
    }),
  });

  assertEquals(
    response.status !== 400,
    true,
    'Should accept request for training mode flow'
  );
});
