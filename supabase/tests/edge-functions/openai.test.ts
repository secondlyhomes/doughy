/**
 * Test Suite: OpenAI Edge Function
 * Description: Verify OpenAI API integration, authentication, and error handling
 * Phase: 5 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

Deno.test('OpenAI: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
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

Deno.test('OpenAI: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      prompt: 'Test prompt',
      model: 'gpt-4',
    }),
  });

  // Should return 401 without valid authorization
  assertEquals(
    response.status === 401 || response.status === 403,
    true,
    'Should require authentication'
  );
});

Deno.test('OpenAI: Validates request body has required fields', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing required 'prompt' field
      model: 'gpt-4',
    }),
  });

  // Should return 400 for invalid request
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should validate request body and return 4xx error'
  );
});

Deno.test('OpenAI: Accepts valid model names', async () => {
  const validModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

  for (const model of validModels) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
        model: model,
      }),
    });

    // Should not reject based on model name alone
    // (might still fail due to missing API key, but that's a different error)
    assertEquals(
      response.status !== 400,
      true,
      `Should accept valid model name: ${model}`
    );
  }
});

Deno.test('OpenAI: Returns error when API key is not configured', async () => {
  // This test verifies that the function properly handles missing API keys
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      prompt: 'Test prompt for missing API key',
      model: 'gpt-4',
    }),
  });

  // Should return an error if no API key is configured
  // Either 401 (unauthorized), 403 (forbidden), or 500 (server error)
  assertEquals(
    response.status >= 400,
    true,
    'Should return error when API key is not configured'
  );

  const data = await response.json();
  assertExists(data.error, 'Error response should have error field');
});

Deno.test('OpenAI: Handles system messages correctly', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ],
      model: 'gpt-4',
    }),
  });

  // Should accept messages format (even if it fails due to missing API key)
  assertEquals(
    response.status !== 400,
    true,
    'Should accept messages array format'
  );
});

Deno.test('OpenAI: Rejects invalid message roles', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      messages: [
        { role: 'invalid_role', content: 'This should fail' },
      ],
      model: 'gpt-4',
    }),
  });

  // Should reject invalid message roles
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should reject invalid message roles with 4xx error'
  );
});

Deno.test('OpenAI: Validates temperature parameter range', async () => {
  // Test temperature > 2 (invalid)
  const invalidResponse = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      prompt: 'Test',
      model: 'gpt-4',
      temperature: 3.0, // Invalid: > 2
    }),
  });

  assertEquals(
    invalidResponse.status >= 400,
    true,
    'Should reject temperature > 2'
  );

  // Test valid temperature
  const validResponse = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      prompt: 'Test',
      model: 'gpt-4',
      temperature: 0.7, // Valid
    }),
  });

  // Should not reject based on valid temperature
  // (might still fail due to missing API key, but that's expected)
  assertEquals(
    validResponse.status !== 400,
    true,
    'Should accept valid temperature value'
  );
});

Deno.test('OpenAI: Validates max_tokens parameter', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      prompt: 'Test',
      model: 'gpt-4',
      max_tokens: -100, // Invalid: negative
    }),
  });

  assertEquals(
    response.status >= 400,
    true,
    'Should reject negative max_tokens'
  );
});

Deno.test('OpenAI: Returns JSON response', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      prompt: 'Test prompt',
      model: 'gpt-4',
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

Deno.test('OpenAI: Environment-based CORS handling', async () => {
  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    // Test development mode allows localhost
    Deno.env.set('ENVIRONMENT', 'development');

    const devResponse = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
      },
    });

    const devCorsOrigin = devResponse.headers.get('Access-Control-Allow-Origin');
    assertEquals(
      devCorsOrigin,
      'http://localhost:8081',
      'Development mode should allow localhost origin'
    );

    // Test production mode rejects localhost
    Deno.env.set('ENVIRONMENT', 'production');

    const prodResponse = await fetch(`${SUPABASE_URL}/functions/v1/openai`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
      },
    });

    const prodCorsOrigin = prodResponse.headers.get('Access-Control-Allow-Origin');
    assertEquals(
      prodCorsOrigin === null || prodCorsOrigin === '',
      true,
      'Production mode should reject localhost origin'
    );
  } finally {
    if (originalEnv) {
      Deno.env.set('ENVIRONMENT', originalEnv);
    } else {
      Deno.env.delete('ENVIRONMENT');
    }
  }
});
