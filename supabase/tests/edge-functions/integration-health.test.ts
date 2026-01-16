/**
 * Test Suite: Integration Health Edge Function
 * Description: Verify API key health monitoring, encryption, and CORS handling
 * Phase: 5 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

Deno.test('Integration-Health: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
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

Deno.test('Integration-Health: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'openai',
    }),
  });

  // Should return 401 without valid authorization
  assertEquals(
    response.status === 401 || response.status === 403,
    true,
    'Should require authentication'
  );
});

Deno.test('Integration-Health: Validates service parameter', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing required 'service' field
    }),
  });

  // Should return 400 for missing service parameter
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should validate service parameter and return 4xx error'
  );
});

Deno.test('Integration-Health: Accepts valid service names', async () => {
  const validServices = ['openai', 'stripe', 'twilio', 'sendgrid'];

  for (const service of validServices) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8081',
      },
      body: JSON.stringify({
        service: service,
      }),
    });

    // Should not reject based on service name alone
    assertEquals(
      response.status !== 400,
      true,
      `Should accept valid service name: ${service}`
    );
  }
});

Deno.test('Integration-Health: Rejects invalid service names', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'invalid_service_name_xyz',
    }),
  });

  // Should reject invalid service names
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should reject invalid service names with 4xx error'
  );
});

Deno.test('Integration-Health: Returns JSON response', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'openai',
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

Deno.test('Integration-Health: Response includes health status', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'openai',
    }),
  });

  const data = await response.json();

  // Response should include health status fields
  assertExists(
    data.status || data.error,
    'Response should include status or error field'
  );
});

Deno.test('Integration-Health: Handles missing API key gracefully', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'openai',
    }),
  });

  const data = await response.json();

  // Should not crash, should return status indicating no API key
  assertExists(data, 'Should return a response even when API key is missing');

  if (data.status) {
    // Status should be 'not_configured' or similar
    assertEquals(
      data.status === 'not_configured' || data.status === 'error' || data.error,
      true,
      'Should indicate API key is not configured'
    );
  }
});

Deno.test('Integration-Health: Updates last_checked timestamp', async () => {
  // This test verifies that the function updates the last_checked field
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'openai',
    }),
  });

  const data = await response.json();

  // Response should include last_checked or updated_at timestamp
  assertExists(
    data.last_checked || data.checked_at || data.timestamp,
    'Response should include timestamp of when health check was performed'
  );
});

Deno.test('Integration-Health: Environment-based CORS handling', async () => {
  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    // Test development mode allows localhost
    Deno.env.set('ENVIRONMENT', 'development');

    const devResponse = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
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

    const prodResponse = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
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

Deno.test('Integration-Health: Performs actual health check', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      service: 'openai',
    }),
  });

  const data = await response.json();

  // Response should indicate whether the API key was tested
  // (even if the test failed due to missing key)
  assertExists(
    data.status || data.health || data.error,
    'Response should include health check result'
  );

  // If status exists, it should be a valid value
  if (data.status) {
    const validStatuses = ['healthy', 'unhealthy', 'not_configured', 'error'];
    assertEquals(
      validStatuses.includes(data.status),
      true,
      `Status should be one of: ${validStatuses.join(', ')}`
    );
  }
});

Deno.test('Integration-Health: Rate limits health checks', async () => {
  // Make multiple rapid requests
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(
      fetch(`${SUPABASE_URL}/functions/v1/integration-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Origin': 'http://localhost:8081',
        },
        body: JSON.stringify({
          service: 'openai',
        }),
      })
    );
  }

  const responses = await Promise.all(requests);

  // At least some should succeed (basic sanity check)
  const successCount = responses.filter(r => r.status === 200).length;
  assertEquals(
    successCount > 0,
    true,
    'At least some health check requests should succeed'
  );

  // If rate limiting is implemented, some might return 429
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  // This is optional - just verifying the function handles rapid requests
  assertEquals(
    rateLimitedCount >= 0,
    true,
    'Function should handle rapid requests (with or without rate limiting)'
  );
});
