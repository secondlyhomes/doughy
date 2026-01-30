# DOUGHY ARCHITECTURE REFACTOR
## Master Planning Document for Parallel Development

**Document Version:** 2.0
**Date:** January 27, 2026
**Project:** Doughy - Multi-Platform Real Estate App

---

## EXECUTIVE SUMMARY

Doughy is being transformed from a single-purpose RE investor tool into a **multi-platform product** with two distinct "umbrellas":

1. **RE Investor Platform** (existing) - Focus, Leads, Deals, Portfolio
2. **Landlord Platform** (new) - Inbox, Properties, Rooms, Bookings, AI Communications

Both platforms coexist within the same app. Users select their platform(s) during onboarding and can toggle between them via a header switcher.

This document defines **5 development zones** that can be worked on in parallel.

### The Vision
```
BEFORE: Focus → Leads → Deals → Portfolio (single RE investor vertical)

AFTER:  [Platform Switcher in Header]
        │
        ├── RE INVESTOR MODE (existing, preserved)
        │   Focus → Leads → Deals → Portfolio
        │   Uses: crm_leads, re_properties, deals tables
        │
        └── LANDLORD MODE (new)
            Inbox → Properties → Bookings → Contacts
            Uses: contacts, rental_properties, rooms, bookings tables
            ↓
            AI qualifies leads, answers guest questions, handles bookings
            ↓
            Human approves/overrides via mobile app when needed
```

### Key Table Naming
| Platform | People Table | Properties Table |
|----------|-------------|------------------|
| RE Investor | `crm_leads` (prospects to buy from) | `re_properties` (deal research) |
| Landlord | `crm_contacts` (guests/tenants) | `rental_properties` (rental listings) |

These are **separate tables**, not aliases. The distinction is intentional.

---

## SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MOLTBOT GATEWAY                                   │
│                     (DigitalOcean Droplet - $6-12/mo)                       │
│                                                                             │
│  CHANNELS:          HOOKS:              MEMORY:           SKILLS:           │
│  ├─ WhatsApp        ├─ Gmail Pub/Sub    ├─ SOUL.md        ├─ doughy-core   │
│  ├─ Telegram        ├─ Webhooks         ├─ USER.md        ├─ doughy-lead   │
│  ├─ iMessage        └─ Cron jobs        └─ memory/        ├─ doughy-guest  │
│  ├─ Discord                                               ├─ doughy-room   │
│  ├─ Signal                                                ├─ doughy-book   │
│  └─ Email (Gmail)                                         └─ doughy-plat   │
│                                                                             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ REST API calls via Skills
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE BACKEND                                  │
│                                                                             │
│  TABLES:                              EDGE FUNCTIONS:                       │
│  ├─ crm_contacts (unified)            ├─ /moltbot-bridge                    │
│  ├─ rental_properties                 ├─ /ai-responder                      │
│  ├─ rental_rooms                      ├─ /availability-check                │
│  ├─ rental_bookings                   ├─ /lead-scorer                       │
│  ├─ rental_conversations              └─ /notification-push                 │
│  ├─ rental_messages                                                         │
│  ├─ rental_ai_queue                                                         │
│  └─ user_platform_settings                                                  │
│                                                                             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ Real-time subscriptions + REST
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXPO MOBILE APP                                   │
│                                                                             │
│  TABS:                                                                      │
│  ├─ 📥 Inbox (NEW - primary)     ← All conversations, AI status, approvals │
│  ├─ 🏠 Properties                ← Manage listings, rooms, rates           │
│  ├─ 📅 Bookings (NEW)            ← Calendar view, upcoming, revenue        │
│  ├─ 👥 Contacts (UPDATED)        ← Unified contacts from all sources       │
│  └─ ⚙️ Settings                  ← AI rules, channels, templates           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ZONE DEFINITIONS

Each zone is **independent** and can be developed in parallel. Zones communicate through **defined interfaces** (API contracts, database schemas, component props).

| Zone | Responsibility | Output | Status |
|------|----------------|--------|--------|
| **Zone 1: Core** | Moltbot skills, business logic, AI prompts | Skill files, Edge Functions | ✅ Complete |
| **Zone 2: Database** | Schema design, migrations, RLS policies | SQL migrations, types | ✅ Complete |
| **Zone 3: UI/UX** | Mobile app screens, components, navigation | React Native screens | ✅ Complete |
| **Zone 4: Testing** | Unit tests, integration tests, E2E tests | Test suites, mocks | ✅ Complete |
| **Zone 5: Integration** | Combine zones, refactor, optimize | Final polished system | 🔄 In Progress |

### Current Status Summary (January 28, 2026)

**Zones 1-4 are COMPLETE.** Zone 5 (Integration & Cleanup) is the final phase.

| Zone | Key Deliverables | Notes |
|------|-----------------|-------|
| Zone 1 | 5 Moltbot skills (doughy-core, doughy-lead, doughy-guest, doughy-room, doughy-book), 4 Edge Functions | AI responder, lead scorer, availability checker, moltbot bridge |
| Zone 2 | 12+ tables with RLS, TypeScript types generated | crm_contacts, rental_*, ai_queue, etc. |
| Zone 3 | Landlord platform UI (Inbox, Properties, Bookings), Focus nudges, Platform switcher | All screens functional |
| Zone 4 | 15 test suites, 456 tests, 80-95% coverage | All critical paths covered |
| Zone 5 | E2E testing, performance optimization, deployment | **NEXT: See Zone 5 checklist** |

---

## INTERFACE CONTRACTS

These contracts define how zones communicate. **All zones must adhere to these interfaces.**

### Contract A: Database → All Zones (TypeScript Types)

```typescript
// types/database.ts - Zone 2 produces, all zones consume
// NOTE: Table names use domain prefixes per DATABASE_NAMING_CONVENTIONS.md
// - CRM tables: crm_contacts, crm_leads, etc.
// - Rental tables: rental_properties, rental_rooms, rental_bookings, etc.

// Maps to: crm_contacts table
export interface Contact {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  emails: { email: string; type: string; primary: boolean }[];
  phones: { phone: string; type: string; primary: boolean }[];
  company: string | null;
  job_title: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  address: Record<string, any>;
  contact_types: ('lead' | 'guest' | 'tenant' | 'vendor' | 'personal')[];
  source: 'furnishedfinder' | 'airbnb' | 'turbotenant' | 'facebook' | 'whatsapp' | 'direct' | 'referral' | null;
  status: 'new' | 'contacted' | 'qualified' | 'active' | 'inactive' | 'archived';
  sms_opt_status: 'opted_in' | 'opted_out' | 'pending';
  score: number | null; // 0-100 lead score
  tags: string[];
  metadata: Record<string, any>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Note: This is rental_properties table (Landlord platform)
// RE Investor platform uses re_properties table (already exists)
export interface RentalProperty {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: 'single_family' | 'multi_family' | 'condo' | 'apartment' | 'room';
  bedrooms: number;
  bathrooms: number;
  base_rate: number;
  rate_type: 'nightly' | 'weekly' | 'monthly';
  room_by_room_enabled: boolean;
  amenities: string[];
  house_rules: Record<string, any>;
  listing_urls: {
    furnishedfinder?: string;
    airbnb?: string;
    turbotenant?: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  property_id: string; // References rental_properties.id
  name: string;
  description: string | null;
  size_sqft: number | null;
  has_private_bath: boolean;
  has_private_entrance: boolean;
  amenities: string[];
  weekly_rate: number;
  monthly_rate: number;
  utilities_included: boolean;
  status: 'available' | 'occupied' | 'maintenance' | 'unavailable';
  available_date: string | null;
  current_booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string;
  room_id: string | null; // null = whole property
  start_date: string;
  end_date: string | null;
  rate: number;
  rate_type: 'nightly' | 'weekly' | 'monthly';
  deposit: number | null;
  status: 'inquiry' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string | null;
  channel: 'whatsapp' | 'telegram' | 'email' | 'sms' | 'imessage' | 'discord' | 'webchat';
  platform: 'furnishedfinder' | 'airbnb' | 'turbotenant' | 'facebook' | 'direct' | null;
  status: 'active' | 'resolved' | 'escalated' | 'archived';
  ai_enabled: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  content_type: 'text' | 'image' | 'file' | 'voice';
  sent_by: 'contact' | 'ai' | 'user';
  ai_confidence: number | null;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Maps to: rental_ai_queue table
export interface RentalAIQueue {
  id: string;
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  sent_message_id: string | null;
  suggested_response: string;
  confidence: number;
  reasoning: string | null;
  intent: string | null;
  detected_topics: string[] | null;
  alternatives: Record<string, any>[];
  status: 'pending' | 'approved' | 'edited' | 'rejected' | 'expired' | 'auto_sent';
  final_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  expires_at: string;
  created_at: string;
}
```

### Contract B: Edge Function API Endpoints

```typescript
// All Edge Functions follow this pattern

// POST /moltbot-bridge
// Called by Moltbot skills to interact with Doughy database
interface MoltbotBridgeRequest {
  action: 'get_properties' | 'get_property' | 'get_rooms' | 'get_availability' 
        | 'create_contact' | 'update_contact' | 'log_message' | 'create_booking'
        | 'get_contact_history' | 'queue_response' | 'get_templates';
  user_id: string;
  payload: Record<string, any>;
}

interface MoltbotBridgeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// POST /ai-responder
// Generate AI response for a message
interface AIResponderRequest {
  contact_id: string;
  message: string;
  channel: string;
  context?: {
    property_id?: string;
    conversation_history?: Message[];
  };
}

interface AIResponderResponse {
  response: string;
  confidence: number;
  suggested_actions: string[];
  should_auto_send: boolean;
}

// POST /lead-scorer
// Score a lead based on conversation
interface LeadScorerRequest {
  contact_id: string;
  conversation_id: string;
}

interface LeadScorerResponse {
  score: number;
  factors: { factor: string; points: number }[];
  recommendation: 'auto_qualify' | 'needs_review' | 'decline';
}

// GET /availability-check
// Check property/room availability
interface AvailabilityRequest {
  property_id: string;
  room_id?: string;
  start_date: string;
  end_date: string;
}

interface AvailabilityResponse {
  available: boolean;
  conflicts?: Booking[];
  suggested_dates?: { start: string; end: string }[];
}
```

### Contract C: UI Component Props

