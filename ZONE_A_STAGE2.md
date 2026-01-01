# ZONE A: UI Components & Theme System - Stage 2

**Instance 1 Assignment - Full Implementation**

## Overview

Convert all 67 UI components from the web app to React Native compatible versions using NativeWind.

**Source Directory:** `/Users/dinosaur/Documents/doughy-ai-web-backup/src/components/ui/`
**Target Directory:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/`

---

## Phase 1: Core Form Components (Priority: HIGH)

These are used throughout the app and must be completed first.

| Component | Web File | Status | Notes |
|-----------|----------|--------|-------|
| Button | `button.tsx` | TODO | Add all variants (default, destructive, outline, secondary, ghost, link) |
| Input | `input.tsx` | TODO | Handle keyboard types, secure text |
| Textarea | `textarea.tsx` | TODO | Use TextInput with multiline |
| Checkbox | `checkbox.tsx` | TODO | Custom checkbox with Pressable |
| Radio Group | `radio-group.tsx` | TODO | Custom radio buttons |
| Select | `select.tsx` | TODO | Use Modal + FlatList picker |
| Switch | `switch.tsx` | TODO | Use RN Switch or custom |
| Slider | `slider.tsx` | TODO | Use @react-native-community/slider |
| Label | `label.tsx` | TODO | Simple Text wrapper |
| Form | `form.tsx` | TODO | React Hook Form integration |

### Conversion Pattern for Form Components

```tsx
// Web (uses HTML elements)
<input type="text" className="..." />

// React Native
<TextInput className="..." />

// Web checkbox
<input type="checkbox" />

// React Native checkbox (custom)
<Pressable onPress={toggle}>
  <View className={checked ? "bg-primary" : "border"}>
    {checked && <Check size={16} />}
  </View>
</Pressable>
```

---

## Phase 2: Layout & Container Components

| Component | Web File | Status | Notes |
|-----------|----------|--------|-------|
| Card | `card.tsx` | PARTIAL | Enhance with all variants |
| Dialog | `dialog.tsx` | TODO | Use Modal component |
| Sheet | `sheet.tsx` | TODO | Bottom sheet modal |
| Drawer | `drawer.tsx` | TODO | Use react-native-drawer or Modal |
| Accordion | `accordion.tsx` | TODO | Animated collapsible |
| Collapsible | `collapsible.tsx` | TODO | Reanimated for smooth animation |
| Tabs | `tabs.tsx` | PARTIAL | Enhance styling |
| Separator | `separator.tsx` | TODO | Simple View with border |
| Scroll Area | `scroll-area.tsx` | TODO | Use ScrollView |
| Resizable | `resizable.tsx` | SKIP | Not applicable for mobile |

### Modal/Dialog Pattern

```tsx
// Web uses Radix Dialog
// React Native use Modal

import { Modal, View, TouchableOpacity } from 'react-native';

export function Dialog({ open, onClose, children }) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
        activeOpacity={1}
      >
        <View className="bg-card rounded-lg p-6 m-4 max-w-sm w-full">
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
```

---

## Phase 3: Feedback & Status Components

| Component | Web File | Status | Notes |
|-----------|----------|--------|-------|
| Alert | `alert.tsx` | TODO | View with icon + text |
| Alert Dialog | `alert-dialog.tsx` | TODO | Confirmation modal |
| Badge | `badge.tsx` | DONE | Already converted |
| Progress | `progress.tsx` | DONE | Already converted |
| Skeleton | `skeleton.tsx` | TODO | Animated placeholder |
| Toast/Sonner | `toast.tsx`, `sonner.tsx` | TODO | Use react-native-toast-message |
| Loader | `loader.tsx` | TODO | ActivityIndicator wrapper |
| Loading Screen | `loading-screen.tsx` | TODO | Full screen loader |
| Status Banner | `status-banner.tsx` | TODO | Top banner component |
| Error Boundary | `error-boundary.tsx` | TODO | React error boundary |

### Toast Pattern

```tsx
// Install: npm install react-native-toast-message
import Toast from 'react-native-toast-message';

// In RootNavigator after NavigationContainer:
<Toast />

