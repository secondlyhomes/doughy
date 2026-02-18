# Doughy App Mobile

iOS-first CRM and property management platform for real estate investors and landlords. Built with Expo 54, React Native, and Supabase. Doughy is the **source of truth** for all data in the ecosystem — contacts, leads, deals, properties, bookings, and maintenance all live here.

## Ecosystem

```
┌─────────────────────────────────────────────────────┐
│                    SUPABASE                          │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐│
│  │  auth.*  │ │  crm.*  │ │investor.*│ │landlord.*││
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘│
│  ┌──────────┐ ┌───────────┐ ┌──────┐ ┌────────┐   │
│  │  claw.*  │ │callpilot.*│ │ ai.* │ │integr.*│   │
│  └──────────┘ └───────────┘ └──────┘ └────────┘   │
└───────┬──────────┬──────────┬──────────┬───────────┘
        │          │          │          │
   ┌────▼────┐ ┌───▼───┐ ┌───▼────┐ ┌───▼─────┐
   │ Doughy  │ │CallPlt│ │The Claw│ │ Server  │
   │  App    │ │  App  │ │  App   │ │(Express)│
   │(Expo)   │ │(Expo) │ │(Expo)  │ │  on DO  │
   └─────────┘ └───────┘ └────────┘ └─────────┘
```

| App | Role | Repo |
|-----|------|------|
| **Doughy** (this repo) | CRM + data source of truth | `doughy-app-mobile` |
| **CallPilot** | Communication companion, call coaching | `callpilot` |
| **The Claw** | AI agent control panel (trust, permissions, activity) | `the-claw-app` |
| **OpenClaw Server** | The Claw's brain — Express backend powering all 3 apps | `doughy-app-mobile/openclaw-server/` |

## Tech Stack

- **Framework:** Expo 54 + React Native
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL, 8 schemas, 170 tables)
- **State:** Zustand (client) + React Query (server)
- **Styling:** NativeWind (Tailwind) + design tokens + liquid glass (iOS 26)
- **Navigation:** Expo Router (file-based routing)
- **Auth:** Supabase Auth with RLS
- **AI:** OpenClaw server (Anthropic Claude)

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env  # Then fill in values

# 3. Start Expo dev server
npx expo start

# 4. Run on iOS simulator
npx expo run:ios
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side) |
| `EXPO_PUBLIC_USE_MOCK_DATA` | Enable mock data mode (no Supabase needed) |
| `EXPO_PUBLIC_DEV_EMAIL` | Auto-fill dev login email |
| `EXPO_PUBLIC_DEV_PASSWORD` | Auto-fill dev login password |

The OpenClaw server (`openclaw-server/`) has its own `.env` with additional vars — see `openclaw-server/CLAUDE.md`.

## Database Schemas

| Schema | Tables | Description |
|--------|--------|-------------|
| `public` | 57 | System tables, user profiles, comms, billing, security |
| `investor` | 34 | Deals, properties, campaigns, portfolio, agents, documents |
| `landlord` | 19 | Properties, rooms, bookings, maintenance, vendors |
| `ai` | 25 | AI jobs, sessions, OpenClaw memory/knowledge |
| `claw` | 12 | Agent profiles, tasks, approvals, messages, cost tracking |
| `callpilot` | 10 | Calls, transcripts, coaching cards, summaries |
| `crm` | 5 | Contacts, leads, opt-outs, skip trace, touches |
| `integrations` | 9 | Gmail, Seam, Meta DM, PostGrid |

## Screen Inventory

### Investor Mode (4 tabs)
- **Inbox** — Unified notification center
- **Pipeline** — Leads, Deals, Portfolio (tabbed view with segment control)
- **Contacts** — CRM contacts list with search and filters
- **Settings** — Profile, security, preferences, integrations

### Landlord Mode (4 tabs)
- **Inbox** — Rental inquiries and notifications
- **Properties** — Property list with needs-attention header, hub grid (Maintenance, Vendors, Turnovers, Bookings, Inventory, Smart Home)
- **Contacts** — Shared contacts view
- **Settings** — Same as investor with landlord-specific sections

### Shared Screens
- Auth (login, signup, forgot password, MFA)
- Property detail, Deal cockpit, Lead detail, Contact detail
- Admin dashboard (admin users only)
- Campaign builder, Portfolio management
- VoIP calling (in-call, post-call summary)

## Deployment

Doughy is an Expo app — not deployed to a server. It runs on iOS devices via TestFlight or the Expo development build.

```bash
# Build for iOS
npx expo run:ios --configuration Release

# Or use EAS Build
eas build --platform ios
```

## Cross-System Dependencies

- **Doughy is the source of truth** for CRM data (crm.*, investor.*, landlord.*)
- CallPilot reads Doughy's data for pre-call briefings and contact info
- The Server reads Doughy's data for AI briefings, draft follow-ups, and agent actions
- Doughy reads from `claw.tasks` to show AI-created tasks
- Doughy's design system (tokens, colors, components) is the source of truth — CallPilot and The Claw copy from it

## Docs

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | AI assistant context (read this first) |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/SCHEMA_MAP.md` | Database schema reference |
| `docs/DECISIONS.md` | Architectural decisions log |
| `docs/ROADMAP.md` | Feature roadmap |
| `docs/DESIGN_SYSTEM.md` | Design system reference |
