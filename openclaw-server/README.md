# OpenClaw Gateway

**Your AI Property Manager Employee** - Multi-channel communication gateway that automatically handles rental inquiries across Email, WhatsApp, Telegram, SMS, and more.

## The Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPENCLAW GATEWAY                                  │
│                     (DigitalOcean Droplet - $6-12/mo)                       │
│                                                                             │
│  CHANNELS:          HOOKS:              MEMORY:           SKILLS:           │
│  ├─ Email (Gmail)   ├─ Gmail Pub/Sub    ├─ SOUL.md        ├─ doughy-core   │
│  ├─ WhatsApp        ├─ Webhooks         ├─ USER.md        ├─ doughy-lead   │
│  ├─ Telegram        └─ Cron jobs        └─ memory/        ├─ doughy-guest  │
│  ├─ SMS (Twilio)                                          ├─ doughy-room   │
│  ├─ iMessage*                                             ├─ doughy-book   │
│  ├─ Discord*                                              └─ doughy-plat   │
│  └─ Signal*                                                                 │
│                                                                             │
│  * Coming soon                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ REST API calls via Skills
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE BACKEND                                  │
│                                                                             │
│  TABLES:                              EDGE FUNCTIONS:                       │
│  ├─ crm_contacts (unified)            ├─ /openclaw-bridge                   │
│  ├─ rental_properties                 ├─ /ai-responder                      │
│  ├─ rental_rooms                      ├─ /availability-check                │
│  ├─ rental_bookings                   ├─ /lead-scorer                       │
│  ├─ rental_conversations              └─ /notification-push                 │
│  ├─ rental_messages                                                         │
│  └─ rental_ai_queue                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## OpenClaw is the CORE

OpenClaw is the brain of the landlord platform. It:

1. **Receives messages** from any channel (email, WhatsApp, Telegram, SMS)
2. **Parses & understands** the platform (Airbnb, FurnishedFinder, etc.)
3. **Scores leads** (0-100) based on profession, dates, source
4. **Generates AI responses** using Claude with your communication style
5. **Auto-sends or queues** based on confidence and your settings
6. **Learns** from your approvals and edits

### Without OpenClaw:
```
Email arrives → Check phone → Open Gmail → Read → Think → Type → Send
→ Repeat 20x/day → Miss leads → Lose bookings → Burnout
```

### With OpenClaw:
```
Message arrives (any channel) → OpenClaw handles it → You get notified
→ Review if you want → AI learns → You focus on what matters
```

## Directory Structure

```
openclaw-server/
├── src/
│   ├── server.ts          # Express server with all webhook endpoints
│   ├── handler.ts         # 8-step AI pipeline (parse → score → respond)
│   ├── config.ts          # Environment configuration
│   ├── types.ts           # TypeScript interfaces
│   ├── supabase.ts        # Database & edge function calls
│   └── channels/          # Multi-channel adapters
│       ├── index.ts       # Channel registry & exports
│       ├── base.ts        # ChannelAdapter interface
│       ├── gmail.ts       # Gmail API + Pub/Sub
│       ├── whatsapp.ts    # WhatsApp Business API
│       ├── telegram.ts    # Telegram Bot API
│       └── sms.ts         # Twilio SMS
├── deploy/
│   ├── setup.sh           # Droplet setup script
│   ├── nginx.conf         # Nginx reverse proxy
│   └── gcloud-setup.sh    # Google Cloud Pub/Sub setup
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs   # PM2 configuration
└── .env.example
```

## Quick Start

### Local Development

```bash
cd openclaw-server

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env

# Build and run
npm run build
npm start

# Or development mode with auto-reload
npm run dev
```

### Production Deployment

See the full deployment guide in `deploy/setup.sh`. Summary:

1. Create DigitalOcean droplet ($6/mo Ubuntu 24.04)
2. Point `openclaw.doughy.app` DNS to droplet
3. Run setup script, upload code, configure `.env`
4. Start with PM2, setup SSL with certbot

## Webhook Endpoints

| Channel | Endpoint | Status |
|---------|----------|--------|
| Gmail | `POST /webhooks/gmail` | ✅ Fully implemented |
| WhatsApp | `POST /webhooks/whatsapp` | 🔧 Adapter ready, needs user lookup |
| Telegram | `POST /webhooks/telegram` | 🔧 Adapter ready, needs user lookup |
| SMS | `POST /webhooks/sms` | 🔧 Adapter ready, needs user lookup |