```typescript
// components/inbox/ConversationCard.tsx
interface ConversationCardProps {
  conversation: Conversation;
  contact: Contact;
  lastMessage: Message;
  pendingResponse?: AIResponseQueue;
  onPress: () => void;
  onQuickApprove?: () => void;
}

// components/inbox/MessageBubble.tsx
interface MessageBubbleProps {
  message: Message;
  isAI: boolean;
  isPending: boolean;
  confidence?: number;
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
}

// components/properties/PropertyCard.tsx
interface PropertyCardProps {
  property: Property;
  roomCount?: number;
  activeBookings?: number;
  onPress: () => void;
  onQuickAction?: (action: 'edit' | 'pause' | 'rooms') => void;
}

// components/properties/RoomCard.tsx
interface RoomCardProps {
  room: Room;
  property: Property;
  currentGuest?: Contact;
  onPress: () => void;
  onStatusChange?: (status: Room['status']) => void;
}

// components/bookings/BookingCard.tsx  
interface BookingCardProps {
  booking: Booking;
  contact: Contact;
  property: Property;
  room?: Room;
  onPress: () => void;
  onStatusChange?: (status: Booking['status']) => void;
}
```

---

# ZONE 1: CORE DEVELOPMENT

## Responsibility
Build Moltbot skills and Edge Functions that power the AI communication layer.

## Deliverables

### 1.1 Moltbot Skills (Markdown files for ~/clawd/skills/)

#### doughy-core/SKILL.md
```markdown
# Doughy Core Skill

## Purpose
Connect Moltbot to Doughy's Supabase database. This skill provides the foundation
for all other Doughy skills to query and update data.

## Configuration
Requires environment variables:
- DOUGHY_API_URL: Supabase Edge Function URL
- DOUGHY_API_KEY: Supabase anon key or service role key
- DOUGHY_USER_ID: The landlord's user ID in Doughy

## Available Actions

### get_properties
Fetch all properties for the user.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_properties",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "status": "active",
    "include_rooms": true
  }
}
```

### get_property
Fetch a specific property by ID or address hint.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_property",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "property_id": "uuid" // OR
    "address_hint": "Alexandria" // fuzzy match
  }
}
```

### get_rooms
Fetch rooms for a property.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_rooms",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "property_id": "uuid",
    "status": "available" // optional filter
  }
}
```

### get_availability
Check if a property/room is available for dates.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_availability",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "property_id": "uuid",
    "room_id": "uuid", // optional, null = whole property
    "start_date": "2026-02-01",
    "end_date": "2026-04-30"
  }
}
```

### create_contact
Create or update a contact.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "create_contact",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "name": "Sarah Johnson",
    "email": "sarah@email.com",
    "phone": "+15551234567",
    "source": "furnishedfinder",
    "contact_type": ["lead"],
    "metadata": {
      "profession": "Travel Nurse",
      "employer": "Aya Healthcare"
    }
  }
}
```

### log_message
Log a message to a conversation.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "log_message",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "conversation_id": "uuid", // or null to create new
    "channel": "whatsapp",
    "platform": "furnishedfinder",
    "direction": "inbound",
    "content": "Message text...",
    "sent_by": "contact",
    "property_id": "uuid" // optional
  }
}
```

### queue_response
Queue an AI response for human approval.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "queue_response",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "conversation_id": "uuid",
    "suggested_response": "AI generated response...",
    "confidence": 0.85,
    "reason": "New lead, high score, auto-qualify threshold met"
  }
}
```

### get_contact_history
Get conversation history with a contact.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_contact_history",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "limit": 50
  }
}
```

### get_templates
Get response templates for a category.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_templates",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "category": "lead_response" // or "guest_faq", "booking_confirm", etc.
  }
}
```

## Error Handling
All requests return:
```json
{
  "success": true/false,
  "data": { ... },
  "error": "Error message if success=false"
}
```

If a request fails, inform the user and suggest they check the Doughy app.
```

#### doughy-platform/SKILL.md
```markdown
# Doughy Platform Detection Skill

## Purpose
Parse incoming emails from rental platforms (FurnishedFinder, Airbnb, TurboTenant,
Facebook Marketplace) and extract structured lead/guest data.

## Triggers
This skill is invoked when Moltbot receives an email via Gmail Pub/Sub hooks.
Check the sender and subject to determine the platform.

## Platform Detection Rules

### FurnishedFinder / Travel Nurse Housing
**Senders:** 
- *@furnishedfinder.com
- *@travelnursehousing.com
- noreply@furnishedfinder.com

**Subject patterns:**
- "New message from [NAME]"
- "Housing request from [NAME]"
- "[NAME] is interested in your property"
- "New inquiry for [PROPERTY]"

**Extraction:**
- Name: Look for "from [NAME]" in subject or "Name: [NAME]" in body
- Email: Usually in body as "Email: [EMAIL]" or "Contact: [EMAIL]"
- Phone: Sometimes included as "Phone: [PHONE]"
- Dates: Look for "Move-in: [DATE]" or "Dates: [START] - [END]"
- Property: Match property name/address from body against user's listings
- Message: The inquiry text, usually after "Message:" or in quoted section

**Note:** FurnishedFinder does not support direct email reply. Flag for manual 
response via FurnishedFinder website, or if phone/email provided, respond directly.

### Airbnb
**Senders:**
- *@airbnb.com
- *@guest.airbnb.com
- express@airbnb.com

**Subject patterns:**
- "New inquiry from [NAME]"
- "Reservation request from [NAME]"
- "Message from [NAME]"
- "[NAME] wants to book [PROPERTY]"

**Extraction:**
- Name: From subject or "Guest: [NAME]" in body
- Dates: "Check-in: [DATE]" and "Check-out: [DATE]"
- Guests: "Guests: [NUMBER]"
- Property: Match listing name
- Message: The guest's message text

**Note:** Can reply via email - it threads to Airbnb conversation.

### TurboTenant
**Senders:**
- *@turbotenant.com
- noreply@turbotenant.com

**Subject patterns:**
- "New lead for [PROPERTY]"
- "Application submitted"
- "New inquiry"

**Extraction:**
- Name: "Applicant: [NAME]" or "From: [NAME]"
- Email: "Email: [EMAIL]"
- Phone: "Phone: [PHONE]"
- Property: From subject or body

### Facebook Marketplace
**Senders:**
- *@facebook.com
- *@fb.com
- notification@facebookmail.com

**Subject patterns:**
- "Marketplace"
- "Someone is interested in"
- "New message about"

**Extraction:**
- Name: Sender name or "from [NAME]"
- Message: Usually "Is this still available?" or custom message
- Property: Matched from listing title in subject

**Note:** Cannot reply via email. Flag for response via Facebook Messenger.

## Output Format
After parsing, call doughy-core with extracted data:

```json
{
  "source": "furnishedfinder",
  "contact": {
    "name": "Sarah Johnson",
    "email": "sarah.j@email.com",
    "phone": "+15551234567"
  },
  "inquiry": {
    "property_hint": "Alexandria 2BR",
    "property_id": null,
    "dates": {
      "start": "2026-02-01",
      "end": "2026-04-30"
    },
    "message": "Hi, I'm a travel nurse looking for housing near Inova Alexandria...",
    "guests": 1
  },
  "reply_method": "direct_email", // or "platform_only", "messenger"
  "original_email": {
    "from": "noreply@furnishedfinder.com",
    "subject": "New message from Sarah Johnson",
    "received_at": "2026-01-27T14:30:00Z"
  }
}
```

Then trigger doughy-lead skill for qualification.

## Unknown Platforms
If sender doesn't match known patterns:
1. Check if it's a direct email to the landlord's Doughy email
2. If yes, treat as source="direct"
3. If unknown, log for manual review and notify owner
```

#### doughy-lead/SKILL.md
```markdown
# Doughy Lead Qualification Skill

## Purpose
Score incoming leads based on their inquiry, generate appropriate responses,
and decide whether to auto-send or queue for human review.

## Scoring System (0-100 points)

### Positive Factors
| Factor | Points | Detection |
|--------|--------|-----------|
| Traveling professional | +20 | Keywords: "travel nurse", "traveling", "contract", "assignment", "relocating for work" |
| Healthcare worker | +15 | Keywords: "nurse", "RN", "doctor", "physician", "therapist", "tech" |
| Clear move-in date | +15 | Specific date mentioned within 60 days |
| Medium-term stay (30-180 days) | +15 | Date range or duration mentioned |
| Mentions employer | +10 | Company name, staffing agency, or "my employer" |
| Found via FurnishedFinder | +10 | source = furnishedfinder (high intent) |
| Professional email domain | +5 | Not gmail/yahoo/hotmail, or healthcare domain |
| Complete inquiry (name+email+dates) | +5 | All fields provided |
| Repeat guest/contact | +10 | Existing contact in database with positive history |

### Negative Factors
| Factor | Points | Detection |
|--------|--------|-----------|
| Very short stay (<14 days) | -15 | Unless explicitly corporate/insurance placement |
| Vague about purpose | -20 | No mention of work, reason for travel |
| Party/event keywords | -30 | "party", "bachelor", "bachelorette", "event", "gathering" |
| Asks about extra guests | -10 | "friends staying", "visitors", unless reasonable |
| Refuses basic info | -20 | Won't provide name, dates, or purpose |
| Cash only request | -25 | "pay cash", "no checks", "no verification" |
| Sob story pattern | -15 | Common scam patterns, urgency without details |
| Bad history | -50 | Previous issues flagged in contact record |

### Score Interpretation
| Score | Action | Response Type |
|-------|--------|---------------|
| 80-100 | Auto-qualify | Detailed response with availability, rates, next steps |
| 60-79 | Likely qualify | Response with request for minor clarifying info |
| 40-59 | Needs review | Queue for human review, send acknowledgment only |
| 20-39 | Likely decline | Queue for review, prepare polite decline draft |
| 0-19 | Auto-decline | Send polite decline, do not engage further |

## Response Generation

### High Score (80+): Auto-Qualify Response
```
Hi [NAME]! 👋

Thanks for reaching out about [PROPERTY_NAME]!

Great news — it's available [START_DATE] through [END_DATE]!

Here are the details:
• [RATE] all-inclusive (utilities, WiFi, parking included)
• [BEDS] bedroom, [BATHS] bath, fully furnished
• [KEY_AMENITIES - washer/dryer, workspace, etc.]
[IF healthcare worker: • Just [DISTANCE] from [NEAREST_HOSPITAL]!]

[IF room_by_room AND asking about whole property:]
I also offer individual rooms if you'd prefer — let me know!

[IF room_by_room AND asking about room:]
That room includes [ROOM_AMENITIES] with access to shared [SHARED_AMENITIES].

Would you like to schedule a quick video tour? I have availability:
• [AVAILABLE_SLOT_1]
• [AVAILABLE_SLOT_2]

Or if you're ready, I can send over the application link!

Looking forward to hosting you!
[OWNER_NAME]
```

### Medium Score (60-79): Clarifying Response
```
Hi [NAME]!

Thanks for your interest in [PROPERTY_NAME]! I'd love to help you find the right fit.

Could you tell me a bit more?
• What brings you to [CITY]?
• Approximately when would you need to move in?
• How long are you thinking of staying?

Once I have those details, I can check availability and share all the specifics!

Talk soon,
[OWNER_NAME]
```

