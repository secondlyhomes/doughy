# Deal OS MVP - Parallel Workstreams

## Overview
Split into two independent workstreams that can run in parallel. Each zone has no dependencies on the other until the final integration phase.

**Development Approach:** Client-side first with mock data → then Supabase

---

## ZONE A: Core Deal Infrastructure (Claude A)

**Focus:** Deal types, Deal Cockpit, Quick Underwrite, Navigation

### A1: Deal Types & Mock Data
**Files to create:**
```
src/features/deals/types/index.ts
src/features/deals/data/mockDeals.ts
```

**Tasks:**
- [ ] Create `Deal` interface combining Lead + Property + Strategy
- [ ] Create `DealStage` enum (new, contacted, appointment_set, analyzing, offer_sent, negotiating, under_contract, closed_won, closed_lost)
- [ ] Create `DealOffer` interface
- [ ] Create `DealEvidence` interface (for "Why?" trails)
- [ ] Create 5-10 mock deals with realistic data
- [ ] Wire to existing `Lead` and `Property` types

### A2: Deal Hooks (Mock Data First)
**Files to create:**
```
src/features/deals/hooks/useDeals.ts
src/features/deals/hooks/useDeal.ts
src/features/deals/hooks/useNextAction.ts
```

**Tasks:**
- [ ] `useDeals()` - returns mock deals list with filtering
- [ ] `useDeal(id)` - returns single mock deal
- [ ] `useNextAction(deal)` - rule-based NBA engine
  - Stage → Suggested Action mapping
  - Return action text + due date

### A3: Navigation Restructure
**Files to modify:**
```
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx
```

**Tasks:**
- [ ] Update tabs: Inbox → Deals → Properties → Settings
- [ ] Refocus Dashboard (`index.tsx`) to show top 5 actions from mock deals
- [ ] Keep existing screens working

### A4: Deals List Screen
**Files to create:**
```
app/(tabs)/deals/index.tsx
app/(tabs)/deals/_layout.tsx
src/features/deals/screens/DealsListScreen.tsx
```

**Tasks:**
- [ ] Adapt patterns from `LeadsListScreen.tsx`
- [ ] Stage filter tabs (All, New, Analyzing, Offer Sent, etc.)
- [ ] Search by address/lead name
- [ ] Deal cards with swipe actions
- [ ] FAB to add new deal

### A5: Deal Cockpit Screen
**Files to create:**
```
app/(tabs)/deals/[dealId].tsx
src/features/deals/screens/DealCockpitScreen.tsx
src/features/deals/components/DealStageHeader.tsx
src/features/deals/components/DealMetrics.tsx
src/features/deals/components/NextActionButton.tsx
src/features/deals/components/UnderwriteSnapshotCard.tsx
src/features/deals/components/OfferCard.tsx
src/features/deals/components/WalkthroughCard.tsx
src/features/deals/components/DealDocsCard.tsx
src/features/deals/components/SellerReportCard.tsx
```

**Tasks:**
- [ ] DealStageHeader - stage badge + NBA button
- [ ] DealMetrics - 3-number display (MAO, Profit/Cashflow, Risk)
  - **REUSE `useDealAnalysis`** for calculations
- [ ] Card components (tap to navigate to sub-screens)
- [ ] Layout matches "Apple screen" spec

### A6: Quick Underwrite Screen
**Files to create:**
```
src/features/deals/screens/QuickUnderwriteScreen.tsx
src/features/deals/components/EvidenceLink.tsx
```

**Tasks:**
- [ ] Wrapper around **existing `PropertyAnalysisTab`**
- [ ] Add 3-number header (pulls from `useDealAnalysis`)
- [ ] Add EvidenceLink component ("Why?" links)
- [ ] **REUSE `CashFlowAnalysis`** for assumptions drawer
- [ ] **REUSE `FinancingComparisonTable`** for 2-scenario compare

### A7: Fix Hard-Coded Values
**Files to modify:**
```
src/features/real-estate/hooks/useDealAnalysis.ts (lines 104-116)
```

**Tasks:**
- [ ] Replace hard-coded percentages with `buyingCriteria` values:
  - closingCosts: 3% → `buyingCriteria.closingExpenses`
  - holdingCosts: 2% → `buyingCriteria.holdingMonths * monthlyRate`
  - sellingCosts: 8% → `buyingCriteria.sellingCommission`
  - MAO rule: 70% → configurable

---

## ZONE B: Content Creation Features (Claude B)

**Focus:** Field Mode, Offer Builder, Seller Report

### B1: Field Mode Types & Mock Data
**Files to create:**
```
src/features/field-mode/types/index.ts
src/features/field-mode/data/mockWalkthrough.ts
```

**Tasks:**
- [ ] Create `Walkthrough` interface
- [ ] Create `WalkthroughItem` interface (photo, voice_memo)
- [ ] Create `PhotoBucket` type (exterior_roof, kitchen, baths, basement_mechanical, electrical_plumbing, notes_other)
- [ ] Create `AISummary` interface (issues, questions, scope_bullets)
- [ ] Create mock walkthrough data with sample AI output

