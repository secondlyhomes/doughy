# The Claw App

The Claw is a mobile control panel for an AI agent system that manages real estate operations. It gives users visibility and control over what their AI agents are doing across Doughy (CRM), Bland AI (phone calls), WhatsApp, Discord, SMS, and other connected services. Users set trust levels (locked/manual/guarded/autonomous), review queued actions, manage per-service permissions, monitor costs, and can kill all agents instantly with one tap.

## Ecosystem

The Claw App is one of four interconnected pieces:

| Piece | Role | Repo |
|-------|------|------|
| **Doughy** | CRM and data source of truth. Real estate investor + landlord modules. | `doughy-ai` |
| **CallPilot** | Communication companion. Reads from CRM, coaches calls, manages messaging. | `callpilot-app` |
| **The Claw App** | Control panel for the AI system. Trust levels, permissions, activity, cost. | `the-claw-app` (this repo) |
| **Server** | The Claw's brain. Express backend. Powers all three apps. | `openclaw-server` |

## Tech Stack

- **Framework:** React Native with Expo SDK 54+
- **Language:** TypeScript (strict mode)
- **Backend:** Supabase (auth, database, Realtime)
- **State:** Zustand + AsyncStorage persistence
- **Navigation:** Expo Router (file-based)
- **Design:** iOS 26 Liquid Glass (via `expo-glass-effect`), Doughy design tokens
- **Platform:** iOS-first (Android supported)

## How to Run

```bash
# 1. Clone and install
git clone <repo-url> && cd the-claw-app
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials

# 3. Start Expo dev server
npx expo start

# 4. Run on iOS simulator or physical device
# Press 'i' for iOS simulator, or scan QR with Expo Go
```

### Supabase Setup

```bash
# If running Supabase locally:
supabase start
supabase db push   # Apply migrations

# Generate TypeScript types after schema changes:
supabase gen types typescript --local > src/types/database.ts
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `EXPO_PUBLIC_CLAW_API_URL` | The Claw server API base URL (e.g., `https://openclaw.doughy.app/api/claw`) |

The Claw App is a **client-only** app. It does NOT use service_role keys, Twilio, Bland, Deepgram, or Anthropic API keys directly. Those live on the server.

## Database Schemas

The Claw App reads and writes to the `claw` schema in Supabase:

| Table | Read/Write | Purpose |
|-------|-----------|---------|
| `claw.trust_config` | R/W | Trust level, countdown, limits, overrides |
| `claw.connections` | R/W | Connected services and permissions |
| `claw.action_queue` | R (+ cancel) | Pending/countdown queue items (Realtime) |
| `claw.cost_log` | R | Monthly cost aggregation |

Also reads:
- `callpilot.calls` — to show call activity in the activity log

## Screen Inventory

| Screen | File | Description |
|--------|------|-------------|
| Control Panel | `app/(main)/index.tsx` | THE single screen. Pinned header + Queue + Connections + Activity + Cost |
| Connection Detail | `app/(main)/connection-detail.tsx` | Service-specific permissions (Doughy modules, Bland settings, channel delivery) |
| Per-Action Overrides | `app/(main)/per-action-overrides.tsx` | Override trust level per action type |
| Activity Detail | `app/(main)/activity-detail.tsx` | Full audit trail for a single action |
| Settings | `app/(main)/settings.tsx` | Theme, queue settings, cost limits, about, sign out |
| Welcome | `app/(onboarding)/index.tsx` | Animated welcome with feature highlights |
| Connect | `app/(onboarding)/connect.tsx` | Sign in with email/password or try demo mode |

## Verification

```bash
npx tsc --noEmit   # TypeScript check (primary verification)
npm test           # Unit tests (jest-expo preset needed)
```

## Deployment

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

See `docs/11-deployment/` for full CI/CD and build practices.