### Low Score (40-59): Acknowledgment Only
```
Hi [NAME],

Thanks for reaching out! I've received your inquiry about [PROPERTY_NAME].

I'll review the details and get back to you within 24 hours.

Best,
[OWNER_NAME]
```
**→ Queue for human review with score breakdown**

### Decline (Below 40):
```
Hi [NAME],

Thanks for your interest in [PROPERTY_NAME].

Unfortunately, this property isn't quite the right fit for what you're looking for. 
[IF short_stay: We focus on stays of 30+ days for traveling professionals.]
[IF red_flags: We require standard screening and verification for all guests.]

Best of luck with your housing search!

[OWNER_NAME]
```

## Auto-Send Rules
Only auto-send if ALL conditions are met:
1. Score >= 80
2. Property availability confirmed
3. No previous negative interactions with this contact
4. User has enabled auto-send for this score threshold
5. Response is for a supported reply method (not platform_only)

Otherwise, queue for human review.

## Integration Flow
1. Receive parsed inquiry from doughy-platform
2. Match property from hint (doughy-core.get_property)
3. Check availability (doughy-core.get_availability)
4. Calculate score based on factors above
5. Generate appropriate response
6. If auto-send: send via appropriate channel, log message
7. If review: queue response, send push notification to owner

## Logging
Always log to doughy-core:
- Contact creation/update with score
- All messages (inbound and outbound)
- Score breakdown in contact.metadata
- Qualification decision and reasoning
```

#### doughy-guest/SKILL.md
```markdown
# Doughy Guest Communication Skill

## Purpose
Handle ongoing communication with confirmed guests — questions about the property,
check-in instructions, WiFi passwords, local recommendations, maintenance issues.

## Triggers
- Message from a contact with contact_type includes 'guest'
- Message from contact with active booking (status = 'confirmed' or 'active')
- Keywords indicating guest question vs new inquiry

## Context Loading
Before responding, fetch:
1. Contact record with booking history
2. Active booking details (property, room, dates)
3. Property details (amenities, house rules, check-in instructions)
4. Previous conversation history

## Common Questions & Auto-Responses

### Check-In Instructions
**Triggers:** "check in", "check-in", "arrive", "arrival", "get in", "access", "key", "code"

**Response pattern:**
```
Here's your check-in info for [PROPERTY_NAME]:

📍 Address: [ADDRESS]
🕐 Check-in time: [CHECK_IN_TIME]
🔑 Access: [ACCESS_INSTRUCTIONS]

[IF smart_lock:]
Your door code is: [CODE]
(This code is unique to your stay and will be active from [START] to [END])

[IF lockbox:]
The lockbox is located [LOCKBOX_LOCATION]. Code: [CODE]

[IF key_pickup:]
Please pick up keys from [PICKUP_LOCATION]. Contact [CONTACT] if needed.

Parking: [PARKING_INSTRUCTIONS]

Let me know when you arrive! 🏠
```

**Security Note:** Only provide access codes to confirmed guests within 24 hours of check-in
or during their stay. Verify booking status before sending.

### WiFi Information
**Triggers:** "wifi", "wi-fi", "internet", "password", "network"

**Response:**
```
Here's the WiFi info:

📶 Network: [WIFI_NETWORK]
🔑 Password: [WIFI_PASSWORD]

[IF multiple_networks:]
For streaming/gaming, use: [SECONDARY_NETWORK]

Let me know if you have any trouble connecting!
```

### House Rules & Policies
**Triggers:** "rules", "policy", "policies", "allowed", "can I", "pets", "smoking", "guests", "visitors", "quiet hours"

**Response:** Provide relevant rule from property.house_rules, formatted conversationally.

### Local Recommendations
**Triggers:** "recommend", "suggestion", "where", "best", "restaurant", "food", "grocery", "gym", "coffee"

**Response:** Pull from property.metadata.local_recommendations or generate based on location.

### Maintenance Issues
**Triggers:** "broken", "not working", "issue", "problem", "leak", "clogged", "heat", "AC", "hot water"

**Triage rules:**
- URGENT (immediate escalation): "flooding", "fire", "gas smell", "no heat" (winter), "no AC" (summer), "locked out", "safety"
- STANDARD (log + notify owner): "not working", "broken", "clogged", "dripping"
- SELF-SERVICE (provide guidance): "how do I", "where is", "thermostat", "breaker"

**Urgent response:**
```
I'm sorry to hear that! This sounds urgent.

I'm notifying [OWNER_NAME] right now. 

In the meantime:
[IF flooding: Please locate the water shutoff valve under the kitchen sink / in the utility closet]
[IF gas: Please leave the property immediately and call 911]
[IF locked_out: I'll get you a temporary code ASAP]

[OWNER_NAME] or our maintenance contact will reach out within [TIMEFRAME].

Emergency contact: [EMERGENCY_PHONE]
```
**→ Immediately notify owner via high-priority push + WhatsApp/SMS**

**Standard response:**
```
Thanks for letting me know about the [ISSUE].

I've logged this and notified [OWNER_NAME]. Someone will follow up within [TIMEFRAME] to get this resolved.

[IF self_help_available:]
In the meantime, you might try: [SELF_HELP_TIP]

Is this affecting your stay significantly? Let me know if it's urgent.
```

### Check-Out Instructions
**Triggers:** "check out", "check-out", "leaving", "departure", "last day"

**Response:**
```
Here's what to know for check-out:

🕐 Check-out time: [CHECK_OUT_TIME]
📋 Before you go:
   • [CHECKOUT_TASK_1 - e.g., "Start a load of towels"]
   • [CHECKOUT_TASK_2 - e.g., "Take out trash"]
   • [CHECKOUT_TASK_3 - e.g., "Leave keys on counter"]

[IF no_cleaning_required:]
No need to deep clean — just tidy up and we'll handle the rest!

[IF cleaning_fee_context:]
Professional cleaning is included, so just the basics above.

Safe travels! 🚗 It was great having you.

[IF review_request_enabled:]
If you have a moment, we'd really appreciate a review on [PLATFORM]!
```

### Extension Requests
**Triggers:** "extend", "stay longer", "extra days", "extra week", "keep the room"

**Response:**
```
I'd love to have you stay longer! Let me check availability.

[CHECK availability via doughy-core]

[IF available:]
Great news — [PROPERTY/ROOM] is available through [NEW_END_DATE]!

The rate for the extension would be [RATE]. Want me to update your booking?

[IF not_available:]
Unfortunately, I have another guest arriving on [CONFLICT_DATE].

I could offer:
• Extension through [AVAILABLE_DATE] ([X] extra days)
• [IF other_property:] Or my [OTHER_PROPERTY] is available if you need longer

Let me know what works for you!
```

## Confidence & Escalation
- High confidence (>0.9): Auto-send for routine questions (WiFi, check-in, recommendations)
- Medium confidence (0.7-0.9): Auto-send but flag for review
- Low confidence (<0.7): Queue for human response
- Always escalate: Maintenance emergencies, complaints, refund requests, anything involving money

## Personalization
Use guest's name and reference their specific booking/stay:
- "Hope you're settling in well at [PROPERTY]!"
- "How's your first week been?"
- "Getting close to the end of your stay — time flies!"
```

#### doughy-room/SKILL.md
```markdown
# Doughy Room-by-Room Skill

## Purpose
Handle inquiries and bookings for properties with room_by_room_enabled = true.
Manage availability across multiple rooms within a single property.

## Triggers
- Inquiry for property where room_by_room_enabled = true
- Questions about "a room" vs "the whole place"
- Existing guest asking about room changes

## Room Inquiry Flow

### Step 1: Determine Intent
When someone inquires about a room-by-room property:

**Check if they want:**
A) Whole property - "entire house", "whole place", "all bedrooms"
B) Single room - "a room", "one bedroom", "private room"
C) Unclear - Ask clarifying question

**Clarifying question:**
```
Thanks for your interest in [PROPERTY_NAME]!

Are you looking for:
• A private room (starting at $[MIN_ROOM_RATE]/[week|month])
• The entire property ($[WHOLE_RATE]/[month])

Both options include [SHARED_AMENITIES].
```

### Step 2: Present Available Rooms
If seeking a room, fetch available rooms via doughy-core.get_rooms:

```
Great! Here are the available rooms at [PROPERTY_NAME] for [DATES]:

🚪 [ROOM_1_NAME] — $[RATE]/[week|month]
   • [ROOM_1_AMENITIES]
   • [IF private_bath: Private bathroom ✓]
   • Available: [DATE]

🚪 [ROOM_2_NAME] — $[RATE]/[week|month]
   • [ROOM_2_AMENITIES]
   • Shared bathroom
   • Available: [DATE]

All rooms include:
✓ Utilities & WiFi
✓ Access to [SHARED_AMENITIES]
✓ [OTHER_INCLUSIONS]

Which room interests you? Happy to share more details or schedule a video tour!
```

### Step 3: Room-Specific Questions
Handle questions about specific rooms:

**"What's included with [ROOM]?"**
```
The [ROOM_NAME] includes:

In your room:
• [ROOM_AMENITIES - bed size, desk, closet, etc.]
• [IF private_bath: Private bathroom with [BATH_AMENITIES]]

Shared spaces:
• Full kitchen with [KITCHEN_AMENITIES]
• Living room
• [LAUNDRY - in-unit or shared]
• [PARKING]

Utilities (all included):
• Electricity, water, gas
• High-speed WiFi
• [IF included: Streaming services]

Would you like to see it? I can do a quick video tour!
```

**"Who else lives there?"**
```
Great question! Right now at [PROPERTY_NAME]:

[IF rooms_occupied:]
• [ROOM_X] is occupied by [DESCRIPTION - e.g., "a travel nurse, been here 2 months"]
• [ROOM_Y] is occupied by [DESCRIPTION]
• [ROOM_Z] is available (the one you're asking about)

[IF all_empty:]
You'd actually be the first! The property was just set up for room rentals.

All housemates go through the same screening process, so everyone's a verified 
working professional. Let me know if you have any concerns!
```

**"Can I see the room first?"**
```
Absolutely! I offer:

📹 Video tour (quickest) - I can walk you through on a video call
📸 Photo gallery - I'll send detailed photos of your specific room + shared spaces
🏠 In-person tour - If you're in [CITY], happy to schedule

Which works best for you?
```

### Step 4: Booking a Room
When ready to book:

```
Awesome! Let's get you set up in the [ROOM_NAME].

Here's the summary:
📍 [PROPERTY_ADDRESS]
🚪 Room: [ROOM_NAME]
📅 Dates: [START_DATE] - [END_DATE]
💰 Rate: $[RATE]/[week|month] (all-inclusive)
💵 Security deposit: $[DEPOSIT] (refundable)

Next steps:
1. I'll send an application link for a quick background check
2. Once approved, you'll get a lease to e-sign
3. First [week|month] + deposit due to secure the room
4. I'll send check-in details!

Ready to proceed? 🏠
```

