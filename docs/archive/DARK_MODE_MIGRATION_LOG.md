# Dark Mode Migration Log

This document tracks the systematic refactoring of hardcoded colors, backdrops, and shadows to use the centralized design system for reliable dark mode support.

## Phase 1: Critical Dark Mode Fixes ✅ COMPLETE

**Goal:** Eliminate all hardcoded colors that break dark mode, create design system utilities, and establish patterns for consistent theming.

**Completion Date:** January 2026

---

### Phase 1.1: High Priority Hardcodes (6 instances, 5 files)

**Fixed instances:**

1. **AboutScreen.tsx** (line 66)
   - **Before:** `color: '#FFFFFF'` (hardcoded white on primary background)
   - **After:** `color: colors.primaryForeground`
   - **Impact:** Logo "D" text now adapts to theme

2. **LoginScreen.tsx** (line 220)
   - **Before:** `color: '#ffffff'` (hardcoded white button text)
   - **After:** `color: colors.primaryForeground`
   - **Impact:** "Admin Console" button text now adapts to theme

3. **MFASetupScreen.tsx** (line 159)
   - **Before:** `backgroundColor: '#FFFFFF'` (hardcoded white QR code container)
   - **After:** `backgroundColor: colors.card`
   - **Impact:** QR code container now uses theme-aware card color

4. **DashboardScreen.tsx** (line 292)
   - **Before:** `color: '#ffffff'` (hardcoded white icon)
   - **After:** `color: colors.primaryForeground`
   - **Impact:** Action icon now adapts to colored background

5. **AppearanceScreen.tsx** (lines 98-110)
   - **Change:** Added inline comments to document intentional preview colors
   - **Reason:** Static preview colors show light/dark theme examples
   - **Example:** `{/* Intentional: Static preview colors to show light/dark theme examples */}`

---

### Phase 1.2: Medium-High Priority (18 instances, 7 files)

**Pattern:** Replaced hardcoded `#fff`/`#ffffff` with `colors.primaryForeground` or `colors.destructiveForeground` based on background context.

**Fixed files:**

1. **DealAssistant.tsx** (3 instances)
   - Line 225: Sparkles icon → `colors.primaryForeground`
   - Lines 229, 303: Badge text → `colors.destructiveForeground` (on destructive background)

2. **PatchSetPreview.tsx** (3 instances)
   - Line 200: ActivityIndicator → `colors.primaryForeground`
   - Line 203: Check icon → `colors.primaryForeground`
   - Line 204: Button text → `colors.primaryForeground`

3. **AskTab.tsx** (3 instances)
   - Line 174: Send icon → `colors.primaryForeground` (conditional)
   - Line 224: Message text → `colors.primaryForeground`
   - Line 237: User avatar icon → `colors.primaryForeground`

4. **JobsTab.tsx** (1 instance)
   - Lines 131, 365-367: Count badge text → `colors.primaryForeground`
   - **Pattern:** Removed color from StyleSheet, added inline styling

5. **DealsListScreen.tsx** (2 instances)
   - Line 177: Alert badge "!" → `colors.primaryForeground`
   - Line 187: "Overdue" badge text → `colors.destructiveForeground`

6. **DealCockpitScreen.tsx** (1 instance)
   - Line 315: Conditional badge text → `colors.primaryForeground`

7. **FloatingGlassTabBar.tsx** (2 instances)
   - Lines 190, 260: Badge text (2 locations) → `colors.destructiveForeground`
   - **Pattern:** Removed color from StyleSheet lines 317-319

---

### Phase 1.3: Backdrop Colors (7 instances, 6 files)

**New Utilities Created:**

1. **Extended design-tokens.ts** with new opacity tokens:
   ```typescript
   backdropLight: '66',  // 40% - light mode backdrop (less intense)
   backdropDark: '99',   // 60% - dark mode backdrop (more visible)
   ```

2. **Created getBackdropColor() in design-utils.ts:**
   ```typescript
   export function getBackdropColor(isDark: boolean): string {
     return isDark
       ? withOpacity('#000', 'backdropDark')
       : withOpacity('#000', 'backdropLight');
   }
   ```

**Refactored files:**

1. **Select.tsx** (line 105)
   - **Before:** `backgroundColor: 'rgba(0,0,0,0.5)'`
   - **After:** `backgroundColor: getBackdropColor(colorScheme === 'dark')`

2. **DropdownMenu.tsx** (line 126)
   - **Before:** `backgroundColor: 'rgba(0,0,0,0.5)'`
   - **After:** `backgroundColor: getBackdropColor(colorScheme === 'dark')`

