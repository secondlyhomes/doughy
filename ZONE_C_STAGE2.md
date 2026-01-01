# ZONE C: Real Estate Features - Stage 2

**Instance 3 Assignment - Full Implementation**

## Overview

Fully implement all real estate property management features from the web app.

**Source Directory:** `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/real-estate/` (254 files)

**Target Directory:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/features/real-estate/`

---

## Current Status (Stage 1 Complete)

Basic navigation and placeholder screens exist. Need full feature implementation.

---

## Phase 1: Property List & Grid (Priority: CRITICAL)

### 1.1 Property List View

**Web Files to Convert:**
- `src/features/real-estate/components/properties/PropertyList.tsx`
- `src/features/real-estate/components/properties/PropertyCard.tsx`
- `src/features/real-estate/components/properties/PropertyFilters.tsx`
- `src/features/real-estate/components/properties/PropertySort.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── PropertyListScreen.tsx          [ ] - FlatList with pull-to-refresh
├── components/
│   ├── PropertyCard.tsx            [ ] - Card for list item
│   ├── PropertyCardCompact.tsx     [ ] - Smaller card variant
│   ├── PropertyListHeader.tsx      [ ] - Search + filters button
│   ├── PropertyFiltersSheet.tsx    [ ] - Bottom sheet with filters
│   ├── PropertySortSheet.tsx       [ ] - Sort options sheet
│   └── PropertyEmptyState.tsx      [ ] - No properties view
```

### 1.2 Property Search

**Web Files to Convert:**
- `src/features/real-estate/components/search/PropertySearch.tsx`
- `src/features/real-estate/hooks/usePropertySearch.ts`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── PropertySearchScreen.tsx        [ ] - Dedicated search screen
├── components/
│   ├── SearchBar.tsx               [ ] - Search input
│   ├── SearchSuggestions.tsx       [ ] - Auto-complete
│   ├── RecentSearches.tsx          [ ] - Search history
│   └── SearchFilters.tsx           [ ] - Advanced filters
```

---

## Phase 2: Property Detail View (Priority: CRITICAL)

### 2.1 Main Detail Screen

**Web Files to Convert:**
- `src/features/real-estate/pages/PropertyWorkspacePage.tsx`
- `src/features/real-estate/components/PropertyDetailTabs.tsx`
- `src/features/real-estate/components/OverviewPanel.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── PropertyDetailScreen.tsx        [ ] - Main detail view
├── components/
│   ├── PropertyHeader.tsx          [ ] - Image + title + price
│   ├── PropertyImageGallery.tsx    [ ] - Swipeable gallery
│   ├── PropertyQuickStats.tsx      [ ] - Beds/baths/sqft
│   ├── PropertyTabs.tsx            [ ] - Tab navigation
│   ├── PropertyOverview.tsx        [ ] - Overview tab content
│   ├── PropertyDescription.tsx     [ ] - Full description
│   └── PropertyFeatures.tsx        [ ] - Feature list
```

### 2.2 Property Images

**Web Files to Convert:**
- `src/features/real-estate/components/PropertyImageDisplay.tsx`
- `src/features/real-estate/components/ImageUploader.tsx`

**Mobile Implementation:**
```
src/features/real-estate/components/
├── PropertyImageCarousel.tsx       [ ] - Full-screen swipeable
├── PropertyImageGrid.tsx           [ ] - Thumbnail grid
├── PropertyImageViewer.tsx         [ ] - Zoom/pan modal
├── ImageUploadButton.tsx           [ ] - expo-image-picker
└── ImageUploadProgress.tsx         [ ] - Upload status
```

### 2.3 Property Map

**Web Files to Convert:**
- `src/features/real-estate/components/PropertyLocationMap.tsx`

**Mobile Implementation:**
```
src/features/real-estate/components/
├── PropertyLocationMap.tsx         [x] Native done
├── PropertyLocationMap.web.tsx     [x] Web fallback done
├── PropertyMapFullscreen.tsx       [ ] - Expandable map
└── DirectionsButton.tsx            [ ] - Open in Maps app
```

---

## Phase 3: Property Forms (Priority: HIGH)

### 3.1 Add Property

**Web Files to Convert:**
- `src/features/real-estate/components/properties/PropertyForm.tsx`
- `src/features/real-estate/components/properties/AddPropertyModal.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── AddPropertyScreen.tsx           [ ] - Multi-step form
├── components/
│   ├── PropertyFormStep1.tsx       [ ] - Basic info (address, type)
│   ├── PropertyFormStep2.tsx       [ ] - Details (beds, baths, sqft)
│   ├── PropertyFormStep3.tsx       [ ] - Pricing (ARV, purchase)
│   ├── PropertyFormStep4.tsx       [ ] - Images upload
│   ├── PropertyFormStep5.tsx       [ ] - Notes/description
│   ├── PropertyFormProgress.tsx    [ ] - Step indicator
│   └── PropertyFormSummary.tsx     [ ] - Review before save
```

### 3.2 Edit Property

