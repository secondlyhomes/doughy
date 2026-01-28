# Edge Function API Documentation

This document describes the Supabase Edge Functions that power the Doughy Landlord platform's backend services.

## Base URL

All Edge Functions are available at:
```
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

## Authentication

All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <supabase-jwt-token>
```

---

## Moltbot Bridge

**Endpoint:** `POST /moltbot-bridge`

Bridge between Moltbot AI assistant and Doughy's database. Provides a unified API for all CRUD operations on rental data.

### Request Body

```typescript
interface MoltbotBridgeRequest {
  action: MoltbotAction;
  user_id: string;
  payload: Record<string, any>;
}

type MoltbotAction =
  | 'get_properties'
  | 'get_property'
  | 'get_rooms'
  | 'get_availability'
  | 'create_contact'
  | 'update_contact'
  | 'log_message'
  | 'create_booking'
  | 'get_contact_history'
  | 'queue_response'
  | 'get_templates';
```

### Actions

#### get_properties
Fetch all properties for a user.

**Payload:**
```json
{
  "status": "active",         // Optional: filter by status
  "include_rooms": true       // Optional: include rooms for each property
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "uuid",
        "name": "Alexandria House",
        "address": "123 Main St",
        "city": "Alexandria",
        "state": "VA",
        "property_type": "single_family",
        "bedrooms": 4,
        "bathrooms": 2,
        "base_rate": 2500,
        "rate_type": "monthly",
        "status": "active",
        "rooms": []
      }
    ]
  }
}
```

#### get_property
Fetch a specific property by ID or address hint.

**Payload:**
```json
{
  "property_id": "uuid"       // OR
  "address_hint": "Alexandria" // Fuzzy match on name, address, or city
}
```

#### get_rooms
Fetch rooms for a property.

**Payload:**
```json
{
  "property_id": "uuid",
  "status": "available"       // Optional: filter by status
}
```

#### get_availability
Check if a property/room is available for dates.

**Payload:**
```json
{
  "property_id": "uuid",
  "room_id": "uuid",          // Optional: null = whole property
  "start_date": "2026-02-01",
  "end_date": "2026-04-30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "conflicts": [],
    "suggested_dates": []
  }
}
```

#### create_contact
Create or update a contact (auto-deduplicates by email/phone).

**Payload:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah@email.com",
  "phone": "+15551234567",
  "source": "furnishedfinder",
  "contact_type": ["lead"],
  "metadata": {}
}
```

#### update_contact
Update an existing contact.

**Payload:**
```json
{
  "contact_id": "uuid",
  "status": "qualified",
  "score": 85,
  "contact_type": ["guest"],
  "tags": ["travel_nurse", "long_term"],
  "metadata": {}
}
```

#### log_message
Log a message to a conversation (creates conversation if needed).

**Payload:**
```json
{
  "contact_id": "uuid",
  "conversation_id": "uuid",  // Optional: creates new if not provided
  "channel": "whatsapp",
  "platform": "furnishedfinder",
  "direction": "inbound",
  "content": "Hi, I'm interested in your property!",
  "sent_by": "contact",
  "property_id": "uuid"
}
```

#### create_booking
Create a new booking.

**Payload:**
```json
{
  "contact_id": "uuid",
  "property_id": "uuid",
  "room_id": "uuid",          // Optional: null = whole property
  "start_date": "2026-02-01",
  "end_date": "2026-05-01",
  "rate": 2500,
  "rate_type": "monthly",
  "deposit": 500,
  "source": "furnishedfinder",
  "notes": "Travel nurse, 3-month contract"
}
```

#### queue_response
Queue an AI-generated response for review.

**Payload:**
```json
{
  "conversation_id": "uuid",
  "trigger_message_id": "uuid",
  "suggested_response": "Hi Sarah! Thank you for your interest...",
  "confidence": 85,
  "reasoning": "Standard inquiry about availability",
  "detected_topics": ["availability", "pricing"]
}
```

---

## AI Responder

**Endpoint:** `POST /ai-responder`

Generates AI responses for guest/lead messages with confidence scores.

### Request Body

```typescript
interface AIResponderRequest {
  user_id: string;
  contact_id: string;
  conversation_id?: string;
  message: string;
  message_id?: string;
  channel: string;
  platform?: string;
  context?: {
    property_id?: string;
    conversation_history?: Message[];
    score?: number;
    score_factors?: { factor: string; points: number }[];
  };
}
```

### Example Request

```json
{
  "user_id": "user-uuid",
  "contact_id": "contact-uuid",
  "conversation_id": "conv-uuid",
  "message": "Hi, I'm a travel nurse looking for housing from Feb 1 to April 30. Do you have availability?",
  "channel": "email",
  "platform": "furnishedfinder",
  "context": {
    "property_id": "property-uuid"
  }
}
```

### Response

```typescript
interface AIResponderResponse {
  response: string;              // Generated response text
  confidence: number;            // Base confidence (0-100)
  adjusted_confidence: number;   // Confidence after learning adjustments
  suggested_actions: string[];   // Recommended follow-up actions
  detected_topics: string[];     // Topics detected in message
  should_auto_send: boolean;     // Whether to auto-send (based on settings)
  requires_review_reason?: string; // Why review is needed (if applicable)
  message_type: string;          // Classification: inquiry, faq, complaint, etc.
  queued?: boolean;              // Whether response was queued for review
  queue_id?: string;             // ID of queued response (if queued)
}
```

### Example Response

```json
{
  "response": "Hi there! Thank you for reaching out about our Alexandria property. Yes, we do have availability from February 1st to April 30th! As a travel nurse, you'd be a perfect fit for our furnished room.\n\nThe monthly rate is $2,500 which includes all utilities and WiFi. Would you like to schedule a virtual tour or do you have any questions about the property?\n\nBest,\nProperty Management",
  "confidence": 92,
  "adjusted_confidence": 90,
  "suggested_actions": ["schedule_tour", "send_lease"],
  "detected_topics": ["availability", "booking"],
  "should_auto_send": true,
  "message_type": "booking_request",
  "queued": false
}
```

### Topic Detection

The AI responder detects the following topics:
- `wifi` - WiFi/internet questions
- `pricing` - Rate/cost inquiries
- `availability` - Availability checks
- `check_in` / `check_out` - Access and departure info
- `amenities` - Property features
- `maintenance` - Repair/issue reports
- `refund` - Refund requests (always requires review)
- `discount` - Negotiation attempts (always requires review)
- `complaint` - Unhappy guests (always requires review)
- `cancellation` - Booking cancellations
- `booking` - Reservation requests
- `tour` - Viewing requests
- `pets` - Pet policy questions
- `guests` - Visitor policy questions

---

## Lead Scorer

**Endpoint:** `POST /lead-scorer`

Scores leads based on their inquiry content and source.

### Request Body

```typescript
interface LeadScorerRequest {
  contact_id: string;
  conversation_id: string;
  message?: string;  // Optional: latest message to include in scoring
}
```

### Example Request

```json
{
  "contact_id": "contact-uuid",
  "conversation_id": "conv-uuid",
  "message": "Hi, I'm a travel nurse with Aya Healthcare looking for housing from March 1st for 13 weeks"
}
```

### Response

```typescript
interface LeadScorerResponse {
  score: number;                 // 0-100 lead score
  factors: ScoreFactor[];        // Breakdown of scoring factors
  recommendation: Recommendation;
  suggested_response_type: ResponseType;
}

