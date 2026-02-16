# Doughy Developer Quickstart

Quick reference for developers working on the multi-platform refactor.

## Overview

Doughy has two platforms:
- **RE Investor** (existing): Focus, Leads, Deals, Portfolio
- **Landlord** (new): Inbox, Properties, Rooms, Bookings, Contacts

Both coexist in the same app. Users select platforms during onboarding and switch via header toggle.

---

## Environment Setup

```bash
# Clone and install
git clone <repo>
cd doughy-app-mobile
npm install

# Start dev server
npx expo start

# Run on iOS simulator
npx expo run:ios
```

### Required Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Zone Reference

### Zone 2: Database (Start First)

**Purpose**: Create new Landlord tables while preserving existing RE Investor tables.

**Key Files to Create**:
```
supabase/migrations/
├── YYYYMMDD_rental_core_tables.sql          # rental_properties, rental_rooms, rental_bookings
├── YYYYMMDD_rental_communication_tables.sql # rental_conversations, rental_messages, rental_ai_queue
├── YYYYMMDD_rental_functions_triggers.sql   # Availability check, booking triggers
├── YYYYMMDD_rental_rls_policies.sql         # Row-level security
└── YYYYMMDD_user_platform_settings.sql      # Platform selection

src/types/rental-database.ts                 # TypeScript types for new tables
```

**Table Naming Convention** (per DATABASE_NAMING_CONVENTIONS.md):
| Platform | People | Properties | Domain Prefix |
|----------|--------|------------|---------------|
| RE Investor | `crm_leads` | `re_properties` | `re_*` |
| Landlord | `crm_contacts` (reuse) | `rental_properties` | `rental_*` |

**Existing Tables (DO NOT MODIFY)**:
- `crm_leads`, `crm_contacts`, `re_properties`, `deals`, `re_documents`

**New Tables to Create** (all use `rental_*` prefix):
- `rental_properties` - Properties with `rental_type` column ('str', 'mtr', 'ltr')
- `rental_rooms` - Individual rooms for room-by-room rentals
- `rental_bookings` - Reservations/leases with `booking_type` column
- `rental_conversations` - Message threads with contacts
- `rental_messages` - Individual messages
- `rental_ai_queue` - Pending AI responses for human review
- `rental_templates` - Response templates
- `rental_integrations` - External platform connections (Airbnb, FurnishedFinder, etc.)

---

### Zone 1: Core / Moltbot

**Purpose**: Build AI communication layer via Moltbot skills and Edge Functions.

**Prerequisites**: Moltbot infrastructure must be set up on DigitalOcean first.

**Key Files to Create**:
```
supabase/functions/
├── moltbot-bridge/index.ts      # Bridge between Moltbot and Supabase
├── ai-responder/index.ts        # Generate AI responses
├── lead-scorer/index.ts         # Score contacts
├── availability-check/index.ts  # Check property/room availability
└── notification-push/index.ts   # Send push notifications

~/clawd/skills/
├── doughy-core/SKILL.md         # Database operations
├── doughy-platform/SKILL.md     # Email parsing
├── doughy-lead/SKILL.md         # Lead qualification
├── doughy-guest/SKILL.md        # Guest communication
├── doughy-room/SKILL.md         # Room management
└── doughy-booking/SKILL.md      # Booking lifecycle
```

---

### Zone 3: UI/UX

**Purpose**: Build platform switching and Landlord screens.

**Key Files to Create/Modify**:
```
src/contexts/PlatformContext.tsx           # Platform state management

app/(tabs)/_layout.tsx                     # Conditional tab rendering

# Landlord Screens
app/(tabs)/inbox/
├── index.tsx                              # Inbox list
├── [conversationId].tsx                   # Conversation detail
└── components/

app/(tabs)/rental-properties/
├── index.tsx                              # Property list
├── [propertyId]/index.tsx                 # Property detail
└── components/

app/(tabs)/bookings/
├── index.tsx                              # Bookings + calendar
└── components/

app/(tabs)/contacts/
├── index.tsx                              # Contact list
└── components/

# Zustand Stores
src/stores/
├── rental-properties-store.ts
├── rental-rooms-store.ts
├── rental-bookings-store.ts
├── rental-conversations-store.ts
└── rental-ai-queue-store.ts
```

**Platform Context Usage**:
```typescript
import { usePlatform } from '@/contexts/PlatformContext';

const MyComponent = () => {
  const { activePlatform, switchPlatform } = usePlatform();

  if (activePlatform === 'investor') {
    // Show RE Investor UI
  } else {
    // Show Landlord UI (activePlatform === 'landlord')
  }
};
```

**Tab Structures**:
```
RE Investor:  Focus | Leads | Deals | Portfolio | Settings
Landlord:     Inbox | Properties | Bookings | Contacts | Settings
```

---

### Zone 4: Testing

**Purpose**: Unit tests, integration tests, E2E tests.

**Key Files to Create**:
```
__tests__/
├── database/
│   ├── rental-tables.test.ts     # Schema validation
│   └── rls-policies.test.ts      # Security tests
├── components/
│   ├── inbox/
│   └── platform-switcher.test.tsx
└── integration/
    ├── booking-flow.test.ts      # Full booking flow
    ├── ai-approval.test.ts       # AI response approval
    └── platform-switch.test.ts   # Platform toggling
```

---

## Interface Contracts

### Database Types (Zone 2 produces, all zones consume)

```typescript
// src/types/rental-database.ts
export interface RentalProperty { ... }      // rental_properties table
export interface RentalRoom { ... }          // rental_rooms table
export interface RentalBooking { ... }       // rental_bookings table
export interface RentalConversation { ... }  // rental_conversations table
export interface RentalMessage { ... }       // rental_messages table
export interface RentalAIQueue { ... }       // rental_ai_queue table
export interface RentalIntegration { ... }   // rental_integrations table

// Reused from existing types (crm_contacts)
export { Contact } from './crm-database';
```

### API Endpoints (Zone 1 implements, Zone 3 calls)

```
POST /moltbot-bridge     → Moltbot skills call this
POST /ai-responder       → Generate AI response
POST /lead-scorer        → Score a contact
GET  /availability-check → Check property/room availability
POST /notification-push  → Send push to owner
```

---

## PR Checklist

Before submitting a PR:

- [ ] All new tables follow naming convention (`rental_*` prefix for Landlord platform)
- [ ] RLS policies added for new tables
- [ ] TypeScript types updated in `src/types/rental-database.ts`
- [ ] Tests written for new functionality
- [ ] Platform context used correctly (not hardcoded platform checks)
- [ ] No breaking changes to existing RE Investor features
- [ ] Naming follows `DATABASE_NAMING_CONVENTIONS.md` patterns

---

## Quick Links

- Full architecture: `docs/doughy-architecture-refactor.md`
- Executive summary: `docs/doughy-refactor-executive-summary.md`
- Naming conventions: `docs/DATABASE_NAMING_CONVENTIONS.md`
- DBA review response: `DBA_FINAL_REVIEW_RESPONSE.md`
- Existing schema: `supabase/migrations/20260112_create_core_tables.sql`
