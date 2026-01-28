# Doughy Investor Core Skill

## Purpose

Core AI assistant capabilities for Real Estate Investors. Handles seller outreach, agent relationship management, deal tracking, and follow-up sequences. This skill transforms MoltBot from a rental-focused assistant to a comprehensive RE investor communication tool.

## Triggers

This skill is activated when:

1. **Platform Detection**: Message is routed to the `investor` platform by the router
2. **Domain Match**: Sender email matches known RE investor platforms (PropStream, BatchLeads, etc.)
3. **Content Match**: Message content indicates seller/agent communication patterns
4. **Manual Override**: User explicitly marks a conversation as investor-related

## Contact Types

### Seller
Motivated sellers who may want to sell their property.

**Indicators:**
- Mentions selling property, cash offer, quick close
- Responds to direct mail or marketing
- Discusses property condition, liens, or distress factors
- Uses phrases like "as-is", "inherited", "foreclosure"

**Communication Style:**
- Empathetic and understanding
- Focus on solving their problem
- Avoid aggressive tactics
- Build trust before discussing price

### Agent
Real estate agents for deal sourcing and relationships.

**Indicators:**
- Mentions listings, pocket listings, off-market deals
- Discusses commissions or referral fees
- Uses MLS terminology
- Professional email signatures with license info

**Communication Style:**
- Professional and business-focused
- Highlight mutual benefits
- Quick response to deal opportunities
- Maintain relationship for future deals

## Actions

### QUALIFY_SELLER
Assess seller motivation and property potential.

**Request:**
```json
{
  "action": "qualify_seller",
  "user_id": "uuid",
  "contact_id": "uuid",
  "payload": {
    "property_address": "123 Main St",
    "initial_message": "I got your letter...",
    "context": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "qualification": {
    "motivation_score": 75,
    "property_potential": "high",
    "timeline": "30_days",
    "pain_points": ["foreclosure", "inheritance"],
    "objections": ["price_expectations"],
    "next_steps": ["schedule_call", "send_offer_range"]
  }
}
```

### GENERATE_OUTREACH
Create personalized outreach messages for cold leads.

**Request:**
```json
{
  "action": "generate_outreach",
  "user_id": "uuid",
  "payload": {
    "lead_type": "absentee_owner",
    "property_info": {
      "address": "456 Oak Ave",
      "owner_name": "John Smith",
      "equity_estimate": 150000,
      "ownership_years": 15
    },
    "campaign_type": "direct_mail_followup",
    "sequence_position": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "subject": "Following up on 456 Oak Ave",
    "body": "Hi John, I hope this message finds you well...",
    "personalization_notes": ["Mentioned long ownership", "Focused on convenience"]
  }
}
```

### TRACK_DEAL
Update deal pipeline and status.

**Request:**
```json
{
  "action": "track_deal",
  "user_id": "uuid",
  "payload": {
    "deal_id": "uuid",
    "status_update": "offer_submitted",
    "offer_details": {
      "amount": 180000,
      "terms": "cash_close_14_days",
      "contingencies": ["inspection"]
    }
  }
}
```

### SCHEDULE_FOLLOWUP
Create automated follow-up reminders.

**Request:**
```json
{
  "action": "schedule_followup",
  "user_id": "uuid",
  "contact_id": "uuid",
  "payload": {
    "followup_type": "seller_check_in",
    "delay_days": 7,
    "message_template": "checking_in",
    "context": {
      "last_conversation_topic": "price_negotiation"
    }
  }
}
```

## Response Templates

### Initial Seller Response

**Triggered by:** First response from potential seller

**Template:**
```
Hi {first_name},

Thank you for reaching out about your property at {property_address}. I appreciate you taking the time to contact me.

I work with homeowners in situations like yours every day, and I'm here to provide a straightforward, hassle-free option if it makes sense for you.

To better understand how I can help, could you tell me a bit more about:
- Your timeline for potentially selling?
- The current condition of the property?
- What's most important to you in this process?

I'm happy to discuss this over the phone if you prefer - just let me know what works for you.

Looking forward to hearing from you,

{owner_name}
{company_name}
```

### Motivated Seller Follow-up

**Triggered by:** High motivation score seller who hasn't responded