interface ScoreFactor {
  factor: string;
  points: number;
  detected: boolean;
}

type Recommendation =
  | 'auto_qualify'    // Score >= 80
  | 'likely_qualify'  // Score 60-79
  | 'needs_review'    // Score 40-59
  | 'likely_decline'  // Score 20-39
  | 'auto_decline';   // Score < 20

type ResponseType = 'detailed' | 'clarifying' | 'acknowledgment' | 'decline';
```

### Example Response

```json
{
  "score": 85,
  "factors": [
    { "factor": "traveling professional", "points": 20, "detected": true },
    { "factor": "healthcare worker", "points": 15, "detected": true },
    { "factor": "mentions employer", "points": 10, "detected": true },
    { "factor": "clear move-in date", "points": 15, "detected": true },
    { "factor": "medium-term stay", "points": 15, "detected": true },
    { "factor": "source: furnishedfinder", "points": 10, "detected": true }
  ],
  "recommendation": "auto_qualify",
  "suggested_response_type": "detailed"
}
```

### Scoring Rules

**Positive Factors:**
- Traveling professional (+20)
- Healthcare worker (+15)
- Mentions employer (+10)
- Clear move-in date (+15)
- Medium-term stay (30-90 days, +15)
- Source: FurnishedFinder (+10)
- Source: Airbnb/TurboTenant (+5)

**Negative Factors:**
- Party/event mention (-30)
- Cash-only request (-25)
- Very short stay (-15)
- Urgent/desperate language (-15)
- Extra guests mention (-10)
- Source: Facebook (-5)
- Source: Craigslist (-10)

---

## Availability Check

**Endpoint:** `GET /availability-check`

Dedicated endpoint for checking property/room availability.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `property_id` | string | Yes | Property UUID |
| `room_id` | string | No | Room UUID (null = whole property) |
| `start_date` | string | Yes | Start date (YYYY-MM-DD) |
| `end_date` | string | Yes | End date (YYYY-MM-DD) |

### Example Request

```
GET /availability-check?property_id=abc-123&start_date=2026-02-01&end_date=2026-04-30
```

### Response

```typescript
interface AvailabilityResponse {
  available: boolean;
  property_id: string;
  room_id?: string;
  requested_dates: {
    start: string;
    end: string;
  };
  conflicts?: Booking[];           // If not available
  suggested_dates?: DateRange[];   // Alternative available dates
  rooms_available?: RoomStatus[];  // For room-by-room properties
}

interface DateRange {
  start: string;
  end: string;
}

interface RoomStatus {
  room_id: string;
  room_name: string;
  available: boolean;
}
```

### Example Response (Available)

```json
{
  "available": true,
  "property_id": "abc-123",
  "requested_dates": {
    "start": "2026-02-01",
    "end": "2026-04-30"
  }
}
```

### Example Response (Not Available)

```json
{
  "available": false,
  "property_id": "abc-123",
  "requested_dates": {
    "start": "2026-02-01",
    "end": "2026-04-30"
  },
  "conflicts": [
    {
      "id": "booking-uuid",
      "start_date": "2026-01-15",
      "end_date": "2026-03-15",
      "status": "confirmed"
    }
  ],
  "suggested_dates": [
    { "start": "2026-03-16", "end": "2026-06-15" },
    { "start": "2026-05-01", "end": "2026-07-31" }
  ]
}
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing JWT |
| 403 | Forbidden - User doesn't have access to resource |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

Edge Functions are rate-limited based on your Supabase plan. For high-volume operations, consider batching requests or using database subscriptions for real-time updates.

---

## Related Documentation

- [Architecture Refactor](/docs/doughy-architecture-refactor.md) - Full system architecture
- [Database Schema](/supabase/migrations) - Table definitions and migrations
- [Moltbot Integration](/docs/MOLTBOT_INTEGRATION.md) - Moltbot skill setup