### B2: Field Mode Screen & Components
**Files to create:**
```
src/features/field-mode/screens/FieldModeScreen.tsx
src/features/field-mode/components/PhotoBucket.tsx
src/features/field-mode/components/VoiceMemoRecorder.tsx
src/features/field-mode/components/WalkthroughSummary.tsx
src/features/field-mode/hooks/useWalkthrough.ts
src/features/field-mode/hooks/useVoiceRecording.ts
```

**Tasks:**
- [ ] PhotoBucket component
  - Accept photos from camera (expo-image-picker)
  - Accept photos from gallery
  - Display thumbnails
  - Delete photos
- [ ] VoiceMemoRecorder component
  - Record audio (expo-av)
  - Stop/pause recording
  - Playback audio
  - Display duration
- [ ] WalkthroughSummary component
  - Display issues list
  - Display questions to verify
  - Display scope-of-work bullets
- [ ] Mock "AI Organize" button (returns hardcoded sample output)
- [ ] useWalkthrough hook with mock data
- [ ] useVoiceRecording hook for expo-av

### B3: Field Mode Route
**Files to create:**
```
app/(tabs)/deals/[dealId]/field-mode.tsx
```

**Tasks:**
- [ ] Route from Deal Cockpit → Field Mode
- [ ] Pass deal context
- [ ] Back navigation

### B4: Offer Builder Types & Mock Data
**Files to create:**
```
src/features/deals/types/offers.ts (or extend index.ts)
src/features/deals/data/mockOffers.ts
```

**Tasks:**
- [ ] **REUSE existing `strategies.ts` types** (SellerFinancingSummary, etc.)
- [ ] Create `OfferTerms` interface per strategy
- [ ] Create mock offer data
- [ ] Create offer template text per strategy

### B5: Offer Builder Screen & Components
**Files to create:**
```
src/features/deals/screens/OfferBuilderScreen.tsx
src/features/deals/components/StrategySelector.tsx
src/features/deals/components/OfferTermsForm.tsx
src/features/deals/components/OfferPreview.tsx
src/features/deals/components/CopyScriptButton.tsx
```

**Tasks:**
- [ ] StrategySelector - Cash / Seller Finance / Subject-to
- [ ] OfferTermsForm - inputs per strategy
- [ ] OfferPreview - formatted offer text
- [ ] CopyScriptButton - copy call script to clipboard
- [ ] CopyEmailButton - copy follow-up email to clipboard
- [ ] Mock PDF preview (placeholder for server-side)

### B6: Offer Builder Route
**Files to create:**
```
app/(tabs)/deals/[dealId]/offer.tsx
```

**Tasks:**
- [ ] Route from Deal Cockpit → Offer Builder
- [ ] Pass deal context

### B7: Seller Report Types & Mock Data
**Files to create:**
```
src/features/deals/types/sellerReport.ts
src/features/deals/data/mockSellerReport.ts
```

**Tasks:**
- [ ] Create `SellerReport` interface
- [ ] Create `WeHandleOptions` interface (cleanout, closing_costs, title_search, etc.)
- [ ] Create mock seller report data
- [ ] Create report template text

### B8: Seller Report Screen & Components
**Files to create:**
```
src/features/deals/screens/SellerReportBuilderScreen.tsx
src/features/deals/components/WeHandleToggles.tsx
src/features/deals/components/SellerReportPreview.tsx
src/features/deals/components/ShareReportSheet.tsx
```

**Tasks:**
- [ ] WeHandleToggles - checkboxes for "What we cover"
- [ ] SellerReportPreview - formatted report text
- [ ] ShareReportSheet - bottom sheet with:
  - Copy share link placeholder
  - Copy SMS/email message template
  - Download PDF placeholder
- [ ] Pull data from `useDealAnalysis` for numbers

### B9: Seller Report Route
**Files to create:**
```
app/(tabs)/deals/[dealId]/seller-report.tsx
```

**Tasks:**
- [ ] Route from Deal Cockpit → Seller Report Builder
- [ ] Pass deal context

---

## INTEGRATION POINTS (After Both Zones Complete)

### Shared Types
- Zone A creates `Deal` type with `walkthroughId`, `offerId`, `sellerReportId` references
- Zone B creates the detail types
- Integration: Wire references together

### Navigation
- Zone A creates Deal Cockpit with card placeholders
- Zone B creates the screens those cards navigate to
- Integration: Wire navigation from cards to screens

### Testing Sequence
1. Zone A: Test Deal list → Deal Cockpit flow
2. Zone B: Test Field Mode, Offer Builder, Seller Report as standalone
3. Integration: Test full flow from Deals → Cockpit → Sub-screens

---

## Files NOT to Touch (Shared Dependencies)

Both zones should NOT modify these files to avoid conflicts:
```
src/features/real-estate/hooks/useDealAnalysis.ts   # Zone A fixes hard-coded values
src/features/real-estate/components/*              # Reuse only, don't modify
src/features/real-estate/types/*                   # Reuse only, don't modify
```

---

## Estimated Scope

| Zone | Tasks | New Files | Modified Files |
|------|-------|-----------|----------------|
| A | 7 major tasks | ~15 files | 3 files |
| B | 9 major tasks | ~18 files | 0 files |

Both zones can work independently until integration.