## OAuth Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /oauth/gmail/start?user_id=...` | Start Gmail OAuth flow |
| `GET /oauth/gmail/callback` | Gmail OAuth callback |
| `POST /oauth/disconnect` | Disconnect a channel |

## The 8-Step Pipeline

Every message goes through this pipeline (in `handler.ts`):

```
1. PARSE         → platform-email-parser edge function
                   Detect Airbnb/FurnishedFinder/etc, extract contact

2. CONTACT       → openclaw-bridge UPSERT_CONTACT
                   Create or update in crm_contacts

3. PROPERTY      → openclaw-bridge GET_PROPERTY
                   Fuzzy match address hints to your listings

4. CONVERSATION  → openclaw-bridge CREATE_CONVERSATION
                   Start thread, log inbound message

5. SCORE         → lead-scorer edge function
                   0-100 score with factors

6. SETTINGS      → Query user_platform_settings
                   Get AI mode, threshold, topics

7. RESPOND       → ai-responder edge function
                   Generate response with confidence

8. ACTION        → Auto-send or queue for review
                   Push notification to Doughy app
```

## Channel Adapters

Each channel implements the `ChannelAdapter` interface:

```typescript
interface ChannelAdapter {
  channelType: 'email' | 'whatsapp' | 'telegram' | 'sms' | ...;
  initialize(): Promise<void>;
  isConfigured(): boolean;
  sendMessage(message, credentials): Promise<string>;
  normalizeMessage(raw): IncomingMessage | null;
}
```

### Gmail (✅ Complete)
- OAuth 2.0 for user authorization
- Pub/Sub webhooks for real-time notifications
- Gmail API for fetching and sending
- Watch renewal via daily cron

### WhatsApp (🔧 Adapter Ready)
- WhatsApp Business Cloud API (Meta)
- Webhook verification for Meta
- Text message support
- Needs: User credential storage/lookup

### Telegram (🔧 Adapter Ready)
- Telegram Bot API
- Webhook for incoming messages
- HTML formatting support
- Needs: Bot registration per user, credential lookup

### SMS (🔧 Adapter Ready)
- Twilio Programmable SMS
- TwiML response format
- Needs: Twilio credential storage/lookup

### Coming Soon
- **iMessage** - Via BlueBubbles (requires Mac server)
- **Discord** - Bot API for property servers
- **Signal** - Via signal-cli daemon

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production
SERVER_URL=https://openclaw.doughy.app

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Google OAuth (Gmail)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://openclaw.doughy.app/oauth/gmail/callback
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GMAIL_PUBSUB_TOPIC=gmail-notifications

# WhatsApp (optional)
WHATSAPP_VERIFY_TOKEN=openclaw-verify

# Cron Security
CRON_SECRET=your-random-secret
```

## Database Tables

OpenClaw uses these Supabase tables:

| Table | Purpose |
|-------|---------|
| `user_gmail_tokens` | Gmail OAuth tokens & watch state |
| `crm_contacts` | All contacts (leads, guests, tenants) |
| `rental_properties` | Landlord's property listings |
| `rental_conversations` | Message threads |
| `rental_messages` | Individual messages |
| `rental_ai_queue` | Pending AI responses for review |
| `user_platform_settings` | AI mode, thresholds, preferences |
| `ai_response_outcomes` | Learning from approvals/edits |

## Cost

| Item | Cost |
|------|------|
| DigitalOcean Droplet | $6/month |
| Google Cloud Pub/Sub | Free tier |
| WhatsApp Business | Free (up to 1000 conversations/month) |
| Telegram | Free |
| Twilio SMS | ~$0.0075/message |
| Anthropic API | ~$5-20/month (usage-based) |
| **Total** | ~$11-30/month |

## Testing

```bash
# Test individual edge functions
npx ts-node scripts/test-landlord-functions.ts parser

# Test full webhook flow with simulated emails
TEST_USER_ID=your-uuid npx ts-node openclaw-skills/doughy-webhook/test-harness.ts all
```

## Related Files

| File | Purpose |
|------|---------|
| `openclaw-skills/doughy-webhook/handler.ts` | Original handler (reference) |
| `openclaw-skills/doughy-webhook/test-harness.ts` | Test scenarios |
| `supabase/functions/openclaw-bridge/` | Database operations |
| `supabase/functions/ai-responder/` | AI response generation |
| `supabase/functions/lead-scorer/` | Lead scoring |
| `supabase/functions/platform-email-parser/` | Email parsing |
| `docs/OPENCLAW_SERVER.md` | Full integration docs |

---

**OpenClaw: Your AI Superhost**