## Room Status Management
Track room states:
- `available` - Open for booking
- `occupied` - Current guest
- `hold` - Reserved but not confirmed (48-hour holds)
- `maintenance` - Temporarily unavailable
- `unavailable` - Long-term block

## Conflict Prevention
Before confirming any room booking:
1. Re-check availability (rooms can book fast)
2. If conflict found:
```
Oh no — someone just booked the [ROOM_NAME] while we were chatting! 😅

But good news: [ALTERNATIVE_ROOM] is still available with similar amenities.

Or if you have flexibility on dates, [ORIGINAL_ROOM] opens up on [DATE].

What would you prefer?
```

## House Rules for Shared Living
Include in initial response and pre-booking:
```
Since this is shared housing, here are the house expectations:
• Quiet hours: [QUIET_HOURS]
• Guests: [GUEST_POLICY]
• Shared spaces: [CLEANING_EXPECTATIONS]
• Parking: [PARKING_RULES]

All housemates agree to these — it keeps things smooth for everyone! 🤝
```

## Room Transfer Requests
If current guest wants to change rooms:
```
I can definitely look into that!

[CHECK other room availability]

[IF available:]
The [NEW_ROOM] is available. It's $[RATE]/[week|month] ([IF different: that's $X more/less than your current room]).

Want to switch starting [DATE]? I'd just need to adjust your lease.

[IF not_available:]
Unfortunately the other rooms are occupied right now. [CURRENT_GUEST_ROOM] opens up on [DATE] if you can wait?

What's prompting the change? Maybe I can help address it another way.
```
```

#### doughy-booking/SKILL.md
```markdown
# Doughy Booking & Availability Skill

## Purpose
Manage booking lifecycle — availability checks, holds, confirmations, modifications,
and cancellations across properties and rooms.

## Availability Checking

### Simple Availability Query
```
POST doughy-core/get_availability
{
  "property_id": "uuid",
  "room_id": "uuid | null",
  "start_date": "2026-02-01",
  "end_date": "2026-04-30"
}
```

**Response scenarios:**

1. **Available:**
```
Great news! [PROPERTY/ROOM] is available [START] through [END].

Ready to book, or would you like more details first?
```

2. **Partially Available:**
```
[PROPERTY/ROOM] is available, but only through [EARLIER_DATE] — 
I have another booking starting [CONFLICT_DATE].

Would [START] to [EARLIER_DATE] work? That's [X] weeks/months.

[IF other_options:]
Or I could offer:
• [ALTERNATIVE_PROPERTY/ROOM] for your full dates
• Put you on a waitlist in case the other booking cancels
```

3. **Not Available:**
```
Unfortunately [PROPERTY/ROOM] is booked during those dates.

Here's what I have available:
• [ALTERNATIVE_1]: [DATES] - $[RATE]
• [ALTERNATIVE_2]: [DATES] - $[RATE]

Or if your dates are flexible, [ORIGINAL] opens up on [NEXT_AVAILABLE].

Would any of these work?
```

## Booking Creation Flow

### Step 1: Create Hold (48-hour reservation)
When guest indicates intent to book:
```
Perfect! I'll put a 48-hour hold on [PROPERTY/ROOM] for you.

That gives you until [HOLD_EXPIRES] to complete the application and deposit.

Sending the application link now... ✉️
```

Create booking with status='pending', set hold expiration.

### Step 2: Application & Screening
After application submitted:
```
Got your application! 🎉

I'm running the background check now — usually takes 1-2 hours. 
I'll message you as soon as it's ready.

In the meantime, any questions about [PROPERTY]?
```

### Step 3: Approval
When screening passes:
```
Great news — you're approved! 🎉

Here's your lease agreement: [LEASE_LINK]

Once signed, I'll send payment instructions for:
• First [month/week]: $[RATE]
• Security deposit: $[DEPOSIT]
• Total due: $[TOTAL]

Your hold is secure until [HOLD_EXPIRES]. Let me know if you need more time!
```

### Step 4: Confirmation
After lease signed and payment received:
```
You're all set! 🏠

Booking confirmed:
📍 [PROPERTY_ADDRESS]
[IF room: 🚪 Room: [ROOM_NAME]]
📅 [START_DATE] - [END_DATE]
💰 Paid: $[AMOUNT]

I'll send check-in details [X days] before your arrival.

Can't wait to host you! Let me know if you need anything before then.
```

Update booking status='confirmed'.

## Booking Modifications

### Date Changes
```
User: "Can I change my dates to [NEW_START] - [NEW_END]?"
```

1. Check new date availability
2. Calculate rate difference (if any)
3. Respond:

```
[IF available, same rate:]
No problem! I've updated your booking to [NEW_DATES].

Everything else stays the same. 👍

[IF available, different rate:]
I can do that! The new dates would be $[NEW_RATE]/[period] 
([IF higher: that's $X more] [IF lower: that's $X less] than before).

[IF prorated:] I'll [charge|refund] the difference of $[DIFFERENCE].

Want me to make the change?

[IF not available:]
Unfortunately I'm booked [CONFLICT_DATES] with another guest.

I could offer:
• [ALTERNATIVE_DATES] 
• Partial change: keep [ORIGINAL_START], end on [EARLIER_END]

What works best?
```

### Early Termination
```
User: "I need to leave early"
```

```
Sorry to hear you need to cut your stay short!

Your current booking goes through [END_DATE]. 

[IF flexible_policy:]
No worries — I just need [NOTICE_PERIOD] notice. When's your new checkout date?

[IF strict_policy:]
Per the lease, early termination requires [NOTICE_PERIOD] notice, and 
[PENALTY_TERMS — e.g., "forfeit deposit" or "pay through notice period"].

Your new end date would be [CALCULATED_DATE].

[IF willing_to_negotiate:]
That said, if you're leaving due to [job change / emergency / etc.], 
let's talk — I try to be flexible when I can.

What's your situation?
```

### Extension
(Handled in doughy-guest skill, but booking updates here)

## Cancellation Handling

### Guest-Initiated Cancellation
```
User: "I need to cancel my booking"
```

```
I'm sorry to hear that! Let me check your cancellation terms.

Your booking: [DATES] at [PROPERTY]
[DAYS_UNTIL_CHECKIN] days until check-in

[IF within_free_cancellation:]
Good news — you're within the free cancellation window.
I'll process a full refund of $[AMOUNT]. Should arrive in 5-7 business days.

[IF partial_refund:]
Based on our policy, I can refund $[REFUND_AMOUNT]:
• First [week|month] paid: $[AMOUNT] — [refundable|non-refundable]
• Deposit: $[DEPOSIT] — refundable

Want me to proceed with the cancellation?

[IF no_refund:]
Unfortunately, cancellations within [X] days of check-in aren't refundable 
per the lease terms.

[IF sympathetic_reason:]
That said, if this is due to [emergency/job cancellation/etc.], let me know — 
I may be able to work something out.

[IF offer_alternatives:]
Would rescheduling to different dates work instead?
```

### Owner-Initiated Cancellation
(Rare, but handle gracefully)
```
I'm really sorry, but I need to cancel your upcoming booking at [PROPERTY].

[REASON — maintenance emergency, property sale, personal emergency]

I'll immediately process a full refund of $[AMOUNT].

[IF can_help_relocate:]
I'd also like to help you find alternative housing:
• [ALTERNATIVE_PROPERTY] is available for your dates
• I can connect you with [TRUSTED_LANDLORD_CONTACT]

Again, I'm so sorry for the inconvenience. Please let me know how I can help.
```

## Calendar Integration
For scheduling tours or coordinating with guests:

```
User: "When can we do a video tour?"
```

```
I have these slots available this week:
• [SLOT_1]
• [SLOT_2]
• [SLOT_3]

Pick one and I'll send a calendar invite with the video link!

[Alternative:] Or tell me what works for you and I'll make it happen.
```

## Waitlist Management
If property/room is booked but guest wants it:

```
[PROPERTY/ROOM] is booked through [DATE], but I'd be happy to add you to the waitlist!

If anything changes with the current booking, you'll be first to know.

In the meantime, would you like me to keep an eye out for similar openings?
```

Create waitlist entry in contact.metadata or dedicated waitlist table.
```

### 1.2 Edge Functions (Supabase)

Zone 1 is responsible for implementing the business logic in these Edge Functions.
The database schema and types come from Zone 2.

**Files to create:**
- `/supabase/functions/moltbot-bridge/index.ts`
- `/supabase/functions/ai-responder/index.ts`
- `/supabase/functions/lead-scorer/index.ts`
- `/supabase/functions/availability-check/index.ts`
- `/supabase/functions/notification-push/index.ts`

See Contract B for API specifications.

### 1.3 Moltbot Configuration

**moltbot.json additions:**
```json
{
  "hooks": {
    "enabled": true,
    "presets": ["gmail"],
    "mappings": [
      {
        "match": { "path": "gmail" },
        "action": "agent",
        "name": "Doughy-Platform",
        "messageTemplate": "New email from {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].body}}"
      }
    ]
  },
  "skills": {
    "workspace": ["doughy-core", "doughy-platform", "doughy-lead", "doughy-guest", "doughy-room", "doughy-booking"]
  }
}
```

---

# ZONE 2: DATABASE DEVELOPMENT

## Responsibility
Design and implement the database schema, migrations, Row Level Security policies,
and TypeScript type definitions.

## Deliverables

### 2.1 SQL Migrations

#### Migration 001: Core Tables
```sql
-- 001_core_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CONTACTS: Reuse existing crm_contacts table
-- NOTE: The crm_contacts table already exists (from Phase 2 standardization).
-- For the Landlord platform, we reuse this table and add 'guest', 'tenant' to contact_types.
-- No new table needed - just ensure crm_contacts.contact_types includes rental-specific values.

-- If needed, add new source values to crm_contacts:
-- ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS valid_source;
-- ALTER TABLE crm_contacts ADD CONSTRAINT valid_source
--   CHECK (source IN ('furnishedfinder', 'airbnb', 'turbotenant', 'facebook',
--                     'whatsapp', 'telegram', 'email', 'sms', 'direct', 'referral',
--                     'zillow', 'hotpads', 'craigslist'));

-- RENTAL_PROPERTIES: Landlord rental properties
-- Note: This is SEPARATE from re_properties (RE Investor platform)
CREATE TABLE rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT,

  -- Property details
  property_type TEXT NOT NULL DEFAULT 'single_family',
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1,
  sqft INTEGER,

  -- Rental type (STR/MTR/LTR)
  rental_type TEXT NOT NULL DEFAULT 'mtr',

  -- Pricing
  base_rate NUMERIC(10,2) NOT NULL,
  rate_type TEXT NOT NULL DEFAULT 'monthly',
  cleaning_fee NUMERIC(10,2),
  security_deposit NUMERIC(10,2),

  -- Room-by-room
  room_by_room_enabled BOOLEAN DEFAULT FALSE,
  
  -- Features
  amenities TEXT[] DEFAULT '{}',
  house_rules JSONB DEFAULT '{}',
  check_in_instructions JSONB DEFAULT '{}',
  
  -- External listings
  listing_urls JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_property_type CHECK (property_type IN ('single_family', 'multi_family', 'condo', 'apartment', 'townhouse', 'room')),
  CONSTRAINT valid_rental_type CHECK (rental_type IN ('str', 'mtr', 'ltr')),
  CONSTRAINT valid_rate_type CHECK (rate_type IN ('nightly', 'weekly', 'monthly', 'yearly')),
  CONSTRAINT valid_property_status CHECK (status IN ('active', 'inactive', 'maintenance'))
);

