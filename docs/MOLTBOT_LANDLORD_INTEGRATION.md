# MoltBot Landlord Platform Integration Guide

This guide documents how MoltBot integrates with the Doughy Landlord Platform to automatically handle rental communications across multiple platforms (Airbnb, FurnishedFinder, TurboTenant, etc.).

---

## Overview

MoltBot acts as your AI property manager employee. It receives emails from rental platforms, parses them, scores leads, generates AI responses, and either auto-sends or queues for your review in the Doughy mobile app.

```
                     ┌────────────────────────────────────┐
                     │        RENTAL PLATFORMS            │
                     │  Airbnb | FurnishedFinder | Turbo  │
                     │  Facebook | Zillow | Craigslist    │
                     └─────────────────┬──────────────────┘
                                       │ emails/messages
                                       ▼
┌────────────────────────────────────────────────────────────┐
│                      MOLTBOT                               │
│  "Your AI Property Manager Employee"                       │
│                                                            │
│  Receives: Emails, WhatsApp, Telegram, SMS                 │
│  Skills:   Property knowledge, Lead scoring, Booking mgmt  │
│  Actions:  Answers questions, Qualifies leads, Books stays │
└──────────────────────────┬─────────────────────────────────┘
                           │ API calls to store/retrieve
                           ▼
┌────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                       │
│  rental_properties | contacts | bookings | conversations   │
│                                                            │
│  "Single source of truth for everything"                   │
└──────────────────────────┬─────────────────────────────────┘
                           │ real-time sync
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   DOUGHY MOBILE APP                        │
│  "Your Command Center"                                     │
│                                                            │
│  Inbox: Review AI responses, approve/edit/send             │
│  Properties: Manage listings, rooms, rates, availability   │
│  Bookings: Calendar view, revenue tracking                 │
│  Contacts: All guests/tenants, lead scores, history        │
└────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Edge Functions (Supabase)

| Function | Purpose | Status |
|----------|---------|--------|
| `platform-email-parser` | Parse emails from rental platforms, extract contact info | ✅ Deployed |
| `moltbot-bridge` | CRUD operations for properties, contacts, bookings, conversations | ✅ Deployed |
| `lead-scorer` | Score leads 0-100 with qualification factors | ✅ Deployed |
| `ai-responder` | Generate AI responses with confidence scores | ✅ Deployed |
| `availability-check` | Check property/room availability for dates | ✅ Deployed |
| `notification-push` | Send push notifications to mobile app | ✅ Deployed |

### MoltBot Skills

Located in `moltbot-skills/`:

| Skill | Purpose |
|-------|---------|
| `doughy-core` | Core property/contact/booking operations |
| `doughy-platform` | Platform detection and email parsing rules |
| `doughy-lead` | Lead qualification and scoring |
| `doughy-guest` | Guest communication and FAQ handling |
| `doughy-room` | Room-by-room rental management |
| `doughy-booking` | Booking creation and management |
| `doughy-webhook` | Main webhook handler orchestrating all functions |

### Webhook Handler

The webhook handler (`moltbot-skills/doughy-webhook/handler.ts`) orchestrates the complete flow:

```
Email arrives → Parse → Create Contact → Match Property →
Log Message → Score Lead → Generate AI Response →
Auto-send or Queue for Review → Push Notification
```

---

## Message Flow

### Step 1: Email Arrives

MoltBot receives emails via Gmail Pub/Sub webhooks when a platform notification arrives.

### Step 2: Parse Email

```typescript
POST /functions/v1/platform-email-parser
{
  "from": "noreply@furnishedfinder.com",
  "subject": "New message from Sarah Johnson",
  "body": "..."
}

// Returns:
{
  "platform": "furnishedfinder",
  "replyMethod": "direct_email",
  "contact": {
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah.j@email.com",
    "phone": "+15715551234",
    "profession": "travel_nurse",
    "employer": "Inova Alexandria"
  },
  "inquiry": {
    "message": "Looking for housing near Inova...",
    "propertyHint": "Alexandria 2BR",
    "dates": { "start": "2026-02-01", "end": "2026-04-26" }
  }
}
```

### Step 3: Create/Update Contact

```typescript
POST /functions/v1/moltbot-bridge
{
  "action": "UPSERT_CONTACT",
  "user_id": "user-uuid",
  "contact": {
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah.j@email.com",
    "contact_types": ["lead"],
    "source": "furnishedfinder"
  }
}
```

### Step 4: Score Lead

```typescript
POST /functions/v1/lead-scorer
{
  "contact": { ... },
  "message": "I'm a travel nurse...",
  "source": "furnishedfinder",
  "metadata": {
    "profession": "travel_nurse",
    "employer": "Inova Alexandria"
  }
}

