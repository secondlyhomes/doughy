# DOUGHY REFACTOR: EXECUTIVE SUMMARY
## How 4 Parallel Development Zones Converge Into One Seamless Product

---

## 🎯 THE VISION

Transform Doughy from a single-purpose RE investor tool into a **multi-platform product** with two "umbrellas":

1. **RE Investor Platform** (existing) - Leads, Deals, Portfolio, Focus/Capture
2. **Landlord Platform** (new) - Inbox, Properties, Rooms, Bookings, AI Communications

Users select their platform(s) during onboarding and can toggle between them via a header switcher.

```
TODAY                              AFTER REFACTOR
─────                              ──────────────

📱 Doughy App                      📱 Doughy App
│                                  │
├─ Focus                           ├─ [Platform Switcher in Header]
├─ Leads                           │
├─ Deals                           │   RE INVESTOR MODE          LANDLORD MODE
└─ Portfolio                       │   (existing)                (new)
                                   │   ├─ Focus                  ├─ 📥 Inbox
                                   │   ├─ Leads                  │    └─ WhatsApp, Email, SMS
                                   │   ├─ Deals                  │    └─ AI responses + approval
                                   │   └─ Portfolio              ├─ 🏠 Properties
                                   │                             │    └─ Room-by-room support
                                   │                             ├─ 📅 Bookings
                                   │                             │    └─ Calendar + revenue
                                   │                             └─ 👥 Contacts
                                   │                                  └─ Unified + scored
                                   │
                                   └─ ⚙️ Settings (shared)
                                        └─ Platform management
                                        └─ AI rules & thresholds
                                        └─ Channel connections
```

### Key Distinction: RE Investor vs Landlord

| Concept | RE Investor Platform | Landlord Platform |
|---------|---------------------|----------------------|
| Properties | `re_properties` (deal research) | `rental_properties` (rental listings) |
| People | `crm_leads` (prospects to buy from) | `crm_contacts` (guests/tenants) |
| Focus | Finding deals, underwriting | Managing bookings, guest comms |
| AI Role | None currently | Auto-respond, qualify leads |

---

## 🔧 PLATFORM SELECTION UX

### Onboarding Choice
During signup, users see: "What best describes you?"
- **RE Investor** - Finding and analyzing real estate deals
- **Landlord** - Managing medium-term rentals and guests
- **Both** - Full access to both platforms

Selection is stored in `user_platform_settings` table.

### Header Platform Switcher
- Small toggle in header (similar to Airbnb host mode)
- Only visible if user has multiple platforms enabled
- Persists selection in user settings

---

## 🚀 INFRASTRUCTURE PREREQUISITE: Moltbot Setup

**Moltbot does NOT exist yet.** Before Zone 1 (Core) can begin, we need:

1. **DigitalOcean Droplet** ($6-12/mo)
   - Node.js environment
   - Gmail Pub/Sub webhook handler
   - WhatsApp Business API integration

2. **Moltbot Skills** (created in Zone 1)
   - `doughy-core` - Database operations
   - `doughy-platform` - Email parsing (FurnishedFinder, Airbnb, etc.)
   - `doughy-lead` - Lead qualification & scoring
   - `doughy-guest` - Guest communication handling
   - `doughy-room` - Room-by-room management
   - `doughy-booking` - Booking lifecycle

3. **Supabase Edge Functions** (created in Zone 1)
   - `/moltbot-bridge` - Bridge between Moltbot and Supabase
   - `/ai-responder` - Generate AI responses
   - `/lead-scorer` - Score leads/contacts
   - `/availability-check` - Check property/room availability

---

## 🧩 THE 5 ZONES

Each zone can be developed **independently** by a separate Claude instance or developer.
They connect through **defined interfaces** (types, API contracts, component props).

```
Zone 2 (Database)     ← Foundation layer, starts first
    ↓
Zone 1 (Core/Moltbot) ← Uses Zone 2 types
    ↓
Zone 3 (UI/UX)        ← Uses Zone 2 types + Zone 1 APIs
    ↓
Zone 4 (Testing)      ← Tests all zones
    ↓
Zone 5 (Integration)  ← Merges, optimizes, deploys
```

### Zone Details

| Zone | What It Builds | Key Outputs |
|------|----------------|-------------|
| **Zone 2: Database** | Schema, migrations, types, RLS | `rental_properties`, `rental_rooms`, `rental_bookings`, `rental_conversations`, `rental_messages`, `rental_ai_queue`, `user_platform_settings` (reuses `crm_contacts`) |
| **Zone 1: Core** | Moltbot skills, Edge Functions | Skills, `/moltbot-bridge`, `/ai-responder`, `/availability-check` |
| **Zone 3: UI/UX** | Screens, components, platform switching | `PlatformContext`, conditional tab layout, Landlord screens |
| **Zone 4: Testing** | Unit, integration, E2E tests | Platform switching tests, booking flow tests |
| **Zone 5: Integration** | Merge, optimize, deploy | Final polished system |

