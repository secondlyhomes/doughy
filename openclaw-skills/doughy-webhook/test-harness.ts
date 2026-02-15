// openclaw-skills/doughy-webhook/test-harness.ts
// Test harness for Doughy webhook handler with simulated emails
// Run with: npx ts-node test-harness.ts

import handleIncomingEmail from './handler';

// Test email templates for each platform
const TEST_EMAILS = {
  furnishedfinder_with_contact: {
    from: 'noreply@furnishedfinder.com',
    to: 'your-email@gmail.com',
    subject: 'New message from Sarah Johnson',
    body: `You have a new message from Sarah Johnson regarding your listing
"Furnished 2BR near Inova Alexandria"

Name: Sarah Johnson
Email: sarah.j@testmail.com
Phone: (571) 555-1234

Move-in: February 1, 2026
Length of stay: 3 months

Message:
Hi! I'm a travel nurse starting a contract at Inova Alexandria on Feb 1.
Looking for a furnished place for my 13-week assignment. Is this available?
What are the amenities and is parking included?

Thanks,
Sarah`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-ff-001',
  },

  furnishedfinder_no_contact: {
    from: 'noreply@furnishedfinder.com',
    to: 'your-email@gmail.com',
    subject: 'New inquiry for Alexandria 2BR',
    body: `You have a new inquiry from a potential tenant.

Property: Alexandria 2BR
Message:
Is this still available for March? I work at the hospital nearby.

Reply via FurnishedFinder to respond.`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-ff-002',
  },

  airbnb_inquiry: {
    from: 'express@airbnb.com',
    to: 'your-email@gmail.com',
    subject: 'New inquiry from Mike Chen',
    body: `Mike Chen is interested in your listing.

Listing: Cozy Arlington Studio
Check-in: March 15, 2026
Check-out: March 22, 2026
Guests: 2

Message from Mike:
"Hi! My wife and I are visiting DC for a week. Is your place close to the Metro?
We're also wondering about check-in time - our flight lands at 2pm."

Reply to this email to respond to Mike.`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-airbnb-001',
    threadId: 'airbnb-thread-12345',
  },

  airbnb_wifi_question: {
    from: 'express@airbnb.com',
    to: 'your-email@gmail.com',
    subject: 'Message from Emily Davis',
    body: `Emily Davis sent you a message.

Listing: Cozy Arlington Studio
Reservation: Confirmed (Check-in tomorrow)

Message from Emily:
"Hi! I'm arriving tomorrow and wanted to confirm the WiFi password
and the door code. Thanks!"

Reply to this email to respond.`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-airbnb-002',
    threadId: 'airbnb-thread-67890',
  },

  turbotenant_application: {
    from: 'noreply@turbotenant.com',
    to: 'your-email@gmail.com',
    subject: 'New lead for 123 Main St',
    body: `You have a new lead from TurboTenant!

Property: 123 Main St, Arlington VA
Applicant: James Wilson
Email: james.wilson@email.com
Phone: 703-555-9876

Move-in Date: April 1, 2026

Message:
I'm relocating for work and looking for a long-term rental.
I have excellent credit and can provide references.
Is this property pet-friendly? I have a small dog.

View full application on TurboTenant.`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-tt-001',
  },

  facebook_marketplace: {
    from: 'notification@facebookmail.com',
    to: 'your-email@gmail.com',
    subject: 'Someone is interested in your listing',
    body: `David Brown is interested in "Room for rent - Alexandria"

David Brown wrote:
"Is this still available?"

Reply on Messenger to respond.`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-fb-001',
  },

  zillow_inquiry: {
    from: 'noreply@zillow.com',
    to: 'your-email@gmail.com',
    subject: 'Lisa Park is interested in 456 Oak Ave',
    body: `New rental inquiry from Zillow

Name: Lisa Park
Email: lisa.park@email.com
Phone: (202) 555-4321

Property: 456 Oak Ave, Arlington VA
Move-in: ASAP

Message:
Hi, I saw your listing on Zillow. I'm a young professional
working in DC and looking for a quiet place. Is the unit
on the ground floor? And what's included in the rent?

Best,
Lisa`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-zillow-001',
  },

  sensitive_refund_request: {
    from: 'express@airbnb.com',
    to: 'your-email@gmail.com',
    subject: 'Message from John Smith',
    body: `John Smith sent you a message.

Listing: Cozy Arlington Studio
Reservation: Completed

Message from John:
"Hi, I had a problem during my stay - the AC wasn't working properly
for the first two days. I'd like to request a partial refund.
Can you help with this?"

Reply to this email to respond.`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-sensitive-001',
  },

  direct_email: {
    from: 'potential.tenant@gmail.com',
    to: 'your-email@gmail.com',
    subject: 'Interested in your Alexandria rental',
    body: `Hi,

I found your property listing through a friend's referral.
I'm looking for a furnished place for about 6 months starting in May.
I'm a consultant and work remotely most of the time.

Could you tell me more about the property and availability?

Thanks,
Robert Chen
(555) 123-4567`,
    receivedAt: new Date().toISOString(),
    messageId: 'test-msg-direct-001',
  },
};