**Template:**
```
Hi {first_name},

I wanted to follow up on our conversation about {property_address}. I understand selling a property can be a big decision, and I want to make sure you have all the information you need.

As a reminder, when you work with me:
- No repairs or cleaning needed
- No agent commissions or fees
- Flexible closing timeline that works for you
- Fair cash offer with no obligations

Is there anything specific I can answer for you? I'm here to help whenever you're ready.

{owner_name}
```

### Agent Introduction

**Triggered by:** Initial outreach to real estate agent

**Template:**
```
Hi {agent_name},

I hope this message finds you well. My name is {owner_name} and I'm an active real estate investor in the {market_area} area.

I'm always looking to connect with agents who have:
- Off-market or pocket listings
- Expired listings with motivated sellers
- REO or estate sale properties

I can close quickly with cash and handle properties in any condition. If you come across any deals that might fit, I'd love to be a resource for you.

Happy to discuss how we can work together - what's the best way to connect?

{owner_name}
{company_name}
```

### Deal Status Update

**Triggered by:** Deal pipeline status change

**Template:**
```
Hi {first_name},

I wanted to give you a quick update on {property_address}:

{status_update_details}

{next_steps_if_applicable}

Please let me know if you have any questions.

{owner_name}
```

## Qualification Scoring

### Motivation Factors

| Factor | Points | Description |
|--------|--------|-------------|
| Foreclosure mention | +25 | Property in foreclosure |
| Inherited property | +20 | Recently inherited |
| Out-of-state owner | +15 | Absentee owner |
| Vacancy indicators | +15 | Property appears vacant |
| Divorce mention | +20 | Divorce situation |
| Medical/health issues | +20 | Health-related urgency |
| Job relocation | +15 | Moving for work |
| Tired landlord | +15 | Exhausted from management |
| Quick timeline (30 days) | +20 | Wants to sell fast |
| Flexible timeline | +5 | No urgency |
| Already listed (90+ days) | +15 | Stale listing |
| Code violations | +15 | Property has violations |

### Negative Factors

| Factor | Points | Description |
|--------|--------|-------------|
| Unrealistic price expectations | -20 | Wants retail price |
| Just testing waters | -15 | No real motivation |
| Has an agent | -10 | Already represented |
| Wants to stay in property | -25 | Not actually selling |
| Just refinanced | -20 | Recently locked in |

### Motivation Levels

- **Hot (80+):** Schedule call immediately, prepare offer
- **Warm (60-79):** Priority follow-up, more discovery needed
- **Cold (40-59):** Add to nurture sequence
- **Not Motivated (<40):** Low priority, long-term follow-up

## Integration with Deal Pipeline

This skill integrates with the RE Investor deal tracking system:

```
Lead
  ↓ [QUALIFY_SELLER]
Prospect (motivation assessed)
  ↓ [GENERATE_OUTREACH / Follow-up]
Appointment Set
  ↓
Offer Made [TRACK_DEAL]
  ↓
Under Contract
  ↓
Due Diligence
  ↓
Closed / Wholesaled
```

## Learning & Adaptation

The investor skill learns from:

1. **Successful Deals:** Response patterns that led to closed deals
2. **User Edits:** Adjustments made to generated outreach
3. **Outcome Tracking:** Which follow-up sequences convert best
4. **Market Feedback:** What sellers respond to in specific markets

## Channel Support

| Channel | Supported | Notes |
|---------|-----------|-------|
| Email | ✅ | Primary channel for investor communication |
| SMS | ✅ | Quick follow-ups and appointment confirmations |
| WhatsApp | ⏳ | Planned for international markets |
| Telegram | ❌ | Not typical for RE investing |

## Security Considerations

- Never store or reveal financial details in AI responses
- Don't make specific price commitments without user approval
- Avoid discriminatory language or targeting
- Comply with DNC (Do Not Call) regulations
- Honor opt-out requests immediately

## Configuration

User settings for investor AI:

```json
{
  "investor_ai_settings": {
    "ai_mode": "assisted",
    "outreach_enabled": true,
    "follow_up_cadence": [3, 7, 14],
    "auto_qualify_threshold": 75,
    "max_daily_outreach": 50,
    "preferred_deal_types": ["wholesale", "fix_and_flip", "buy_and_hold"],
    "target_markets": ["Austin, TX", "San Antonio, TX"],
    "acquisition_criteria": {
      "min_equity_percent": 30,
      "max_arv": 500000,
      "property_types": ["single_family", "duplex"]
    }
  }
}
```
