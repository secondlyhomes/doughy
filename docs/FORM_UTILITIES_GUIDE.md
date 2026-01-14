# Form Utilities Guide

This document explains the new standardized form utilities: `FormField` component and `useForm` hook.

## Overview

**Problem:** Form input patterns were duplicated across multiple files (AddCompSheet, AddRepairSheet, AddFinancingSheet, AddLeadScreen, EditLeadScreen, PropertyForm), leading to:
- Inconsistent styling and behavior
- Repeated label + input + error rendering logic
- Duplicated form state management
- Harder to maintain and update

**Solution:** Created two reusable utilities:
1. **`FormField`** - Standardized input component with label, error, helper text, icons, and prefix/suffix support
2. **`useForm`** - Form state management hook with validation and submission handling

---

## FormField Component

Located at: `/src/components/ui/FormField.tsx`

### Features

- ✅ Label with optional required indicator (*)
- ✅ Icon support (left-side icon from lucide-react-native)
- ✅ Prefix/suffix text (e.g., "$" or "%")
- ✅ Error message display (replaces helper text when present)
- ✅ Helper text support
- ✅ Full theme support (dark mode compatible)
- ✅ Multiline support
- ✅ Disabled state styling
- ✅ Uses design tokens (SPACING, BORDER_RADIUS)

### Basic Usage

```typescript
import { FormField } from '@/components/ui';
import { DollarSign } from 'lucide-react-native';

<FormField
  label="Property Value"
  value={value}
  onChangeText={setValue}
  error={errors.value}
  placeholder="Enter amount"
/>
```

### With Icon and Prefix

```typescript
<FormField
  label="Purchase Price"
  value={values.price}
  onChangeText={(text) => updateField('price', text)}
  error={errors.price}
  required
  prefix="$"
  icon={DollarSign}
  keyboardType="numeric"
  helperText="Enter the purchase price of the property"
/>
```

### Multiline Example

```typescript
<FormField
  label="Notes"
  value={values.notes}
  onChangeText={(text) => updateField('notes', text)}
  placeholder="Add notes..."
  multiline
  numberOfLines={4}
/>
```

### Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | **required** | Field label text |
| `value` | `string` | **required** | Current field value |
| `onChangeText` | `(text: string) => void` | **required** | Change handler |
| `error` | `string?` | `undefined` | Error message (overrides helper text) |
| `helperText` | `string?` | `undefined` | Helper text shown below input |
| `required` | `boolean` | `false` | Shows asterisk (*) after label |
| `icon` | `LucideIcon?` | `undefined` | Icon component (left side) |
| `prefix` | `string?` | `undefined` | Prefix text (e.g., "$") |
| `suffix` | `string?` | `undefined` | Suffix text (e.g., "%") |
| `placeholder` | `string?` | `undefined` | Input placeholder |
| `keyboardType` | `KeyboardTypeOptions` | `'default'` | Keyboard type |
| `autoCapitalize` | `AutoCapitalize` | `'sentences'` | Auto-capitalize mode |
| `multiline` | `boolean` | `false` | Enable multiline input |
| `numberOfLines` | `number` | `1` | Lines for multiline |
| `editable` | `boolean` | `true` | Enable/disable input |

---

## useForm Hook

Located at: `/src/hooks/useForm.ts`

### Features

- ✅ Centralized form state management
- ✅ Built-in validation with error tracking
- ✅ Async submission handling with loading state
- ✅ Dirty state tracking (has form been modified?)
- ✅ Field-level error clearing on input
- ✅ Success/error callbacks
- ✅ Form reset functionality

### Basic Usage

