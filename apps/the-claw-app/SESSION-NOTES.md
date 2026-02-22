# The Claw App — Session Notes

## What Was Built (Feb 2026)

Full POC (Proof of Concept) for The Claw App — a mobile control interface for OpenClaw, an open-source AI assistant. All UI/UX is real; all data is mock. The app is fully navigable and interactive.

### Starting Point
- Copied `mobile-app-blueprint` scaffold to `the-claw-app`
- Blueprint provided: Text, Button, Input components, ThemeProvider, design tokens, Expo Router setup
- Added `zustand` as the only new dependency
- Created `tsconfig.json` from blueprint template (was missing from root)
- Used `npm install --legacy-peer-deps` due to react-test-renderer@19 vs react@18 peer conflict

### What Was Created (75 files)

**Types (7 files)** — `src/types/`
- `connection.ts` — ConnectionStatus, OpenClawConnection, HealthResponse, ConnectionError
- `integration.ts` — IntegrationId (10 integrations), Integration, IntegrationPermission, IntegrationToggleResult
- `actions.ts` — ActionTier (none/low/medium/high/blocked), PendingAction, ActionResult, ActionBatch, ActionStats
- `guards.ts` — GuardLevel (relaxed/balanced/strict/fortress), GUARD_LEVEL_CONFIGS constant with labels, descriptions, colors
- `openclaw.ts` — GatewayConfig, GatewayStatusResponse, BatchApproveRequest/Response

**Services (8 files)** — `src/services/`
- `gateway/types.ts` — GatewayAdapter interface (the abstraction layer)
- `gateway/mockAdapter.ts` — **PRIMARY for POC** — 10 mock integrations with sub-permissions, 5 pending actions across tiers, 300-800ms simulated delays, in-memory state tracking
- `gateway/httpAdapter.ts` — Stub that throws "not implemented" (plug-in point for real OpenClaw)
- `gateway/index.ts` — Factory function `createGatewayAdapter('mock' | 'http')`
- `connectionManager.ts` — Connect/disconnect lifecycle
- `integrationService.ts` — Thin wrapper over gateway for integration ops
- `actionService.ts` — Thin wrapper over gateway for action ops

**Stores (3 files)** — `src/stores/`
- `useIntegrationStore.ts` — Zustand + AsyncStorage persistence
- `useActionQueueStore.ts` — Zustand in-memory only (actions re-fetched from gateway)
- `useGuardStore.ts` — Zustand + AsyncStorage persistence

**Context (1 file)** — `src/contexts/`
- `ConnectionContext.tsx` — React Context with ConnectionProvider, mock connection on connect()

**Hooks (7 files)** — `src/hooks/`
- `useConnection.ts` — Wraps ConnectionContext
- `useOnboarding.ts` — AsyncStorage-backed onboarding completion check
- `useIntegrations.ts` — Wraps store + gateway adapter calls
- `useActionQueue.ts` — Wraps store + gateway, provides pendingActions/actionsByTier/pendingCount
- `useGuardLevel.ts` — Wraps store + GUARD_LEVEL_CONFIGS lookup
- `useAppState.ts` — Pre-existing blueprint hook (app foreground/background)

**Shared Components (30 files)** — `src/components/`
- `Switch/` — Animated toggle with haptics, spring animation
- `Card/` — Elevated/outlined/filled variants, pressable with haptics
- `Badge/` — Colored labels for tiers/status (default/success/warning/error/info/custom)
- `StatusDot.tsx` — Connection/integration status indicator (green/yellow/red/gray/blue, sm/md/lg)
- `Divider.tsx` — Themed horizontal rule (sm/md/lg spacing)
- `shared/DisclaimerBanner.tsx` — Session-dismissible AI disclaimer
- `shared/ConnectionStatusBar.tsx` — Top bar showing gateway connection state
- `shared/EmptyState.tsx` — Icon + title + description + CTA (from blueprint example)
- `shared/ErrorState.tsx` — Error display + retry (from blueprint example)
- `shared/LoadingState.tsx` — Spinner + message + overlay (from blueprint example)
- `integrations/IntegrationCard.tsx` — Card with icon, name, status dot, toggle switch
- `integrations/IntegrationCategoryHeader.tsx` — Section header with count
- `integrations/IntegrationPermissionList.tsx` — Sub-permission toggles with risk badges
- `actions/PendingActionsSection.tsx` — Grouped actions by tier with batch approve
- `actions/ActionConfirmationCard.tsx` — Tiered confirmation UX (low→medium→high)
- `actions/ActionPreview.tsx` — Action detail preview with key-value pairs
- `actions/ActionBatchGroup.tsx` — Same-tier action group with "Approve All"
- `actions/PendingActionBadge.tsx` — Red count badge for tab bar
- `guards/GuardLevelIndicator.tsx` — Colored badge showing current guard level

