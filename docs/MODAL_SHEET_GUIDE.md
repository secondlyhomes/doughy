# Modal & Sheet Presentation Guide

Comprehensive guide for choosing the right presentation style for overlays and modal content in Doughy AI.

**Last Updated:** February 1, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Decision Framework](#decision-framework)
3. [Bottom Sheet](#bottom-sheet)
4. [Focused Sheet](#focused-sheet)
5. [Stack Navigation](#stack-navigation)
6. [Migration Guide](#migration-guide)
7. [ADHD-Friendly Patterns](#adhd-friendly-patterns)

---

## Overview

The app uses three presentation patterns for modal content:

| Pattern | Component | iOS Behavior | Best For |
|---------|-----------|--------------|----------|
| **Bottom Sheet** | `BottomSheet` | Slides up, glass background | Quick actions, simple inputs |
| **Focused Sheet** | `FocusedSheet` | Native pageSheet, swipe dismiss | Complex forms, focused work |
| **Stack Navigation** | Router/Stack | Full screen push | Multi-step wizards |

### Key Principle

**Reduce cognitive load.** Complex forms behind transparent glass are distracting. Match the presentation to the task complexity.

---

## Decision Framework

### Quick Decision Tree

```
Is it quick (1-4 fields, 3-5 actions)?
├── Yes → Bottom Sheet
└── No → Is it a single focused form (5+ fields)?
    ├── Yes → Focused Sheet
    └── No → Is it multi-step (3+ distinct views)?
        ├── Yes → Stack Navigation
        └── No → Does it have mode switching (list/add/edit)?
            ├── Yes → Stack Navigation
            └── No → Focused Sheet
```

### By Field Count

| Fields | Recommendation | Rationale |
|--------|---------------|-----------|
| 1-4 | Bottom Sheet | Quick entry, minimal context switch |
| 5-8 | Focused Sheet | Needs concentration, less distraction |
| 9+ | Multi-step wizard | Break into digestible chunks |

### By Interaction Pattern

| Pattern | Presentation | Example |
|---------|--------------|---------|
| Action menu | Bottom Sheet | PropertyActionsSheet main view |
| Filter/sort | Bottom Sheet | PropertyFiltersSheet |
| Confirmation | Bottom Sheet | Delete confirmation |
| Single form | Focused Sheet | AddFinancingSheet |
| Form with calculations | Focused Sheet | MortgageSheet |
| Mode toggle + form | Focused Sheet | AddToPortfolioSheet |
| List/Add/Edit | Stack Navigation | SecurityPatternEditor |
| Multi-step wizard | Stack Navigation | PropertyFormWizard |

---

## Bottom Sheet

### When to Use

- **Action menus:** 3-5 tappable options
- **Filters/sorts:** Toggle-based selections
- **Quick inputs:** Single field + confirm
- **Confirmations:** Yes/no decisions
- **Contextual selections:** Pick from list

### Component

```tsx
import { BottomSheet, BottomSheetSection } from '@/components/ui';

function MySheet({ visible, onClose }) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Property Actions"
      snapPoints={['50%']}
    >
      <BottomSheetSection title="Quick Actions">
        <ActionButton label="Share Property" onPress={handleShare} />
        <ActionButton label="Copy Details" onPress={handleCopy} />
        <ActionButton label="Change Status" onPress={handleStatus} />
      </BottomSheetSection>
    </BottomSheet>
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `visible` | boolean | Sheet visibility |
| `onClose` | () => void | Close callback |
| `title` | string | Header title |
| `subtitle` | string | Optional subtitle |
| `snapPoints` | string[] | Height percentages (e.g., `['50%', '85%']`) |
| `useGlass` | boolean | Glass effect (default: true) |
| `scrollable` | boolean | Wrap in ScrollView (default: true) |

### Best Practices

- Keep to **max 5 options** in action menus
- Use `BottomSheetSection` to group related items
- Don't nest sheets (open one, close current)

---

## Focused Sheet

### When to Use

- **Complex forms:** 5+ fields needing concentration
- **Real-time calculations:** Mortgage, financing scenarios
- **Mode toggle forms:** Existing/new property selection
- **Media capture:** Voice memo + photos + metadata

### Component

```tsx
import { FocusedSheet, FocusedSheetSection } from '@/components/ui';

function AddFinancingSheet({ visible, onClose, onSubmit, isLoading }) {
  return (
    <FocusedSheet
      visible={visible}
      onClose={onClose}
      title="New Financing Scenario"
      subtitle="Compare loan options"
      doneLabel="Save"
      onDone={handleSubmit}
      doneDisabled={!isValid}
      isSubmitting={isLoading}
    >
      <FocusedSheetSection title="Loan Details">
        <FormField label="Purchase Price" ... />
        <FormField label="Down Payment" ... />
        <FormField label="Interest Rate" ... />
      </FocusedSheetSection>

      <FocusedSheetSection title="Calculations">
        <FinancingPreview calculations={calculations} />
      </FocusedSheetSection>
    </FocusedSheet>
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `visible` | boolean | Sheet visibility |
| `onClose` | () => void | Close callback |
| `title` | string | Header title (centered) |
| `subtitle` | string | Optional subtitle |
| `doneLabel` | string | Done button text (omit for just close button) |
| `onDone` | () => void | Done button callback |
| `doneDisabled` | boolean | Disable done button |
| `isSubmitting` | boolean | Show loading state |
| `cancelLabel` | string | Cancel button text (default: "Cancel") |
| `scrollable` | boolean | Wrap in ScrollView (default: true) |
| `progress` | number | Progress indicator (0-1) |
| `stepText` | string | Step text (e.g., "Step 1 of 4") |

### iOS Native Behavior

`FocusedSheet` uses `presentationStyle="pageSheet"` which provides:

- Native swipe-down to dismiss gesture
- Dimmed parent content (reduced distraction)
- Proper keyboard handling
- Standard iOS sheet appearance

### Best Practices

- Group fields into logical `FocusedSheetSection`s
- Use `progress` and `stepText` for multi-section forms
- Keep one primary action (Done button)
- Cancel always available

---

## Stack Navigation

### When to Use

- **Multi-step wizards:** 3+ distinct steps
- **List/Add/Edit flows:** CRUD patterns
- **Complex editors:** Multiple view modes

### Implementation

```tsx
// 1. Define screens in navigator
// app/(tabs)/admin/_layout.tsx
<Stack.Screen
  name="security-patterns"
  options={{ headerShown: true, title: 'Security Patterns' }}
/>
<Stack.Screen
  name="security-pattern-editor"
  options={{ headerShown: true, title: 'Edit Pattern' }}
/>

// 2. Navigate between screens
// SecurityPatternsScreen.tsx
const handleEdit = (patternId: string) => {
  router.push({
    pathname: '/admin/security-pattern-editor',
    params: { id: patternId },
  });
};

// 3. Handle params in editor
// SecurityPatternEditorScreen.tsx
const { id } = useLocalSearchParams<{ id?: string }>();
const isEditing = !!id;
```

### Benefits

- Native back gesture
- Deep-linkable URLs
- Progress persists across screens
- Proper history stack

---

## Migration Guide

### From BottomSheet to FocusedSheet

**Before:**
```tsx
<BottomSheet visible={visible} onClose={onClose} title="Add Mortgage" snapPoints={['90%']}>
  <ScrollView>
    {/* 10+ form fields */}
    <Button onPress={handleSubmit}>Save</Button>
  </ScrollView>
</BottomSheet>
```

**After:**
```tsx
<FocusedSheet
  visible={visible}
  onClose={onClose}
  title="Add Mortgage"
  doneLabel="Save"
  onDone={handleSubmit}
  isSubmitting={isLoading}
>
  <FocusedSheetSection title="Lender">
    {/* Lender fields */}
  </FocusedSheetSection>
  <FocusedSheetSection title="Loan Details">
    {/* Loan fields */}
  </FocusedSheetSection>
</FocusedSheet>
```

**Key Changes:**
1. Replace `BottomSheet` with `FocusedSheet`
2. Remove `snapPoints` (FocusedSheet is full height)
3. Move submit button to `doneLabel`/`onDone` props
4. Use `FocusedSheetSection` instead of `BottomSheetSection`
5. Remove wrapper `ScrollView` (built-in)

### From BottomSheet to Stack Navigation

**Before:**
```tsx
// PatternEditorSheet.tsx with internal mode state
const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');

{mode === 'list' && <PatternList onAdd={() => setMode('add')} />}
{mode === 'add' && <PatternForm onBack={() => setMode('list')} />}
```

**After:**
```tsx
// SecurityPatternsScreen.tsx
router.push('/admin/security-pattern-editor');

// SecurityPatternEditorScreen.tsx
const { id } = useLocalSearchParams();
// Use router.back() instead of mode state
```

---

## ADHD-Friendly Patterns

### Reduce Visual Noise

**FocusedSheet** dims the parent content, reducing visual distraction compared to glass bottom sheets where the underlying content is visible.

### Progressive Disclosure

For screens with many options, show a manageable subset first:

```tsx
const [showAllActions, setShowAllActions] = useState(false);
const visibleActions = showAllActions ? allActions : allActions.slice(0, 6);

{visibleActions.map(action => <ActionCard key={action.id} action={action} />)}
{allActions.length > 6 && (
  <Button variant="ghost" onPress={() => setShowAllActions(!showAllActions)}>
    {showAllActions ? 'Show less' : `Show ${allActions.length - 6} more`}
  </Button>
)}
```

### Step Indicators

Always show progress for multi-step forms:

```tsx
<FocusedSheet
  visible={visible}
  onClose={onClose}
  title="Add Property"
  progress={currentStep / totalSteps}
  stepText={`Step ${currentStep} of ${totalSteps}`}
>
```

### Max 5 Rule

Apply Hick's Law consistently:

| Context | Limit | When exceeded |
|---------|-------|---------------|
| Action menu options | 5 | Add dividers, group related |
| Visible form fields | 5 | Use multi-step wizard |
| Tab bar items | 5 | Use overflow menu |
| Grid items (prominent) | 6 | Hide behind "More" |

---

## Related Documentation

- [UI_CONVENTIONS.md](./UI_CONVENTIONS.md) - Component patterns
- [UI_CONSISTENCY_GUIDE.md](./UI_CONSISTENCY_GUIDE.md) - Style consistency
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens
