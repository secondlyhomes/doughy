# CallPilot

Communication companion for real estate professionals. CallPilot reads contact data from a connected CRM (Doughy), coaches users during phone calls with AI-generated briefings and live prompts, and manages SMS/email messaging with AI-drafted reply suggestions powered by The Claw.

## Ecosystem

CallPilot is one of four pieces in the Secondly Homes platform:

| Piece | Role |
|-------|------|
| **Doughy** (Expo) | CRM and data source of truth. Manages leads, contacts, deals, properties, tenants, maintenance. |
| **CallPilot** (Expo) | Communication companion. Reads from CRM, coaches calls, manages messaging. You are here. |
| **The Claw App** (Expo) | Control panel for the AI system. Trust levels, permissions, activity monitoring, kill switches. |
| **Server** (Express on DO) | The Claw's brain. Powers all three apps. Handles AI generation, call orchestration, message routing. |

All four apps share a single Supabase instance with schema-based isolation.

## Tech Stack

- **Framework:** React Native (Expo 54+) with Expo Router
- **Language:** TypeScript (strict mode, `exactOptionalPropertyTypes`)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **UI:** iOS-first with Liquid Glass effects (`@callstack/liquid-glass`)
- **Animation:** `react-native-reanimated` for shimmer/skeleton loading
- **Haptics:** `expo-haptics` on key actions
- **State:** React hooks + mock data layer (Supabase integration in progress)

## How to Run Locally

```bash
# 1. Clone and install
git clone <repo-url>
cd callpilot
npm install

# 2. Create .env with your Supabase credentials (see Environment Variables below)
cp .env.example .env  # or create manually

# 3. Start Expo dev server
npx expo start

# 4. Run on iOS simulator or device
# Press 'i' in terminal, or scan QR code with Expo Go
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `EXPO_PUBLIC_DEV_EMAIL` | Dev auto-login email (dev only) |
| `EXPO_PUBLIC_DEV_PASSWORD` | Dev auto-login password (dev only) |

CallPilot does NOT need server-side keys (service_role, Twilio, Bland, Anthropic) — those live on the Server.

## Database Schemas

CallPilot reads from and writes to these Supabase schemas:

| Schema | Access | Tables |
|--------|--------|--------|
| `crm` | Read | `contacts`, `messages` |
| `investor` | Read | `deals_pipeline`, `properties`, `follow_ups` |
| `landlord` | Read | `bookings`, `maintenance_requests`, `vendor_jobs` |
| `claw` | Read | `draft_suggestions` |
| `callpilot` | Read/Write | `calls`, `call_summaries`, `coaching_cards`, `user_profiles`, `script_templates`, `question_tracking`, `action_items`, `suggested_updates` |
| `auth` | Read | `users` |

## Screen Inventory

### Tab Screens (3 tabs)
| Screen | File | Description |
|--------|------|-------------|
| Contacts | `app/(tabs)/index.tsx` | Module-filtered contact list with temperature grouping |
| Messages | `app/(tabs)/messages.tsx` | iMessage-style conversation inbox with module filter |
| Settings | `app/(tabs)/settings.tsx` | Profile, CRM, scripts, Claw, calling, notifications, theme |

### Detail Screens
| Screen | File | Description |
|--------|------|-------------|
| Contact Detail | `app/contact/[id].tsx` | Full profile with module info, quick actions, call history |
| Conversation Thread | `app/messages/[contactId].tsx` | Message thread with Claw suggestion cards |
| Pre-Call Briefing | `app/pre-call/[contactId].tsx` | AI-generated call prep with rapport builders |
| Active Call | `app/active-call/[contactId].tsx` | Live call coaching (stub) |
| Call Summary | `app/call-summary/[callId].tsx` | Post-call AI summary with action items |
| Record Memo | `app/record-memo/[callId].tsx` | Voice memo recording (stub) |

### Settings Screens
| Screen | File | Description |
|--------|------|-------------|
| Profile Edit | `app/settings/profile-edit.tsx` | Edit user profile |
| Script Templates | `app/settings/scripts.tsx` | Manage call scripts |
| AI Profile | `app/settings/ai-profile.tsx` | AI persona configuration |
| Questionnaire | `app/settings/questionnaire.tsx` | Call questionnaire setup |

### Onboarding
| Screen | File | Description |
|--------|------|-------------|
| Welcome | `app/onboarding/welcome.tsx` | First-time welcome |
| Profile Setup | `app/onboarding/profile-setup.tsx` | Initial profile creation |
| Connect CRM | `app/onboarding/connect-crm.tsx` | CRM connection flow |
| First Call | `app/onboarding/first-call.tsx` | First call walkthrough |

## Deployment

```bash
# Pre-deploy checks
npm run pre-deploy:check

# Build for iOS
npx eas build --platform ios

# Submit to App Store
npx eas submit --platform ios
```

See `docs/13-lifecycle/PRODUCTION-OPERATIONS.md` for full deployment guide.
