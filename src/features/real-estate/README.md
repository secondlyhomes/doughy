# Real Estate Feature

Mobile-optimized real estate property management feature for the Doughy AI app.

## Status: Complete

All phases from ZONE_C_INSTRUCTIONS.md have been implemented:
- Phase 1: Core Property Views ✅
- Phase 2: Property Forms ✅
- Phase 3: Advanced Features ✅

## Dependencies

The following packages are required (already installed):

```bash
npx expo install react-native-maps expo-image-picker expo-location lodash @types/lodash
```

## Setup

### 1. iOS Configuration

Already configured in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses your location to show nearby properties.",
        "NSCameraUsageDescription": "This app uses your camera to take property photos.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photos to add property images."
      }
    },
    "plugins": [
      ["expo-image-picker", {...}],
      ["expo-location", {...}]
    ]
  }
}
```

### 2. Android Configuration

Already configured in `app.json`. For production, add Google Maps API key:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

### 3. Navigation Setup

The RealEstateNavigator is already wired into MainNavigator and BottomTabs:

```tsx
// Already configured in src/routes/MainNavigator.tsx and
// src/features/layout/components/BottomTabs.tsx
import { RealEstateNavigator } from '@/features/real-estate';

<Tab.Screen name="Properties" component={RealEstateNavigator} />
```

## Components

### PropertyCard
Displays property info in list/grid layouts.

```tsx
import { PropertyCard } from '@/features/real-estate';

<PropertyCard
  property={property}
  isSelected={isSelected}
  onPress={handlePress}
  compact={false} // true for grid view
/>
```

### PropertyMap
Full interactive map with multiple properties.

```tsx
import { PropertyMap } from '@/features/real-estate';

<PropertyMap
  properties={properties}
  onPropertyPress={handlePropertyPress}
  selectedPropertyId={selectedId}
  showUserLocation={true}
/>
```

### PropertyLocationMap
Single property location display.

```tsx
import { PropertyLocationMap } from '@/features/real-estate';

<PropertyLocationMap
  address="123 Main St"
  city="Los Angeles"
  state="CA"
  zip="90001"
  geoPoint={{ lat: 34.0522, lng: -118.2437 }}
  height={200}
  showDirectionsButton={true}
/>
```

### PropertyImagePicker
Camera/gallery image picker using expo-image-picker.

```tsx
import { PropertyImagePicker } from '@/features/real-estate';

<PropertyImagePicker
  images={images}
  onChange={setImages}
  maxImages={10}
/>
```

### PropertyForm
Add/edit property form with validation.

```tsx
import { PropertyForm } from '@/features/real-estate';

<PropertyForm
  initialData={property} // optional for edit
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={isLoading}
  submitLabel="Save Property"
/>
```

### AddressAutocomplete
Address input with OpenStreetMap geocoding suggestions.

```tsx
import { AddressAutocomplete } from '@/features/real-estate';

<AddressAutocomplete
  value={address}
  onChange={setAddress}
  onAddressSelected={(result) => {
    // result: { address, city, state, zip, lat, lon }
    setCity(result.city);
    setState(result.state);
    setZip(result.zip);
  }}
  placeholder="Enter property address..."
/>
```

### PropertyAnalytics
Investment metrics dashboard with key financial indicators.

```tsx
import { PropertyAnalytics } from '@/features/real-estate';

<PropertyAnalytics
  purchasePrice={250000}
  arv={350000}
  monthlyRent={2500}
  monthlyExpenses={1800}
  totalRepairCost={30000}
  cashOnCashReturn={12.5}
  capRate={7.2}
  ltvRatio={75}
  totalInvestment={80000}
/>
```

## Screens

### PropertyListScreen
Main property list with search, filter, and grid/list toggle.

### PropertyDetailScreen
Full property details with tabs for info, analytics, and map.

### AddPropertyScreen
Modal screen for creating new properties.

### EditPropertyScreen
Modal screen for editing existing properties.

### PropertyMapScreen
Full-screen map view of all properties.

## Hooks

### useProperties
Fetch list of properties with filtering and sorting.

```tsx
import { useProperties } from '@/features/real-estate';

const { properties, isLoading, error, count, refetch } = useProperties({
  status: 'active',
  sortBy: 'created_desc',
  limit: 50,
});
```

### useProperty
Fetch single property by ID.

```tsx
import { useProperty } from '@/features/real-estate';

const { property, isLoading, error, refetch } = useProperty(propertyId);
```

### usePropertyMutations
Create, update, delete properties.

```tsx
import { usePropertyMutations } from '@/features/real-estate';