**Web Files to Convert:**
- `src/features/real-estate/components/EditPropertyModal.tsx`
- `src/features/real-estate/components/PropertyEditableFields.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── EditPropertyScreen.tsx          [ ] - Edit form
├── components/
│   ├── EditableField.tsx           [ ] - Inline editable
│   ├── EditableAddress.tsx         [ ] - Address autocomplete
│   ├── EditablePrice.tsx           [ ] - Currency input
│   └── EditableSelect.tsx          [ ] - Dropdown field
```

### 3.3 Address Autocomplete

**Mobile Implementation:**
```
src/features/real-estate/components/
├── AddressAutocomplete.tsx         [ ] - Google Places integration
├── AddressSearchResults.tsx        [ ] - Results list
└── AddressSuggestionItem.tsx       [ ] - Single result
```

**Notes:**
- Use `expo-location` for current location
- Google Places API for autocomplete
- Or use OpenStreetMap Nominatim (free)

---

## Phase 4: Financial Analysis (Priority: HIGH)

### 4.1 ARV & Comps

**Web Files to Convert:**
- `src/features/real-estate/components/comps/CompsPanel.tsx`
- `src/features/real-estate/components/comps/CompCard.tsx`
- `src/features/real-estate/components/comps/CompsMap.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── CompsScreen.tsx                 [ ] - Comparable properties
├── CompDetailScreen.tsx            [ ] - Single comp detail
├── components/
│   ├── CompsPanel.tsx              [ ] - Tab panel content
│   ├── CompCard.tsx                [ ] - Comp property card
│   ├── CompsMapView.tsx            [ ] - Map with markers
│   ├── CompAdjustments.tsx         [ ] - Value adjustments
│   └── ARVCalculator.tsx           [ ] - ARV computation
```

### 4.2 Deal Analysis

**Web Files to Convert:**
- `src/features/real-estate/components/analysis/*.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── DealAnalysisScreen.tsx          [ ] - Full analysis view
├── components/
│   ├── DealSummaryCard.tsx         [ ] - Quick deal metrics
│   ├── ProfitCalculator.tsx        [ ] - Profit breakdown
│   ├── CashFlowChart.tsx           [ ] - Cash flow graph
│   ├── ROIDisplay.tsx              [ ] - ROI metrics
│   └── ScenarioComparison.tsx      [ ] - Compare scenarios
```

### 4.3 Repair Estimates

**Web Files to Convert:**
- `src/features/real-estate/components/repairs/*.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── RepairEstimateScreen.tsx        [ ] - Repair cost estimator
├── components/
│   ├── RepairCategoryCard.tsx      [ ] - Category (kitchen, bath, etc)
│   ├── RepairLineItem.tsx          [ ] - Individual repair item
│   ├── RepairCostInput.tsx         [ ] - Cost entry
│   ├── RepairTotalSummary.tsx      [ ] - Total costs
│   └── RepairPresets.tsx           [ ] - Quick presets
```

---

## Phase 5: Financing Options (Priority: MEDIUM)

### 5.1 Financing Scenarios

**Web Files to Convert:**
- `src/features/real-estate/components/financing/*.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── FinancingScreen.tsx             [ ] - Financing options
├── AddFinancingScreen.tsx          [ ] - Add new scenario
├── components/
│   ├── FinancingScenarioCard.tsx   [ ] - Scenario summary
│   ├── LoanCalculator.tsx          [ ] - Loan details
│   ├── PaymentBreakdown.tsx        [ ] - Payment schedule
│   ├── InterestRateSlider.tsx      [ ] - Rate input
│   └── LoanTermPicker.tsx          [ ] - Term selection
```

---

## Phase 6: Documents & Notes (Priority: MEDIUM)

### 6.1 Property Documents

**Web Files to Convert:**
- `src/features/real-estate/components/documents/*.tsx`

**Mobile Implementation:**
```
src/features/real-estate/screens/
├── PropertyDocumentsScreen.tsx     [ ] - Document list
├── DocumentViewerScreen.tsx        [ ] - View document
├── components/
│   ├── DocumentCard.tsx            [ ] - Document item
│   ├── DocumentUpload.tsx          [ ] - Upload button
│   └── DocumentPreview.tsx         [ ] - Preview modal
```

### 6.2 Property Notes

**Mobile Implementation:**
```
src/features/real-estate/components/
├── PropertyNotes.tsx               [ ] - Notes section
├── NoteCard.tsx                    [ ] - Single note
├── AddNoteModal.tsx                [ ] - Add note form
└── NoteEditor.tsx                  [ ] - Rich text editor
```

---

## Phase 7: Property Actions (Priority: MEDIUM)

### 7.1 Share & Export

**Mobile Implementation:**
```
src/features/real-estate/components/
├── PropertyShareSheet.tsx          [ ] - Share action sheet
├── PropertyExport.tsx              [ ] - Export to PDF
└── PropertyQRCode.tsx              [ ] - QR code generator
```

### 7.2 Property Status

