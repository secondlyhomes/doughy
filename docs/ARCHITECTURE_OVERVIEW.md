# Doughy Architecture Overview

**Last Updated**: 2026-01-30
**Status**: Active Reference

This document provides a high-level overview of the doughy-ai system architecture for developers and AI assistants.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Directory Structure](#directory-structure)
3. [Data Flow](#data-flow)
4. [Key Patterns](#key-patterns)
5. [Platform Architecture](#platform-architecture)
6. [Database Architecture](#database-architecture)
7. [Edge Function Architecture](#edge-function-architecture)
8. [State Management](#state-management)

---

## System Overview

Doughy is a multi-platform mobile/web application built with:

- **Frontend**: React Native + Expo (iOS, Android, Web)
- **Navigation**: Expo Router (file-based routing)
- **State**: Zustand with persist middleware
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **AI**: OpenAI GPT-4 + Anthropic Claude

### Two Platforms, One Codebase

| Platform | Target User | Key Features |
|----------|-------------|--------------|
| **RE Investor** | Real estate investors | Leads, Deals, Properties, Portfolio |
| **Landlord** | Property managers | Inbox, Bookings, Contacts, Smart Home |

Users select their platform during onboarding and can switch via the header toggle.

---

## Directory Structure

```
doughy-ai/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── dashboard/            # Dashboard screens
│   │   ├── deals/                # RE Investor: Deal screens
│   │   ├── leads/                # RE Investor: Lead screens
│   │   ├── portfolio/            # RE Investor: Portfolio screens
│   │   ├── investor-inbox/       # RE Investor: Conversation inbox
│   │   ├── landlord-inbox/       # Landlord: Guest inbox
│   │   ├── rental-properties/    # Landlord: Property screens
│   │   ├── bookings/             # Landlord: Booking screens
│   │   └── contacts/             # Landlord: Contact screens
│   ├── (admin)/                  # Admin screens
│   └── _layout.tsx               # Root layout
│
├── src/
│   ├── components/
│   │   └── ui/                   # Shared UI primitives (Button, Card, etc.)
│   │
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── PlatformContext.tsx   # Platform switching
│   │   └── ThemeContext.tsx      # Theme/appearance
│   │
│   ├── features/                 # Feature modules (self-contained)
│   │   └── <feature>/
│   │       ├── components/       # Feature-specific components
│   │       ├── hooks/            # Feature-specific hooks
│   │       ├── screens/          # Feature screens (used by app/)
│   │       ├── services/         # Feature business logic
│   │       └── types/            # Feature types
│   │
│   ├── hooks/                    # Shared hooks
│   ├── lib/                      # Utilities & external integrations
│   │   ├── supabase.ts           # Supabase client
│   │   ├── openai.ts             # OpenAI client
│   │   └── design-utils.ts       # Design system utilities
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── index.ts              # Store exports
│   │   ├── app-store.ts          # Global app state
│   │   ├── rental-conversations-store.ts
│   │   └── investor-conversations-store.ts
│   │
│   └── types/                    # Shared types
│       ├── index.ts              # Type exports
│       └── supabase.ts           # Generated Supabase types
│
├── supabase/
│   ├── functions/                # Edge functions
│   │   ├── _shared/              # Shared edge function modules
│   │   ├── ai-responder/         # AI response generation
│   │   ├── integration-health/   # API health checks
│   │   └── resend-email/         # Email sending
│   └── migrations/               # Database migrations
│
└── docs/                         # Documentation
```

---

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Screen    │────▶│    Hook     │────▶│   Store     │
│ (app/*.tsx) │     │ (useDeals)  │     │ (Zustand)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Supabase   │◀───▶│ AsyncStorage│
                    │  (Remote)   │     │  (Local)    │
                    └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Edge Func   │
                    │ (AI, Email) │
                    └─────────────┘
```

### Request Flow

1. **Screens** render UI and call hooks for data
2. **Hooks** orchestrate data fetching/mutations via stores or Supabase
3. **Stores** (Zustand) manage client state with persistence to AsyncStorage
4. **Supabase** provides PostgreSQL database with Row-Level Security
5. **Edge Functions** handle server-side logic (AI, emails, integrations)
6. **Realtime** subscriptions push updates back to stores

---

## Key Patterns

### 1. Feature Isolation

Each feature is self-contained with its own components, hooks, screens, and types.

```typescript
// Good: Import from feature
import { LeadCard } from '@/features/leads/components';
import { useLeads } from '@/features/leads/hooks';

// Avoid: Cross-feature imports
import { validateLead } from '@/features/deals/utils'; // Bad
```

### 2. Store Selectors

Always use selectors to access store state, not direct state access.

```typescript
// Good: Use selectors
const leads = useLeadsStore(selectLeads);
const isLoading = useLeadsStore(selectIsLoading);

// Avoid: Direct state access
const { leads, isLoading } = useLeadsStore(); // Causes unnecessary re-renders
```

### 3. Domain-Prefixed Types

Types that exist in multiple domains use prefixes to prevent collisions.

```typescript
// Investor domain
interface InvestorLead { }
interface InvestorProperty { }

// Landlord domain
interface LandlordConversation { }
interface LandlordBooking { }
```

### 4. Collocated Tests

Tests live next to the code they test.

```
features/deals/hooks/
├── useDeals.ts
├── useDeals.test.ts
└── __tests__/
    └── integration.test.ts
```

### 5. Error Boundaries

Each major screen section has error boundaries for graceful failure.

```typescript
<ErrorBoundary fallback={<DealsSectionError />}>
  <DealsSection />
</ErrorBoundary>
```

---

## Platform Architecture

### Platform Context

```typescript
// src/contexts/PlatformContext.tsx
interface PlatformContextType {
  activePlatform: 'investor' | 'landlord';
  switchPlatform: (platform: 'investor' | 'landlord') => void;
  availablePlatforms: Platform[];
}
```

### Conditional Navigation

The tab bar shows different tabs based on active platform:

```
RE Investor:  Dashboard | Leads | Deals | Portfolio | Settings
Landlord:     Dashboard | Inbox | Properties | Bookings | Settings
```

### Shared vs Platform-Specific

| Type | Location | Example |
|------|----------|---------|
| **Shared components** | `src/components/ui/` | Button, Card, Modal |
| **Shared hooks** | `src/hooks/` | useAuth, useTheme |
| **Platform features** | `src/features/<platform>/` | deals, rental-properties |

---

## Database Architecture

### Table Naming

| Platform | Prefix | Example Tables |
|----------|--------|----------------|
| **RE Investor** | `re_*`, `crm_*` | `re_properties`, `crm_leads` |
| **Landlord** | `rental_*` | `rental_properties`, `rental_bookings` |
| **Shared** | No prefix | `users`, `workspaces`, `documents` |

### Row-Level Security (RLS)

All tables have RLS policies that restrict access to:
- User's own data (personal accounts)
- Workspace data (team accounts)

```sql
-- Example RLS policy
CREATE POLICY "Users can view own leads"
ON crm_leads
FOR SELECT
USING (user_id = auth.uid());
```

### Key Tables

```
Users & Workspaces
├── users                    # User profiles
├── workspaces               # Team workspaces
└── workspace_members        # Workspace membership

RE Investor
├── crm_leads                # Lead contacts
├── re_properties            # Properties
├── deals                    # Active deals
└── portfolio_properties     # Owned properties

Landlord
├── crm_contacts             # Guest contacts (shared)
├── rental_properties        # Rental properties
├── rental_rooms             # Individual rooms
├── rental_bookings          # Reservations
├── rental_conversations     # Message threads
└── rental_messages          # Individual messages
```

---

## Edge Function Architecture

### Shared Modules

Edge functions share common code in `supabase/functions/_shared/`:

```
_shared/
├── cors.ts              # CORS headers
├── security.ts          # Auth validation
├── crypto-server.ts     # Encryption
├── email/               # Email utilities
│   ├── templates.ts
│   └── resend-client.ts
├── ai/                  # AI utilities
│   ├── openai-client.ts
│   └── topic-detector.ts
└── health-checks/       # Integration health
    ├── openai.ts
    └── stripe.ts
```

### Key Edge Functions

| Function | Purpose | Triggers |
|----------|---------|----------|
| `ai-responder` | Generate AI responses | Webhook, manual |
| `integration-health` | Check API health | Cron, manual |
| `resend-email` | Send transactional email | Webhook |
| `drip-touch-executor` | Execute drip campaigns | Cron |
| `platform-email-parser` | Parse incoming emails | Webhook |

---

## State Management

### Zustand Store Pattern

```typescript
// src/stores/leads-store.ts
interface LeadsState {
  leads: Lead[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchLeads: () => Promise<void>;
  createLead: (lead: LeadInput) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
}

// Selectors
export const selectLeads = (state: LeadsState) => state.leads;
export const selectIsLoading = (state: LeadsState) => state.isLoading;
export const selectLeadById = (id: string) => (state: LeadsState) =>
  state.leads.find(l => l.id === id);
```

### Persistence

Stores use Zustand's persist middleware with AsyncStorage:

```typescript
export const useLeadsStore = create<LeadsState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'leads-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Realtime Subscriptions

Stores subscribe to Supabase Realtime for live updates:

```typescript
// Subscribe to changes
const channel = supabase
  .channel('leads-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'crm_leads' },
    (payload) => {
      // Update store based on change type
    }
  )
  .subscribe();
```

---

## Quick Reference

### Common Operations

| Task | Location | Example |
|------|----------|---------|
| Add a new screen | `app/(tabs)/<route>/` | `app/(tabs)/deals/new.tsx` |
| Add a component | `src/features/<feature>/components/` | `LeadCard.tsx` |
| Add a hook | `src/features/<feature>/hooks/` | `useLeadQueries.ts` |
| Add a store | `src/stores/` | `leads-store.ts` |
| Add an edge function | `supabase/functions/` | `new-function/index.ts` |
| Add a migration | `supabase/migrations/` | `20260130_add_column.sql` |

### Key Files to Understand

| File | Purpose |
|------|---------|
| `app/(tabs)/_layout.tsx` | Main navigation configuration |
| `src/contexts/AuthContext.tsx` | Authentication flow |
| `src/contexts/PlatformContext.tsx` | Platform switching |
| `src/lib/supabase.ts` | Database client |
| `src/stores/index.ts` | All Zustand stores |

---

## Related Documentation

- [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) - Getting started
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Code standards
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database details
- [RLS_SECURITY_MODEL.md](./RLS_SECURITY_MODEL.md) - Security policies
