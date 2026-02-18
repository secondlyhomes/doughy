# CLAUDE.md

## Project

**The Claw App** — React Native (Expo 54+) + Supabase + TypeScript | iOS-first

Control panel for an AI agent system. Single scrollable screen with pinned header. Trust levels, permissions, queue, activity, cost monitoring, kill switch.

## Commands

```bash
npx tsc --noEmit          # Primary verification (always run)
npm test                  # Unit tests (jest-expo preset needed — not yet installed)
supabase gen types typescript   # After schema changes
```

## Current State (2026-02-17)

### What Works
- Single-screen control panel with all 4 sections (Queue, Connections, Activity, Cost)
- Pinned header with trust level bar + kill switch + settings gear
- Kill switch with confirmation dialog, wired to gateway adapter
- Trust level picker (bottom sheet with 4 levels + per-action overrides)
- Connection detail screens (Doughy: 2 modules/18 perms, Bland: call settings, Channels: delivery prefs)
- Activity section with day-grouped entries (Today/Yesterday/This Week/Older)
- Cost card with monthly breakdown and stats
- Skeleton loading states on Connections and Cost sections
- Haptic feedback on kill switch, approve/deny, cancel, trust level selection
- Supabase Realtime subscription for action_queue
- Supabase adapter with cost_log aggregation
- Mock adapter with realistic seed data for demo mode
- Settings screen (theme, queue settings, cost limits, about, sign out)
- Autonomous consent modal
- Supabase auth with demo mode fallback
- iOS 26 Liquid Glass header with BlurView fallback
- Dark/light/system theme
- Database migrations for trust_config, connections, action_queue, cost_log

### What's Not Done
- jest-expo preset not installed (`npm test` fails)
- Physical device QA needed
- Production seed data (placeholder UUID)
- Push notification delivery for approvals
- Draft messages section (claw.draft_messages not yet wired)

### Known Tech Debt
- Supabase adapter `getMonthlyCost` has a simplistic leads count approximation
- Server API may not be deployed — activity/kill switch use Supabase direct fallbacks

## Structure

```
src/
├── components/       # UI components (all <200 lines)
│   ├── activity/     # ActivitySection, ActivityEntry, ActivityCard, ActivityDetail, ActivityFilters
│   ├── connections/  # ConnectionsSection, ConnectionCard
│   ├── control/      # AutonomousConsentModal
│   ├── control-panel/# PinnedHeader, SectionHeader
│   ├── cost/         # CostCard
│   ├── queue/        # QueueSection, CountdownCard, ApprovalCard
│   ├── shared/       # EmptyState, GlassHeader, Skeleton, SegmentedControl, etc.
│   ├── trust/        # TrustLevelPicker, TrustLevelOption
│   ├── Badge/        # Badge
│   ├── Button/       # Button
│   ├── Card/         # Card
│   ├── Input/        # Input
│   ├── Switch/       # Switch
│   ├── Text.tsx      # Text with variants
│   ├── StatusDot.tsx # Colored status indicator
│   ├── Divider.tsx   # Divider
│   └── index.ts      # Barrel exports
├── hooks/            # useQueue, useConnections, useActivity, useTrustLevel, useCost, useConnection, useAuth
├── stores/           # Zustand stores (trust, connections, queue, activity, cost, consent)
├── services/
│   └── gateway/      # GatewayAdapter interface, MockAdapter, SupabaseAdapter
├── contexts/         # AuthContext, ConnectionContext
├── theme/            # ThemeContext, tokens
├── types/            # trust, connections, queue, activity, cost, actions, openclaw, database
├── constants/        # icons, trust, integrations
├── utils/            # color, formatters
└── lib/              # supabase client, notifications

app/
├── _layout.tsx       # Root: ThemeProvider > AuthProvider > ConnectionProvider > Stack
├── index.tsx         # Auth redirect
├── (onboarding)/     # Welcome + Connect screens
└── (main)/           # Control panel + detail screens

supabase/
└── migrations/       # 5 SQL files (trust_config, connections, action_queue, cost_log, seed)
```

## Key Files

| What | Where |
|------|-------|
| Main screen | `app/(main)/index.tsx` |
| Gateway adapter interface | `src/services/gateway/types.ts` |
| Supabase adapter | `src/services/gateway/supabaseAdapter.ts` |
| Trust level configs | `src/types/trust.ts` |
| Design tokens | `src/theme/tokens.ts` |
| Theme colors | `src/theme/ThemeContext.tsx` |
| Supabase client | `src/lib/supabase.ts` |