// Test runner
async function runTest(
  testName: string,
  email: typeof TEST_EMAILS[keyof typeof TEST_EMAILS],
  userId: string,
  userToken?: string
) {
  console.log('\n' + '='.repeat(70));
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(70));
  console.log(`From: ${email.from}`);
  console.log(`Subject: ${email.subject}`);
  console.log('-'.repeat(70));

  const startTime = Date.now();
  const result = await handleIncomingEmail(email, userId, userToken);
  const duration = Date.now() - startTime;

  console.log('-'.repeat(70));
  console.log('RESULT:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Action: ${result.action}`);

  if (result.contactId) {
    console.log(`  Contact ID: ${result.contactId}`);
  }
  if (result.conversationId) {
    console.log(`  Conversation ID: ${result.conversationId}`);
  }
  if (result.leadScore) {
    console.log(`  Lead Score: ${result.leadScore.score}/100 (${result.leadScore.qualification})`);
    console.log(`  Recommendation: ${result.leadScore.recommendation}`);
  }
  if (result.aiResponse) {
    console.log(`  AI Confidence: ${result.aiResponse.confidence}%`);
    console.log(`  AI Reason: ${result.aiResponse.reason}`);
    console.log(`  Suggested Response Preview: "${result.aiResponse.suggestedResponse.substring(0, 100)}..."`);
  }
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }

  console.log(`  Duration: ${duration}ms`);
  console.log('='.repeat(70));

  return result;
}

// Interactive test menu
async function runInteractiveTests() {
  const userId = process.env.TEST_USER_ID || 'test-user-id';
  const userToken = process.env.TEST_USER_TOKEN;

  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║          DOUGHY LANDLORD PLATFORM - WEBHOOK TEST HARNESS             ║
╠══════════════════════════════════════════════════════════════════════╣
║  This tests the complete flow with real Supabase Edge Functions      ║
║  but simulated email input.                                          ║
║                                                                      ║
║  User ID: ${userId.padEnd(54)}║
║  Token: ${userToken ? 'Provided'.padEnd(56) : 'Using service key'.padEnd(56)}║
╚══════════════════════════════════════════════════════════════════════╝
`);

  const testCases = [
    { name: 'FurnishedFinder - Travel Nurse (with contact info)', key: 'furnishedfinder_with_contact' },
    { name: 'FurnishedFinder - Basic Inquiry (no contact)', key: 'furnishedfinder_no_contact' },
    { name: 'Airbnb - New Inquiry', key: 'airbnb_inquiry' },
    { name: 'Airbnb - Confirmed Guest WiFi Question', key: 'airbnb_wifi_question' },
    { name: 'TurboTenant - Application Lead', key: 'turbotenant_application' },
    { name: 'Facebook Marketplace - Quick Inquiry', key: 'facebook_marketplace' },
    { name: 'Zillow - Professional Lead', key: 'zillow_inquiry' },
    { name: 'Sensitive - Refund Request (should queue)', key: 'sensitive_refund_request' },
    { name: 'Direct Email - Referral', key: 'direct_email' },
  ];

  // Check for command line argument
  const testArg = process.argv[2];

  if (testArg === 'all') {
    // Run all tests
    console.log('Running all tests...\n');
    const results: Record<string, boolean> = {};

    for (const testCase of testCases) {
      const email = TEST_EMAILS[testCase.key as keyof typeof TEST_EMAILS];
      const result = await runTest(testCase.name, email, userId, userToken);
      results[testCase.name] = result.success;
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    for (const [name, success] of Object.entries(results)) {
      console.log(`  ${success ? '✅' : '❌'} ${name}`);
    }
    const passed = Object.values(results).filter(Boolean).length;
    console.log(`\n  Total: ${passed}/${testCases.length} passed`);
  } else if (testArg && !isNaN(parseInt(testArg))) {
    // Run specific test by index
    const index = parseInt(testArg) - 1;
    if (index >= 0 && index < testCases.length) {
      const testCase = testCases[index];
      const email = TEST_EMAILS[testCase.key as keyof typeof TEST_EMAILS];
      await runTest(testCase.name, email, userId, userToken);
    } else {
      console.log(`Invalid test number. Choose 1-${testCases.length}`);
    }
  } else {
    // Show menu
    console.log('Available tests:');
    testCases.forEach((tc, i) => {
      console.log(`  ${i + 1}. ${tc.name}`);
    });
    console.log(`\nUsage:`);
    console.log(`  npx ts-node test-harness.ts <number>  - Run specific test`);
    console.log(`  npx ts-node test-harness.ts all       - Run all tests`);
    console.log(`\nEnvironment variables:`);
    console.log(`  SUPABASE_URL           - Your Supabase project URL`);
    console.log(`  SUPABASE_SERVICE_ROLE_KEY - Service role key for Edge Functions`);
    console.log(`  TEST_USER_ID           - User ID to test with`);
    console.log(`  TEST_USER_TOKEN        - Optional: user JWT for authenticated calls`);
  }
}

// Export for programmatic use
export { TEST_EMAILS, runTest };

// Run if executed directly
runInteractiveTests().catch(console.error);