**Mobile Implementation:**
```
src/features/real-estate/components/
├── PropertyStatusBadge.tsx         [ ] - Status display
├── PropertyStatusPicker.tsx        [ ] - Change status
└── PropertyArchive.tsx             [ ] - Archive/delete
```

---

## Hooks to Implement

```
src/features/real-estate/hooks/
├── useProperties.ts                [ ] - Property list
├── useProperty.ts                  [ ] - Single property
├── usePropertySearch.ts            [ ] - Search functionality
├── usePropertyFilters.ts           [ ] - Filter state
├── useComps.ts                     [ ] - Comparable properties
├── useRepairEstimate.ts            [ ] - Repair costs
├── useFinancingScenarios.ts        [ ] - Financing options
├── useDealAnalysis.ts              [ ] - Analysis calculations
├── usePropertyImages.ts            [ ] - Image management
└── usePropertyDocuments.ts         [ ] - Document handling
```

---

## Services to Implement

```
src/features/real-estate/services/
├── propertyService.ts              [ ] - CRUD operations
├── compsService.ts                 [ ] - Fetch comps
├── analysisService.ts              [ ] - Run analysis
├── imageService.ts                 [ ] - Image upload/delete
├── documentService.ts              [ ] - Document handling
├── geocodingService.ts             [ ] - Address to coords
└── exportService.ts                [ ] - PDF/share export
```

---

## Store Implementation

```tsx
// src/features/real-estate/stores/propertyStore.ts
// Already exists - enhance with:

interface PropertyStore {
  // List state
  properties: Property[];
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: PropertyFilters;
  sortBy: SortOption;
  searchQuery: string;

  // Selected property
  selectedProperty: Property | null;

  // Actions
  fetchProperties: () => Promise<void>;
  fetchProperty: (id: string) => Promise<void>;
  createProperty: (data: PropertyFormData) => Promise<void>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  setFilters: (filters: PropertyFilters) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
}
```

---

## Types to Define

```tsx
// src/features/real-estate/types/index.ts

export interface Property {
  id: string;
  workspace_id: string;
  user_id: string;

  // Address
  address: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  geo_point?: { lat: number; lng: number };

  // Details
  property_type: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;

  // Financials
  arv?: number;
  purchase_price?: number;
  repair_cost?: number;

  // Status
  status: PropertyStatus;

  // Media
  images?: PropertyImage[];
  primary_image_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export type PropertyType =
  | 'single_family'
  | 'multi_family'
  | 'condo'
  | 'townhouse'
  | 'land'
  | 'commercial';

export type PropertyStatus =
  | 'lead'
  | 'analyzing'
  | 'offer_pending'
  | 'under_contract'
  | 'closed'
  | 'archived';

export interface PropertyFilters {
  status?: PropertyStatus[];
  propertyType?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  city?: string;
  state?: string;
}

export interface Comp {
  id: string;
  property_id: string;
  address: string;
  sale_price: number;
  sale_date: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  distance_miles: number;
  adjustments?: CompAdjustment[];
  adjusted_price?: number;
}

export interface RepairEstimate {
  id: string;
  property_id: string;
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost?: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface FinancingScenario {
  id: string;
  property_id: string;
  name: string;
  loan_amount: number;
  interest_rate: number;
  loan_term_months: number;
  down_payment: number;
  monthly_payment: number;
}
```

---

## Navigation Structure

```tsx
// Add to real-estate navigator
const PropertyStack = createNativeStackNavigator();

<PropertyStack.Navigator>
  <PropertyStack.Screen name="PropertyList" component={PropertyListScreen} />
  <PropertyStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
  <PropertyStack.Screen name="PropertySearch" component={PropertySearchScreen} />
  <PropertyStack.Screen name="AddProperty" component={AddPropertyScreen} />
  <PropertyStack.Screen name="EditProperty" component={EditPropertyScreen} />
  <PropertyStack.Screen name="Comps" component={CompsScreen} />
  <PropertyStack.Screen name="CompDetail" component={CompDetailScreen} />
  <PropertyStack.Screen name="DealAnalysis" component={DealAnalysisScreen} />
  <PropertyStack.Screen name="RepairEstimate" component={RepairEstimateScreen} />
  <PropertyStack.Screen name="Financing" component={FinancingScreen} />
  <PropertyStack.Screen name="Documents" component={PropertyDocumentsScreen} />
</PropertyStack.Navigator>
```

---

## Dependencies to Install

```bash
npm install react-native-image-zoom-viewer  # Image gallery
npm install react-native-pdf                 # PDF viewing
npm install react-native-share               # Share functionality
```

---

## Testing Checklist

- [ ] Property list loads and displays correctly
- [ ] Property search works with filters
- [ ] Property detail shows all information
- [ ] Image gallery is swipeable
- [ ] Map displays property location
- [ ] Add property form submits successfully
- [ ] Edit property saves changes
- [ ] Comps load and display on map
- [ ] Deal analysis calculates correctly
- [ ] Repair estimates save and total
- [ ] Financing scenarios calculate payments
- [ ] Documents upload and display
- [ ] Share/export functions work
