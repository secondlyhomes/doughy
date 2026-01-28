# Doughy Guest Communication Skill

## Purpose
Handle ongoing communication with confirmed guests - questions about the property,
check-in instructions, WiFi passwords, local recommendations, maintenance issues.

## Triggers
- Message from a contact with contact_type includes 'guest'
- Message from contact with active booking (status = 'confirmed' or 'active')
- Keywords indicating guest question vs new inquiry

## Context Loading
Before responding, fetch via doughy-core:
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

Address: [ADDRESS]
Check-in time: [CHECK_IN_TIME]
Access: [ACCESS_INSTRUCTIONS]

[IF smart_lock:]
Your door code is: [CODE]
(This code is unique to your stay and will be active from [START] to [END])

[IF lockbox:]
The lockbox is located [LOCKBOX_LOCATION]. Code: [CODE]

[IF key_pickup:]
Please pick up keys from [PICKUP_LOCATION]. Contact [CONTACT] if needed.

Parking: [PARKING_INSTRUCTIONS]

Let me know when you arrive!
```

**Security Note:** Only provide access codes to confirmed guests within 24 hours of check-in
or during their stay. Verify booking status before sending.

### WiFi Information
**Triggers:** "wifi", "wi-fi", "internet", "password", "network"

**Response:**
```
Here's the WiFi info:

Network: [WIFI_NETWORK]
Password: [WIFI_PASSWORD]

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
- **URGENT** (immediate escalation): "flooding", "fire", "gas smell", "no heat" (winter), "no AC" (summer), "locked out", "safety"
- **STANDARD** (log + notify owner): "not working", "broken", "clogged", "dripping"
- **SELF-SERVICE** (provide guidance): "how do I", "where is", "thermostat", "breaker"

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
**-> Immediately notify owner via high-priority push + WhatsApp/SMS**

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

Check-out time: [CHECK_OUT_TIME]
Before you go:
  - [CHECKOUT_TASK_1 - e.g., "Start a load of towels"]
  - [CHECKOUT_TASK_2 - e.g., "Take out trash"]
  - [CHECKOUT_TASK_3 - e.g., "Leave keys on counter"]

[IF no_cleaning_required:]
No need to deep clean - just tidy up and we'll handle the rest!

[IF cleaning_fee_context:]
Professional cleaning is included, so just the basics above.

Safe travels! It was great having you.

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
Great news - [PROPERTY/ROOM] is available through [NEW_END_DATE]!

The rate for the extension would be [RATE]. Want me to update your booking?

[IF not_available:]
Unfortunately, I have another guest arriving on [CONFLICT_DATE].

I could offer:
- Extension through [AVAILABLE_DATE] ([X] extra days)
- [IF other_property:] Or my [OTHER_PROPERTY] is available if you need longer

Let me know what works for you!
```

## Confidence & Escalation
- **High confidence (>0.9):** Auto-send for routine questions (WiFi, check-in, recommendations)
- **Medium confidence (0.7-0.9):** Auto-send but flag for review
- **Low confidence (<0.7):** Queue for human response
- **Always escalate:** Maintenance emergencies, complaints, refund requests, anything involving money

## Personalization
Use guest's name and reference their specific booking/stay:
- "Hope you're settling in well at [PROPERTY]!"
- "How's your first week been?"
- "Getting close to the end of your stay - time flies!"

## Integration Flow

1. **Receive message** from confirmed guest
2. **Load context** via doughy-core:
   - get_contact_history
   - get_property (for property details)
   - Current booking details
3. **Classify question type** (check-in, WiFi, maintenance, etc.)
4. **Generate response** using appropriate template + AI refinement
5. **Determine confidence** based on question type and available info
6. **Auto-send or queue** based on confidence and escalation rules
7. **Log message** via doughy-core.log_message

## Security Considerations

### Sensitive Information
Never auto-send:
- Access codes to non-confirmed guests
- Access codes more than 24 hours before check-in
- Financial information
- Other guests' information

### Identity Verification
If request seems unusual:
- Verify against known phone/email
- Ask for booking confirmation details
- Flag for human review

## API Calls

### Get Guest Context
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "get_contact_history",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "limit": 20
  }
}
```

### Generate Response
```
POST {DOUGHY_API_URL}/ai-responder
{
  "contact_id": "uuid",
  "message": "Guest's question...",
  "channel": "whatsapp",
  "context": {
    "property_id": "uuid",
    "conversation_history": [...],
    "guest_context": {
      "booking_status": "active",
      "days_into_stay": 5,
      "checkout_date": "2026-04-30"
    }
  }
}
```

### Log Maintenance Issue
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "log_message",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "contact_id": "uuid",
    "conversation_id": "uuid",
    "channel": "whatsapp",
    "direction": "inbound",
    "content": "The AC isn't working",
    "sent_by": "contact",
    "property_id": "uuid",
    "metadata": {
      "issue_type": "maintenance",
      "priority": "standard",
      "category": "hvac"
    }
  }
}
```
