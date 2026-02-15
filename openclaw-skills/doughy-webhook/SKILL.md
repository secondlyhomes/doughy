# Doughy Webhook Handler Skill

## Purpose
Main entry point for OpenClaw to process incoming rental platform emails.
Orchestrates all Doughy Edge Functions to handle the complete flow from
email receipt to AI response generation.

## How OpenClaw Uses This

When OpenClaw receives an email notification via Gmail Pub/Sub:

1. **Extract email data** from the Pub/Sub message
2. **Call this webhook handler** with the email payload
3. **Webhook orchestrates** all downstream functions
4. **Return result** to OpenClaw for logging/monitoring

## Webhook Endpoint

```
POST /api/doughy/incoming-email

Body:
{
  "email": {
    "from": "noreply@furnishedfinder.com",
    "to": "your-email@gmail.com",
    "subject": "New message from Sarah Johnson",
    "body": "Full email body text...",
    "receivedAt": "2026-01-28T10:30:00Z",
    "messageId": "unique-message-id",
    "threadId": "thread-id-for-replies"
  },
  "userId": "user-uuid-from-supabase",
  "userToken": "optional-jwt-for-authenticated-calls"
}
```

## Flow Diagram

```
                    ┌─────────────────┐
                    │   Gmail Email   │
                    │   Pub/Sub Hook  │
                    └────────┬────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    WEBHOOK HANDLER                         │
│                                                            │
│  1. platform-email-parser                                  │
│     └─ Detect platform, extract contact info               │
│                                                            │
│  2. openclaw-bridge → UPSERT_CONTACT                        │
│     └─ Create or update contact in database                │
│                                                            │
│  3. openclaw-bridge → GET_PROPERTY                          │
│     └─ Match property from address/name hint               │
│                                                            │
│  4. openclaw-bridge → CREATE_CONVERSATION                   │
│     └─ Create conversation, log inbound message            │
│                                                            │
│  5. lead-scorer                                            │
│     └─ Score lead 0-100, determine qualification           │
│                                                            │
│  6. ai-responder                                           │
│     └─ Generate response with confidence score             │
│                                                            │
│  7. Decision: Auto-send or Queue for Review                │
│     ├─ High confidence + safe topic → Auto-send            │
│     └─ Low confidence or sensitive → Queue in app          │
│                                                            │
│  8. notification-push                                      │
│     └─ Notify user of action taken                         │
└────────────────────────────────────────────────────────────┘
```

## Response Format

```json
{
  "success": true,
  "contactId": "uuid",
  "conversationId": "uuid",
  "messageId": "uuid",
  "leadScore": {
    "score": 75,
    "qualification": "likely_qualify",
    "factors": [...],
    "recommendation": "Send detailed property info"
  },
  "aiResponse": {
    "suggestedResponse": "Hi Sarah! Great news...",
    "confidence": 82,
    "reason": "New lead inquiry",
    "requiresReview": true
  },
  "action": "queued_for_review"
}
```

## Action Types

| Action | When | What Happens |
|--------|------|--------------|
| `auto_sent` | High confidence, safe topic, can reply via email | Response sent automatically |
| `queued_for_review` | Low confidence, sensitive topic, or training mode | Response saved for human review in Doughy app |
| `manual_required` | Platform requires login (FB Messenger, etc.) | Draft saved, user must send manually |
| `error` | Something failed | Error message included |

## OpenClaw Integration

### Option 1: Direct Function Call (Recommended for Testing)

```typescript
import handleIncomingEmail from './openclaw-skills/doughy-webhook/handler';

// When OpenClaw receives an email
const result = await handleIncomingEmail(
  {
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    body: emailData.body,
    receivedAt: new Date().toISOString(),
    messageId: emailData.id,
    threadId: emailData.threadId,
  },
  userId,
  userToken // optional
);

console.log(`Processed: ${result.action}`);
```

### Option 2: HTTP Endpoint (For Production)

Deploy the webhook as an HTTP endpoint that OpenClaw can call:

```typescript
// In your OpenClaw server
app.post('/api/doughy/incoming-email', async (req, res) => {
  const result = await webhookHttpHandler(req);
  res.json(result);
});
```

### Gmail Pub/Sub Integration

OpenClaw should set up a Gmail watch on the user's inbox:

```typescript
// 1. User authorizes Gmail access via OAuth
// 2. OpenClaw creates a Pub/Sub subscription
// 3. When email arrives, Pub/Sub sends notification
// 4. OpenClaw fetches the email content
// 5. OpenClaw calls this webhook handler
```

## Testing Without Real Emails

Use the test harness to simulate emails:

```bash
# Run all platform tests
npx ts-node openclaw-skills/doughy-webhook/test-harness.ts all

# Run a specific test
npx ts-node openclaw-skills/doughy-webhook/test-harness.ts 1

# Test individual Edge Functions
npx ts-node scripts/test-landlord-functions.ts parser
npx ts-node scripts/test-landlord-functions.ts scorer
```

## Environment Variables

Required for the webhook handler:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key (for ai-responder)
```

## Error Handling

- **Parsing fails:** Raw email stored, flagged for manual review
- **Contact creation fails:** Logged, but flow continues where possible
- **Property match fails:** Continues without property link
- **AI generation fails:** Queue item created without suggestion
- **Push notification fails:** Logged, doesn't block main flow

## Monitoring

Each step logs to console with `[Webhook]` prefix:
```
[Webhook] Processing email from noreply@furnishedfinder.com: "New message from Sarah"
[Webhook] Step 1: Parsing email...
[Webhook] Detected platform: furnishedfinder, reply method: direct_email
[Webhook] Step 2: Creating/updating contact...
...
```

In production, these should go to a proper logging service.
