# Architectural Decisions

## 2026-02-17 — Single Screen, No Tabs

**Context:** The original app had 5 tabs (Control, Approvals, Activity, Integrations, Settings). This created navigation friction and scattered related information.

**Decision:** Convert to a single scrollable control panel with a pinned header. Only 6 screens total: Main, Connection Detail, Per-Action Overrides, Activity Detail, Settings, and the Trust Level Picker overlay.

**Alternatives considered:** Bottom tabs with 3 tabs (Control, Activity, Settings), drawer navigation.

**Consequences:** Faster to scan everything at a glance. Settings moved from tab to gear icon. Activity and connections are sections, not separate screens.

---

## 2026-02-17 — Four Trust Levels Replace Five Guard Levels

**Context:** Original system had 5 guard levels (1-5) which were confusing. Users didn't know what "guard level 3" meant.

**Decision:** Four named trust levels: Locked, Manual, Guarded, Autonomous. Each has clear emoji, color, and behavioral description.

**Alternatives considered:** Three levels (off/on/auto), slider-based continuous control.

**Consequences:** Queue section changes behavior per trust level. Autonomous requires explicit consent modal. Trust config stored in Supabase with migration from old system.

---

## 2026-02-17 — No Chat in The Claw App

**Context:** The Claw was initially planned to have an in-app chat with the AI agent.

**Decision:** Users talk to The Claw via WhatsApp, Discord, or SMS — not through the app. The app is a control panel only.

**Alternatives considered:** In-app chat tab, voice commands.

**Consequences:** No chat screen, no message input. Server handles all messaging channels. The Claw App is purely for monitoring and control.

---

## 2026-02-17 — Gateway Adapter Pattern (Mock vs Supabase)

**Context:** Need to develop and demo the app without a live server, but also support real Supabase backend.

**Decision:** `GatewayAdapter` interface with `MockGatewayAdapter` (in-memory, realistic delays) and `SupabaseGatewayAdapter` (real HTTP calls). Factory function: `createGatewayAdapter('mock' | 'supabase')`.

**Alternatives considered:** Feature flags, separate app builds, mock server.

**Consequences:** Demo mode works offline with zero configuration. Real mode requires Supabase credentials. Hooks wrap store + adapter so components never know which adapter is active.

---

## 2026-02-17 — Cost Tracking in Cents

**Context:** Need to track per-action costs (AI calls, SMS, voice) without floating point issues.

**Decision:** All costs stored as integers in cents. `cost_cents INTEGER NOT NULL` in the database. Formatting to dollars happens only in the UI layer.

**Alternatives considered:** Decimal type, storing as dollars with 2 decimal places.

**Consequences:** No floating point rounding errors. Monthly aggregation is simple SUM. UI formats with `(cents / 100).toFixed(2)`.

---

## 2026-02-17 — Doughy Module-Based Permissions

**Context:** Doughy has two business modules (Real Estate Investor, Landlord) with different data and capabilities.

**Decision:** Doughy connection permissions are grouped by module. Each module has its own read/write/send/delete permissions. Stored as nested JSONB in `claw.connections.permissions`.

**Alternatives considered:** Flat permission list, role-based access per module.

**Consequences:** Connection detail screen shows two distinct permission cards for Doughy. Seed data mirrors this structure. Server reads permissions per-module before taking actions.

---

## 2026-02-17 — Supabase Realtime for Queue Only

**Context:** Need live updates for the action queue (countdown timers, new items appearing).

**Decision:** Subscribe to `postgres_changes` on `claw.action_queue` table via Supabase Realtime. Only activate when using Supabase adapter (not mock). Other sections (connections, activity, cost) use pull-to-refresh.

**Alternatives considered:** Realtime on all tables, WebSocket to server, polling.

**Consequences:** Queue updates instantly when server adds/modifies items. Migration includes `ALTER PUBLICATION supabase_realtime ADD TABLE claw.action_queue`. Mock mode uses local timer for countdowns.

---

## 2026-02-17 — Design Tokens Copied from Doughy, Darker Mood

**Context:** The Claw should feel like part of the same ecosystem as Doughy but with a more serious "control room" aesthetic.

**Decision:** Copy Doughy's design tokens exactly (sage green primary, 4px spacing grid, border radius, shadows, spring configs). Dark mode surface is #1a2332 (darker than Doughy's #1e293b). Glass blur intensity is Doughy's values + 5.

**Alternatives considered:** Completely separate design system, shared package.

**Consequences:** Apps feel cohesive. Theme tokens in `src/theme/tokens.ts` match Doughy. Trust level colors are unique to The Claw (locked=gray, manual=blue, guarded=amber, autonomous=green, killed=red).

---

## 2026-02-17 — Settings as Full Screen, Not Bottom Sheet

**Context:** Original settings was a bottom sheet opened from the header. It felt cramped for the amount of settings needed.

**Decision:** Settings is a full screen at `app/(main)/settings.tsx`, navigated to from the gear icon in PinnedHeader via `router.push`.

**Alternatives considered:** Keep bottom sheet, split into multiple bottom sheets, in-line accordion.

**Consequences:** More room for settings sections (theme, queue, cost limits, about). Sign out button has proper placement. Back arrow for navigation.