// Usage:
Toast.show({
  type: 'success',
  text1: 'Success',
  text2: 'Operation completed'
});
```

---

## Phase 4: Navigation & Menu Components

| Component | Web File | Status | Notes |
|-----------|----------|--------|-------|
| Dropdown Menu | `dropdown-menu.tsx` | TODO | Use Popover or ActionSheet |
| Context Menu | `context-menu.tsx` | TODO | Long press menu |
| Navigation Menu | `navigation-menu.tsx` | SKIP | Using React Navigation |
| Menubar | `menubar.tsx` | SKIP | Not typical for mobile |
| Command | `command.tsx` | TODO | Search/command palette |
| Breadcrumb | `breadcrumb.tsx` | TODO | Navigation breadcrumbs |
| Pagination | `pagination.tsx` | TODO | For lists |

---

## Phase 5: Data Display Components

| Component | Web File | Status | Notes |
|-----------|----------|--------|-------|
| Table | `table.tsx` | TODO | Use FlatList with headers |
| Avatar | `avatar.tsx` | TODO | Image with fallback |
| Tooltip | `tooltip.tsx` | TODO | Use Popover on long press |
| Hover Card | `hover-card.tsx` | SKIP | No hover on mobile |
| Popover | `popover.tsx` | TODO | Floating view |
| Calendar | `calendar.tsx` | TODO | Use react-native-calendars |
| Date Picker | `date-picker.tsx` | TODO | Use @react-native-community/datetimepicker |
| Chart | `chart.tsx` | PARTIAL | Using react-native-chart-kit |
| Carousel | `carousel.tsx` | TODO | Use FlatList horizontal or library |

---

## Phase 6: Specialized Components

| Component | Web File | Status | Notes |
|-----------|----------|--------|-------|
| File Upload | `file-upload.tsx` | TODO | expo-image-picker / expo-document-picker |
| Multi File Upload | `multi-file-upload.tsx` | TODO | Multiple selection |
| Address Autocomplete | `address-autocomplete.tsx` | TODO | Google Places API |
| OSM Map | `osm-map.tsx` | DONE | Web version created |
| Input OTP | `input-otp.tsx` | TODO | OTP input boxes |
| Recaptcha | `recaptcha.tsx` | SKIP | Not needed for mobile |
| Honeypot | `honeypot.tsx` | SKIP | Web-only spam protection |

---

## Phase 7: Theme System

### Files to Create/Update

1. **`src/styles/theme.ts`** - Theme constants
```tsx
export const colors = {
  light: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    primary: 'hsl(221.2 83.2% 53.3%)',
    // ... all colors from web
  },
  dark: {
    // Dark mode colors
  }
};
```

2. **`src/context/ThemeContext.tsx`** - Theme provider
3. **Update `tailwind.config.js`** - Ensure all color tokens match web

### Copy These Style Files
From `/Users/dinosaur/Documents/doughy-ai-web-backup/src/styles/`:
- `theme-core.css` - Convert to NativeWind compatible
- `fonts.css` - Load custom fonts with expo-font

---

## Testing Checklist

For each component:
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Works on Web
- [ ] Matches web app styling
- [ ] Handles dark mode (if applicable)
- [ ] Accessible (proper labels)

---

## Dependencies to Install

```bash
npm install react-native-toast-message
npm install @react-native-community/slider
npm install @react-native-community/datetimepicker
npm install react-native-calendars
npm install react-native-reanimated  # Already installed
```

---

## Files Created Checklist

```
src/components/ui/
├── accordion.tsx          [ ]
├── alert-dialog.tsx       [ ]
├── alert.tsx              [ ]
├── avatar.tsx             [ ]
├── badge.tsx              [x] Done
├── button.tsx             [ ] Enhance
├── calendar.tsx           [ ]
├── card.tsx               [x] Done
├── carousel.tsx           [ ]
├── chart.tsx              [ ] Enhance
├── checkbox.tsx           [ ]
├── collapsible.tsx        [ ]
├── command.tsx            [ ]
├── date-picker.tsx        [ ]
├── dialog.tsx             [ ]
├── drawer.tsx             [ ]
├── dropdown-menu.tsx      [ ]
├── file-upload.tsx        [ ]
├── form.tsx               [ ]
├── input.tsx              [ ] Enhance
├── label.tsx              [ ]
├── loader.tsx             [ ]
├── loading-screen.tsx     [ ]
├── pagination.tsx         [ ]
├── popover.tsx            [ ]
├── progress.tsx           [x] Done
├── radio-group.tsx        [ ]
├── scroll-area.tsx        [ ]
├── select.tsx             [ ]
├── separator.tsx          [ ]
├── sheet.tsx              [ ]
├── skeleton.tsx           [ ]
├── slider.tsx             [ ]
├── switch.tsx             [ ]
├── table.tsx              [ ]
├── tabs.tsx               [ ] Enhance
├── textarea.tsx           [ ]
├── toast.tsx              [ ]
├── toggle.tsx             [ ]
├── tooltip.tsx            [ ]
└── index.ts               [ ] Update exports
```