CREATE INDEX idx_rental_properties_user_id ON rental_properties(user_id);
CREATE INDEX idx_rental_properties_status ON rental_properties(status);
CREATE INDEX idx_rental_properties_city ON rental_properties(city);
CREATE INDEX idx_rental_properties_rental_type ON rental_properties(rental_type);

-- ROOMS: Individual rooms for room-by-room rentals
CREATE TABLE rental_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rental_properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Room details
  size_sqft INTEGER,
  has_private_bath BOOLEAN DEFAULT FALSE,
  has_private_entrance BOOLEAN DEFAULT FALSE,
  bed_type TEXT,
  
  -- Features
  amenities TEXT[] DEFAULT '{}',
  
  -- Pricing
  weekly_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2) NOT NULL,
  utilities_included BOOLEAN DEFAULT TRUE,
  
  -- Availability
  status TEXT NOT NULL DEFAULT 'available',
  available_date DATE,
  
  -- Current booking reference
  current_booking_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_room_status CHECK (status IN ('available', 'occupied', 'hold', 'maintenance', 'unavailable'))
);

CREATE INDEX idx_rental_rooms_property_id ON rental_rooms(property_id);
CREATE INDEX idx_rental_rooms_status ON rental_rooms(status);

-- BOOKINGS: Reservations for properties or rooms
CREATE TABLE rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES rental_properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rental_rooms(id) ON DELETE SET NULL,

  -- Booking type (reservation for STR/MTR, lease for LTR)
  booking_type TEXT NOT NULL DEFAULT 'reservation',

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Pricing
  rate NUMERIC(10,2) NOT NULL,
  rate_type TEXT NOT NULL DEFAULT 'monthly',
  deposit NUMERIC(10,2),
  total_amount NUMERIC(10,2),

  -- Status
  status TEXT NOT NULL DEFAULT 'inquiry',
  
  -- Source tracking
  source TEXT,
  
  -- Hold management
  hold_expires_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_booking_type CHECK (booking_type IN ('reservation', 'lease')),
  CONSTRAINT valid_booking_status CHECK (status IN ('inquiry', 'pending', 'hold', 'confirmed', 'active', 'completed', 'cancelled')),
  CONSTRAINT valid_booking_rate_type CHECK (rate_type IN ('nightly', 'weekly', 'monthly', 'yearly')),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_rental_bookings_user_id ON rental_bookings(user_id);
CREATE INDEX idx_rental_bookings_contact_id ON rental_bookings(contact_id);
CREATE INDEX idx_rental_bookings_property_id ON rental_bookings(property_id);
CREATE INDEX idx_rental_bookings_room_id ON rental_bookings(room_id);
CREATE INDEX idx_rental_bookings_status ON rental_bookings(status);
CREATE INDEX idx_rental_bookings_dates ON rental_bookings(start_date, end_date);

-- Add foreign key for rooms.current_booking_id
ALTER TABLE rental_rooms 
ADD CONSTRAINT fk_rooms_current_booking 
FOREIGN KEY (current_booking_id) REFERENCES rental_bookings(id) ON DELETE SET NULL;
```

#### Migration 002: Communication Tables
```sql
-- 002_communication_tables.sql

-- CONVERSATIONS: Message threads with contacts
CREATE TABLE rental_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,
  
  -- Channel info
  channel TEXT NOT NULL,
  platform TEXT,
  
  -- External references
  external_thread_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  
  -- AI handling
  ai_enabled BOOLEAN DEFAULT TRUE,
  
  -- Activity tracking
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_ai_response_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_channel CHECK (channel IN ('whatsapp', 'telegram', 'email', 'sms', 'imessage', 'discord', 'messenger', 'webchat', 'voice')),
  CONSTRAINT valid_conversation_status CHECK (status IN ('active', 'resolved', 'escalated', 'archived'))
);

CREATE INDEX idx_rental_conversations_user_id ON rental_conversations(user_id);
CREATE INDEX idx_rental_conversations_contact_id ON rental_conversations(contact_id);
CREATE INDEX idx_rental_conversations_status ON rental_conversations(status);
CREATE INDEX idx_rental_conversations_channel ON rental_conversations(channel);
CREATE INDEX idx_rental_conversations_last_message ON rental_conversations(last_message_at DESC);

-- MESSAGES: Individual messages in conversations
CREATE TABLE rental_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES rental_conversations(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  direction TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  
  -- Sender info
  sent_by TEXT NOT NULL,
  
  -- AI tracking
  ai_confidence NUMERIC(3,2),
  ai_model TEXT,
  
  -- Approval workflow
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  original_content TEXT,
  
  -- Delivery status
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- External references
  external_message_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound')),
  CONSTRAINT valid_content_type CHECK (content_type IN ('text', 'image', 'file', 'voice', 'location')),
  CONSTRAINT valid_sent_by CHECK (sent_by IN ('contact', 'ai', 'user'))
);

CREATE INDEX idx_rental_messages_conversation_id ON rental_messages(conversation_id);
CREATE INDEX idx_rental_messages_created_at ON rental_messages(created_at DESC);
CREATE INDEX idx_rental_messages_sent_by ON rental_messages(sent_by);

-- AI_RESPONSE_QUEUE: Pending AI responses for human review
CREATE TABLE rental_ai_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES rental_conversations(id) ON DELETE CASCADE NOT NULL,
  
  -- The triggering message (optional)
  trigger_message_id UUID REFERENCES rental_messages(id) ON DELETE SET NULL,
  
  -- Suggested response
  suggested_response TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  
  -- Context
  reason TEXT,
  score_breakdown JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Resolution
  final_response TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_queue_status CHECK (status IN ('pending', 'approved', 'edited', 'rejected', 'expired', 'auto_sent'))
);

CREATE INDEX idx_rental_ai_queue_user_id ON rental_ai_queue(user_id);
CREATE INDEX idx_rental_ai_queue_status ON rental_ai_queue(status);
CREATE INDEX idx_rental_ai_queue_expires ON rental_ai_queue(expires_at);
CREATE INDEX idx_rental_ai_queue_created ON rental_ai_queue(created_at DESC);

-- TEMPLATES: Response templates
CREATE TABLE rental_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Template info
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Variables
  variables TEXT[] DEFAULT '{}',
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_template_category CHECK (category IN ('lead_response', 'guest_faq', 'check_in', 'check_out', 'maintenance', 'booking_confirm', 'decline', 'custom'))
);

CREATE INDEX idx_rental_templates_user_id ON rental_templates(user_id);
CREATE INDEX idx_rental_templates_category ON rental_templates(category);

-- USER_PLATFORM_SETTINGS: Track which platforms each user has enabled
CREATE TABLE user_platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Platform enablement
  investor_enabled BOOLEAN DEFAULT FALSE,
  landlord_enabled BOOLEAN DEFAULT FALSE,

  -- Current active platform
  active_platform TEXT NOT NULL DEFAULT 'investor',

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_active_platform CHECK (active_platform IN ('investor', 'landlord')),
  CONSTRAINT at_least_one_platform CHECK (investor_enabled OR landlord_enabled)
);

CREATE INDEX idx_user_platform_settings_user_id ON user_platform_settings(user_id);

-- PLATFORMS: External platform connections (FurnishedFinder, Airbnb, etc.)
CREATE TABLE rental_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Platform info
  platform_type TEXT NOT NULL,
  display_name TEXT,

  -- Connection status
  is_connected BOOLEAN DEFAULT FALSE,

  -- Credentials (encrypted)
  credentials JSONB DEFAULT '{}',

  -- Timestamps
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_platform_type CHECK (platform_type IN ('furnishedfinder', 'airbnb', 'turbotenant', 'facebook', 'whatsapp', 'telegram'))
);

CREATE INDEX idx_rental_integrations_user_id ON rental_integrations(user_id);
CREATE INDEX idx_rental_integrations_type ON rental_integrations(platform_type);
```

#### Migration 003: Functions and Triggers
```sql
-- 003_functions_triggers.sql

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_properties_updated_at
  BEFORE UPDATE ON rental_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_templates_updated_at
  BEFORE UPDATE ON rental_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update conversation stats on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    last_ai_response_at = CASE 
      WHEN NEW.sent_by = 'ai' THEN NEW.created_at 
      ELSE last_ai_response_at 
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_stats
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Function to update room status on booking change
CREATE OR REPLACE FUNCTION update_room_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When booking becomes active, mark room as occupied
  IF NEW.status = 'active' AND NEW.room_id IS NOT NULL THEN
    UPDATE rooms
    SET status = 'occupied', current_booking_id = NEW.id
    WHERE id = NEW.room_id;
  END IF;
  
  -- When booking ends, mark room as available
  IF (NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled')) 
     AND NEW.room_id IS NOT NULL THEN
    UPDATE rooms
    SET status = 'available', current_booking_id = NULL
    WHERE id = NEW.room_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_status
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_room_on_booking();

-- Function to check booking availability
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_property_id UUID,
  p_room_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflicting_bookings JSONB
) AS $$
DECLARE
  conflicts JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'start_date', b.start_date,
    'end_date', b.end_date,
    'status', b.status,
    'contact_name', c.name
  )), '[]'::jsonb)
  INTO conflicts
  FROM bookings b
  LEFT JOIN contacts c ON b.contact_id = c.id
  WHERE b.property_id = p_property_id
    AND (p_room_id IS NULL OR b.room_id = p_room_id OR b.room_id IS NULL)
    AND b.status IN ('hold', 'confirmed', 'active')
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    AND (
      (p_start_date BETWEEN b.start_date AND COALESCE(b.end_date, '9999-12-31'::DATE))
      OR (p_end_date BETWEEN b.start_date AND COALESCE(b.end_date, '9999-12-31'::DATE))
      OR (b.start_date BETWEEN p_start_date AND p_end_date)
    );
  
  RETURN QUERY SELECT 
    (conflicts = '[]'::jsonb) AS is_available,
    conflicts AS conflicting_bookings;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old holds
CREATE OR REPLACE FUNCTION expire_booking_holds()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE bookings
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE status = 'hold' AND hold_expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old AI response queue items
CREATE OR REPLACE FUNCTION expire_ai_queue_items()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE ai_response_queue
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
```

#### Migration 004: Row Level Security
```sql
-- 004_row_level_security.sql

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_templates ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY contacts_select ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (auth.uid() = user_id);