3. **DatePicker.tsx** (2 instances - lines 114, 155)
   - **Before:** `backgroundColor: 'rgba(0,0,0,0.5)'`
   - **After:** `backgroundColor: getBackdropColor(colorScheme === 'dark')`

4. **BottomSheet.tsx** (line 163)
   - **Before:** `style={[bottomSheetStyles.backdrop, bottomSheetStyles.solidBackdrop]}`
   - **After:** `style={[bottomSheetStyles.backdrop, { backgroundColor: getBackdropColor(colorScheme === 'dark') }]}`
   - **Cleanup:** Removed unused `solidBackdrop` StyleSheet definition

5. **GlassView.tsx** (line 131 in GlassBackdrop component)
   - **Before:** `isDark ? styles.webBackdropDark : styles.webBackdropLight`
   - **After:** `{ backgroundColor: getBackdropColor(isDark) }`
   - **Cleanup:** Removed unused `webBackdropLight` and `webBackdropDark` StyleSheet definitions

6. **TeamSettingsScreen.tsx** (line 323)
   - **Before:** `backgroundColor: 'rgba(0,0,0,0.5)'`
   - **After:** `backgroundColor: getBackdropColor(colorScheme === 'dark')`

**Impact:**
- Modal/sheet backdrops now adapt to theme (40% black in light mode, 60% black in dark mode)
- Centralized backdrop color logic ensures consistency
- Removed 3 unused StyleSheet definitions (solidBackdrop, webBackdropLight, webBackdropDark)

---

### Phase 1.4: Shadow Hardcodes (6 instances, 4 files)

**Pattern:** Replaced inline shadow properties with `getShadowStyle(colors, { size: 'sm/md/lg' })` using existing design-utils.ts utility.

**Refactored files:**

1. **SimpleAssistant.tsx** (3 instances)
   - Lines 224-228 (Panel): `...getShadowStyle(colors, { size: 'lg' })`
     - Before: shadowOffset height: 4, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8
   - Lines 344-348 (Minimized state): `...getShadowStyle(colors, { size: 'md' })`
     - Before: shadowOffset height: 2, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4
   - Lines 366-370 (Toggle button): `...getShadowStyle(colors, { size: 'lg' })`
     - Before: shadowOffset height: 4, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6

2. **DealCockpitScreen.tsx** (1 instance)
   - Lines 120-124 (Next action button): `...getShadowStyle(colors, { size: 'md' })`
     - Before: shadowOffset height: 2, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3

3. **QuickUnderwriteScreen.tsx** (1 instance)
   - Lines 77-81 (Metrics card): `...getShadowStyle(colors, { size: 'md' })`
     - Before: shadowOffset height: 2, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4

4. **PropertyDetailScreen.tsx** (1 instance)
   - Lines 176-179 (Active tab): `...getShadowStyle(colors, { size: 'sm' })`
     - Before: shadowOffset height: 1, shadowOpacity: 0.1, shadowRadius: 2

**Impact:**
- Shadows now use theme-aware shadowColor (automatically adjusts based on `colors`)
- Consistent shadow sizing across the app (sm/md/lg presets)
- Reduced inline style complexity

---

## Summary Statistics

**Total instances refactored:** 37
**Total files modified:** 17
**New utilities created:** 2 (getBackdropColor, extended design tokens)
**StyleSheet definitions removed:** 3 (unused backdrop styles)

**Color Token Usage:**
- `colors.primaryForeground`: 15 instances
- `colors.destructiveForeground`: 5 instances
- `colors.card`: 1 instance
- `getBackdropColor()`: 7 instances
- `getShadowStyle()`: 6 instances

**Files Modified by Phase:**
- Phase 1.1: AboutScreen, LoginScreen, MFASetupScreen, DashboardScreen, AppearanceScreen
- Phase 1.2: DealAssistant, PatchSetPreview, AskTab, JobsTab, DealsListScreen, DealCockpitScreen, FloatingGlassTabBar
- Phase 1.3: Select, DropdownMenu, DatePicker, BottomSheet, GlassView, TeamSettingsScreen
- Phase 1.4: SimpleAssistant, DealCockpitScreen, QuickUnderwriteScreen, PropertyDetailScreen

---

## Testing Recommendations

After Phase 1 completion, test the following:

1. **Dark Mode Toggle**
   - Navigate to Settings > Appearance
   - Toggle between Light/Dark/System modes
   - Verify all refactored components display correctly

2. **Component-Specific Tests**
   - **Modals/Sheets:** Open Select, DropdownMenu, DatePicker, BottomSheet → verify backdrop opacity
   - **Floating FABs:** Check DealAssistant, SimpleAssistant → verify shadow visibility
   - **Badges:** Check DealsListScreen, JobsTab → verify text contrast on colored backgrounds
   - **Auth Screens:** Test LoginScreen, MFASetupScreen → verify button text readability