**Screens (14 files)** — `app/`
- `_layout.tsx` — Root layout: ThemeProvider → ConnectionProvider → Stack
- `index.tsx` — Root redirect: onboarded → tabs, not onboarded → onboarding
- `(onboarding)/_layout.tsx` — Stack navigator
- `(onboarding)/index.tsx` — Welcome screen with philosophy + "Get Started"
- `(onboarding)/connect.tsx` — Gateway URL input + "Try Demo Mode" button
- `(onboarding)/verify.tsx` — Mock connection verification + "Complete Setup"
- `(tabs)/_layout.tsx` — 4-tab bottom nav (Activity, Approvals, Control, Settings)
- `(tabs)/activity.tsx` — Unified timeline/audit trail
- `(tabs)/approvals.tsx` — Swipe-to-approve pending actions
- `(tabs)/control.tsx` — Guard level + integrations
- `(tabs)/settings.tsx` — Connection info, theme toggle, version, disconnect/reset
- `(modals)/_layout.tsx` — Modal stack layout
- `(modals)/action-confirmation.tsx` — Approve/deny modal with tiered UX
- `(modals)/integration-detail.tsx` — Integration info + sub-permission toggles

---

## UI/UX Overhaul: Team Consensus Report (Feb 10, 2026)

**Team:** 2 UI/UX Devs, 1 Backend Dev, 1 Code Reviewer, 1 Devil's Advocate
**Goal:** Make The Claw visually polished, modern, and usable — iOS-first with tasteful glass treatment

### Team Roster & Key Findings

**UI/UX Dev 1 (Visual Design Lead):**
Full liquid glass token system, color palette shift to cooler violet, replace all emoji icons with Ionicons, glass tab bar, translucent badges, bigger border radii, refined shadows. Reference apps: Apple Weather, Flighty, Apollo.

**UI/UX Dev 2 (UX & Information Architecture):**
Activity screen has too many filters (9 chips), stacking banners eat viewport. Control screen has 5 guard cards = ~600pt scroll before integrations. Approvals has redundant elements. Settings looks like a debug panel. Proposed stepper for guard levels, segmented controls, time-grouped activity.

**Backend Dev (Technical Feasibility):**
`expo-blur` uses native `UIVisualEffectView` — same as Apple's glass. `expo-linear-gradient` is GPU-accelerated. `@expo/vector-icons` v15.0.3 already installed. Built-in `Animated` sufficient for all springs. BlurView performant for chrome, risky in FlatList. ~5-8 days total.

**Code Reviewer (Quality Assessment):**
Bug: CHANNEL_LABELS diverge between card/detail views. Bug: Tab emoji icons ignore `color` prop. Bug: Hex-alpha concatenation fragile. 9 hardcoded `#ffffff`. Duplicate INTEGRATION_ICONS. Needs: `withAlpha()`, `sizing` tokens, shared components.

**Devil's Advocate (Risk Assessment):**
Glass on data cards kills perf on iPhone 12-. Glass breaks WCAG contrast. ADHD-first philosophy contradicts busy transparent backgrounds. This is a security panel — info hiding is dangerous. Guard level friction is a safety feature. No test coverage = risky refactor. "Make it better. Do not make it trendy."

### Resolved Disagreements

1. **Glass on data cards** → Devil's Advocate wins. Solid surfaces for data. Glass only on chrome.
2. **Guard level UI** → Hybrid. Collapsible cards (selected=expanded, others=compact pill). Preserves safety friction, reduces scroll.
3. **Activity card density** → Remove channel badge from cards (keep in detail view).
4. **Warning banners** → Consolidate to one, keep solid and prominent.
5. **Glass placement:** Tab bar YES, headers YES, modals YES, empty states YES. Data cards NO, filter chips NO, banners NO, settings forms NO.

### Implementation Plan (5 Phases, ~10 days)

**Phase 0: Fix Bugs & Foundation (Day 1)**
- Fix CHANNEL_LABELS divergence
- Replace 9x hardcoded `#ffffff` with theme tokens
- Extract duplicate INTEGRATION_ICONS/TIER_INDICATOR to constants
- Add `withAlpha()` utility, `sizing` tokens
- Fix PendingActionBadge theme integration

