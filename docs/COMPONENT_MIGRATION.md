# Component Migration Guide

This guide provides before/after examples for migrating to our reusable component patterns. These migrations improve code consistency, reduce duplication, and make the codebase easier to maintain.

---

## Table of Contents

1. [DataCard Migration](#datacard-migration)
2. [FormField Migration](#formfield-migration)
3. [Form State Migration (useForm)](#form-state-migration)
4. [ListEmptyState Migration](#listemptystate-migration)
5. [Design Token Migration](#design-token-migration)
6. [MessageBubble Migration (Completed)](#messagebubble-migration-completed)
7. [VendorCard to DataCard Migration (Completed)](#vendorcard-to-datacard-migration-completed)
8. [FilterSheet Pattern (Completed)](#filtersheet-pattern-completed)

---

## DataCard Migration

Consolidate custom card implementations into the reusable `DataCard` component.

### Before: Custom PropertyCard Implementation

```tsx
// Custom card with hardcoded styles and manual layout
<TouchableOpacity
  style={[
    styles.propertyCard,
    {
      backgroundColor: colors.muted,
      borderColor: colors.border,
    },
  ]}
  onPress={() => onPress(property)}
>
  <View style={styles.cardHeader}>
    <View style={styles.addressRow}>
      <MapPin size={16} color={colors.primary} />
      <Text style={[styles.address, { color: colors.foreground }]}>
        {property.address}
      </Text>
    </View>
    {property.status && (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(property.status) },
        ]}
      >
        <Text style={styles.statusText}>{property.status}</Text>
      </View>
    )}
  </View>

  <View style={styles.cardBody}>
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
        Purchase Price
      </Text>
      <Text style={[styles.priceValue, { color: colors.foreground }]}>
        {formatCurrency(property.purchasePrice)}
      </Text>
    </View>
    {/* More rows... */}
  </View>
</TouchableOpacity>
```

### After: Using DataCard

```tsx
// Clean, declarative API with consistent styling
<DataCard
  title={property.address}
  subtitle={property.city}
  icon={MapPin}
  badge={
    property.status
      ? { label: property.status, variant: getStatusVariant(property.status) }
      : undefined
  }
  rows={[
    {
      label: 'Purchase Price',
      value: formatCurrency(property.purchasePrice),
    },
    {
      label: 'ARV',
      value: formatCurrency(property.arv),
    },
    {
      label: 'ROI',
      value: `${property.roi}%`,
      valueColor: property.roi > 20 ? 'success' : undefined,
    },
  ]}
  onPress={() => onPress(property)}
/>
```

### Benefits

- ✅ **80% less code** - Eliminated 40+ lines of boilerplate
- ✅ **Automatic dark mode** - Colors managed by DataCard
- ✅ **Consistent spacing** - Uses design tokens
- ✅ **Built-in accessibility** - ARIA labels, roles, states

### Migration Checklist

- [ ] Replace custom card TouchableOpacity with `<DataCard>`
- [ ] Extract title/subtitle from custom header
- [ ] Convert data rows to `rows` prop array
- [ ] Move badges to `badge` prop
- [ ] Move onPress handler to DataCard's `onPress`
- [ ] Remove custom styles and color management

---

## FormField Migration

Replace verbose form field boilerplate with the reusable `FormField` component.

### Before: Manual Field Rendering

```tsx
// Verbose field with manual label, input, error handling
<View style={styles.fieldContainer}>
  <Text style={[styles.label, { color: colors.foreground }]}>
    Property Address
    {required && <Text style={{ color: colors.destructive }}> *</Text>}
  </Text>
  <TextInput
    style={[
      styles.input,
      {
        backgroundColor: colors.muted,
        borderColor: errors.address ? colors.destructive : colors.border,
        color: colors.foreground,
      },
    ]}
    value={address}
    onChangeText={setAddress}
    placeholder="123 Main St"
    placeholderTextColor={colors.mutedForeground}
    accessibilityLabel="Property address"
    accessibilityHint="Enter the property's street address"
  />
  {errors.address && (
    <Text style={[styles.errorText, { color: colors.destructive }]}>
      {errors.address}
    </Text>
  )}
</View>
```

### After: Using FormField

```tsx
// Clean, declarative field with built-in error handling
<FormField
  label="Property Address"
  required
  error={errors.address}
>
  <Input
    value={address}
    onChangeText={setAddress}
    placeholder="123 Main St"
  />
</FormField>
```

### Benefits

- ✅ **70% less code** - Reduced 20+ lines to 8
- ✅ **Automatic error display** - Errors shown consistently
- ✅ **Required field indicator** - Asterisk added automatically
- ✅ **Consistent spacing** - Managed by FormField
- ✅ **Built-in accessibility** - Labels linked to inputs

### Migration Checklist

- [ ] Wrap existing input with `<FormField>`
- [ ] Move label text to `label` prop
- [ ] Add `required` prop if needed
- [ ] Pass error message to `error` prop
- [ ] Remove manual label/error rendering
- [ ] Remove custom field container styles

---

## Form State Migration

Migrate from manual useState/errors management to the `useForm` hook.

### Before: Manual State Management

```tsx
// Manual state for each field
const [address, setAddress] = useState('');
const [city, setCity] = useState('');
const [state, setState] = useState('');
const [zip, setZip] = useState('');
const [purchasePrice, setPurchasePrice] = useState('');
const [bedrooms, setBedrooms] = useState('');
const [bathrooms, setBathrooms] = useState('');

// Manual error tracking
const [errors, setErrors] = useState<Record<string, string>>({});

// Manual validation
const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!address.trim()) {
    newErrors.address = 'Address is required';
  }
  if (!city.trim()) {
    newErrors.city = 'City is required';
  }
  if (!zip.trim()) {
    newErrors.zip = 'ZIP code is required';
  } else if (!/^\d{5}$/.test(zip)) {
    newErrors.zip = 'ZIP must be 5 digits';
  }
  if (purchasePrice && isNaN(Number(purchasePrice))) {
    newErrors.purchasePrice = 'Must be a valid number';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Manual submit handler
const handleSubmit = () => {
  if (!validateForm()) return;

  onSubmit({
    address,
    city,
    state,
    zip,
    purchasePrice: Number(purchasePrice),
    bedrooms: Number(bedrooms),
    bathrooms: Number(bathrooms),
  });
};
```

### After: Using useForm Hook

```tsx
// Declarative form state with built-in validation
const { register, handleSubmit, errors } = useForm<PropertyFormData>({
  initialValues: {
    address: '',
    city: '',
    state: '',
    zip: '',
    purchasePrice: 0,
    bedrooms: 0,
    bathrooms: 0,
  },
  validate: (values) => {
    const errors: Record<string, string> = {};

    if (!values.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!values.city.trim()) {
      errors.city = 'City is required';
    }
    if (!values.zip.trim()) {
      errors.zip = 'ZIP code is required';
    } else if (!/^\d{5}$/.test(values.zip)) {
      errors.zip = 'ZIP must be 5 digits';
    }

    return errors;
  },
  onSubmit,
});
```

### Usage in Component

```tsx
// Before: Manual field binding
<Input
  value={address}
  onChangeText={setAddress}
/>

// After: Automatic field binding
<Input {...register('address')} />
```

### Benefits

- ✅ **60% less boilerplate** - Eliminated 30+ lines of state management
- ✅ **Centralized validation** - All rules in one place
- ✅ **Automatic error tracking** - Errors managed by hook
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Consistent behavior** - Same API across all forms

### Migration Checklist

- [ ] Define form data type
- [ ] Replace individual useStates with `useForm` hook
- [ ] Move validation logic to `validate` option
- [ ] Replace manual field bindings with `register()`
- [ ] Update submit handler to use `handleSubmit()`
- [ ] Remove manual error state management

---

## ListEmptyState Migration

Replace custom empty state implementations with the reusable `ListEmptyState` component.

### Before: Custom Empty State

```tsx
// Conditional rendering with duplicated styling
{filteredLeads.length === 0 ? (
  isLoading ? (
    <LoadingSpinner fullScreen text="Loading leads..." className="py-20" />
  ) : error ? (
    <View className="flex-1 items-center justify-center py-20 px-4">
      <Text className="text-center mb-4" style={{ color: colors.destructive }}>
        Error loading leads
      </Text>
      <Button onPress={retry}>Try Again</Button>
    </View>
  ) : hasFilters ? (
    <View className="flex-1 items-center justify-center py-20">
      <Search size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
      <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
        No Results Found
      </Text>
      <Text className="text-center mb-6 px-8" style={{ color: colors.mutedForeground }}>
        Try adjusting your search or filters to find what you're looking for.
      </Text>
      <Button variant="secondary" onPress={clearFilters}>Clear All Filters</Button>
    </View>
  ) : (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-xl font-semibold mb-2" style={{ color: colors.foreground }}>
        No Leads Yet
      </Text>
      <Text className="text-center mb-6 px-8" style={{ color: colors.mutedForeground }}>
        Add your first lead to start building your pipeline.
      </Text>
      <Button onPress={handleAdd} size="lg">
        <Plus size={20} color={colors.primaryForeground} />
        <Text style={{ color: colors.primaryForeground }}>Add First Lead</Text>
      </Button>
    </View>
  )
) : (
  <FlatList data={filteredLeads} ... />
)}
```

### After: Using ListEmptyState

```tsx
// Clean, declarative empty states
<FlatList
  data={filteredLeads}
  renderItem={renderLeadCard}
  ListEmptyComponent={
    <ListEmptyState
      state={
        isLoading ? 'loading' :
        error ? 'error' :
        hasFilters ? 'filtered' :
        'empty'
      }
      icon={hasFilters ? Search : Users}
      title={
        error ? 'Error Loading Leads' :
        hasFilters ? 'No Results Found' :
        'No Leads Yet'
      }
      description={
        error ? error.message :
        hasFilters ? 'Try adjusting your search or filters.' :
        'Add your first lead to start building your pipeline.'
      }
      primaryAction={
        error ? { label: 'Try Again', onPress: retry } :
        hasFilters ? { label: 'Clear Filters', onPress: clearFilters } :
        { label: 'Add First Lead', onPress: handleAdd }
      }
    />
  }
/>
```

### Benefits

- ✅ **85% less code** - Reduced 50+ lines to 8
- ✅ **Consistent UX** - Same empty states across app
- ✅ **Built-in loading** - Loading spinner handled automatically
- ✅ **Automatic dark mode** - Colors managed by component
- ✅ **Accessibility** - Screen reader support built-in

### Migration Checklist

- [ ] Determine appropriate state (loading/error/filtered/empty)
- [ ] Choose icon for each state
- [ ] Define title and description text
- [ ] Set up primary action (button)
- [ ] Add secondary action if needed
- [ ] Replace custom empty state with `<ListEmptyState>`
- [ ] Test all states (loading, error, filtered, empty)

---

## Design Token Migration

Migrate hardcoded values to centralized design tokens for consistency.

### Before: Hardcoded Values

```tsx
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2f1',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});
```

### After: Using Design Tokens

```tsx
import { BORDER_RADIUS, SPACING, ICON_SIZES } from '@/constants/design-tokens';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: ICON_SIZES.md,
    height: ICON_SIZES.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.muted,  // Use theme colors
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
});
```

### Available Tokens

#### Border Radius
```typescript
BORDER_RADIUS = {
  sm: 6,
  md: 8,
  '10': 10,
  lg: 12,
  '14': 14,
  xl: 16,
  '18': 18,
  '2xl': 20,
  '24': 24,
  '28': 28,
  '36': 36,
  full: 9999,
}
```

#### Spacing
```typescript
SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
}
```

#### Icon Sizes
```typescript
ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
}
```

### Benefits

- ✅ **Consistent spacing** - Same values across entire app
- ✅ **Easier updates** - Change once, apply everywhere
- ✅ **Better readability** - Semantic names vs magic numbers
- ✅ **Fewer bugs** - No typos in hardcoded values

### Migration Checklist

- [ ] Import design tokens at top of file
- [ ] Replace hardcoded border-radius values
- [ ] Replace hardcoded spacing (padding, margin, gap)
- [ ] Replace hardcoded icon sizes
- [ ] Replace hardcoded colors with theme colors
- [ ] Test visual appearance (should match exactly)

---

## MessageBubble Migration (Completed)

> **Status:** ✅ Completed - Unified MessageBubble component created (January 2026)

### Unified Component

Location: `/src/components/ui/MessageBubble.tsx`

The unified MessageBubble component consolidates features from both the rental-inbox and assistant implementations:

| Feature | Support |
|---------|---------|
| Direction-based positioning | ✅ `direction: 'inbound' \| 'outbound'` |
| Role-based positioning | ✅ `role: 'user' \| 'assistant' \| 'system'` |
| AI indicator badge | ✅ `showAIIndicator` prop |
| Avatar icons (Bot/User) | ✅ `showAvatar` prop |
| Time format options | ✅ `timeFormat: 'absolute' \| 'relative'` |
| System messages | ✅ Centered pill style for `role='system'` |
| Sender labels | ✅ `showSenderLabel` + `senderLabel` props |

### Interface

```typescript
interface MessageBubbleProps {
  content: string;
  timestamp: string;
  direction?: 'inbound' | 'outbound';
  role?: 'user' | 'assistant' | 'system';
  isAI?: boolean;
  showAIIndicator?: boolean;
  showAvatar?: boolean;
  timeFormat?: 'absolute' | 'relative';
  showSenderLabel?: boolean;
  senderLabel?: string;
}
```

### Usage Examples

**Rental Inbox (AI indicator, absolute time):**
```typescript
import { MessageBubble } from '@/components/ui';

<MessageBubble
  content={message.content}
  timestamp={message.created_at}
  direction={message.direction}
  isAI={message.sent_by === 'ai'}
  showAIIndicator={true}
  showAvatar={false}
  timeFormat="absolute"
/>
```

**AI Assistant (avatars, relative time):**
```typescript
import { MessageBubble } from '@/components/ui';

<MessageBubble
  content={message.content}
  timestamp={message.createdAt}
  role={message.role}
  showAvatar={true}
  showAIIndicator={false}
  timeFormat="relative"
  showSenderLabel={false}
/>
```

### Feature-Specific Wrappers

For backwards compatibility, feature-specific wrappers exist that adapt local message types:

- `/src/features/rental-inbox/components/MessageBubble.tsx` - Wraps unified component for rental-inbox Message type
- `/src/features/assistant/components/MessageBubble.tsx` - Wraps unified component for assistant Message type

### Migration Checklist

- [x] Create unified component in `/src/components/ui/MessageBubble.tsx`
- [x] Support all features from both implementations
- [x] Update rental-inbox to use unified component
- [x] Update assistant to use unified component
- [x] Add exports to `/src/components/ui/index.ts`
- [x] Document in COMPONENT_MIGRATION.md

---

## VendorCard to DataCard Migration (Completed)

> **Status:** ✅ Completed - VendorCard migrated to DataCard (January 2026)

### Migration Results

| Metric | Before | After |
|--------|--------|-------|
| Lines of code | 227 | 137 |
| Reduction | - | 40% |
| Custom StyleSheet | Yes | No |
| Glass variant support | No | Yes |

### Features Preserved

All original features maintained:
- ✅ Category emoji (now in headerBadge)
- ✅ Name with primary indicator (Award icon in footerContent)
- ✅ Company name subtitle
- ✅ Rating display with star icon
- ✅ Jobs count
- ✅ Hourly rate with success color
- ✅ Contact actions (Call, Email)
- ✅ Navigation chevron
- ✅ Compact mode support
- ✅ Primary vendor border indicator

### Implementation

```typescript
import { DataCard, DataCardField, DataCardAction } from '@/components/ui';
import { ChevronRight, Phone, Mail, Star, Award, Briefcase } from 'lucide-react-native';

<DataCard
  onPress={onPress}
  variant={variant}
  glassIntensity={glassIntensity}
  title={vendor.name}
  subtitle={vendor.company_name || undefined}
  headerIcon={Briefcase}
  headerBadge={{
    label: `${categoryConfig.emoji} ${categoryConfig.label}`,
    variant: 'secondary',
    size: 'sm',
  }}
  headerRight={<ChevronRight size={20} color={colors.mutedForeground} />}
  fields={fields}  // Rating, jobs, hourly rate
  actions={actions}  // Call, Email buttons
  footerContent={
    vendor.is_primary ? (
      <View className="flex-row items-center gap-1 mb-2">
        <Award size={14} color={colors.primary} />
        <Text className="text-xs font-medium" style={{ color: colors.primary }}>
          Primary Vendor
        </Text>
      </View>
    ) : undefined
  }
  style={vendor.is_primary ? { borderLeftWidth: 4, borderLeftColor: colors.primary } : undefined}
/>
```

### Key Decisions

1. **Emoji handling**: Moved category emoji into headerBadge label (`"🔧 Plumber"`)
2. **Primary indicator**: Used footerContent for Award badge + left border via style prop
3. **Compact mode**: Fields and actions arrays are conditionally empty when compact=true
4. **Glass support**: Added variant and glassIntensity props for iOS 26 compatibility

### Migration Checklist

- [x] Identify all VendorCard features
- [x] Map features to DataCard props
- [x] Replace implementation with DataCard
- [x] Handle primary vendor indicator
- [x] Handle compact mode
- [x] Add glass variant support
- [x] Remove unused StyleSheet and imports

---

## FilterSheet Pattern (Completed)

> **Status:** ✅ Completed - FilterSheet component and useListFilters hook created (January 2026)

### Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| `FilterSheet` | `/src/components/ui/FilterSheet.tsx` | Base filter sheet with header/content/footer |
| `FilterSection` | Re-export of BottomSheetSection | Section with title for grouping options |
| `FilterOptionButton` | `/src/components/ui/FilterSheet.tsx` | Selectable list option with checkmark |
| `FilterChip` | `/src/components/ui/FilterSheet.tsx` | Compact pill-style filter option |
| `FilterToggleRow` | `/src/components/ui/FilterSheet.tsx` | Binary toggle (e.g., sort order) |
| `useListFilters` | `/src/hooks/useListFilters.ts` | Filter state management hook |

### FilterSheet Usage

```typescript
import { FilterSheet, FilterSection, FilterOptionButton } from '@/components/ui';
import { useListFilters } from '@/hooks';

// Setup filter state
const {
  filters,
  updateFilter,
  resetFilters,
  applyFilters,
  hasActiveFilters,
  hasUnsavedChanges,
} = useListFilters({
  initialFilters: appliedFilters,
  defaultFilters: DEFAULT_FILTERS,
  mode: 'deferred',
});

// Render filter sheet
<FilterSheet
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  title="Filter Leads"
  onReset={resetFilters}
  onApply={() => {
    applyFilters();
    setShowFilters(false);
  }}
  hasActiveFilters={hasActiveFilters}
  hasUnsavedChanges={hasUnsavedChanges}
  presentation="modal"  // or "sheet"
  footerStyle="apply"   // or "done" for immediate mode
>
  <FilterSection title="Status">
    {STATUS_OPTIONS.map(option => (
      <FilterOptionButton
        key={option.value}
        label={option.label}
        selected={filters.status === option.value}
        onPress={() => updateFilter('status', option.value)}
      />
    ))}
  </FilterSection>
</FilterSheet>
```

### useListFilters Hook

Supports two modes:

**Deferred Mode** (for Modal with Apply button):
```typescript
const { filters, updateFilter, resetFilters, applyFilters } = useListFilters({
  initialFilters: appliedFilters,
  defaultFilters: DEFAULT_FILTERS,
  mode: 'deferred',
});
// Changes are staged, then applied via applyFilters()
```

**Immediate Mode** (for BottomSheet with live updates):
```typescript
const { filters, updateFilter, resetFilters } = useListFilters({
  initialFilters: appliedFilters,
  defaultFilters: DEFAULT_FILTERS,
  mode: 'immediate',
  onChange: setAppliedFilters,
});
// Changes apply immediately via onChange callback
```

### Migration Checklist

- [x] Create FilterSheet base component
- [x] Create FilterSection (re-export of BottomSheetSection)
- [x] Create FilterOptionButton sub-component
- [x] Create FilterChip sub-component
- [x] Create FilterToggleRow sub-component
- [x] Create useListFilters hook
- [x] Export from `/src/components/ui/index.ts`
- [x] Export from `/src/hooks/index.ts`
- [ ] Migrate LeadsFiltersSheet (optional - works with existing code)
- [ ] Migrate ContactsFiltersSheet (optional - works with existing code)
- [ ] Migrate PropertyFiltersSheet (optional - works with existing code)

---

## When to Use Each Pattern

| Component | Use When... | Don't Use When... |
|-----------|-------------|-------------------|
| **DataCard** | Displaying structured data with rows | Custom layouts, image-heavy cards |
| **FormField** | Creating form inputs with labels | Non-form inputs, custom layouts |
| **useForm** | Managing form state with validation | Single input, simple forms |
| **ListEmptyState** | Showing empty/loading/error states | Custom, unique empty states |
| **Design Tokens** | Styling any component | One-off, exception values |
| **MessageBubble** | Chat/conversation UI | Non-message content |
| **FilterSheet** | List filtering UI | Complex multi-step filters |
| **useListFilters** | Managing filter state | Simple single-filter scenarios |
| **formatStatus()** | Displaying status strings | Custom status formatting needed |
| **GlassView** | Glass effect containers | Android performance-critical lists |

---

## Additional Resources

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens, iOS 26 Liquid Glass, utilities
- [UI_CONSISTENCY_GUIDE.md](./UI_CONSISTENCY_GUIDE.md) - Consistency patterns and anti-patterns
- [FORM_UTILITIES_GUIDE.md](./FORM_UTILITIES_GUIDE.md) - FormField and useForm documentation
- [UI Components](../src/components/ui/) - Component source code
- [Design Tokens](../src/constants/design-tokens.ts) - Token definitions
- [Shared Formatters](../src/lib/formatters.ts) - Status formatting utilities

---

## Questions?

If you have questions about migrating to these patterns:
1. Check existing migrations in the codebase for examples
2. Review the component source code in `/src/components/ui/`
3. Consult the design system documentation

**Remember:** These patterns are designed to save time and improve consistency. If you find yourself fighting the pattern, there may be a better approach - ask for help!
