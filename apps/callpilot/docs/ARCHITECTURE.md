# Architecture

## The Ecosystem

```
┌─────────────────────────────────────────────────────┐
│                    SUPABASE                          │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐│
│  │  auth.*  │ │  crm.*  │ │investor.*│ │landlord.*││
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘│
│  ┌──────────┐ ┌───────────┐                        │
│  │  claw.*  │ │callpilot.*│                        │
│  └──────────┘ └───────────┘                        │
└───────┬──────────┬──────────┬──────────┬───────────┘
        │          │          │          │
   ┌────▼────┐ ┌───▼───┐ ┌───▼────┐ ┌───▼─────┐
   │ Doughy  │ │CallPlt│ │The Claw│ │ Server  │
   │  App    │ │  App  │ │  App   │ │(Express)│
   │(Expo)   │ │(Expo) │ │(Expo)  │ │  on DO  │
   └─────────┘ └───────┘ └────────┘ └─────────┘
```

## What Each Piece Owns

- **Doughy App**: reads/writes `auth.*`, `crm.*`, `investor.*`, `landlord.*`
- **CallPilot App**: reads `crm.*`, `investor.*`, `landlord.*`, `claw.draft_suggestions` | writes `callpilot.*`
- **The Claw App**: reads `claw.*`, `callpilot.calls` | writes `claw.trust_config`, `claw.connections`
- **Server**: reads/writes everything (via `service_role` key). Powers The Claw's intelligence.

## Data Flow for Key Operations

### Morning Briefing
Server reads `crm` + `investor` + `landlord` + `callpilot` → Claude generates briefing → broadcasts to WhatsApp/Discord

### Draft Follow-Up
Server reads lead data → Claude generates draft → stored in `claw.draft_suggestions` → pushed to CallPilot + Discord

### Incoming Message
Twilio → Server routes (Claw command vs lead reply) → stores in `crm.messages` → CallPilot displays

### AI Call
Server → Bland API → call happens → Bland webhook → Server stores in `callpilot.calls` → broadcasts result

### Pre-Call Briefing
CallPilot → Server `/api/calls/pre-brief` → reads lead data → Claude generates → returns to CallPilot

### Trust Enforcement
Server checks `claw.trust_config` before every action → executes, queues, or requests approval

### Vendor Dispatch
Maintenance request → Server matches contractor → drafts message → enforces trust → sends

## CallPilot App Architecture

### Layer Structure

```
app/                    # Screens (Expo Router) - default exports
  (tabs)/               # Bottom tab navigator (Contacts, Messages, Settings)
  contact/[id].tsx      # Contact detail
  messages/[contactId]  # Conversation thread
  pre-call/[contactId]  # Pre-call briefing
  active-call/          # Live call coaching (stub)
  call-summary/         # Post-call summary
  settings/             # Settings sub-screens
  onboarding/           # First-time onboarding flow

src/
  components/           # Shared UI - named exports only
    contacts/           # Contact-specific components
    messages/           # Message-specific components
    settings/           # Settings-specific components
    briefs/             # Pre-call briefing components
  hooks/                # Custom React hooks (useXxx)
  services/             # Business logic & API calls
  theme/                # Design tokens, colors, theme provider
  types/                # TypeScript type definitions
  mocks/                # Mock data for development
  utils/                # Pure utility functions
  lib/                  # Third-party integrations (liquid glass)
```

### Module System

Contacts are discriminated by `module: 'investor' | 'landlord'`:

- **Investor module**: Motivated sellers, wholesalers, agents, title companies
- **Landlord module**: Tenants, contractors, applicants, property managers

Each module has distinct:
- Card layouts and info display
- Temperature scoring
- Call scripts and briefing templates
- Contact type-specific metadata (lease info, contractor info, deal info)

### Design System

- Theme tokens from Doughy (primary sage green `#4d7c5f`)
- 3-tier glass rendering: LiquidGlass (iOS 26+) → BlurView → opaque fallback
- Skeleton shimmer loading (never spinners)
- Haptic feedback on Send, Call, Approve, Cancel

## Cross-System Dependencies

**CallPilot depends on:**
- `crm.contacts` — Doughy writes these, CallPilot reads for contact list
- `crm.messages` — Server writes these (via Twilio), CallPilot displays
- `claw.draft_suggestions` — Server writes these (via Claude), CallPilot shows as suggestion cards
- Server API endpoints:
  - `POST /api/calls/pre-brief` — Pre-call briefing generation
  - `POST /api/calls/start` — Initiate AI-assisted call
  - `POST /api/calls/end` — End call and trigger summary
  - `GET /api/contacts/:id/history` — Full communication history
- Supabase Realtime subscriptions:
  - `callpilot.coaching_cards` — Live coaching hints during calls
  - `claw.draft_suggestions` — New AI draft messages

**CallPilot provides to others:**
- `callpilot.calls` — Call records read by Claw App and Server
- `callpilot.user_profiles` — Caller profile read by Server for AI generation
- `callpilot.script_templates` — Call scripts read by Server for call coaching