```typescript
import { useForm } from '@/hooks/useForm';

const { values, errors, updateField, handleSubmit, isSubmitting } = useForm({
  initialValues: {
    name: '',
    email: '',
    amount: '',
  },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.name) errs.name = 'Name is required';
    if (!vals.email) errs.email = 'Email is required';
    if (!vals.amount || parseFloat(vals.amount) <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }
    return errs;
  },
  onSubmit: async (vals) => {
    await api.submit(vals);
  },
  onSuccess: () => {
    console.log('Form submitted successfully!');
  },
});

return (
  <>
    <FormField
      label="Name"
      value={values.name}
      onChangeText={(text) => updateField('name', text)}
      error={errors.name}
      required
    />
    <FormField
      label="Email"
      value={values.email}
      onChangeText={(text) => updateField('email', text)}
      error={errors.email}
      required
    />
    <Button onPress={handleSubmit} loading={isSubmitting}>
      Submit
    </Button>
  </>
);
```

### Complete Example (AddRepairSheet pattern)

```typescript
import { useState } from 'react';
import { FormField } from '@/components/ui';
import { useForm } from '@/hooks/useForm';
import { DollarSign, Wrench } from 'lucide-react-native';

function AddRepairSheet({ onClose }: { onClose: () => void }) {
  const { values, errors, updateField, handleSubmit, isSubmitting, reset } = useForm({
    initialValues: {
      name: '',
      cost: '',
      notes: '',
    },
    validate: (vals) => {
      const errs: any = {};
      if (!vals.name.trim()) errs.name = 'Repair name is required';
      if (!vals.cost || parseFloat(vals.cost) <= 0) {
        errs.cost = 'Cost must be greater than $0';
      }
      return errs;
    },
    onSubmit: async (vals) => {
      // Submit to API
      await repairsApi.create({
        name: vals.name,
        cost: parseFloat(vals.cost),
        notes: vals.notes,
      });
    },
    onSuccess: () => {
      reset();
      onClose();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to add repair. Please try again.');
    },
  });

  return (
    <BottomSheet visible onClose={onClose}>
      <FormField
        label="Repair Name"
        value={values.name}
        onChangeText={(text) => updateField('name', text)}
        error={errors.name}
        required
        icon={Wrench}
        placeholder="e.g., Kitchen Remodel"
      />

      <FormField
        label="Estimated Cost"
        value={values.cost}
        onChangeText={(text) => updateField('cost', text)}
        error={errors.cost}
        required
        prefix="$"
        icon={DollarSign}
        keyboardType="numeric"
        placeholder="0.00"
      />

      <FormField
        label="Notes"
        value={values.notes}
        onChangeText={(text) => updateField('notes', text)}
        placeholder="Additional details..."
        multiline
        numberOfLines={3}
      />

      <Button onPress={handleSubmit} loading={isSubmitting}>
        Add Repair
      </Button>
    </BottomSheet>
  );
}
```

### Return Values Reference

| Property | Type | Description |
|----------|------|-------------|
| `values` | `T` | Current form values |
| `errors` | `Partial<Record<keyof T, string>>` | Current validation errors |
| `isSubmitting` | `boolean` | Whether form is submitting |
| `isDirty` | `boolean` | Whether form has been modified |
| `updateField` | `(field: keyof T, value: any) => void` | Update single field |
| `setValues` | `(values: Partial<T>) => void` | Update multiple fields |
| `setErrors` | `(errors: Partial<Record<keyof T, string>>) => void` | Set errors manually |
| `clearError` | `(field: keyof T) => void` | Clear specific field error |
| `clearErrors` | `() => void` | Clear all errors |
| `validate` | `() => boolean` | Validate form (returns true if valid) |
| `handleSubmit` | `() => Promise<void>` | Handle form submission |
| `reset` | `() => void` | Reset to initial values |

---

## Migration Guide

### Before (Old Pattern)

```typescript
// AddCompSheet.tsx - OLD pattern (100+ lines)
const [description, setDescription] = useState('');
const [value, setValue] = useState('');
const [distance, setDistance] = useState('');
const [errors, setErrors] = useState<any>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSave = async () => {
  const newErrors: any = {};
  if (!description) newErrors.description = 'Required';
  if (!value) newErrors.value = 'Required';
  if (!distance) newErrors.distance = 'Required';

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setIsSubmitting(true);
  try {
    await compsApi.create({ description, value: parseFloat(value), distance: parseFloat(distance) });
    setDescription('');
    setValue('');
    setDistance('');
    onClose();
  } catch (error) {
    Alert.alert('Error', 'Failed to add comp');
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <>
    <View>
      <Text style={{ color: colors.foreground }}>Description *</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={{ backgroundColor: colors.background, color: colors.foreground }}
      />
      {errors.description && <Text style={{ color: colors.destructive }}>{errors.description}</Text>}
    </View>
    {/* Repeat for other fields... */}
  </>
);
```

