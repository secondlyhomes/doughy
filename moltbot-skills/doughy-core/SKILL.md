# Doughy Core Skill

## Purpose
Connect Moltbot to Doughy's Supabase database. This skill provides the foundation
for all other Doughy skills to query and update data via the moltbot-bridge Edge Function.

## Configuration
Requires environment variables:
- `DOUGHY_API_URL`: Supabase Edge Function URL (e.g., https://[project-ref].supabase.co/functions/v1)
- `DOUGHY_API_KEY`: Supabase anon key or service role key
- `DOUGHY_USER_ID`: The landlord's user ID in Doughy

## Available Actions

### get_properties
Fetch all rental properties for the user.
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

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "uuid",
        "name": "Alexandria 2BR",
        "address": "123 Main St",
        "city": "Alexandria",
        "state": "VA",
        "bedrooms": 2,
        "bathrooms": 1,
        "base_rate": 2500,
        "rate_type": "monthly",
        "room_by_room_enabled": false,
        "status": "active",
        "rooms": []
      }
    ]
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
    "property_id": "uuid"
  }
}
```

OR with fuzzy match:
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_property",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "address_hint": "Alexandria"
  }
}
```

### get_rooms
Fetch rooms for a property (room-by-room rentals).
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_rooms",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "property_id": "uuid",
    "status": "available"
  }
}
```

### get_availability
Check if a property/room is available for specific dates.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_availability",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "property_id": "uuid",
    "room_id": "uuid",
    "start_date": "2026-02-01",
    "end_date": "2026-04-30"
  }
}
```

**Note:** `room_id` is optional. If null, checks whole property availability.

### create_contact
Create or update a contact (upserts by email or phone).
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

### update_contact
Update an existing contact.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "update_contact",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "status": "qualified",
    "score": 85,
    "contact_type": ["lead", "guest"],
    "tags": ["travel_nurse", "high_intent"]
  }
}
```

### log_message
Log a message to a conversation (creates conversation if needed).
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "log_message",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "conversation_id": "uuid",
    "channel": "whatsapp",
    "platform": "furnishedfinder",
    "direction": "inbound",
    "content": "Message text...",
    "sent_by": "contact",
    "property_id": "uuid"
  }
}
```

**Note:** If `conversation_id` is null, a new conversation is created.

### queue_response
Queue an AI-generated response for human approval.
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
    "category": "lead_response"
  }
}
```

**Categories:** `lead_response`, `guest_faq`, `booking_confirm`, `check_in`, `check_out`, `maintenance`

### create_booking
Create a new booking.
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "create_booking",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "property_id": "uuid",
    "room_id": "uuid",
    "start_date": "2026-02-01",
    "end_date": "2026-04-30",
    "rate": 2500,
    "rate_type": "monthly",
    "deposit": 1500,
    "status": "inquiry",
    "source": "furnishedfinder"
  }
}
```

## Error Handling
All requests return:
```json
{
  "success": true | false,
  "data": { ... },
  "error": "Error message if success=false"
}
```

If a request fails:
1. Log the error for debugging
2. Inform the user conversationally
3. Suggest they check the Doughy app for details

## Integration Points

### Supabase Tables
- `crm_contacts` - Unified contacts (leads, guests, tenants)
- `rental_properties` - Landlord rental listings
- `rental_rooms` - Individual rooms for room-by-room rentals
- `rental_bookings` - Booking records
- `conversations` - Message threads
- `messages` - Individual messages
- `ai_response_queue` - Pending AI responses

### Edge Functions
- `/moltbot-bridge` - Main API endpoint for all CRUD operations
- `/ai-responder` - Generate AI responses with confidence scores
- `/availability-check` - Dedicated availability checking
- `/lead-scorer` - Calculate lead scores

## Example Usage

### Processing a new inquiry
```
1. Receive email/message from platform
2. Call doughy-platform skill to parse
3. Call create_contact with extracted data
4. Call get_property to match property
5. Call get_availability to check dates
6. Hand off to doughy-lead skill for scoring/response
```

### Handling a guest question
```
1. Receive message from confirmed guest
2. Call get_contact_history for context
3. Call get_property for property details
4. Hand off to doughy-guest skill for response
5. Call log_message to record interaction
```
