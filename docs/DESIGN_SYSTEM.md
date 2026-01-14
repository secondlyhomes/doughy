# Design System Guide

Comprehensive guide to the Doughy AI design system: tokens, utilities, components, and patterns.

**Last Updated:** January 2026
**Status:** Phase 1 & Phase 2 Complete

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Utility Functions](#utility-functions)
3. [Reusable Components](#reusable-components)
4. [Color Guidelines](#color-guidelines)
5. [Migration Guides](#migration-guides)
6. [Best Practices](#best-practices)

---

## Design Tokens

All design tokens are located in `/src/constants/design-tokens.ts`.

### Spacing

Based on a 4px grid system. Use these for padding, margins, and gaps.

```typescript
import { SPACING } from '@/constants/design-tokens';

<View style={{ padding: SPACING.lg, gap: SPACING.md }} />
```

**Available values:**
- `xs: 4` - Very tight spacing
- `sm: 8` - Tight spacing
- `md: 12` - Standard spacing
- `lg: 16` - Comfortable spacing
- `xl: 20` - Loose spacing
- `2xl: 24` - Extra loose
- `3xl: 32` - Section spacing
- `4xl: 40` - Large section spacing

### Border Radius

Consistent rounding for all UI elements.

```typescript
import { BORDER_RADIUS } from '@/constants/design-tokens';

<View style={{ borderRadius: BORDER_RADIUS.lg }} />
```

**Available values:**
- `sm: 6` - Subtle rounding
- `md: 8` - Standard rounding
- `lg: 12` - Comfortable rounding
- `xl: 16` - Prominent rounding
- `2xl: 20` - Extra prominent
- `full: 9999` - Fully rounded (pills, circles)

### Opacity

Hex suffix values for semi-transparent colors.

```typescript
import { OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

const mutedBg = withOpacity(colors.primary, 'muted'); // 10% opacity
```

**Available values:**
- `subtle: '0D'` - 5% opacity (very faint)
- `muted: '1A'` - 10% opacity (subtle backgrounds)
- `light: '20'` - 12.5% opacity (light overlays)
- `medium: '33'` - 20% opacity (standard overlays)
- `strong: '4D'` - 30% opacity (prominent overlays)
- `opaque: '80'` - 50% opacity (semi-transparent)
- `backdrop: '80'` - 50% opacity (default backdrop)
- `backdropLight: '66'` - 40% opacity (light mode backdrop)
- `backdropDark: '99'` - 60% opacity (dark mode backdrop)

### Shadows

Predefined shadow/elevation levels.

```typescript
import { getShadowStyle } from '@/lib/design-utils';

<View style={getShadowStyle(colors, { size: 'md' })} />
```

**Available sizes:**
- `sm` - Subtle shadow (cards, inputs)
- `md` - Standard shadow (buttons, elevated cards)
- `lg` - Prominent shadow (modals, FABs)
- `xl` - Maximum shadow (overlays, high elevation)

### Icon Sizes

Standard icon dimensions.

```typescript
import { ICON_SIZES } from '@/constants/design-tokens';

<Icon size={ICON_SIZES.lg} />
```

**Available values:**
- `xs: 12` - Tiny icons
- `sm: 14` - Small icons
- `md: 16` - Standard icons
- `lg: 20` - Large icons
- `xl: 24` - Extra large icons
- `2xl: 32` - Hero icons

---

## Utility Functions

Located in `/src/lib/design-utils.ts`.

### getShadowStyle()

Get theme-aware shadow styling.

```typescript
import { getShadowStyle } from '@/lib/design-utils';

// Basic usage
const shadowStyle = getShadowStyle(colors, { size: 'md' });

// With custom color
const glowStyle = getShadowStyle(colors, {
  size: 'lg',
  color: colors.primary
});

// Theme color glow
const themeGlow = getShadowStyle(colors, {
  size: 'lg',
  useThemeColor: true
});
```

**Options:**
- `size` - Shadow size preset (sm/md/lg/xl)
- `useThemeColor` - Use theme primary color (creates glow effect)
- `color` - Custom shadow color (overrides useThemeColor)

### withOpacity()

Add opacity to colors using design tokens.

```typescript
import { withOpacity } from '@/lib/design-utils';

const mutedBg = withOpacity(colors.primary, 'muted'); // 10%
const backdrop = withOpacity('#000', 'backdrop'); // 50%
const strongOverlay = withOpacity(colors.foreground, 'strong'); // 30%
```

### getBackdropColor()

Get theme-aware backdrop color for modals and sheets.

```typescript
import { getBackdropColor } from '@/lib/design-utils';
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const backdropColor = getBackdropColor(colorScheme === 'dark');

<View style={{ backgroundColor: backdropColor }} />
```

**Returns:**
- Light mode: `rgba(0, 0, 0, 0.4)` - 40% black
- Dark mode: `rgba(0, 0, 0, 0.6)` - 60% black

---

## Reusable Components

### FormField

Standardized form input with label, error, helper text, icons, and prefix/suffix support.

**Location:** `/src/components/ui/FormField.tsx`
**Documentation:** [Form Utilities Guide](./FORM_UTILITIES_GUIDE.md)

```typescript
import { FormField } from '@/components/ui';
import { DollarSign } from 'lucide-react-native';

<FormField
  label="Purchase Price"
  value={values.price}
  onChangeText={(text) => updateField('price', text)}
  error={errors.price}
  required
  prefix="$"
  icon={DollarSign}
  keyboardType="numeric"
  helperText="Enter the purchase price"
/>
```

**Key Features:**
- Label with required indicator (*)
- Icon support (left-side)
- Prefix/suffix text
- Error and helper text
- Full dark mode support
- Multiline support

### useForm Hook

Form state management with validation and submission handling.

**Location:** `/src/hooks/useForm.ts`
**Documentation:** [Form Utilities Guide](./FORM_UTILITIES_GUIDE.md)

```typescript
import { useForm } from '@/hooks/useForm';

const { values, errors, updateField, handleSubmit, isSubmitting } = useForm({
  initialValues: { name: '', amount: '' },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.name) errs.name = 'Name is required';
    if (!vals.amount) errs.amount = 'Amount is required';
    return errs;
  },
  onSubmit: async (vals) => {
    await api.submit(vals);
  },
});
```

**Key Features:**
- Centralized state management
- Built-in validation
- Async submission
- Dirty state tracking
- Auto error clearing

### ListEmptyState

Reusable empty state for list screens.

**Location:** `/src/components/ui/ListEmptyState.tsx`

```typescript
import { ListEmptyState } from '@/components/ui';
import { Home } from 'lucide-react-native';

// Empty state
<ListEmptyState
  state="empty"
  icon={Home}
  title="No Properties Yet"
  description="Add your first property to get started."
  primaryAction={{
    label: 'Add Property',
    onPress: handleAdd
  }}
/>

// Loading state
<ListEmptyState state="loading" />

// Error state
<ListEmptyState
  state="error"
  primaryAction={{ label: 'Try Again', onPress: retry }}
/>

// Filtered state
<ListEmptyState
  state="filtered"
  title="No Results"
  description="Try adjusting your search or filters."
  secondaryAction={{
    label: 'Clear Filters',
    onPress: clearFilters
  }}
/>
```

**States:**
- `empty` - No items in list
- `loading` - Loading data
- `error` - Failed to load
- `filtered` - No results from search/filter

### DataCard

Consolidated card component for displaying structured data.

**Location:** `/src/components/ui/DataCard.tsx`

```typescript
import { DataCard } from '@/components/ui';
import { MapPin, DollarSign } from 'lucide-react-native';

<DataCard
  title="123 Main St"
  subtitle="Single Family"
  icon={MapPin}
  badge={{ label: 'New', variant: 'default' }}
  fields={[
    { label: 'MAO', value: '$450,000', icon: DollarSign },
    { label: 'Bedrooms', value: '3' },
    { label: 'Bathrooms', value: '2' },
  ]}
  actions={[
    { label: 'View Details', onPress: handleView },
  ]}
  onPress={handlePress}
/>
```

### Timeline

Timeline component for displaying chronological events.

**Location:** `/src/components/ui/Timeline.tsx`

```typescript
import { Timeline } from '@/components/ui';

<Timeline
  events={[
    {
      id: '1',
      type: 'note',
      timestamp: new Date(),
      title: 'Initial Contact',
      description: 'Called seller about property',
      metadata: { caller: 'John Doe' },
    },
    {
      id: '2',
      type: 'status_change',
      timestamp: new Date(),
      title: 'Deal Created',
      description: 'Deal moved to analyzing stage',
    },
  ]}
  eventConfig={{
    note: { icon: FileText, color: 'info' },
    status_change: { icon: TrendingUp, color: 'success' },
  }}
/>
```

---

## Color Guidelines

### Theme Colors

All colors come from `useThemeColors()` hook and adapt to light/dark mode automatically.

```typescript
import { useThemeColors } from '@/context/ThemeContext';

const colors = useThemeColors();

// Primary colors
colors.primary           // Brand primary color
colors.primaryForeground // Text on primary background

// Semantic colors
colors.destructive       // Error/danger color
colors.destructiveForeground
colors.warning           // Warning color
colors.warningForeground
colors.success           // Success color
colors.successForeground
colors.info              // Info color
colors.infoForeground

// Neutral colors
colors.background        // Page background
colors.foreground        // Primary text
colors.card              // Card background
colors.cardForeground    // Text on cards
colors.muted             // Muted backgrounds
colors.mutedForeground   // Muted text
colors.border            // Border color
```

### When to Use Hardcoded Colors

**✅ ACCEPTABLE:**
- Public marketing pages (intentional brand colors)
- Test mocks and fixtures
- Static preview/demo colors (with inline comment explaining why)

**❌ PROHIBITED:**
- Component styling (always use `colors`)
- Modal/sheet backdrops (use `getBackdropColor()`)
- Shadows (use `getShadowStyle()`)
- Text on colored backgrounds (use `primaryForeground`, `destructiveForeground`, etc.)

**Pattern for acceptable hardcodes:**
```typescript
// Intentional: Static brand color for marketing hero
backgroundColor: '#4d7c5f'
```

---

## Migration Guides

### Migrating Hardcoded Colors

**Before:**
```typescript
<Text style={{ color: '#ffffff' }}>Button Text</Text>
<View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
```

**After:**
```typescript
<Text style={{ color: colors.primaryForeground }}>Button Text</Text>
<View style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }} />
```

### Migrating Shadows

**Before:**
```typescript
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
}} />
```

**After:**
```typescript
<View style={getShadowStyle(colors, { size: 'md' })} />
```

### Migrating Forms

**Before (100+ lines):**
```typescript
const [name, setName] = useState('');
const [amount, setAmount] = useState('');
const [errors, setErrors] = useState({});

// Manual validation
// Manual error clearing
// Manual submission handling
```

**After (40 lines):**
```typescript
const { values, errors, updateField, handleSubmit } = useForm({
  initialValues: { name: '', amount: '' },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.name) errs.name = 'Required';
    return errs;
  },
  onSubmit: async (vals) => await api.submit(vals),
});
```

---

## Best Practices

### 1. Always Use Theme Colors

```typescript
// ❌ Bad
<Text style={{ color: '#000' }}>Text</Text>

// ✅ Good
<Text style={{ color: colors.foreground }}>Text</Text>
```

### 2. Use Design Tokens for Spacing

```typescript
// ❌ Bad
<View style={{ padding: 16, gap: 8 }} />

// ✅ Good
<View style={{ padding: SPACING.lg, gap: SPACING.sm }} />
```

### 3. Use Shadow Utility

```typescript
// ❌ Bad
shadowColor: '#000', shadowOffset: { width: 0, height: 2 }

// ✅ Good
getShadowStyle(colors, { size: 'md' })
```

### 4. Use FormField for Inputs

```typescript
// ❌ Bad - Manual label, input, error
<View>
  <Text>{label}</Text>
  <TextInput value={value} onChangeText={setValue} />
  {error && <Text>{error}</Text>}
</View>

// ✅ Good - FormField handles everything
<FormField
  label={label}
  value={value}
  onChangeText={setValue}
  error={error}
/>
```

### 5. Use ListEmptyState for Empty Lists

```typescript
// ❌ Bad - Custom empty state each time
{items.length === 0 && (
  <View>
    <Text>No items</Text>
    <Button onPress={handleAdd}>Add</Button>
  </View>
)}

// ✅ Good - Consistent empty state
{items.length === 0 && (
  <ListEmptyState
    state="empty"
    title="No Items"
    primaryAction={{ label: 'Add', onPress: handleAdd }}
  />
)}
```

### 6. Test Dark Mode

Always test components in both light and dark mode:

1. Navigate to Settings > Appearance
2. Toggle between Light/Dark/System
3. Verify text contrast and readability
4. Check backgrounds and borders

---

## Component Consolidation

The following components have been consolidated:

### ✅ DataCard
**Replaces:**
- PropertyCard (partially)
- LeadCard
- DealCard
- Generic card implementations

**Usage:** Anywhere you need a card with structured data

### ✅ Timeline
**Replaces:**
- DealTimeline (specialized version)
- LeadActivityFeed
- Custom timeline implementations

**Usage:** Anywhere you need chronological event display

### ✅ FormField + useForm
**Replaces:**
- Manual form inputs in 6+ files
- Duplicated validation logic
- Custom error handling

**Usage:** All forms (AddCompSheet, AddRepairSheet, etc.)

### ✅ ListEmptyState
**Replaces:**
- PropertyListEmpty (custom implementation)
- Various empty state patterns
- Loading/error states

**Usage:** All list screens (Leads, Deals, Properties, etc.)

---

## Files Modified (Phase 1 & 2)

### Phase 1 - Dark Mode Fixes (17 files)
- AboutScreen.tsx
- LoginScreen.tsx
- MFASetupScreen.tsx
- DashboardScreen.tsx
- AppearanceScreen.tsx
- DealAssistant.tsx
- PatchSetPreview.tsx
- AskTab.tsx
- JobsTab.tsx
- DealsListScreen.tsx
- DealCockpitScreen.tsx
- FloatingGlassTabBar.tsx
- Select.tsx
- DropdownMenu.tsx
- DatePicker.tsx
- BottomSheet.tsx
- GlassView.tsx
- TeamSettingsScreen.tsx
- SimpleAssistant.tsx
- QuickUnderwriteScreen.tsx
- PropertyDetailScreen.tsx

### Phase 2 - New Components Created (3 files)
- FormField.tsx (new)
- useForm.ts (new)
- ListEmptyState.tsx (new)

### Documentation Created (3 files)
- DARK_MODE_MIGRATION_LOG.md
- FORM_UTILITIES_GUIDE.md
- DESIGN_SYSTEM.md (this file)

---

## Verification Commands

Find remaining hardcoded colors:
```bash
rg '#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}(?![0-9a-fA-F])' \
  --type tsx \
  --glob '!src/features/public/**' \
  --glob '!src/**/__tests__/**' \
  --glob '!src/context/ThemeContext.tsx'
```

Find hardcoded rgba:
```bash
rg 'rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,' \
  --type tsx \
  --glob '!src/features/public/**' \
  --glob '!src/**/__tests__/**'
```

Expected result after Phase 1: **0 matches** (excluding acceptable cases)

---

## Next Steps

### Phase 3: Design Token Migration (Pending)
- Migrate border-radius values (50+ instances)
- Migrate spacing values (150+ instances)
- Create intermediate tokens for common values

### Phase 4: Additional Documentation (Pending)
- Component migration examples
- Video walkthrough
- Interactive Storybook

---

## Support

For questions or issues with the design system:

1. Check this guide first
2. Review migration logs ([DARK_MODE_MIGRATION_LOG.md](./DARK_MODE_MIGRATION_LOG.md), [FORM_UTILITIES_GUIDE.md](./FORM_UTILITIES_GUIDE.md))
3. Look for similar patterns in the codebase
4. Create a GitHub issue if stuck

**Remember:** Consistency is key. When in doubt, use design tokens and reusable components.
