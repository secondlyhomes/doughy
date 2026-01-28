# Doughy Booking & Availability Skill

## Purpose
Manage booking lifecycle - availability checks, holds, confirmations, modifications,
and cancellations across properties and rooms.

## Availability Checking

### Simple Availability Query
```
POST {DOUGHY_API_URL}/availability-check
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
[PROPERTY/ROOM] is available, but only through [EARLIER_DATE] -
I have another booking starting [CONFLICT_DATE].

Would [START] to [EARLIER_DATE] work? That's [X] weeks/months.

[IF other_options:]
Or I could offer:
- [ALTERNATIVE_PROPERTY/ROOM] for your full dates
- Put you on a waitlist in case the other booking cancels
```

3. **Not Available:**
```
Unfortunately [PROPERTY/ROOM] is booked during those dates.

Here's what I have available:
- [ALTERNATIVE_1]: [DATES] - $[RATE]
- [ALTERNATIVE_2]: [DATES] - $[RATE]

Or if your dates are flexible, [ORIGINAL] opens up on [NEXT_AVAILABLE].

Would any of these work?
```

## Booking Creation Flow

### Step 1: Create Hold (48-hour reservation)
When guest indicates intent to book:
```
Perfect! I'll put a 48-hour hold on [PROPERTY/ROOM] for you.

That gives you until [HOLD_EXPIRES] to complete the application and deposit.

Sending the application link now...
```

Create booking with status='pending', set hold expiration.

### Step 2: Application & Screening
After application submitted:
```
Got your application!

I'm running the background check now - usually takes 1-2 hours.
I'll message you as soon as it's ready.

In the meantime, any questions about [PROPERTY]?
```

### Step 3: Approval
When screening passes:
```
Great news - you're approved!

Here's your lease agreement: [LEASE_LINK]

Once signed, I'll send payment instructions for:
- First [month/week]: $[RATE]
- Security deposit: $[DEPOSIT]
- Total due: $[TOTAL]

Your hold is secure until [HOLD_EXPIRES]. Let me know if you need more time!
```

### Step 4: Confirmation
After lease signed and payment received:
```
You're all set!

Booking confirmed:
Address: [PROPERTY_ADDRESS]
[IF room: Room: [ROOM_NAME]]
Dates: [START_DATE] - [END_DATE]
Paid: $[AMOUNT]

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

Everything else stays the same.

[IF available, different rate:]
I can do that! The new dates would be $[NEW_RATE]/[period]
([IF higher: that's $X more] [IF lower: that's $X less] than before).

[IF prorated:] I'll [charge|refund] the difference of $[DIFFERENCE].

Want me to make the change?

[IF not available:]
Unfortunately I'm booked [CONFLICT_DATES] with another guest.

I could offer:
- [ALTERNATIVE_DATES]
- Partial change: keep [ORIGINAL_START], end on [EARLIER_END]

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
No worries - I just need [NOTICE_PERIOD] notice. When's your new checkout date?

[IF strict_policy:]
Per the lease, early termination requires [NOTICE_PERIOD] notice, and
[PENALTY_TERMS - e.g., "forfeit deposit" or "pay through notice period"].

Your new end date would be [CALCULATED_DATE].

[IF willing_to_negotiate:]
That said, if you're leaving due to [job change / emergency / etc.],
let's talk - I try to be flexible when I can.

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
Good news - you're within the free cancellation window.
I'll process a full refund of $[AMOUNT]. Should arrive in 5-7 business days.

[IF partial_refund:]
Based on our policy, I can refund $[REFUND_AMOUNT]:
- First [week|month] paid: $[AMOUNT] - [refundable|non-refundable]
- Deposit: $[DEPOSIT] - refundable

Want me to proceed with the cancellation?

[IF no_refund:]
Unfortunately, cancellations within [X] days of check-in aren't refundable
per the lease terms.

[IF sympathetic_reason:]
That said, if this is due to [emergency/job cancellation/etc.], let me know -
I may be able to work something out.

[IF offer_alternatives:]
Would rescheduling to different dates work instead?
```

### Owner-Initiated Cancellation
(Rare, but handle gracefully)
```
I'm really sorry, but I need to cancel your upcoming booking at [PROPERTY].

[REASON - maintenance emergency, property sale, personal emergency]

I'll immediately process a full refund of $[AMOUNT].

[IF can_help_relocate:]
I'd also like to help you find alternative housing:
- [ALTERNATIVE_PROPERTY] is available for your dates
- I can connect you with [TRUSTED_LANDLORD_CONTACT]

Again, I'm so sorry for the inconvenience. Please let me know how I can help.
```

## Calendar Integration
For scheduling tours or coordinating with guests:

```
User: "When can we do a video tour?"
```

```
I have these slots available this week:
- [SLOT_1]
- [SLOT_2]
- [SLOT_3]

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

## Integration Flow

1. **Receive booking request** or modification
2. **Check availability** via /availability-check
3. **Calculate pricing** based on dates, property, room
4. **Create/update booking** via doughy-core.create_booking
5. **Send confirmation** with next steps
6. **Schedule follow-ups** (check-in reminder, etc.)

## API Calls

### Check Availability
```
POST {DOUGHY_API_URL}/availability-check
{
  "property_id": "uuid",
  "room_id": "uuid",
  "start_date": "2026-02-01",
  "end_date": "2026-04-30"
}
```

### Create Booking
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
    "status": "pending",
    "source": "furnishedfinder",
    "notes": "48-hour hold until 2026-01-29T14:00:00Z"
  }
}
```

### Update Booking Status
```
POST {DOUGHY_API_URL}/moltbot-bridge
{
  "action": "update_booking",
  "user_id": "{DOUGHY_USER_ID}",
  "payload": {
    "booking_id": "uuid",
    "status": "confirmed",
    "notes": "Lease signed, deposit received"
  }
}
```

## Booking Status Flow

```
inquiry -> pending (hold) -> confirmed -> active -> completed
                    |                        |
                    v                        v
                cancelled              cancelled
```

### Status Definitions
- **inquiry** - Initial interest, no commitment
- **pending** - Hold placed, awaiting application/payment
- **confirmed** - Fully paid, lease signed
- **active** - Guest currently in residence
- **completed** - Stay finished, checkout done
- **cancelled** - Booking cancelled (track reason in notes)

## Automated Reminders

### Pre-Booking
- Hold expiration warning (6 hours before)
- Application reminder (if not submitted within 24 hours)

### Pre-Check-In
- Check-in details (3 days before)
- Day-of reminder with access codes

### During Stay
- Mid-stay check-in (for stays > 30 days)
- Extension offer (7 days before checkout)

### Post-Stay
- Checkout reminder (1 day before)
- Review request (1 day after checkout)

Configure via user settings in Doughy app.