const { createProperty, updateProperty, deleteProperty, isLoading } = usePropertyMutations();

// Create - requires user to be authenticated
await createProperty({
  address: '123 Main St',
  city: 'Los Angeles',
  state: 'CA',
  zip: '90001'
});

// Update
await updateProperty(id, { arv: 500000 });

// Delete
await deleteProperty(id);
```

## Stores

### usePropertyStore
Zustand store for global property state with AsyncStorage persistence.

```tsx
import { usePropertyStore } from '@/features/real-estate';

const {
  selectedPropertyId,
  propertyData,
  loading,
  error,
  setSelectedPropertyId,
  fetchProperty,
  updateBasicInfo,
  refetchAll,
  clearPropertyData,
} = usePropertyStore();
```

### useDrawerStore
Mobile drawer state management.

```tsx
import { useDrawerStore } from '@/features/real-estate';

const { isOpen, openDrawer, closeDrawer, toggleDrawer } = useDrawerStore();
```

### Property Events
EventEmitter for cross-component communication (replaces DOM CustomEvents).

```tsx
import { propertyEvents, PROPERTY_EVENTS } from '@/features/real-estate';

// Listen for events
propertyEvents.on(PROPERTY_EVENTS.DATA_UPDATED, (data) => {
  console.log('Property updated:', data.propertyId);
});

// Emit events
propertyEvents.emit(PROPERTY_EVENTS.DATA_REFRESHED, { propertyId, timestamp: Date.now() });
```

## Types

All types are exported from the main index:

```tsx
import type {
  Property,
  DBProperty,
  PropertyImage,
  PropertyStatus,
  PropertyType,
  RepairEstimate,
  FinancingScenario,
  AddressResult,
  PropertyAnalyticsProps,
} from '@/features/real-estate';
```

## Navigation

### RealEstateNavigator
Stack navigator for all property screens.

```tsx
import { RealEstateNavigator } from '@/features/real-estate';
import type { RealEstateStackParamList } from '@/features/real-estate';

// Routes available:
// - PropertyList (initial)
// - PropertyDetail: { id: string }
// - AddProperty (modal)
// - EditProperty: { id: string } (modal)
// - PropertyMap
```

## File Structure

```
src/features/real-estate/
├── components/
│   ├── AddressAutocomplete.tsx    # Address input with geocoding
│   ├── PropertyAnalytics.tsx      # Investment metrics dashboard
│   ├── PropertyCard.tsx           # Property card (full/compact)
│   ├── PropertyForm.tsx           # Add/edit form
│   ├── PropertyImagePicker.tsx    # Camera/gallery picker
│   ├── PropertyLocationMap.tsx    # Single property map
│   ├── PropertyMap.tsx            # Multi-property map
│   └── index.ts
├── hooks/
│   ├── useProperties.ts           # Data fetching hooks
│   └── index.ts
├── navigation/
│   ├── RealEstateNavigator.tsx    # Stack navigator
│   └── index.ts
├── screens/
│   ├── AddPropertyScreen.tsx
│   ├── EditPropertyScreen.tsx
│   ├── PropertyDetailScreen.tsx
│   ├── PropertyListScreen.tsx     # With search/filter
│   ├── PropertyMapScreen.tsx
│   └── index.ts
├── stores/
│   ├── drawerStore.ts             # Mobile drawer state
│   ├── propertyStore.ts           # Main property store
│   └── index.ts
├── types/
│   ├── analysis.ts
│   ├── comps.ts
│   ├── constants.ts               # PropertyStatus, PropertyType enums
│   ├── debt.ts
│   ├── documents.ts
│   ├── financing.ts
│   ├── property.ts                # Core Property types
│   ├── repairs.ts
│   ├── strategies.ts
│   └── index.ts
├── utils/
│   ├── formatters.ts              # Currency, number, date formatters
│   └── index.ts
├── index.ts                       # Main exports
└── README.md
```

## Web to Mobile Conversions

| Web Pattern | Mobile Pattern |
|-------------|----------------|
| `react-leaflet` maps | `react-native-maps` |
| DOM CustomEvents | EventEmitter |
| localStorage | AsyncStorage |
| File input | expo-image-picker |
| CSS tables | FlatList |
| Modals | React Navigation modals |
| Sidebar | Drawer (useDrawerStore) |

## Testing

Run the app with:

```bash
npx expo start --port 8083 --clear
```

Navigate to the Properties tab to see the real estate feature.
