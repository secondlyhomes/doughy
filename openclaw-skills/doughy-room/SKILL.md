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
- A private room (starting at $[MIN_ROOM_RATE]/[week|month])
- The entire property ($[WHOLE_RATE]/[month])

Both options include [SHARED_AMENITIES].
```

### Step 2: Present Available Rooms
If seeking a room, fetch available rooms via doughy-core.get_rooms:

```
Great! Here are the available rooms at [PROPERTY_NAME] for [DATES]:

[ROOM_1_NAME] - $[RATE]/[week|month]
  - [ROOM_1_AMENITIES]
  - [IF private_bath: Private bathroom]
  - Available: [DATE]

[ROOM_2_NAME] - $[RATE]/[week|month]
  - [ROOM_2_AMENITIES]
  - Shared bathroom
  - Available: [DATE]

All rooms include:
- Utilities & WiFi
- Access to [SHARED_AMENITIES]
- [OTHER_INCLUSIONS]

Which room interests you? Happy to share more details or schedule a video tour!
```

### Step 3: Room-Specific Questions
Handle questions about specific rooms:

**"What's included with [ROOM]?"**
```
The [ROOM_NAME] includes:

In your room:
- [ROOM_AMENITIES - bed size, desk, closet, etc.]
- [IF private_bath: Private bathroom with [BATH_AMENITIES]]

Shared spaces:
- Full kitchen with [KITCHEN_AMENITIES]
- Living room
- [LAUNDRY - in-unit or shared]
- [PARKING]

Utilities (all included):
- Electricity, water, gas
- High-speed WiFi
- [IF included: Streaming services]

Would you like to see it? I can do a quick video tour!
```

**"Who else lives there?"**
```
Great question! Right now at [PROPERTY_NAME]:

[IF rooms_occupied:]
- [ROOM_X] is occupied by [DESCRIPTION - e.g., "a travel nurse, been here 2 months"]
- [ROOM_Y] is occupied by [DESCRIPTION]
- [ROOM_Z] is available (the one you're asking about)

[IF all_empty:]
You'd actually be the first! The property was just set up for room rentals.

All housemates go through the same screening process, so everyone's a verified
working professional. Let me know if you have any concerns!
```

**"Can I see the room first?"**
```
Absolutely! I offer:

Video tour (quickest) - I can walk you through on a video call
Photo gallery - I'll send detailed photos of your specific room + shared spaces
In-person tour - If you're in [CITY], happy to schedule

Which works best for you?
```

### Step 4: Booking a Room
When ready to book:

```
Awesome! Let's get you set up in the [ROOM_NAME].

Here's the summary:
Address: [PROPERTY_ADDRESS]
Room: [ROOM_NAME]
Dates: [START_DATE] - [END_DATE]
Rate: $[RATE]/[week|month] (all-inclusive)
Security deposit: $[DEPOSIT] (refundable)

Next steps:
1. I'll send an application link for a quick background check
2. Once approved, you'll get a lease to e-sign
3. First [week|month] + deposit due to secure the room
4. I'll send check-in details!

Ready to proceed?
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
Oh no - someone just booked the [ROOM_NAME] while we were chatting!

But good news: [ALTERNATIVE_ROOM] is still available with similar amenities.

Or if you have flexibility on dates, [ORIGINAL_ROOM] opens up on [DATE].

What would you prefer?
```

## House Rules for Shared Living
Include in initial response and pre-booking:
```
Since this is shared housing, here are the house expectations:
- Quiet hours: [QUIET_HOURS]
- Guests: [GUEST_POLICY]
- Shared spaces: [CLEANING_EXPECTATIONS]
- Parking: [PARKING_RULES]

All housemates agree to these - it keeps things smooth for everyone!
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

## Integration Flow

1. **Detect room-by-room property** via doughy-core.get_property
2. **Fetch available rooms** via doughy-core.get_rooms
3. **Present options** based on guest's intent
4. **Check specific room availability** via doughy-core.get_availability
5. **Generate booking** via doughy-core.create_booking with room_id
6. **Update room status** as needed

## API Calls

### Get Room Availability
```
POST {DOUGHY_API_URL}/openclaw-bridge
{
  "action": "get_rooms",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "property_id": "uuid",
    "status": "available"
  }
}
```

### Check Specific Room
```
POST {DOUGHY_API_URL}/availability-check
{
  "property_id": "uuid",
  "room_id": "uuid",
  "start_date": "2026-02-01",
  "end_date": "2026-04-30"
}
```

### Create Room Booking
```
POST {DOUGHY_API_URL}/openclaw-bridge
{
  "action": "create_booking",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "property_id": "uuid",
    "room_id": "uuid",
    "start_date": "2026-02-01",
    "end_date": "2026-04-30",
    "rate": 1200,
    "rate_type": "monthly",
    "deposit": 600,
    "status": "inquiry",
    "source": "furnishedfinder"
  }
}
```

## Housemate Compatibility

### Compatibility Factors
When multiple rooms are occupied, consider:
- Profession similarity (all healthcare workers tend to gel)
- Schedule compatibility (night shift vs day shift)
- Gender preferences (if configured)
- Pet allergies (if pets allowed)

### Proactive Matching Response
```
Based on what you've shared, I think you'd be a great fit!

Your potential housemates are also traveling professionals in healthcare.
The house tends to be quiet during the week since everyone's working.

Would you like their contact info to chat before committing?
(Only if both parties agree, of course!)
```

## Pricing Considerations

### Room Rate Factors
- Base room rate
- Private bath premium (+$100-200/month typically)
- Room size premium
- Seasonal adjustments

### Response Example with Pricing
```
Here are your options:

Main Bedroom - $1,400/month
- Largest room (200 sq ft)
- Private bathroom
- Walk-in closet

Guest Room - $1,100/month
- Cozy space (120 sq ft)
- Shared bathroom (with 1 other)
- Built-in desk

Both include utilities, WiFi, and access to all common areas.

Which fits your needs better?
```
