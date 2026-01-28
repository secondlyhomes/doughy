# Doughy Platform Detection Skill

## Purpose
Parse incoming emails from rental platforms (FurnishedFinder, Airbnb, TurboTenant,
Facebook Marketplace, Zillow) and extract structured lead/guest data.

## Triggers
This skill is invoked when Moltbot receives an email via Gmail Pub/Sub hooks.
Check the sender and subject to determine the platform.

## Platform Detection Rules

### FurnishedFinder / Travel Nurse Housing
**Senders:**
- `*@furnishedfinder.com`
- `*@travelnursehousing.com`
- `noreply@furnishedfinder.com`

**Subject patterns:**
- "New message from [NAME]"
- "Housing request from [NAME]"
- "[NAME] is interested in your property"
- "New inquiry for [PROPERTY]"

**Extraction:**
- **Name:** Look for "from [NAME]" in subject or "Name: [NAME]" in body
- **Email:** Usually in body as "Email: [EMAIL]" or "Contact: [EMAIL]"
- **Phone:** Sometimes included as "Phone: [PHONE]"
- **Dates:** Look for "Move-in: [DATE]" or "Dates: [START] - [END]"
- **Property:** Match property name/address from body against user's listings
- **Message:** The inquiry text, usually after "Message:" or in quoted section

**Reply Method:** `platform_only` or `direct_email` (if contact info provided)

**Note:** FurnishedFinder does not support direct email reply. Flag for manual
response via FurnishedFinder website, or if phone/email provided, respond directly.

### Airbnb
**Senders:**
- `*@airbnb.com`
- `*@guest.airbnb.com`
- `express@airbnb.com`

**Subject patterns:**
- "New inquiry from [NAME]"
- "Reservation request from [NAME]"
- "Message from [NAME]"
- "[NAME] wants to book [PROPERTY]"

**Extraction:**
- **Name:** From subject or "Guest: [NAME]" in body
- **Dates:** "Check-in: [DATE]" and "Check-out: [DATE]"
- **Guests:** "Guests: [NUMBER]"
- **Property:** Match listing name
- **Message:** The guest's message text

**Reply Method:** `email_reply` (threads to Airbnb conversation)

**Note:** Can reply via email - it threads to Airbnb conversation.

### TurboTenant
**Senders:**
- `*@turbotenant.com`
- `noreply@turbotenant.com`

**Subject patterns:**
- "New lead for [PROPERTY]"
- "Application submitted"
- "New inquiry"

**Extraction:**
- **Name:** "Applicant: [NAME]" or "From: [NAME]"
- **Email:** "Email: [EMAIL]"
- **Phone:** "Phone: [PHONE]"
- **Property:** From subject or body

**Reply Method:** `direct_email` (contact info usually provided)

### Facebook Marketplace
**Senders:**
- `*@facebook.com`
- `*@fb.com`
- `notification@facebookmail.com`

**Subject patterns:**
- "Marketplace"
- "Someone is interested in"
- "New message about"

**Extraction:**
- **Name:** Sender name or "from [NAME]"
- **Message:** Usually "Is this still available?" or custom message
- **Property:** Matched from listing title in subject

**Reply Method:** `messenger` (cannot reply via email)

**Note:** Cannot reply via email. Flag for response via Facebook Messenger.

### Zillow / HotPads
**Senders:**
- `*@zillow.com`
- `*@hotpads.com`
- `noreply@zillow.com`

**Subject patterns:**
- "New lead from Zillow"
- "Rental inquiry"
- "[NAME] is interested in [ADDRESS]"

**Extraction:**
- **Name:** "Name: [NAME]" or from subject
- **Email:** "Email: [EMAIL]"
- **Phone:** "Phone: [PHONE]"
- **Move-in Date:** "Move-in: [DATE]"
- **Message:** The inquiry text

**Reply Method:** `direct_email` (contact info usually provided)

### Direct Email
If sender doesn't match known platforms but emails the landlord's Doughy inbox:
- Treat as `source: "direct"`
- Extract name from email sender
- Parse any inquiry details from body
- Reply method: `email_reply`

## Output Format
After parsing, create structured data for doughy-core:

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
  "reply_method": "direct_email",
  "original_email": {
    "from": "noreply@furnishedfinder.com",
    "subject": "New message from Sarah Johnson",
    "received_at": "2026-01-27T14:30:00Z"
  }
}
```

## Integration Flow

1. **Receive email** via Gmail Pub/Sub hook
2. **Detect platform** from sender/subject patterns
3. **Extract data** using platform-specific rules
4. **Match property** using doughy-core.get_property with address_hint
5. **Create/update contact** via doughy-core.create_contact
6. **Log inbound message** via doughy-core.log_message
7. **Trigger qualification** via doughy-lead skill

## Unknown Platforms
If sender doesn't match known patterns:
1. Check if it's a direct email to the landlord's Doughy email
2. If yes, treat as `source: "direct"`
3. If unknown, log for manual review and notify owner
4. Store raw email in metadata for later processing

## Extraction Utilities

### Date Parsing
Common date formats to handle:
- "February 1, 2026"
- "2/1/26" or "02/01/2026"
- "Feb 1" (assume current year if < now, next year otherwise)
- "next month" (relative)
- "ASAP" (flag as urgent, no specific date)

### Phone Normalization
Convert to E.164 format:
- "(555) 123-4567" -> "+15551234567"
- "555.123.4567" -> "+15551234567"
- "5551234567" -> "+15551234567"

### Name Parsing
- Handle "First Last" format
- Handle "Last, First" format
- Extract from email addresses: "sarah.johnson@email.com" -> "Sarah Johnson"

## Error Handling
- If parsing fails, store raw email and flag for manual review
- If property match fails, include `property_hint` for manual matching
- Always create contact even with partial data
- Log parsing errors but don't block the flow

## Example: FurnishedFinder Email

**Raw Email:**
```
From: noreply@furnishedfinder.com
Subject: New message from Sarah Johnson

You have a new message from Sarah Johnson regarding your listing
"Furnished 2BR near Inova Alexandria"

Name: Sarah Johnson
Email: sarah.j@email.com
Phone: (571) 555-1234

Move-in: February 1, 2026
Length of stay: 3 months

Message:
Hi! I'm a travel nurse starting a contract at Inova Alexandria on Feb 1.
Looking for a furnished place for my 13-week assignment. Is this available?

Thanks,
Sarah
```

**Parsed Output:**
```json
{
  "source": "furnishedfinder",
  "contact": {
    "name": "Sarah Johnson",
    "email": "sarah.j@email.com",
    "phone": "+15715551234"
  },
  "inquiry": {
    "property_hint": "Furnished 2BR near Inova Alexandria",
    "dates": {
      "start": "2026-02-01",
      "end": "2026-04-26"
    },
    "message": "Hi! I'm a travel nurse starting a contract at Inova Alexandria on Feb 1. Looking for a furnished place for my 13-week assignment. Is this available?",
    "guests": 1
  },
  "reply_method": "direct_email",
  "metadata": {
    "profession_detected": "travel_nurse",
    "employer_hint": "Inova Alexandria",
    "stay_type": "mtr",
    "high_intent_signals": ["specific_date", "healthcare_worker", "contract_mention"]
  }
}
```

Then trigger doughy-lead skill for qualification.