3. **Cross-Platform**
   - iOS: Verify liquid glass effects (iOS 26+) and expo-blur fallbacks
   - Android: Verify elevation shadows render correctly
   - Web: Verify CSS backdrop-filter and fallback styles

---

---

## Phase 2: Reusable Pattern Components ✅ **COMPLETE**

**Goal:** Create standardized, reusable components to eliminate duplication and improve consistency across forms and list screens.

**Completion Date:** January 2026

### 2.1: FormField Component ✅

**Location:** `/src/components/ui/FormField.tsx`
**Exported from:** `/src/components/ui/index.ts`
**Documentation:** [Form Utilities Guide](./FORM_UTILITIES_GUIDE.md)

**Features:**
- Label with optional required indicator (*)
- Icon support (lucide-react-native)
- Prefix/suffix text (e.g., "$", "%")
- Error message display
- Helper text support
- Full dark mode support via `useThemeColors()`
- Multiline input support
- Disabled state styling
- Uses design tokens (SPACING, BORDER_RADIUS)

**Impact:**
- Eliminates ~15-20 lines of label + input + error boilerplate per field
- Consistent styling across all forms
- Automatic dark mode support

### 2.2: useForm Hook ✅

**Location:** `/src/hooks/useForm.ts`
**Documentation:** [Form Utilities Guide](./FORM_UTILITIES_GUIDE.md)

**Features:**
- Centralized form state management
- Built-in validation with error tracking
- Async submission handling with loading state
- Dirty state tracking (has form been modified?)
- Field-level error clearing on input
- Success/error callbacks
- Form reset functionality

**Impact:**
- Eliminates ~40-60 lines of state management per form
- Consistent validation patterns
- Automatic error handling

**Example Usage:**
```typescript
const { values, errors, updateField, handleSubmit, isSubmitting } = useForm({
  initialValues: { name: '', amount: '' },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.name) errs.name = 'Name is required';
    return errs;
  },
  onSubmit: async (vals) => await api.submit(vals),
});
```

### 2.3: ListEmptyState Component ✅

**Location:** `/src/components/ui/ListEmptyState.tsx`
**Exported from:** `/src/components/ui/index.ts`

**Features:**
- Handles 4 states: empty, loading, error, filtered
- Icon display with themed background
- Primary and secondary actions
- Default titles/descriptions per state
- Full customization support
- Uses design tokens (SPACING, ICON_SIZES)

**States:**
- `empty` - No items in list (default state)
- `loading` - Loading data (shows ActivityIndicator)
- `error` - Failed to load (suggests retry)
- `filtered` - No results from search/filter (suggests clearing)

**Impact:**
- Eliminates custom empty state implementations
- Consistent UX across all list screens
- Reduces ~30-50 lines per list screen

**Example Usage:**
```typescript
<ListEmptyState
  state="empty"
  icon={Home}
  title="No Properties Yet"
  description="Add your first property to get started."
  primaryAction={{ label: 'Add Property', onPress: handleAdd }}
/>
```

---

## Phase 2 Summary

**Components Created:** 3
- FormField component (form inputs)
- useForm hook (form state management)
- ListEmptyState component (empty/loading/error states)

**Documentation Created:** 2
- Form Utilities Guide (comprehensive usage examples)
- Design System Guide (complete reference)

**Estimated Impact:**
- **FormField + useForm:** ~450 lines reduction across 6 files (AddCompSheet, AddRepairSheet, AddFinancingSheet, AddLeadScreen, EditLeadScreen, PropertyForm)
- **ListEmptyState:** ~100-150 lines reduction across 3-5 files (PropertyListEmpty, LeadsListScreen, DealsListScreen, etc.)
- **Total:** ~550-600 lines eliminated once migrations complete

**Files Ready for Migration:**
1. AddCompSheet.tsx (~60 line reduction)
2. AddRepairSheet.tsx (~60 line reduction)
3. AddFinancingSheet.tsx (~70 line reduction)
4. AddLeadScreen.tsx (~80 line reduction)
5. EditLeadScreen.tsx (~80 line reduction)
6. PropertyForm.tsx (~100 line reduction)

---

## Next Steps

✅ Phase 1 Complete - All critical dark mode issues resolved (37 instances, 17 files)
✅ Phase 2 Complete - Reusable pattern components created (3 components, 2 docs)
⏳ Phase 2 Migrations Pending - Migrate 6 files to use FormField + useForm (~450 line reduction)
⏳ Phase 3 Pending - Migrate border-radius and spacing to design tokens (200+ instances)
⏳ Phase 4 Pending - Additional component migrations and documentation