### Key Zone 3 Detail: Tab Structure

```
RE Investor Mode:     Focus | Leads | Deals | Portfolio | Settings
Landlord Mode:    Inbox | Properties | Bookings | Contacts | Settings
```

The `_layout.tsx` uses `usePlatform()` context to conditionally render tabs.

---

## 🔗 THE INTERFACES (How Zones Connect)

### Interface A: Database Types → Everyone

Zone 2 produces TypeScript types. All zones import them.

```typescript
// /src/types/database.ts (Zone 2 creates)
// Table names use domain prefixes per DATABASE_NAMING_CONVENTIONS.md

export interface Contact { ... }           // Maps to: crm_contacts
export interface RentalProperty { ... }    // Maps to: rental_properties
export interface Room { ... }              // Maps to: rental_rooms
export interface Booking { ... }           // Maps to: rental_bookings
export interface Conversation { ... }      // Maps to: rental_conversations
export interface Message { ... }           // Maps to: rental_messages
export interface RentalAIQueue { ... }     // Maps to: rental_ai_queue
```

### Interface B: API Endpoints → UI

Zone 1 implements Edge Functions. Zone 3 calls them.

```
POST /moltbot-bridge     → Moltbot skills call this
POST /ai-responder       → Generate AI response
POST /lead-scorer        → Score a lead
GET  /availability-check → Check property/room availability
POST /notification-push  → Send push to owner
```

### Interface C: Component Props → UI

Zone 3 uses standardized props for all components.

```typescript
// Every component has typed props
interface ConversationCardProps {
  conversation: Conversation;
  contact: Contact;
  lastMessage: Message;
  onPress: () => void;
}
```

---

## 📱 THE END RESULT: How The UI Looks When Complete

### Inbox Tab (The Star)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  📥 INBOX                                    🔍  ⚙️    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🔴 NEEDS YOUR REVIEW                              │ │
│  │                                                   │ │
│  │  👤 Sarah J.        📧 FurnishedFinder      2m   │ │
│  │  "I'm a travel nurse looking for..."             │ │
│  │  🤖 AI Ready (85%)              [✓ Approve]      │ │
│  │                                                   │ │
│  │  👤 Mike C.         💬 WhatsApp           15m   │ │
│  │  "What's the WiFi password?"                     │ │
│  │  🤖 AI Ready (95%)              [✓ Approve]      │ │
│  │                                                   │ │
│  │  ⚠️ Rachel K.       🏠 Airbnb              1h   │ │
│  │  ESCALATED: Refund request                       │ │
│  │                              [View & Respond]    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ✅ AI HANDLED TODAY (12)                          │ │
│  │                                                   │ │
│  │  👤 James W.        📱 SMS               10m    │ │
│  │  ✓ Sent: Check-in instructions                   │ │
│  │                                                   │ │
│  │  👤 Emily D.        📧 Email              2h    │ │
│  │  ✓ Sent: WiFi info                               │ │
│  │                                                   │ │
│  │  ... 10 more                                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  📥 Inbox  🏠 Properties  📅 Bookings  👥 Contacts  ⚙️ │
└─────────────────────────────────────────────────────────┘
```

### Conversation Detail

```
┌─────────────────────────────────────────────────────────┐
│ ← Sarah Johnson                           📞  ⋮        │
│   FurnishedFinder • Alexandria 2BR                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                     Today 2:34 PM                       │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │ Hi, I'm a travel nurse looking      │               │
│  │ for housing near Inova Alexandria   │               │
│  │ from Feb 1 - Apr 30. Is your 2BR    │               │
│  │ available?                          │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│           ┌─────────────────────────────────────────┐  │
│           │ 🤖 AI RESPONSE (85% confident)          │  │
│           │ ────────────────────────────────────    │  │
│           │ Hi Sarah! 👋                            │  │
│           │                                         │  │
│           │ Great news — the Alexandria 2BR         │  │
│           │ is available Feb 1 - Apr 30!            │  │
│           │                                         │  │
│           │ • $2,400/mo all-inclusive               │  │
│           │ • 8 min to Inova Alexandria             │  │
│           │ • Quiet neighborhood (perfect for       │  │
│           │   night shift!)                         │  │
│           │                                         │  │
│           │ Want to schedule a video tour?          │  │
│           │                                         │  │
│           │    [✏️ Edit]   [✓ Approve & Send]       │  │
│           └─────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ Type a message...                          📎 ➤ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Properties With Rooms

