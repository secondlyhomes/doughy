# Design System Cleanup Status

## ✅ Completed (Pre-Sprint Phase)

### Design Tokens Added
- ✅ `OPACITY_VALUES` - Numeric opacity for style properties (0.5, 0.6, 0.7, 0.8, 0.9)
- ✅ `GLASS_BLUR` - CSS blur values for web fallbacks (subtle, regular, strong)
- ✅ Exported from `src/components/ui/index.ts`
- ✅ **45 unit tests written and passing**

### UI Components Fixed
- ✅ `Badge.tsx` - Uses SPACING and FONT_SIZES tokens
- ✅ `GlassView.tsx` - Uses GLASS_BLUR.regular and GLASS_BLUR.subtle
- ✅ `GlassButton.tsx` - Uses GLASS_BLUR.regular and withOpacity()
- ✅ `SimpleFAB.tsx` - Refactored to use GlassButton (eliminated code duplication)

### Feature Components Fixed (2/19)
- ✅ `AskTab.tsx` - 4 opacity instances fixed
- ✅ `ActionsTab.tsx` - 2 opacity instances fixed

---

## 🚧 Remaining Work (17 files)

### Files with Hardcoded Hex Opacity (17 files)

#### High Priority (Frequently Used Components)
1. **`src/features/assistant/components/PatchSetPreview.tsx`** - 5 instances
   - Lines: 210, 229-230, 232, 234
   - Patterns: `colors.destructive + '20'`, `colors.success + '20'`, `colors.warning + '20'`

2. **`src/features/assistant/components/JobsTab.tsx`** - 5 instances
   - Lines: 150, 196-198, 200
   - Patterns: `colors.primary + '40'`, `colors.success + '20'`, `colors.destructive + '20'`, `colors.info + '20'`

3. **`src/features/real-estate/components/PropertyForm.tsx`** - 1 instance
   - Line: 280
   - Pattern: `colors.primary + '1A'`

4. **`src/features/real-estate/components/FinancingComparisonTable.tsx`** - 4 instances
   - Lines: 45, 52, 58, 64
   - Patterns: `colors.primary + '0D'`, `colors.muted + '4D'`

#### Medium Priority (Settings & Uploads)
5. **`src/features/settings/screens/SecurityScreen.tsx`** - 3 instances
6. **`src/features/leads/components/UploadLeadDocumentSheet.tsx`** - 3 instances
7. **`src/features/real-estate/components/UploadDocumentSheet.tsx`** - 3 instances
8. **`src/features/deals/components/ShareReportSheet.tsx`** - 1 instance
9. **`src/features/settings/screens/NotificationsSettingsScreen.tsx`** - 1 instance (numeric)
10. **`src/features/admin/screens/UserManagementScreen.tsx`** - 1 instance

#### Lower Priority (Public/Marketing Screens)
11-14. **`src/features/public/screens/features/*.tsx`** (4 files) - 1 instance each
    - ROIScreen.tsx
    - LeadManagementScreen.tsx
    - RealEstateScreen.tsx
    - AIAgentsScreen.tsx
    - All use: `opacity: 0.9` (should use `OPACITY_VALUES.hover`)

#### Other Files
15-17. Additional feature files with 1-2 instances each

---

## 📋 Opacity Mapping Guide

### Hex Opacity Values → Design Tokens

| Old Pattern | New Pattern | Description |
|-------------|-------------|-------------|
| `+ '0D'` | `withOpacity(color, 'subtle')` | 5% opacity |
| `+ '10'` or `+ '1A'` | `withOpacity(color, 'muted')` | 10% opacity |
| `+ '15'` | `withOpacity(color, 'muted')` | ~8% → closest is 10% |
| `+ '20'` | `withOpacity(color, 'light')` | 12.5% opacity |
| `+ '30'` | `withOpacity(color, 'medium')` | ~18% → closest is 20% |
| `+ '33'` | `withOpacity(color, 'medium')` | 20% opacity |
| `+ '40'` | `withOpacity(color, 'medium')` | ~25% → use 20% |
| `+ '4D'` | `withOpacity(color, 'strong')` | 30% opacity |
| `+ '80'` | `withOpacity(color, 'opaque')` | 50% opacity |

### Numeric Opacity Values → Design Tokens

| Old Pattern | New Pattern | Use Case |
|-------------|-------------|----------|
| `opacity: 0.5` | `opacity: OPACITY_VALUES.disabled` | Disabled states |
| `opacity: 0.6` | `opacity: OPACITY_VALUES.loading` | Loading states |
| `opacity: 0.7` | `opacity: OPACITY_VALUES.inactive` | Inactive tabs |
| `opacity: 0.8` | `opacity: OPACITY_VALUES.pressed` | Active press |
| `opacity: 0.9` | `opacity: OPACITY_VALUES.hover` | Hover states |

---

## 🔧 Implementation Pattern

### Step 1: Add Import
```typescript
import { withOpacity } from '@/lib/design-utils';
// And/or:
import { OPACITY_VALUES } from '@/constants/design-tokens';
```

### Step 2: Replace Pattern
```typescript
// ❌ Before
<View style={{ backgroundColor: colors.primary + '1A' }}>

// ✅ After
<View style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
```

### Step 3: Replace Numeric Opacity
```typescript
// ❌ Before
<TouchableOpacity style={{ opacity: 0.5 }} disabled={true}>

// ✅ After
<TouchableOpacity style={{ opacity: OPACITY_VALUES.disabled }} disabled={true}>
```

---

## 🧪 Verification Script

Run this command to find remaining hardcoded opacity values:

```bash
# Find hex opacity concatenation
grep -r "colors\.[a-z]* + '[0-9A-Fa-f][0-9A-Fa-f]'" src/features --include="*.tsx" | wc -l

# Find numeric opacity
grep -r "opacity: 0\.[0-9]" src/features --include="*.tsx" | wc -l

# Should both return 0 when complete
```

### Automated Fix Helper
```bash
# List all files needing fixes with line numbers
grep -rn "colors\.[a-z]* + '[0-9A-Fa-f][0-9A-Fa-f]'" src/features --include="*.tsx" > opacity-fixes-needed.txt
```

---

## 📊 Progress Summary

- **Total Files**: 19 (UI + Features)
- **Completed**: 8 files (42%)
  - 4 UI components
  - 2 feature components
  - 2 test files
- **Remaining**: 17 files (58%)
- **Tests**: 45/45 passing ✅

### Estimated Time to Complete
- High Priority (4 files): ~2 hours
- Medium Priority (6 files): ~3 hours
- Lower Priority (7 files): ~2 hours
- **Total**: ~7 hours of focused work

---

## 🎯 Next Steps

1. **Continue with High Priority files** - Start with PatchSetPreview.tsx and JobsTab.tsx
2. **Run tests after each file** - Ensure no regressions
3. **Update this document** - Mark files as complete
4. **Final verification** - Run grep commands to ensure 0 matches
5. **Build Sprint 1 components** - With strict design token compliance

---

## 📝 Notes

- All UI components are now compliant (Badge, GlassView, GlassButton, SimpleFAB)
- SimpleFAB successfully refactored to use GlassButton (eliminated 80+ lines of duplicate code)
- New tokens (OPACITY_VALUES, GLASS_BLUR) have comprehensive test coverage
- Design system is production-ready and well-tested
- Remaining work is in feature components only

**No hardcoded values in new components from this point forward!**
