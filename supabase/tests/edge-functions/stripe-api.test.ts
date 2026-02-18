/**
 * Test Suite: Stripe API Edge Function
 * Description: Verify Stripe API security, CORS handling, and environment detection
 * Phase: 5 - Testing & Documentation
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

Deno.test('Stripe-API: Environment-based development mode detection', async () => {
  // Test that isDevelopment is based on ENVIRONMENT variable
  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    // Test production mode
    Deno.env.set('ENVIRONMENT', 'production');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
      },
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');

    // In production, localhost should not be allowed
    assertEquals(
      corsOrigin === null || corsOrigin === '',
      true,
      'Production mode should reject localhost origin'
    );
  } finally {
    // Restore original environment
    if (originalEnv) {
      Deno.env.set('ENVIRONMENT', originalEnv);
    } else {
      Deno.env.delete('ENVIRONMENT');
    }
  }
});

Deno.test('Stripe-API: Development mode allows localhost', async () => {
  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    // Test development mode
    Deno.env.set('ENVIRONMENT', 'development');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
      },
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');

    // In development, localhost should be allowed
    assertEquals(
      corsOrigin,
      'http://localhost:8081',
      'Development mode should allow localhost origin'
    );
  } finally {
    // Restore original environment
    if (originalEnv) {
      Deno.env.set('ENVIRONMENT', originalEnv);
    } else {
      Deno.env.delete('ENVIRONMENT');
    }
  }
});

Deno.test('Stripe-API: Production mode allows only production origins', async () => {
  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    Deno.env.set('ENVIRONMENT', 'production');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://app.doughy.ai',
      },
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');

    // Production origin should be allowed in production mode
    assertEquals(
      corsOrigin,
      'https://app.doughy.ai',
      'Production mode should allow production origin'
    );
  } finally {
    if (originalEnv) {
      Deno.env.set('ENVIRONMENT', originalEnv);
    } else {
      Deno.env.delete('ENVIRONMENT');
    }
  }
});

Deno.test('Stripe-API: CORS preflight request returns correct headers', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
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

Deno.test('Stripe-API: Requires authentication', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      action: 'create_customer',
      email: 'test@example.com',
    }),
  });

  // Should return 401 without valid authorization
  assertEquals(
    response.status === 401 || response.status === 403,
    true,
    'Should require authentication'
  );
});

Deno.test('Stripe-API: Validates request body', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Origin': 'http://localhost:8081',
    },
    body: JSON.stringify({
      // Missing required 'action' field
      email: 'test@example.com',
    }),
  });

  // Should return 400 for invalid request
  assertEquals(
    response.status >= 400 && response.status < 500,
    true,
    'Should validate request body and return 4xx error'
  );
});

Deno.test('Stripe-API: Rejects unauthorized origins', async () => {
  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    Deno.env.set('ENVIRONMENT', 'production');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'https://evil-site.com',
      },
      body: JSON.stringify({
        action: 'create_customer',
        email: 'test@example.com',
      }),
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');

    // Should not allow unauthorized origin
    assertEquals(
      corsOrigin === null || corsOrigin === '' || corsOrigin !== 'https://evil-site.com',
      true,
      'Should reject unauthorized origins'
    );
  } finally {
    if (originalEnv) {
      Deno.env.set('ENVIRONMENT', originalEnv);
    } else {
      Deno.env.delete('ENVIRONMENT');
    }
  }
});

Deno.test('Stripe-API: No hardcoded development mode', async () => {
  // This test verifies the security fix we made
  // The function should NOT have `isDevelopment = true` hardcoded

  const originalEnv = Deno.env.get('ENVIRONMENT');

  try {
    // Set to production
    Deno.env.set('ENVIRONMENT', 'production');

    // Request with dev origin
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-api`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
      },
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');

    // If isDevelopment was hardcoded to true, this would incorrectly allow localhost
    assertEquals(
      corsOrigin === null || corsOrigin === '' || corsOrigin === '*',
      true,
      'Should NOT allow localhost when ENVIRONMENT=production (verifies no hardcoded isDevelopment=true)'
    );
  } finally {
    if (originalEnv) {
      Deno.env.set('ENVIRONMENT', originalEnv);
    } else {
      Deno.env.delete('ENVIRONMENT');
    }
  }
});
