#!/usr/bin/env npx ts-node
// scripts/test-landlord-functions.ts
// Test individual Doughy Landlord Edge Functions
// Run with: npx ts-node scripts/test-landlord-functions.ts

import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL. Set EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  process.exit(1);
}

const AUTH_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
if (!AUTH_KEY) {
  console.error('Missing auth key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log(`Using Supabase URL: ${SUPABASE_URL}`);
console.log(`Using auth: ${SUPABASE_SERVICE_KEY ? 'Service Role Key' : 'Anon Key'}\n`);

async function callFunction(name: string, payload: Record<string, unknown>) {
  console.log(`\n📡 Calling ${name}...`);
  console.log(`   Payload: ${JSON.stringify(payload).substring(0, 100)}...`);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    console.log(`   ❌ Error ${response.status}: ${text}`);
    return null;
  }

  console.log(`   ✅ Success`);
  return data;
}

// Test 1: Platform Email Parser
async function testEmailParser() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Platform Email Parser');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'FurnishedFinder email',
      payload: {
        from: 'noreply@furnishedfinder.com',
        subject: 'New message from Sarah Johnson',
        body: `You have a new message from Sarah Johnson.
Name: Sarah Johnson
Email: sarah.j@test.com
Phone: (571) 555-1234
Move-in: February 1, 2026
Message: I'm a travel nurse looking for housing near Inova.`,
      },
    },
    {
      name: 'Airbnb email',
      payload: {
        from: 'express@airbnb.com',
        subject: 'New inquiry from Mike Chen',
        body: `Mike Chen wants to book your listing.
Check-in: March 15, 2026
Check-out: March 22, 2026
Message: Is this close to the Metro?`,
      },
    },
    {
      name: 'Unknown platform',
      payload: {
        from: 'random@unknown.com',
        subject: 'Hello',
        body: 'Is your place available?',
      },
    },
  ];

  for (const tc of testCases) {
    console.log(`\n--- ${tc.name} ---`);
    const result = await callFunction('platform-email-parser', tc.payload);
    if (result) {
      console.log(`   Platform: ${(result as any).platform}`);
      console.log(`   Reply Method: ${(result as any).replyMethod}`);
      console.log(`   Contact: ${JSON.stringify((result as any).contact)}`);
    }
  }
}

// Test 2: Lead Scorer
async function testLeadScorer() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Lead Scorer');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'High-quality travel nurse lead',
      payload: {
        contact: {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@test.com',
        },
        message: "I'm a travel nurse starting at Inova Alexandria on Feb 1 for a 13-week assignment.",
        source: 'furnishedfinder',
        metadata: {
          profession: 'travel_nurse',
          employer: 'Inova Alexandria',
          dates: { start: '2026-02-01', end: '2026-04-26' },
        },
      },
    },
    {
      name: 'Low-quality vague inquiry',
      payload: {
        contact: {
          first_name: 'Unknown',
        },
        message: 'Is this available?',
        source: 'facebook',
        metadata: {},
      },
    },
  ];

  for (const tc of testCases) {
    console.log(`\n--- ${tc.name} ---`);
    const result = await callFunction('lead-scorer', tc.payload);
    if (result) {
      console.log(`   Score: ${(result as any).score}/100`);
      console.log(`   Qualification: ${(result as any).qualification}`);
      console.log(`   Recommendation: ${(result as any).recommendation}`);
    }
  }
}

// Test 3: MoltBot Bridge - List Properties
async function testMoltbotBridge() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: MoltBot Bridge');
  console.log('='.repeat(60));

  // Note: These require a valid user_id from your database
  const testUserId = process.env.TEST_USER_ID || 'YOUR_USER_ID_HERE';

  if (testUserId === 'YOUR_USER_ID_HERE') {
    console.log('\n⚠️  Set TEST_USER_ID environment variable to test moltbot-bridge');
    console.log('   Example: TEST_USER_ID=abc123 npx ts-node scripts/test-landlord-functions.ts');
    return;
  }

  // Test: Get properties
  console.log('\n--- GET_PROPERTIES ---');
  const properties = await callFunction('moltbot-bridge', {
    action: 'GET_PROPERTIES',
    user_id: testUserId,
  });
  if (properties) {
    const props = (properties as any).properties || [];
    console.log(`   Found ${props.length} properties`);
    props.slice(0, 3).forEach((p: any) => {
      console.log(`   - ${p.name} (${p.status})`);
    });
  }

  // Test: Get contacts
  console.log('\n--- GET_CONTACTS ---');
  const contacts = await callFunction('moltbot-bridge', {
    action: 'GET_CONTACTS',
    user_id: testUserId,
  });
  if (contacts) {
    const ctcs = (contacts as any).contacts || [];
    console.log(`   Found ${ctcs.length} contacts`);
    ctcs.slice(0, 3).forEach((c: any) => {
      console.log(`   - ${c.first_name} ${c.last_name} (${c.source})`);
    });
  }
}

// Test 4: Availability Check
async function testAvailabilityCheck() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: Availability Check');
  console.log('='.repeat(60));

  const testPropertyId = process.env.TEST_PROPERTY_ID;

  if (!testPropertyId) {
    console.log('\n⚠️  Set TEST_PROPERTY_ID environment variable to test availability-check');
    return;
  }

  const result = await callFunction('availability-check', {
    property_id: testPropertyId,
    start_date: '2026-03-01',
    end_date: '2026-03-15',
  });

  if (result) {
    console.log(`   Available: ${(result as any).available}`);
    console.log(`   Conflicts: ${JSON.stringify((result as any).conflicts || [])}`);
  }
}

// Main
async function main() {
  const testArg = process.argv[2];

  const tests: Record<string, () => Promise<void>> = {
    parser: testEmailParser,
    scorer: testLeadScorer,
    bridge: testMoltbotBridge,
    availability: testAvailabilityCheck,
  };

  if (testArg && tests[testArg]) {
    await tests[testArg]();
  } else if (testArg === 'all') {
    for (const test of Object.values(tests)) {
      await test();
    }
  } else {
    console.log('Usage: npx ts-node scripts/test-landlord-functions.ts <test>');
    console.log('\nAvailable tests:');
    console.log('  parser      - Test platform-email-parser');
    console.log('  scorer      - Test lead-scorer');
    console.log('  bridge      - Test moltbot-bridge (requires TEST_USER_ID)');
    console.log('  availability - Test availability-check (requires TEST_PROPERTY_ID)');
    console.log('  all         - Run all tests');
    console.log('\nEnvironment variables:');
    console.log('  EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY (preferred) or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    console.log('  TEST_USER_ID - for moltbot-bridge tests');
    console.log('  TEST_PROPERTY_ID - for availability-check tests');
  }
}

main().catch(console.error);
