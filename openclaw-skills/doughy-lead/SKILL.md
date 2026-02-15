# Doughy Lead Qualification Skill

## Purpose
Score incoming leads based on their inquiry, generate appropriate responses,
and decide whether to auto-send or queue for human review.

## Triggers
- Called by doughy-platform after parsing a new inquiry
- Called when contact status changes
- Called on-demand for re-scoring existing contacts

## Scoring System (0-100 points)

### Positive Factors
| Factor | Points | Detection |
|--------|--------|-----------|
| Traveling professional | +20 | Keywords: "travel nurse", "traveling", "contract", "assignment", "relocating for work" |
| Healthcare worker | +15 | Keywords: "nurse", "RN", "doctor", "physician", "therapist", "tech", "medical" |
| Clear move-in date | +15 | Specific date mentioned within 60 days |
| Medium-term stay (30-180 days) | +15 | Date range or duration mentioned |
| Mentions employer | +10 | Company name, staffing agency, or "my employer" |
| Found via FurnishedFinder | +10 | source = furnishedfinder (high intent platform) |
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
Hi [NAME]!

Thanks for reaching out about [PROPERTY_NAME]!

Great news - it's available [START_DATE] through [END_DATE]!

Here are the details:
- [RATE] all-inclusive (utilities, WiFi, parking included)
- [BEDS] bedroom, [BATHS] bath, fully furnished
- [KEY_AMENITIES - washer/dryer, workspace, etc.]
[IF healthcare_worker: - Just [DISTANCE] from [NEAREST_HOSPITAL]!]

[IF room_by_room AND asking about whole property:]
I also offer individual rooms if you'd prefer - let me know!

[IF room_by_room AND asking about room:]
That room includes [ROOM_AMENITIES] with access to shared [SHARED_AMENITIES].

Would you like to schedule a quick video tour? I have availability:
- [AVAILABLE_SLOT_1]
- [AVAILABLE_SLOT_2]

Or if you're ready, I can send over the application link!

Looking forward to hosting you!
[OWNER_NAME]
```

### Medium Score (60-79): Clarifying Response
```
Hi [NAME]!

Thanks for your interest in [PROPERTY_NAME]! I'd love to help you find the right fit.

Could you tell me a bit more?
- What brings you to [CITY]?
- Approximately when would you need to move in?
- How long are you thinking of staying?

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
**-> Queue for human review with score breakdown**

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

1. **Receive parsed inquiry** from doughy-platform
2. **Match property** using doughy-core.get_property
3. **Check availability** using doughy-core.get_availability
4. **Calculate score** based on factors above
5. **Generate appropriate response** based on score tier
6. **Decision:**
   - If auto-send: Send via channel, log message
   - If review needed: Queue response, send push notification
7. **Update contact** with score and reasoning

## API Integration

### Call AI Responder for Generation
```
POST {DOUGHY_API_URL}/ai-responder
{
  "contact_id": "uuid",
  "message": "Original inquiry message...",
  "channel": "email",
  "context": {
    "property_id": "uuid",
    "conversation_history": [...],
    "score": 85,
    "score_factors": [...]
  }
}
```

### Call Lead Scorer for Score
```
POST {DOUGHY_API_URL}/lead-scorer
{
  "contact_id": "uuid",
  "conversation_id": "uuid"
}
```

**Response:**
```json
{
  "score": 85,
  "factors": [
    { "factor": "healthcare_worker", "points": 15 },
    { "factor": "clear_dates", "points": 15 },
    { "factor": "furnishedfinder_source", "points": 10 }
  ],
  "recommendation": "auto_qualify"
}
```

## Logging Requirements
Always log to doughy-core:
- Contact creation/update with score
- All messages (inbound and outbound)
- Score breakdown in contact.metadata
- Qualification decision and reasoning

## Example Scoring

**Inquiry:**
```
"Hi! I'm a travel nurse starting a contract at Inova Alexandria on Feb 1.
Looking for a furnished place for my 13-week assignment. Is this available?"
```

**Score Calculation:**
```
Base score: 0
+ Travel professional ("travel nurse", "contract"): +20
+ Healthcare worker ("nurse"): +15
+ Clear move-in date ("Feb 1"): +15
+ Medium-term stay ("13-week assignment"): +15
+ FurnishedFinder source: +10
+ Complete inquiry: +5
---------------------------------
Total: 80 -> Auto-qualify
```

**Recommendation:** Auto-qualify, send detailed response with availability.

## Confidence Calibration

After generating response, assess confidence:
- **High (0.9+):** All info available, clear intent, no ambiguity
- **Medium (0.7-0.9):** Some gaps but reasonable assumptions made
- **Low (<0.7):** Significant missing info, unclear intent

Queue for review if confidence < 0.8 OR score < 60.