**Phase 1: Icon Revolution (Day 2)**
- Replace ALL emoji with Ionicons (tab bar, activity cards, approvals, guards, empty states)
- Create `Icon.tsx` wrapper, `icons.ts` constants
- Add disconnect confirmation dialog

**Phase 2: Token Refinement (Days 3-4)**
- Color: primary.500 `#a855f7` -> `#8b5cf6`, bg `#fff` -> `#f2f2f7`, dark bg -> `#000`
- Border radius: sm 4->10, md 8->14, lg 12->20, xl 16->24
- Shadows: simplified 3-tier glass-appropriate system
- Badge backgrounds: semi-transparent rgba
- Dividers: hairline width
- Spacing: screen padding 16->20, list gaps 8->12, section spacing 24->32

**Phase 3: Glass Chrome (Days 5-6)**
- Install `expo-blur` + `expo-linear-gradient` via `npx expo install`
- Glass tab bar (BlurView, absolute position, scroll-behind content)
- Glass surface tokens in ThemeContext
- Empty state upgrade (icon in glass circle)
- Accessibility fallbacks (Reduce Transparency, Reduce Motion)

**Phase 4: UX Structure (Days 7-8)**
- Activity: segmented time control + filter icon sheet, consolidated banner, SectionList headers
- Approvals: conditional instruction text, remove tier badge, sticky batch footer
- Control: collapsible guard cards, improved integration headers
- Settings: iOS grouped sections, SegmentedControl for theme, KeyValueRow, confirmation dialogs

**Phase 5: Animation Polish (Days 9-10)**
- Scale-on-press (1.0->0.97 spring) for all cards
- Staggered list entrance (50ms/item spring)
- Guard level crossfade transition
- Modal blur materialization
- StatusDot pulse animation
- Spring configs as theme tokens

### New Files
- `src/components/Icon.tsx`, `src/components/shared/GlassTabBar.tsx`
- `src/components/shared/KeyValueRow.tsx`, `src/components/shared/SegmentedControl.tsx`
- `src/components/shared/AlertBanner.tsx`
- `src/constants/integrations.ts`, `src/constants/icons.ts`, `src/constants/tiers.ts`
- `src/utils/color.ts`

### Packages
- Install: `expo-blur`, `expo-linear-gradient` (via `npx expo install` for SDK compatibility)
- Use existing: `@expo/vector-icons` v15.0.3, `expo-font` v14.0.11
- Avoid: `react-native-reanimated` runtime APIs (keep package for React Nav)

### Standards Compliance
- DESIGN-PHILOSOPHY.md: ADHD-friendly (glass on chrome not data), haptics, springs, 48pt targets
- ACCESSIBILITY.md: Solid data surfaces (4.5:1 contrast), Reduce Transparency/Motion fallbacks
- COMPONENT-GUIDELINES.md: <200 lines, named exports, theme tokens, no barrel exports of native deps
- WHAT-NOT-TO-DO.md: No reanimated runtime, no barrel heavy deps, no hardcoded colors

---

## Architecture Decisions

1. **Adapter Pattern** — GatewayAdapter interface lets us swap MockGatewayAdapter → HttpGatewayAdapter without touching any UI code
2. **Zustand for feature state** — Integration configs and guard level persisted to AsyncStorage; action queue in-memory only
3. **React Context for global connection** — Single ConnectionProvider at root, consumed via useConnection hook
4. **Tiered Action UX** — Low: quick approve. Medium: preview + approve/deny. High: typed "CONFIRM" + approve/deny. Blocked: never shown.
5. **Guard Levels** — User-friendly names replacing "firewall tiers": Relaxed → Balanced → Strict → Fortress
6. **Session-dismissible disclaimer** — Returns on app restart (useState, not persisted)
7. **POC uses AsyncStorage** for gateway URL (swap to expo-secure-store for real build)

---

## Known Issues / Cleanup Needed

- **No tests yet** — Unit tests for stores, hooks, and MockGatewayAdapter should be written
- **mobile-app-blueprint/** directory is still in the repo — was the copy source, can be deleted
- **e2e/** has type errors from blueprint (detox types not installed) — not our concern for POC
- **react-test-renderer** peer dep conflict — using --legacy-peer-deps workaround
- **react-native-worklets** version mismatch (JS 0.7.3 vs native 0.5.1) — avoid reanimated runtime APIs

---

## Key Docs to Read
- `CLAUDE.md` — Project rules and conventions
- `docs/patterns/NEW-FEATURE.md` — Feature creation sequence
- `docs/05-ui-ux/DESIGN-PHILOSOPHY.md` — ADHD-friendly design principles
- `docs/09-security/SECURITY-CHECKLIST.md` — Security review checklist
