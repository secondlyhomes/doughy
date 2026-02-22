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
- **CallPilot App**: reads `crm.*`, `investor.*`, `landlord.*`, `callpilot.*` | writes `callpilot.*`
- **The Claw App**: reads `claw.*`, `callpilot.calls` | writes `claw.trust_config`, `claw.connections`
- **Server**: reads/writes everything (via service_role key). Powers The Claw's intelligence.

## Data Flow for Key Operations

### Morning Briefing
Server reads `crm` + `investor` + `landlord` + `callpilot` → generates briefing via Claude → broadcasts to WhatsApp/Discord

### Draft Follow-up
Server reads lead data → Claude generates draft → stored in `claw.draft_suggestions` → pushed to CallPilot + Discord

### Incoming Message
Twilio webhook → Server routes (Claw command vs lead reply) → stores in `crm.messages` → CallPilot displays

### AI Call
Server → Bland API → call happens → Bland webhook → Server stores in `callpilot.calls` → broadcasts result

### Pre-Call Briefing
CallPilot → Server `/api/calls/pre-brief` → reads lead data → Claude generates → returns to CallPilot

### Trust Enforcement
Server checks `claw.trust_config` before every action → executes, queues, or requests approval based on trust level

### Kill Switch
User taps KILL ALL in The Claw → writes `claw.agent_profiles.is_active = false` for all agents → Server reads this before every action → all agents pause

### Vendor Dispatch
Maintenance request → Server matches contractor → drafts message → enforces trust → sends via Twilio

## The Claw App Architecture

### Screen Structure

```
app/
├── _layout.tsx         → ThemeProvider > AuthProvider > ConnectionProvider > Stack
├── index.tsx           → Auth redirect (onboarding or main)
├── (onboarding)/
│   ├── index.tsx       → Welcome screen
│   └── connect.tsx     → Sign in / demo mode
└── (main)/
    ├── index.tsx       → Control panel (THE screen)
    ├── connection-detail.tsx
    ├── per-action-overrides.tsx
    ├── activity-detail.tsx
    └── settings.tsx
```

### Provider Stack

```
ThemeProvider           → Light/dark/system theme
  AuthProvider          → Supabase auth state
    ConnectionProvider  → Gateway adapter (mock or supabase)
      Stack Navigator   → Screen routing
```

### Gateway Adapter Pattern

```
                 ┌──────────────────┐
                 │  GatewayAdapter  │  (interface)
                 │  interface       │
                 └────┬────────┬───┘
                      │        │
          ┌───────────▼┐  ┌───▼──────────┐
          │   Mock     │  │  Supabase    │
          │  Adapter   │  │  Adapter     │
          │ (in-memory)│  │ (real API)   │
          └────────────┘  └──────────────┘
```

Factory: `createGatewayAdapter('mock' | 'supabase')`

- Mock adapter: in-memory state, 300-800ms simulated delays, realistic seed data
- Supabase adapter: reads from Supabase tables, calls Claw server API

### Store + Hook Pattern

```
Zustand Store          → Raw state + actions (AsyncStorage persistence)
  └── useXxx Hook      → Wraps store + gateway adapter calls
       └── Component   → Uses hook, renders UI
```

Stores: `useTrustStore`, `useConnectionStore`, `useQueueStore`, `useActivityStore`, `useCostStore`, `useConsentStore`

### Trust Level System

```
LOCKED      → Read-only. Claw watches but never acts.
MANUAL      → Every action needs explicit approval.
GUARDED     → Actions execute after countdown (cancel window).
AUTONOMOUS  → Actions execute immediately (requires consent).
```

Each level changes the Queue section behavior and what the server is allowed to do.

### Realtime Subscriptions

- `claw.action_queue` → Live queue updates via Supabase Realtime (postgres_changes)
- Subscription activates only when using Supabase adapter (not mock)

## Cross-System Dependencies

### What The Claw App depends on:
- **Server** writes to: `claw.agent_runs`, `claw.approvals`, `claw.cost_log`, `claw.action_queue`, `claw.draft_suggestions`
- **Server** reads from: `claw.trust_config`, `claw.connections`, `claw.agent_profiles`

### What depends on The Claw App:
- **Server** checks `claw.trust_config` before every action (trust enforcement)
- **Server** checks `claw.agent_profiles.is_active` for kill switch status
- **Server** reads `claw.connections` permissions to know what it's allowed to do

### Design system:
- Doughy's design tokens are the source of truth
- The Claw copies Doughy's tokens with a slightly darker "control room" mood
- Primary: sage green (#4d7c5f), dark surface: #1a2332
- Glass blur intensity: Doughy's values + 5 for stronger glass effect