-- Properties policies
CREATE POLICY rental_properties_select ON rental_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rental_properties_insert ON rental_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rental_properties_update ON rental_properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rental_properties_delete ON rental_properties FOR DELETE USING (auth.uid() = user_id);

-- Rooms policies (through property ownership)
CREATE POLICY rental_rooms_select ON rooms FOR SELECT 
  USING (EXISTS (SELECT 1 FROM rental_properties WHERE id = rooms.property_id AND user_id = auth.uid()));
CREATE POLICY rental_rooms_insert ON rooms FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM rental_properties WHERE id = property_id AND user_id = auth.uid()));
CREATE POLICY rental_rooms_update ON rooms FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM rental_properties WHERE id = rooms.property_id AND user_id = auth.uid()));
CREATE POLICY rental_rooms_delete ON rooms FOR DELETE 
  USING (EXISTS (SELECT 1 FROM rental_properties WHERE id = rooms.property_id AND user_id = auth.uid()));

-- Bookings policies
CREATE POLICY rental_bookings_select ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rental_bookings_insert ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rental_bookings_update ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rental_bookings_delete ON bookings FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY rental_conversations_select ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rental_conversations_insert ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rental_conversations_update ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rental_conversations_delete ON conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies (through conversation ownership)
CREATE POLICY rental_messages_select ON messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY rental_messages_insert ON messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY rental_messages_update ON messages FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid()));

-- AI Queue policies
CREATE POLICY rental_ai_queue_select ON rental_ai_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rental_ai_queue_insert ON rental_ai_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rental_ai_queue_update ON rental_ai_queue FOR UPDATE USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY rental_templates_select ON rental_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rental_templates_insert ON rental_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rental_templates_update ON rental_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rental_templates_delete ON rental_templates FOR DELETE USING (auth.uid() = user_id);

-- User platform settings policies
ALTER TABLE user_platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_platform_settings_select ON user_platform_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_platform_settings_insert ON user_platform_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_platform_settings_update ON user_platform_settings FOR UPDATE USING (auth.uid() = user_id);

-- Platforms policies
ALTER TABLE rental_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY rental_integrations_select ON rental_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rental_integrations_insert ON rental_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rental_integrations_update ON rental_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rental_integrations_delete ON rental_integrations FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass for Edge Functions
-- Note: Edge Functions using service_role key bypass RLS automatically
```

### 2.2 TypeScript Types

Generate from schema (see Contract A above). Zone 2 produces `/src/types/database.ts`.

### 2.3 Database Utility Functions

Create `/src/lib/database.ts` with typed query helpers:

```typescript
// Example structure - Zone 2 implements fully
import { supabase } from './supabase';
import type { Contact, RentalProperty, Room, Booking, Conversation, Message } from '@/types/rental-database';

export const db = {
  contacts: {
    getById: (id: string) => Promise<Contact | null>,
    getByEmail: (email: string) => Promise<Contact | null>,
    create: (data: Partial<Contact>) => Promise<Contact>,
    update: (id: string, data: Partial<Contact>) => Promise<Contact>,
    search: (query: string) => Promise<Contact[]>,
  },
  rentalProperties: {
    getAll: () => Promise<RentalProperty[]>,
    getById: (id: string) => Promise<RentalProperty | null>,
    getByAddressHint: (hint: string) => Promise<RentalProperty | null>,
    create: (data: Partial<RentalProperty>) => Promise<RentalProperty>,
    update: (id: string, data: Partial<RentalProperty>) => Promise<RentalProperty>,
  },
  rooms: {
    getByProperty: (propertyId: string) => Promise<Room[]>,
    getAvailable: (propertyId: string) => Promise<Room[]>,
    getById: (id: string) => Promise<Room | null>,
    create: (data: Partial<Room>) => Promise<Room>,
    update: (id: string, data: Partial<Room>) => Promise<Room>,
  },
  bookings: {
    checkAvailability: (propertyId: string, roomId: string | null, startDate: string, endDate: string) => Promise<{available: boolean, conflicts: Booking[]}>,
    create: (data: Partial<Booking>) => Promise<Booking>,
    update: (id: string, data: Partial<Booking>) => Promise<Booking>,
    getUpcoming: (propertyId?: string) => Promise<Booking[]>,
    getActive: () => Promise<Booking[]>,
  },
  conversations: {
    getByContact: (contactId: string) => Promise<Conversation[]>,
    getRecent: (limit?: number) => Promise<Conversation[]>,
    getWithPendingResponses: () => Promise<Conversation[]>,
    create: (data: Partial<Conversation>) => Promise<Conversation>,
    update: (id: string, data: Partial<Conversation>) => Promise<Conversation>,
  },
  messages: {
    getByConversation: (conversationId: string, limit?: number) => Promise<Message[]>,
    create: (data: Partial<Message>) => Promise<Message>,
  },
  aiQueue: {
    getPending: () => Promise<AIResponseQueue[]>,
    approve: (id: string, finalResponse?: string) => Promise<void>,
    reject: (id: string) => Promise<void>,
    create: (data: Partial<AIResponseQueue>) => Promise<AIResponseQueue>,
  }
};
```

---

# ZONE 3: UI/UX DEVELOPMENT

## Responsibility
Build the mobile app screens, components, navigation, and **platform switching system** for the dual-platform experience.

## Deliverables

### 3.1 Platform Context (NEW)

```typescript
// src/contexts/PlatformContext.tsx

type Platform = 'investor' | 'landlord';

interface PlatformState {
  enabledPlatforms: Platform[];    // From user_platform_settings table
  activePlatform: Platform;        // Currently active
  switchPlatform: (platform: Platform) => void;
  isLoading: boolean;
}

export const PlatformContext = createContext<PlatformState | null>(null);

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('usePlatform must be used within PlatformProvider');
  return context;
};
```

### 3.2 Navigation Structure (Conditional Tabs)

The app uses `NativeTabs` from `expo-router/unstable-native-tabs` with iOS liquid glass styling.
Tabs are rendered conditionally based on `activePlatform`.

```typescript
// app/(tabs)/_layout.tsx - Platform-aware tab structure