### After (New Pattern)

```typescript
// AddCompSheet.tsx - NEW pattern (40 lines)
const { values, errors, updateField, handleSubmit, isSubmitting } = useForm({
  initialValues: { description: '', value: '', distance: '' },
  validate: (vals) => {
    const errs: any = {};
    if (!vals.description) errs.description = 'Required';
    if (!vals.value) errs.value = 'Required';
    if (!vals.distance) errs.distance = 'Required';
    return errs;
  },
  onSubmit: async (vals) => {
    await compsApi.create({
      description: vals.description,
      value: parseFloat(vals.value),
      distance: parseFloat(vals.distance),
    });
    onClose();
  },
});

return (
  <>
    <FormField
      label="Description"
      value={values.description}
      onChangeText={(text) => updateField('description', text)}
      error={errors.description}
      required
    />
    <FormField
      label="Value"
      value={values.value}
      onChangeText={(text) => updateField('value', text)}
      error={errors.value}
      required
      prefix="$"
      keyboardType="numeric"
    />
    <FormField
      label="Distance"
      value={values.distance}
      onChangeText={(text) => updateField('distance', text)}
      error={errors.distance}
      required
      suffix="mi"
      keyboardType="numeric"
    />
  </>
);
```

**Savings:** ~60 lines removed per file, consistent styling, automatic error clearing

---

## Files to Migrate

The following files use the old form pattern and should be migrated:

1. ✅ **FormField Component Created** - Ready for use
2. ✅ **useForm Hook Created** - Ready for use
3. ⏳ **AddCompSheet.tsx** - Needs migration (~60 line reduction)
4. ⏳ **AddRepairSheet.tsx** - Needs migration (~60 line reduction)
5. ⏳ **AddFinancingSheet.tsx** - Needs migration (~70 line reduction)
6. ⏳ **AddLeadScreen.tsx** - Needs migration (~80 line reduction)
7. ⏳ **EditLeadScreen.tsx** - Needs migration (~80 line reduction)
8. ⏳ **PropertyForm.tsx** - Needs migration (~100 line reduction)

**Total expected reduction:** ~450 lines across 6 files

---

## Benefits

1. **Consistency** - All forms look and behave the same
2. **Maintainability** - Update once, apply everywhere
3. **Dark Mode** - Fully theme-aware with `useThemeColors()`
4. **Accessibility** - Proper labels and error associations
5. **Type Safety** - Full TypeScript support
6. **Developer Experience** - Less boilerplate, faster development
7. **Error Handling** - Automatic error clearing on input
8. **Loading States** - Built-in submission state management

---

## Testing

When migrating a file:

1. **Visual Comparison** - Screenshot before/after (should match pixel-perfect)
2. **Functionality** - Test all form behaviors (validation, submission, reset)
3. **Error States** - Verify error messages display correctly
4. **Dark Mode** - Toggle theme and verify styling
5. **Keyboard Types** - Verify numeric keyboards appear for number inputs
6. **Required Fields** - Verify asterisks appear and validation works

---

## Future Enhancements

Potential additions for future versions:

- **Async Validation** - Support for server-side validation
- **Field Arrays** - Support for dynamic lists of fields
- **Conditional Fields** - Show/hide fields based on other values
- **Auto-Save** - Debounced auto-save functionality
- **Form Wizard** - Multi-step form support
- **File Upload Field** - Specialized FormField for file uploads

---

**Last Updated:** January 2026
**Status:** Phase 2.1 & 2.2 Complete - Components ready for migration