// Returns:
{
  "score": 75,
  "qualification": "likely_qualify",
  "factors": [
    { "factor": "healthcare_worker", "impact": 20, "reason": "Travel nurse profession" },
    { "factor": "specific_dates", "impact": 15, "reason": "Clear move-in dates" },
    { "factor": "quality_source", "impact": 10, "reason": "FurnishedFinder platform" }
  ],
  "recommendation": "Send detailed property info with amenities and proximity to hospital"
}
```

### Step 5: Generate AI Response

```typescript
POST /functions/v1/ai-responder
{
  "user_id": "user-uuid",
  "conversation_id": "conv-uuid",
  "contact": { ... },
  "property_id": "prop-uuid",
  "message": "Looking for housing...",
  "lead_score": { ... },
  "response_style": "friendly"
}

// Returns:
{
  "suggestedResponse": "Hi Sarah! Great news — the Alexandria 2BR is available...",
  "confidence": 82,
  "reason": "New lead inquiry with clear requirements",
  "requiresReview": true
}
```

### Step 6: Decision & Action

Based on confidence and settings:

| Condition | Action |
|-----------|--------|
| Confidence ≥ threshold + safe topic + can reply via email | Auto-send |
| Confidence < threshold OR sensitive topic | Queue for review |
| Platform requires manual reply (FB Messenger) | Queue with "manual_required" |

---

## Platform Support

### Reply Methods

| Platform | Reply Method | Automation Level |
|----------|--------------|------------------|
| **Airbnb** | `email_reply` | Full - reply via email threads to conversation |
| **FurnishedFinder** | `direct_email` or `platform_only` | Partial - depends on contact info provided |
| **TurboTenant** | `direct_email` | Full - contact info usually provided |
| **Zillow/HotPads** | `direct_email` | Full - contact info provided |
| **Facebook Marketplace** | `messenger` | Manual - must reply via Messenger |
| **WhatsApp** | Direct API | Full - via WhatsApp Business API |
| **Direct Email** | `email_reply` | Full |

### Platform Detection

The `platform-email-parser` detects platforms by sender patterns:

```typescript
// Airbnb
from: *@airbnb.com, *@guest.airbnb.com

// FurnishedFinder
from: *@furnishedfinder.com, *@travelnursehousing.com

// TurboTenant
from: *@turbotenant.com

// Facebook
from: *@facebook.com, *@facebookmail.com

// Zillow
from: *@zillow.com, *@hotpads.com
```

---

## AI Response Modes

### Training Mode
- Most responses queued for review
- Every approval/edit trains the system
- Best for first 2 weeks

### Assisted Mode (Default)
- High confidence (≥85%) → auto-send, notify you
- Medium confidence → queue with quick-approve
- Low confidence → queue for full review

### Autonomous Mode
- Auto-send almost everything
- Only queue truly sensitive topics
- For experienced users

### Sensitive Topics (Always Queue)

These topics always require human review:
- Refunds / discounts
- Complaints
- Maintenance emergencies
- Booking confirmations (optional)

---

## Adaptive Learning System

The system learns from your approvals and edits over time.

### Outcome Tracking

Every AI response outcome is logged to `ai_response_outcomes`:

```sql
CREATE TABLE ai_response_outcomes (
  id UUID PRIMARY KEY,
  message_type TEXT,          -- faq, inquiry, complaint
  topic TEXT,                 -- wifi, pricing, availability
  contact_type TEXT,          -- lead, guest, tenant
  property_id UUID,
  initial_confidence NUMERIC,
  outcome TEXT,               -- auto_sent, approved, edited, rejected
  edit_severity TEXT,         -- none, minor, major
  response_time_seconds INT,
  created_at TIMESTAMPTZ
);
```

### Edit Severity Detection

When you edit an AI response before approving:

| Severity | Criteria |
|----------|----------|
| `none` | No changes or only whitespace |
| `minor` | < 10% word changes, < 5% length change |
| `major` | > 30% word changes or > 40% length change |

### Confidence Adjustment

Over time, the system adjusts confidence based on historical outcomes:

```typescript
// If you always approve WiFi questions unchanged → auto-send these
// If you always edit pricing questions → always queue these
```

---

## Testing Without Real Email

### Test Individual Edge Functions

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key

# Test email parser
npx ts-node scripts/test-landlord-functions.ts parser

# Test lead scorer
npx ts-node scripts/test-landlord-functions.ts scorer

# Test moltbot-bridge (needs user ID)
TEST_USER_ID=your-uuid npx ts-node scripts/test-landlord-functions.ts bridge
```

### Test Full Webhook Flow

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key
export TEST_USER_ID=your-uuid

# Run all simulated email tests
npx ts-node moltbot-skills/doughy-webhook/test-harness.ts all