export default function TabLayout() {
  const { activePlatform } = usePlatform();

  // RE Investor tabs: Focus | Leads | Deals | Portfolio | Settings
  // Landlord tabs: Inbox | Properties | Bookings | Contacts | Settings

  return (
    <NativeTabs
      backgroundColor="transparent"
      blurEffect={isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"}
    >
      {activePlatform === 'investor' ? (
        <>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: 'scope', selected: 'scope' }} />
            <Label>Focus</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="leads">
            <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
            <Label>Leads</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="deals">
            <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
            <Label>Deals</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="portfolio">
            <Icon sf={{ default: 'briefcase', selected: 'briefcase.fill' }} />
            <Label>Portfolio</Label>
          </NativeTabs.Trigger>
        </>
      ) : (
        <>
          <NativeTabs.Trigger name="inbox">
            <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
            <Label>Inbox</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="rental-properties">
            <Icon sf={{ default: 'house', selected: 'house.fill' }} />
            <Label>Properties</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="bookings">
            <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
            <Label>Bookings</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="contacts">
            <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
            <Label>Contacts</Label>
          </NativeTabs.Trigger>
        </>
      )}
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### 3.3 Screen Specifications (Landlord)

### 3.2 Screen Specifications

#### INBOX TAB (Primary - NEW)

**Screen: Inbox List** (`app/(tabs)/inbox/index.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Inbox                              🔍  ⋮             │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔴 NEEDS REVIEW (3)                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Sarah Johnson            📧 FurnishedFinder  2m │ │
│ │ Re: Alexandria 2BR                                  │ │
│ │ "I'm interested in the property for Feb..."         │ │
│ │                                                     │ │
│ │ 🤖 AI Response Ready (85% confidence)    [Approve] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Mike Chen               💬 WhatsApp         15m │ │
│ │ Re: Room inquiry                                    │ │
│ │ "What's included with the Blue Room?"               │ │
│ │                                                     │ │
│ │ 🤖 AI Response Ready (92% confidence)    [Approve] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⚠️ Rachel Kim              📧 Airbnb           1h │ │
│ │ Escalated: Refund request                           │ │
│ │ "I need to cancel my reservation because..."        │ │
│ │                                                     │ │
│ │ [View & Respond]                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✅ AI HANDLED TODAY (12)                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 James Wilson             📱 SMS            10m │ │
│ │ ✓ Sent: Check-in instructions                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Emily Davis              📧 Email           2h │ │
│ │ ✓ Sent: WiFi info                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time updates via Supabase subscriptions
- Pull-to-refresh
- Filter by: channel, property, status
- Quick approve button for high-confidence responses
- Tap to open conversation detail

**Screen: Conversation Detail** (`app/(tabs)/inbox/[id].tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Sarah Johnson                    📞  ⋮               │
│   FurnishedFinder • Alexandria 2BR                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                        Today 2:34 PM                    │
│                                                         │
│ ┌───────────────────────────────────┐                   │
│ │ Hi, I'm a travel nurse looking    │                   │
│ │ for housing near Inova Alexandria │                   │
│ │ from Feb 1 - Apr 30. Is your 2BR  │                   │
│ │ available? I work nights so quiet │                   │
│ │ is important.                     │                   │
│ │                               2:34 PM                 │
│ └───────────────────────────────────┘                   │
│                                                         │
│              ┌───────────────────────────────────┐      │
│              │ 🤖 AI SUGGESTED RESPONSE          │      │
│              │ Confidence: 85%                   │      │
│              │ ─────────────────────────────     │      │
│              │ Hi Sarah! 👋                      │      │
│              │                                   │      │
│              │ Great news — the Alexandria 2BR   │      │
│              │ is available Feb 1 - Apr 30!      │      │
│              │                                   │      │
│              │ Quick details:                    │      │
│              │ • $2,400/mo all-inclusive         │      │
│              │ • Very quiet neighborhood         │      │
│              │ • 8 min to Inova Alexandria       │      │
│              │                                   │      │
│              │ Would you like to schedule a      │      │
│              │ video tour?                       │      │
│              │                                   │      │
│              │ [✏️ Edit] [✓ Approve & Send]      │      │
│              └───────────────────────────────────┘      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ Type a message...                          📎 ➤ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Full conversation history
- AI suggestion with confidence score
- Edit AI response before sending
- One-tap approve and send
- Contact info sidebar (swipe or tap header)
- Property context always visible

#### PROPERTIES TAB (Updated)

**Screen: Properties List** (`app/(tabs)/properties/index.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Properties                              ➕            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏠 Alexandria 2BR                                   │ │
│ │ 123 King St, Alexandria VA                          │ │
│ │                                                     │ │
│ │ 💰 $2,400/mo  🛏️ 2 bed  🚿 1 bath                  │ │
│ │                                                     │ │
│ │ 📊 Status: Active                                   │ │
│ │ 📅 Current: Sarah J. (ends Apr 30)                  │ │
│ │ 💬 2 pending messages                               │ │
│ │                                                     │ │
│ │ [View Rooms]  [Calendar]  [Edit]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏠 Arlington House                    🔄 Room-by-Room│
│ │ 456 Wilson Blvd, Arlington VA                       │ │
│ │                                                     │ │
│ │ 💰 $150-200/wk per room  🚪 4 rooms                 │ │
│ │                                                     │ │
│ │ 📊 3/4 rooms occupied                               │ │
│ │ 🟢 Blue Room available now                          │ │
│ │                                                     │ │
│ │ [View Rooms]  [Calendar]  [Edit]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Screen: Property Detail** (`app/(tabs)/properties/[id].tsx`)

Includes:
- Property info and photos
- Room list (if room_by_room_enabled)
- Booking calendar
- Conversation history for this property
- Listing URLs (FurnishedFinder, Airbnb, etc.)
- Quick actions: Edit, Pause, View Inquiries

**Screen: Room Management** (`app/(tabs)/properties/[id]/rooms.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Arlington House Rooms                     ➕          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🚪 Blue Room                         $175/wk       │ │
│ │ ───────────────────────────────────────────────    │ │
│ │ 🟢 Available now                                   │ │
│ │ 🛁 Private bath • 🖥️ Desk • 📦 Closet              │ │
│ │                                                     │ │
│ │ [Edit]  [Mark Occupied]  [Block Dates]             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🚪 Garden Room                       $150/wk       │ │
│ │ ───────────────────────────────────────────────    │ │
│ │ 🔴 Occupied: Mike C. (until Mar 15)                │ │
│ │ 🚿 Shared bath • 🌳 Garden view                    │ │
│ │                                                     │ │
│ │ [View Guest]  [Edit]  [End Early]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🚪 Front Room                        $160/wk       │ │
│ │ ───────────────────────────────────────────────    │ │
│ │ 🔴 Occupied: Lisa M. (until Feb 28)                │ │
│ │ 🚿 Shared bath • ☀️ Morning sun                    │ │
│ │                                                     │ │
│ │ [View Guest]  [Edit]  [End Early]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### BOOKINGS TAB (NEW)

**Screen: Bookings Calendar** (`app/(tabs)/bookings/index.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Bookings                         📅 List | Calendar  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│            ◀  February 2026  ▶                         │
│                                                         │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat                     │
│  ───────────────────────────────────                    │
│   1    2    3    4    5    6    7                      │
│  ████████████████████████████████  ← Sarah (Alex 2BR)  │
│   8    9   10   11   12   13   14                      │
│  ████████████████████████████████                       │
│  15   16   17   18   19   20   21                      │
│  ████████████████████████████████                       │
│       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    ← Mike (Blue Room)   │
│  22   23   24   25   26   27   28                      │
│  ████████████████████████████████                       │
│       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ UPCOMING                                                │
│                                                         │
│ 📅 Feb 1 - Sarah Johnson checks in (Alexandria 2BR)    │
│ 📅 Feb 15 - Mike Chen checks in (Blue Room)            │
│ 📅 Feb 28 - Lisa Martinez checks out (Front Room)      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 💰 February Revenue: $4,950                             │
│    Occupancy: 87%                                       │
└─────────────────────────────────────────────────────────┘
```

#### CONTACTS TAB (Updated)

**Screen: Contacts List** (`app/(tabs)/contacts/index.tsx`)

Now shows unified contacts from all sources with status and score.

```
┌─────────────────────────────────────────────────────────┐
│ ← Contacts                          🔍 Filter ➕       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Showing: All (47)                                   │ │
│ │ [All] [Leads] [Guests] [Tenants] [Archived]        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Sarah Johnson                   Score: 85 🟢    │ │
│ │ Lead • FurnishedFinder • 2 hours ago               │ │
│ │ Interested in: Alexandria 2BR                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Mike Chen                       Guest 🏠        │ │
│ │ Current: Blue Room (ends Mar 15)                   │ │
│ │ Source: Airbnb                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Emily Davis                     Score: 45 🟡    │ │
│ │ Lead • Direct • 1 day ago                          │ │
│ │ Needs review                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### SETTINGS TAB (Updated)

Add new sections:
- **AI Settings**: Auto-send thresholds, confidence levels, escalation rules
- **Channels**: Connected channels status (Moltbot), notification preferences
- **Templates**: Manage response templates
- **Integrations**: FurnishedFinder, Airbnb, TurboTenant connection status

### 3.3 Component Library

Zone 3 builds these reusable components:

```
/src/components/
├── inbox/
│   ├── ConversationCard.tsx
│   ├── ConversationList.tsx
│   ├── MessageBubble.tsx
│   ├── AIResponseCard.tsx
│   ├── ChannelBadge.tsx
│   └── QuickApproveButton.tsx
├── properties/
│   ├── PropertyCard.tsx
│   ├── PropertyHeader.tsx
│   ├── RoomCard.tsx
│   ├── RoomList.tsx
│   └── AmenityTags.tsx
├── bookings/
│   ├── BookingCard.tsx
│   ├── BookingCalendar.tsx
│   ├── BookingTimeline.tsx
│   └── RevenueStats.tsx
├── contacts/
│   ├── ContactCard.tsx
│   ├── ContactDetail.tsx
│   ├── ScoreBadge.tsx
│   └── SourceBadge.tsx
├── common/
│   ├── EmptyState.tsx
│   ├── LoadingState.tsx
│   ├── ErrorState.tsx
│   ├── ConfirmModal.tsx
│   ├── FilterBar.tsx
│   └── PullToRefresh.tsx
└── forms/
    ├── PropertyForm.tsx
    ├── RoomForm.tsx
    ├── BookingForm.tsx
    └── ContactForm.tsx
```

### 3.4 State Management

Using Zustand (already in stack):

```typescript
// stores/inboxStore.ts
interface InboxStore {
  conversations: Conversation[];
  pendingResponses: AIResponseQueue[];
  filters: InboxFilters;
  isLoading: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchPendingResponses: () => Promise<void>;
  approveResponse: (id: string, edited?: string) => Promise<void>;
  rejectResponse: (id: string) => Promise<void>;
  setFilters: (filters: Partial<InboxFilters>) => void;
  
  // Real-time
  subscribeToUpdates: () => () => void;
}

// stores/propertiesStore.ts
interface PropertiesStore {
  properties: Property[];
  rooms: Record<string, Room[]>; // propertyId -> rooms
  isLoading: boolean;
  
  // Actions
  fetchProperties: () => Promise<void>;
  fetchRooms: (propertyId: string) => Promise<void>;
  updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
}

// stores/bookingsStore.ts
interface BookingsStore {
  bookings: Booking[];
  upcomingCheckIns: Booking[];
  upcomingCheckOuts: Booking[];
  isLoading: boolean;
  
  // Actions
  fetchBookings: (filters?: BookingFilters) => Promise<void>;
  checkAvailability: (params: AvailabilityParams) => Promise<AvailabilityResult>;
  createBooking: (data: Partial<Booking>) => Promise<Booking>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>;
}
```

---

# ZONE 4: TESTING

## Responsibility
Create comprehensive test suites for all zones. Tests should be runnable independently
and as part of CI/CD.

## Deliverables

### 4.1 Unit Tests

#### Database Function Tests
```typescript
// __tests__/database/availability.test.ts

describe('check_booking_availability', () => {
  it('returns available when no conflicts', async () => {
    // Setup: property with no bookings
    // Assert: is_available = true, conflicting_bookings = []
  });

  it('returns unavailable when date overlap exists', async () => {
    // Setup: property with existing booking Feb 1-28
    // Query: Feb 15 - Mar 15
    // Assert: is_available = false, conflicting_bookings contains existing
  });

  it('handles room-level availability correctly', async () => {
    // Setup: property with 2 rooms, room A booked, room B available
    // Query room B: should be available
    // Query room A: should be unavailable
  });

  it('excludes specified booking from conflict check', async () => {
    // For modification scenarios
  });
});
```

#### Edge Function Tests
```typescript
// __tests__/functions/moltbot-bridge.test.ts

describe('moltbot-bridge', () => {
  describe('get_properties', () => {
    it('returns all active properties for user', async () => {});
    it('includes room counts when requested', async () => {});
    it('respects RLS policies', async () => {});
  });

  describe('create_contact', () => {
    it('creates new contact with required fields', async () => {});
    it('updates existing contact if email matches', async () => {});
    it('calculates initial score from metadata', async () => {});
  });

  describe('log_message', () => {
    it('creates conversation if none exists', async () => {});
    it('updates conversation stats', async () => {});
    it('triggers AI response when enabled', async () => {});
  });
});

// __tests__/functions/lead-scorer.test.ts

describe('lead-scorer', () => {
  it('scores travel nurse inquiry as 70+', async () => {
    const input = {
      message: "I'm a travel nurse at Inova looking for Feb-Apr housing",
      source: 'furnishedfinder',
    };
    const result = await scorer.calculate(input);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.factors).toContainEqual({ factor: 'healthcare_worker', points: 15 });
  });

  it('scores vague inquiry as 40-60', async () => {
    const input = {
      message: "Is this available?",
      source: 'facebook',
    };
    const result = await scorer.calculate(input);
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
  });

  it('scores party keywords as below 40', async () => {
    const input = {
      message: "Looking for a place for a bachelor party weekend",
      source: 'airbnb',
    };
    const result = await scorer.calculate(input);
    expect(result.score).toBeLessThan(40);
    expect(result.factors).toContainEqual({ factor: 'party_keywords', points: -30 });
  });
});
```

#### Component Tests
```typescript
// __tests__/components/ConversationCard.test.tsx

describe('ConversationCard', () => {
  it('renders contact name and last message', () => {});
  it('shows channel badge with correct icon', () => {});
  it('displays pending AI response indicator', () => {});
  it('calls onQuickApprove when button pressed', () => {});
  it('navigates to detail on press', () => {});
});

// __tests__/components/AIResponseCard.test.tsx

describe('AIResponseCard', () => {
  it('displays suggested response text', () => {});
  it('shows confidence percentage with correct color', () => {});
  it('enables edit mode on edit button press', () => {});
  it('calls onApprove with edited text when modified', () => {});
  it('disables approve when confidence below threshold', () => {});
});
```

### 4.2 Integration Tests

```typescript
// __tests__/integration/inquiry-flow.test.ts

describe('Full Inquiry Flow', () => {
  it('processes FurnishedFinder email end-to-end', async () => {
    // 1. Simulate Gmail webhook with FF email
    // 2. Verify contact created
    // 3. Verify conversation created
    // 4. Verify AI response queued
    // 5. Verify push notification sent
  });

  it('handles room-by-room inquiry correctly', async () => {
    // 1. Simulate inquiry for room-enabled property
    // 2. Verify correct rooms returned in response
    // 3. Verify availability checked at room level
  });

  it('respects auto-send settings', async () => {
    // 1. Set user auto-send threshold to 80
    // 2. Process 85-confidence response -> auto-sent
    // 3. Process 75-confidence response -> queued
  });
});
```

### 4.3 E2E Tests (Detox or Maestro)

```yaml
# e2e/inbox-approve.yaml (Maestro)

appId: com.dinothesecond.doughy-ai-mobile
---
- launchApp
- tapOn: "Inbox"
- assertVisible: "NEEDS REVIEW"
- tapOn:
    text: "Sarah Johnson"
- assertVisible: "AI SUGGESTED RESPONSE"
- assertVisible: "85%"
- tapOn: "Approve & Send"
- assertVisible: "Message sent"
- tapOn:
    id: "back-button"
- assertVisible: "AI HANDLED TODAY"
```

### 4.4 Test Data Fixtures

```typescript
// __tests__/fixtures/index.ts

export const fixtures = {
  users: {
    landlord: { id: 'user-1', email: 'dino@example.com' },
  },
  
  contacts: {
    travelNurse: {
      id: 'contact-1',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      source: 'furnishedfinder',
      contact_type: ['lead'],
      score: 85,
    },
    vagueInquiry: {
      id: 'contact-2',
      name: 'Unknown',
      email: 'random@gmail.com',
      source: 'facebook',
      contact_type: ['lead'],
      score: 35,
    },
  },
  
  properties: {
    alexandria2BR: {
      id: 'prop-1',
      name: 'Alexandria 2BR',
      address: '123 King St',
      city: 'Alexandria',
      state: 'VA',
      base_rate: 2400,
      rate_type: 'monthly',
      room_by_room_enabled: false,
    },
    arlingtonHouse: {
      id: 'prop-2',
      name: 'Arlington House',
      address: '456 Wilson Blvd',
      city: 'Arlington',
      state: 'VA',
      room_by_room_enabled: true,
    },
  },
  
  rooms: {
    blueRoom: {
      id: 'room-1',
      property_id: 'prop-2',
      name: 'Blue Room',
      monthly_rate: 700,
      status: 'available',
    },
  },
  
  conversations: {
    activeInquiry: {
      id: 'conv-1',
      contact_id: 'contact-1',
      property_id: 'prop-1',
      channel: 'email',
      platform: 'furnishedfinder',
      status: 'active',
    },
  },
  
  messages: {
    initialInquiry: {
      id: 'msg-1',
      conversation_id: 'conv-1',
      direction: 'inbound',
      content: "I'm a travel nurse looking for housing near Inova...",
      sent_by: 'contact',
    },
  },
};
```

### 4.5 Mock Services

```typescript
// __tests__/mocks/moltbot.ts

export const mockMoltbot = {
  sendMessage: jest.fn().mockResolvedValue({ success: true }),
  getConversationHistory: jest.fn().mockResolvedValue([]),
};

// __tests__/mocks/supabase.ts

export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
};
```

---

## Zone 4 Implementation Status (January 2026)

### Completed Test Files

The following test suites have been implemented with comprehensive coverage:

#### P0 Priority (Critical Path - AI & Core Inbox)

| Test File | Coverage | Description |
|-----------|----------|-------------|
| `src/stores/__tests__/rental-conversations-store.test.ts` | 95% | Zustand store for conversations, messages, AI queue |
| `src/stores/__tests__/landlord-settings-store.test.ts` | 90% | Settings store for AI mode, thresholds |
| `src/features/rental-inbox/__tests__/components/AIReviewCard.test.tsx` | 95% | AI response review component |
| `src/features/rental-inbox/__tests__/hooks/useInbox.test.tsx` | 95% | Inbox data hooks |

#### P1 Priority (Core Features - Nudges & Bridge)

| Test File | Coverage | Description |
|-----------|----------|-------------|
| `src/features/focus/__tests__/components/SwipeableNudgeCard.test.tsx` | 90% | Swipeable nudge interaction |
| `src/features/focus/__tests__/hooks/useContactTouches.test.tsx` | 90% | Touch logging hooks |
| `src/features/rental-inbox/__tests__/screens/InboxListScreen.test.tsx` | 85% | Main inbox UI |
| `supabase/tests/edge-functions/ai-responder.test.ts` | 90% | AI response generation |
| `supabase/tests/edge-functions/lead-scorer.test.ts` | 95% | Lead scoring logic |
| `supabase/tests/edge-functions/availability-check.test.ts` | 90% | Date availability checking |
| `supabase/tests/edge-functions/moltbot-bridge.test.ts` | 90% | Bridge CRUD operations |

### Test Categories Implemented

#### 1. Zustand Store Tests
- Initial state validation
- Async fetch operations
- Approve/reject response flows
- Selector functions
- Error handling
- State persistence

#### 2. React Component Tests
- Rendering verification
- User interactions (press, swipe)
- Edit mode toggling
- Confidence badge styling
- Accessibility attributes
- Memoization behavior

#### 3. React Query Hook Tests
- Data fetching and caching
- Mutation operations
- Query invalidation
- Error states
- Loading states
- Filtering and sorting

#### 4. Deno Edge Function Tests
- CORS preflight handling
- Authentication requirements
- Request validation
- Response structure
- Error handling
- Topic detection
- Confidence scoring

### Mock Strategies Used

```typescript
// Supabase mock (from jest.setup.js)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => mockChainForTable(table)),
    auth: { getUser: jest.fn() },
    rpc: jest.fn(),
  },
}));