## Database Tables (this repo)

| Table | Purpose |
|-------|---------|
| `claw.trust_config` | Trust level, countdown, limits, overrides |
| `claw.connections` | Connected services and permissions |
| `claw.action_queue` | Pending/countdown queue (Realtime) |
| `claw.cost_log` | Per-action cost tracking |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `EXPO_PUBLIC_CLAW_API_URL` | The Claw server API URL |

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `QueueSection.tsx` |
| Hooks | `use` prefix | `useConnections.ts` |
| Screens | Default export, file-based | `app/(main)/index.tsx` |
| Services | camelCase | `mockAdapter.ts` |
| Types | PascalCase | `ServiceConnection` |

**Named exports** for `src/`. **Default exports** for `app/` screens (Expo Router).

## Rules

- Use theme tokens, never hardcode styles
- RLS always enabled on all tables
- Service role key: server only, never client
- Components <200 lines (target <150)
- `ServiceConnection` / `ServiceConnectionStatus` — avoids conflict with gateway `ConnectionStatus`
- `ConnectionId` is the union type for service IDs
- Trust colors in `tokens.trustColors`: locked=#6b7280, manual=#3b82f6, guarded=#f59e0b, autonomous=#22c55e, killed=#ef4444

## Security Protocol (Immutable)

- NEVER disable RLS on any table
- NEVER put service_role key in client code
- NEVER commit secrets (.env, API keys)
- ALWAYS validate AI inputs
- ALWAYS use parameterized queries

## Cross-System Dependencies

- **Server** writes to: `claw.agent_runs`, `claw.approvals`, `claw.cost_log`, `claw.action_queue`
- **Server** reads from: `claw.trust_config`, `claw.connections`, `claw.agent_profiles`
- The Claw App's design tokens are copied from Doughy (sage green primary, 4px grid, glass blur + 5)
- The Claw App reads `callpilot.calls` for activity display

## Docs

| Doc | Purpose |
|-----|---------|
| `docs/ARCHITECTURE.md` | Ecosystem diagram, data flows, app architecture |
| `docs/SCHEMA_MAP.md` | Every table in the system |
| `docs/ROADMAP.md` | Phased feature list |
| `docs/DECISIONS.md` | Architectural decision log |
| `README.md` | Setup, env vars, screen inventory |

## Changelog

### 2026-02-17 — Overnight Build (Session 1-2)
- Converted from 5-tab app to single-screen control panel
- Built PinnedHeader with 3-row layout, kill confirmation dialog
- Built QueueSection with trust-level-aware rendering
- Built ConnectionsSection with skeleton loading
- Built ActivitySection with day grouping (Today/Yesterday/This Week)
- Built CostCard with monthly breakdown and stats
- Enhanced connection detail: Doughy modules (Investor/Landlord), Bland call settings, channel delivery prefs
- Created Settings screen (replaced bottom sheet)
- Wired kill switch to gateway adapter
- Added Supabase Realtime for queue
- Added Supabase adapter cost_log aggregation
- Added skeleton loading states (Skeleton component)
- Added haptic feedback to approve/deny, cancel, trust level selection
- Created 5 database migrations (trust_config, connections, action_queue, cost_log, seed)
- Cleaned up dead code (old tabs, modals, unused components)
- Created ecosystem documentation (ARCHITECTURE, SCHEMA_MAP, ROADMAP, DECISIONS)

### 2026-02-18 — Wire to Real DB + Auth
- Replaced mock adapter with Supabase-only adapter (deleted mockAdapter.ts, mockActivityData.ts)
- Standardized auth to match Doughy (hybrid SecureStore/AsyncStorage, initCompleteRef pattern)
- Connected to real Supabase instance (same URL/key as Doughy)
- Auto-connect: ConnectionContext creates SupabaseGatewayAdapter on auth
- Added Supabase direct fallbacks for activity (cost_log) and kill switch (trust_config)
- Wired useTrustLevel to load/save from claw.trust_config
- Added AppState foreground refresh (reconnect + reload all sections)
- Added Gmail OAuth button on connection detail (opens server OAuth flow)
- Added 'gmail' to ConnectionId union type
- Removed demo mode from onboarding (sign-in only)
- Simplified settings screen (live mode, connection status, user email)

## Skills

| Skill | Purpose |
|-------|---------|
| `/start-session` | Load context, check GitHub |
| `/code-review` | Multi-pass review with agents |
| `/deploy` | Pre-deploy checks, version bump, build |
| `/wrap-up` | Save notes, close issues |