# Run specific test (1-9)
npx ts-node moltbot-skills/doughy-webhook/test-harness.ts 1
```

### Available Test Cases

| # | Test Case | Expected Action |
|---|-----------|-----------------|
| 1 | FurnishedFinder - Travel nurse with contact | `queued_for_review` |
| 2 | FurnishedFinder - No contact info | `manual_required` |
| 3 | Airbnb - New inquiry | `queued_for_review` |
| 4 | Airbnb - Confirmed guest WiFi question | `auto_sent` |
| 5 | TurboTenant - Application | `queued_for_review` |
| 6 | Facebook Marketplace | `manual_required` |
| 7 | Zillow - Professional lead | `queued_for_review` |
| 8 | Sensitive - Refund request | `queued_for_review` |
| 9 | Direct email referral | `queued_for_review` |

---

## Production Setup

### Prerequisites

1. **Supabase Project** with Edge Functions deployed
2. **MoltBot Server** (DigitalOcean, Railway, or similar)
3. **Gmail OAuth** credentials for Pub/Sub
4. **Anthropic API Key** for AI responses

### Step 1: Deploy MoltBot Server

MoltBot needs a server to receive webhooks. Options:
- DigitalOcean Droplet ($5-10/month)
- Railway or Render (free tier available)
- Your own VPS

### Step 2: Configure Gmail Pub/Sub

1. Create Google Cloud project
2. Enable Gmail API and Pub/Sub API
3. Create OAuth credentials
4. Set up Pub/Sub topic and subscription
5. Configure Gmail watch on user's inbox:

```typescript
gmail.users.watch({
  userId: 'me',
  requestBody: {
    topicName: 'projects/your-project/topics/gmail-notifications',
    labelIds: ['INBOX']
  }
});
```

### Step 3: Configure MoltBot Webhook

Add endpoint to receive Pub/Sub notifications:

```typescript
// In MoltBot server
app.post('/webhooks/gmail', async (req, res) => {
  const message = req.body.message;
  const emailId = Buffer.from(message.data, 'base64').toString();

  // Fetch email content
  const email = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full'
  });

  // Process with webhook handler
  const result = await handleIncomingEmail(
    parseGmailMessage(email),
    userId
  );

  res.sendStatus(200);
});
```

### Step 4: Connect Doughy App

The mobile app connects via Supabase real-time:
- Conversations update in real-time
- AI queue items appear instantly
- Push notifications via `notification-push` function

---

## Environment Variables

### For Edge Functions

Set in Supabase Dashboard → Edge Functions → Secrets:

```
OPENAI_API_KEY=sk-...           # For AI responder
ANTHROPIC_API_KEY=sk-ant-...    # Alternative AI provider
RESEND_API_KEY=re_...           # For sending emails
```

### For MoltBot Server

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
```

### For Testing

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
TEST_USER_ID=your-user-uuid
TEST_PROPERTY_ID=your-property-uuid
```

---

## Troubleshooting

### Edge Function Returns 401

- Check Authorization header has valid JWT or service key
- Verify the function has `--no-verify-jwt` flag if needed
- Check Supabase Dashboard → Logs for details

### Email Not Parsed Correctly

- Check `platform-email-parser` logs in Supabase Dashboard
- Verify sender matches known platform patterns
- Add new platform pattern if needed

### AI Response Not Generated

- Check `ai-responder` logs
- Verify OpenAI/Anthropic API key is set
- Check if conversation and property exist

### Push Notification Not Received

- Verify user has push token registered
- Check `notification-push` logs
- Verify Expo push credentials configured

### Contact Not Created

- Check `moltbot-bridge` logs
- Verify user_id is valid
- Check RLS policies on contacts table

---

## File Reference

```
moltbot-skills/
├── doughy-core/
│   └── SKILL.md                 # Core operations documentation
├── doughy-platform/
│   └── SKILL.md                 # Platform detection rules
├── doughy-lead/
│   └── SKILL.md                 # Lead scoring documentation
├── doughy-guest/
│   └── SKILL.md                 # Guest communication
├── doughy-room/
│   └── SKILL.md                 # Room-by-room rentals
├── doughy-booking/
│   └── SKILL.md                 # Booking management
└── doughy-webhook/
    ├── handler.ts               # Main webhook handler
    ├── test-harness.ts          # Interactive test runner
    └── SKILL.md                 # Webhook documentation

supabase/functions/
├── platform-email-parser/       # Parse rental platform emails
├── moltbot-bridge/              # Database operations
├── lead-scorer/                 # Lead qualification
├── ai-responder/                # AI response generation
├── availability-check/          # Property availability
└── notification-push/           # Push notifications

scripts/
└── test-landlord-functions.ts   # Test Edge Functions individually
```

---

## Next Steps

1. **Test Edge Functions** - Run test scripts to verify deployment
2. **Deploy MoltBot Server** - Set up hosting for webhook receiver
3. **Configure Gmail** - Set up Pub/Sub for email notifications
4. **Test End-to-End** - Forward real platform email and verify flow
5. **Tune Thresholds** - Adjust confidence settings based on results
6. **Enable for Users** - Roll out to production

---

**Last Updated:** January 28, 2026