// React Query wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Gesture Handler mock (for swipeable)
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: React.forwardRef(({ children, renderLeftActions }, ref) => {
    React.useImperativeHandle(ref, () => ({ close: jest.fn() }));
    return <View>{renderLeftActions?.()}{children}</View>;
  }),
}));
```

### Running Tests

```bash
# Run all Jest tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/stores/__tests__/rental-conversations-store.test.ts

# Run Deno edge function tests
cd supabase && deno test --allow-env --allow-net tests/edge-functions/
```

### P2/P3 Items (Completed January 28, 2026)

| Test File | Coverage | Description |
|-----------|----------|-------------|
| `src/stores/__tests__/rental-bookings-store.test.ts` | 85% | Booking state management |
| `src/features/rental-bookings/__tests__/screens/BookingsListScreen.test.tsx` | 85% | Bookings UI |
| `src/features/focus/__tests__/hooks/useNudges.test.tsx` | 90% | Nudge generation logic |
| `src/contexts/__tests__/PlatformContext.test.tsx` | 85% | Platform switching context |
| `src/features/deals/hooks/__tests__/useDeals.test.tsx` | 85% | Deal CRUD and filtering (expanded) |
| `src/features/leads/hooks/__tests__/useLeads.test.tsx` | 85% | Lead CRUD and scoring (expanded) |
| `src/features/portfolio/__tests__/screens/PortfolioScreen.test.tsx` | 80% | Portfolio UI |
| `src/features/portfolio/hooks/__tests__/usePortfolio.test.tsx` | 80% | Portfolio data hooks |

### Zone 4 Summary

**Status: ✅ COMPLETE**

- **15 test suites** with **456 tests** passing
- **90%+ coverage** on P0/P1 items (critical path)
- **80-85% coverage** on P2/P3 items (supporting features)
- All edge functions have Deno test files
- All Zustand stores have test files
- All critical hooks and screens covered

---

# ZONE 5: INTEGRATION & CLEANUP

**Status: 🔄 IN PROGRESS**

## Responsibility
Combine all zones, resolve conflicts, optimize performance, and polish the final product.

## Deliverables

### 5.1 Integration Tasks

1. **Merge Zone Outputs**
   - [ ] Ensure all database types align with actual schema
   - [ ] Verify Edge Functions use correct types
   - [ ] Confirm UI components receive expected props

2. **End-to-End Testing**
   - [ ] Run full flow tests with all zones integrated
   - [ ] Test Moltbot → Edge Function → Database → UI flow
   - [x] Verify real-time subscriptions work _(added to rental-conversations-store.ts)_

3. **Performance Optimization**
   - [x] Add database indexes for common queries _(migration 20260128140000_performance_indexes.sql)_
   - [ ] Implement pagination for message lists
   - [x] Optimize Supabase subscriptions (filter at DB level) _(real-time subscriptions filter by conversation_id)_

### 5.2 Code Quality

1. **Linting & Formatting**
   - [ ] ESLint pass on all TypeScript
   - [x] Prettier formatting _(added .prettierrc)_
   - [ ] No TypeScript errors

2. **Code Review Checklist**
   - [x] All functions have error handling _(error banners added to InboxListScreen, ConversationDetailScreen, BookingsListScreen)_
   - [ ] All user inputs are validated
   - [ ] No hardcoded secrets
   - [ ] Logging in place for debugging
   - [ ] Loading states for all async operations

### 5.3 Documentation

1. **README Updates**
   - [ ] Architecture overview
   - [ ] Setup instructions
   - [ ] Environment variables

2. **API Documentation**
   - [x] Edge Function endpoints _(docs/EDGE_FUNCTION_API.md)_
   - [x] Request/response examples _(docs/EDGE_FUNCTION_API.md)_

3. **Moltbot Skill Documentation**
   - [ ] How to modify skills
   - [ ] Adding new capabilities

### 5.4 Deployment Checklist

- [ ] Database migrations applied to production
- [ ] Edge Functions deployed
- [ ] Moltbot skills installed on production gateway
- [ ] Gmail Pub/Sub configured
- [ ] Environment variables set
- [ ] Mobile app built and submitted
- [ ] Monitoring/alerting configured

### 5.5 Known Issues / Tech Debt

_Track issues discovered during integration here:_

1. (none yet)

---

# COORDINATION NOTES

## How Zones Stay In Sync

1. **Types are the contract**: Zone 2 produces TypeScript types. All other zones import and use them.

2. **API specs are fixed**: Contract B defines Edge Function signatures. Zone 1 implements, Zone 3 consumes.

3. **Component props are defined**: Contract C specifies what UI components expect. Zone 3 builds to spec.

4. **Tests verify contracts**: Zone 4 tests ensure all zones meet their contracts.

## Communication Points

When zones need to coordinate:

1. **Schema changes**: Zone 2 announces type changes → Zone 1, 3, 4 update
2. **API changes**: Zone 1 announces endpoint changes → Zone 3, 4 update
3. **UI requirements**: Zone 3 requests data shape → Zone 1, 2 accommodate

## Merge Order

1. Zone 2 (Database) - Foundation must be solid first
2. Zone 1 (Core) - Business logic depends on schema
3. Zone 3 (UI) - Presentation depends on data
4. Zone 4 (Tests) - Verification after implementation
5. Zone 5 (Integration) - Final polish

---

# END OF DOCUMENT

This document should be distributed to all development instances/developers.
Each zone works independently but adheres to the shared contracts.
Zone 5 brings everything together for the final product.
