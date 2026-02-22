# Architectural Decisions

## 2026-02-17 - Module Discrimination via Column

**Context:** Contacts serve two business functions — real estate investing (motivated sellers, wholesalers) and property management (tenants, contractors). Need a way to separate them in the UI and data model.

**Decision:** Use a `module: 'investor' | 'landlord'` column on contacts, with a secondary `contactType` field for sub-classification (motivated_seller, tenant, contractor, etc.).

**Alternatives considered:** Separate tables per module, single flat list with tags.

**Consequences:** All queries filter by module. UI components check module for conditional rendering. Module filter chips on Contacts and Messages screens.

---

## 2026-02-17 - CallPilot Is NOT a CRM

**Context:** CallPilot needs contact data but shouldn't duplicate CRM functionality.

**Decision:** CallPilot reads contacts from Doughy's `crm.contacts` table (via Supabase). It never creates or modifies contacts directly — all CRM writes happen in Doughy.

**Alternatives considered:** Embedded CRM features, local contact storage.

**Consequences:** CallPilot depends on Doughy for contact data. Mock data layer used until Supabase integration is wired. No contact create/edit screens in CallPilot.

---

## 2026-02-17 - Claw Suggestion Cards via Supabase Realtime

**Context:** The Claw AI generates draft replies that should appear in CallPilot's message threads.

**Decision:** Server writes drafts to `claw.draft_suggestions` table. CallPilot subscribes via Supabase Realtime. Currently mocked with a static `MOCK_CLAW_DRAFT` constant.

**Alternatives considered:** Push notifications, polling, WebSocket direct.

**Consequences:** Requires Supabase Realtime subscription setup. Mock data shows the UX flow. Send/Edit/Dismiss handlers are stubs.

---

## 2026-02-17 - Trust Levels: Locked → Manual → Guarded → Autonomous

**Context:** The Claw needs graduated autonomy levels for AI actions.

**Decision:** Four trust levels controlled via `claw.trust_config`. Server checks before every action. CallPilot doesn't enforce trust directly but shows approval status in suggestion cards.

**Alternatives considered:** Binary on/off, per-action permissions.

**Consequences:** Server is the trust enforcement point. Claw App is the control panel. CallPilot just shows/sends drafts.

---

## 2026-02-17 - 3-Tier Glass Rendering

**Context:** iOS 26 introduces Liquid Glass but older devices need fallback.

**Decision:** Three rendering tiers: `@callstack/liquid-glass` (iOS 26+) → `expo-blur` BlurView → opaque `View` with `surfaceSecondary` background.

**Alternatives considered:** Always use blur, skip glass entirely.

**Consequences:** `GlassView` component handles detection. All glass-effect UI uses `GlassView` instead of raw `View`. Design tokens include glass intensity levels (subtle=30, light=40, medium=55, strong=65, opaque=80).

---

## 2026-02-17 - Skeleton Loading, Never Spinners

**Context:** Loading states should feel premium, not generic.

**Decision:** All loading states use skeleton shimmer placeholders (`SkeletonLoader.tsx`) instead of `ActivityIndicator` spinners. Uses `react-native-reanimated` for smooth opacity animation.

**Alternatives considered:** ActivityIndicator, full-screen loading, progressive loading.

**Consequences:** Each screen type needs a matching skeleton variant (SkeletonContactCard, SkeletonConversationRow, SkeletonSettingsCard, etc.).

---

## 2026-02-17 - Cost Tracking in Cents

**Context:** AI calls, SMS via Twilio, and API calls all have costs that need tracking.

**Decision:** All costs stored as integers in cents (not floating-point dollars) in `claw.cost_log`.

**Alternatives considered:** Float dollars, string amounts.

**Consequences:** Avoids floating-point precision issues. Display layer converts cents to dollars for UI.

---

## 2026-02-17 - WhatsApp/SMS Draft Pushes Are Opt-In

**Context:** Claw can push draft messages to WhatsApp/SMS via Twilio, but each push costs money.

**Decision:** Push-to-WhatsApp and Push-to-SMS are off by default in Settings. Push-to-Discord is on by default (free).

**Alternatives considered:** All on by default, no push feature.

**Consequences:** Settings toggles for each channel. Server checks user preferences before pushing. Cost warning shown in Settings UI.

---

## 2026-02-17 - Component Size Limit: 200 Lines

**Context:** Large components are hard to maintain and review.

**Decision:** Components must be under 200 lines (target 150). Pre-commit hook warns on violations. Extract sub-components, hooks, and utilities to stay under limit.

**Alternatives considered:** No limit, 300-line limit.

**Consequences:** Settings screen split into CrmConnectionCard, UsageMeter, etc. Contact detail split into ContactHeader, ModuleInfoSection, etc.