```
┌─────────────────────────────────────────────────────────┐
│ ← Arlington House                              ✏️       │
│   456 Wilson Blvd • Room-by-Room                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 OCCUPANCY: 3/4 rooms (75%)                         │
│  💰 MONTHLY: $2,100 ($700 avg/room)                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🚪 BLUE ROOM                        $175/week    │ │
│  │ ─────────────────────────────────────────────    │ │
│  │ 🟢 AVAILABLE NOW                                 │ │
│  │                                                   │ │
│  │ 🛁 Private bath • 🖥️ Desk • 📦 Walk-in closet   │ │
│  │                                                   │ │
│  │ [Edit]  [Block Dates]  [View Inquiries: 2]       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🚪 GARDEN ROOM                      $150/week    │ │
│  │ ─────────────────────────────────────────────    │ │
│  │ 🔴 OCCUPIED: Mike Chen                           │ │
│  │    Until Mar 15 (47 days)                        │ │
│  │                                                   │ │
│  │ 🚿 Shared bath • 🌳 Garden view                  │ │
│  │                                                   │ │
│  │ [View Guest]  [Message]  [Edit]                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [+ Add Room]                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Bookings Calendar

```
┌─────────────────────────────────────────────────────────┐
│ ← Bookings                         List | 📅 Calendar  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              ◀  February 2026  ▶                       │
│                                                         │
│   S    M    T    W    T    F    S                      │
│  ────────────────────────────────                       │
│        1    2    3    4    5    6                      │
│       ████████████████████████████  Sarah (Alex 2BR)   │
│   7    8    9   10   11   12   13                      │
│       ████████████████████████████                      │
│       ░░░░░░░░░░░░░░░░░░░░░░░░░░░  Mike (Blue Room)   │
│  14   15   16   17   18   19   20                      │
│       ████████████████████████████                      │
│       ░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │
│  21   22   23   24   25   26   27                      │
│       ████████████████████████████                      │
│       ░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │
│  28                                                     │
│       ████                                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📅 UPCOMING                                            │
│                                                         │
│  Feb 1  → Sarah J. checks in (Alexandria 2BR)          │
│  Feb 15 → Mike C. checks in (Blue Room)                │
│  Feb 28 → Lisa M. checks out (Front Room)              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  💰 FEBRUARY                                            │
│                                                         │
│  Revenue: $4,950     Occupancy: 87%                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⏱️ TIMELINE

```
WEEK 1-2: Zones work in parallel
──────────────────────────────────
Zone 2 → Database schema, migrations, types
Zone 1 → Starts skills (uses Zone 2 types as ready)
Zone 3 → Starts UI scaffolding, component shells
Zone 4 → Starts test framework, fixtures

WEEK 3-4: Implementation
──────────────────────────────────
Zone 2 → RLS policies, functions, triggers
Zone 1 → Edge Functions, full skill logic
Zone 3 → Complete screens, real API integration
Zone 4 → Unit tests, integration tests

WEEK 5: Integration (Zone 5)
──────────────────────────────────
• Merge all branches
• Resolve type mismatches
• Full E2E testing
• Performance optimization
• Bug fixes

WEEK 6: Polish & Deploy
──────────────────────────────────
• Code quality pass
• Documentation
• Staging deployment
• Final testing
• Production release
```

---

## 🚀 HOW TO USE THIS DOCUMENT

### For the Project Lead (You, Dino)
1. Share the full architecture doc with your developer
2. Decide if you're using 4 Claude instances or having dev work sequentially
3. Zone 2 (Database) should be done first — it's the foundation

### For Claude Instances / Developers
1. Read the ZONE section assigned to you
2. Review the INTERFACE CONTRACTS — these are your inputs and outputs
3. Build to the spec
4. Don't deviate from types/APIs unless coordinating with other zones

### For Integration (Zone 5)
1. Start after Zones 1-4 have deliverables
2. Run Zone 4's tests against everything
3. Fix integration issues
4. Optimize and polish

---

## 📎 ATTACHMENTS

The main architecture document (`doughy-architecture-refactor.md`) contains:

1. **Full database schema** (SQL migrations)
2. **TypeScript type definitions** (all interfaces)
3. **API contracts** (request/response formats)
4. **Moltbot skills** (complete SKILL.md files)
5. **UI specifications** (screen mockups, component props)
6. **Test specifications** (what to test, example tests)

---

## ✅ SUCCESS CRITERIA

When this refactor is complete:

### Platform Infrastructure
1. ✅ Users can select RE Investor, Landlord, or Both during onboarding
2. ✅ Platform switcher in header works smoothly without losing state
3. ✅ Tab bar shows correct tabs based on active platform

### Landlord Features
4. ✅ FurnishedFinder emails create contacts automatically
5. ✅ Airbnb inquiries are processed and responded to
6. ✅ WhatsApp messages work via Moltbot
7. ✅ AI generates appropriate responses with confidence scores
8. ✅ Owner can approve/edit/send from mobile app
9. ✅ Room-by-room properties track individual room availability
10. ✅ Booking calendar shows all reservations
11. ✅ Lead scoring identifies hot vs cold leads

### RE Investor Features (Preserved)
12. ✅ Focus, Leads, Deals, Portfolio tabs work as before
13. ✅ Existing `crm_leads`, `re_properties`, `deals` tables unchanged

### Quality
14. ✅ All tests pass (including platform switching tests)
15. ✅ < 3 second response time for AI suggestions

---

**This is the future of Doughy. Let's build it.** 🦞
