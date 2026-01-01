# ZONE A: UI Components & Theme System - Stage 3

**Instance 1 Assignment | Priority: CRITICAL**

---

## Before You Begin

### Required Reading
1. Read `EXPO_UNIVERSAL_MASTER_PLAN.md` first
2. Read this document completely
3. Check the current state of `/src/components/ui/`

### Your Mission
Build the universal UI component library that works identically on iOS, Android, and Web. **All other zones are blocked until you deliver core components.**

---

## Current Status

### Already Completed (From Stage 1-2)
- [x] Basic Button component
- [x] Basic Card component
- [x] Basic Input component
- [x] Badge component
- [x] Progress component
- [x] Alert component
- [x] Avatar component
- [x] Checkbox component
- [x] Skeleton component
- [x] Tabs component
- [x] Toast component

### Needs Enhancement
- [ ] Button - add all variants from web
- [ ] Input - add all types, validation states
- [ ] Card - add all sub-components

### Not Yet Created
- [ ] Dialog/Modal
- [ ] Sheet (bottom sheet)
- [ ] Select/Dropdown
- [ ] Form (react-hook-form wrapper)
- [ ] DatePicker
- [ ] And 40+ more...

---

## Phase 1: Core Form Components (CRITICAL)

**These are blocking other zones. Complete first.**

### 1.1 Button (Enhance)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/button.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Button.tsx`

**Requirements:**
- All variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- All sizes: `default`, `sm`, `lg`, `icon`
- Loading state with spinner
- Disabled state
- Icon support (left/right)

```tsx
// Expected API
<Button variant="destructive" size="lg" loading disabled>
  <Icon /> Delete
</Button>
```

**Checklist:**
- [ ] All 6 variants styled
- [ ] All 4 sizes work
- [ ] Loading spinner shows
- [ ] Disabled state works
- [ ] Icons render correctly
- [ ] Works on iOS/Android/Web

### 1.2 Input (Enhance)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/input.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Input.tsx`

**Requirements:**
- Text, email, password, number, phone types
- Error state with message
- Label integration
- Left/right icons
- Secure text toggle for password

```tsx
<Input
  label="Email"
  type="email"
  error="Invalid email"
  leftIcon={<Mail />}
/>
```

**Checklist:**
- [ ] All input types with correct keyboards
- [ ] Error state styling
- [ ] Label displays above
- [ ] Icons render in correct position
- [ ] Password visibility toggle
- [ ] Focus/blur states

### 1.3 Select (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/select.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Select.tsx`

**Requirements:**
- Opens Modal with FlatList on mobile
- Searchable option
- Single and multi-select modes
- Placeholder text
- Error state

```tsx
<Select
  label="Status"
  options={[
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
  ]}
  value={status}
  onChange={setStatus}
  searchable
/>
```

**Checklist:**
- [ ] Opens modal when pressed
- [ ] Options list renders
- [ ] Selection updates value
- [ ] Searchable filter works
- [ ] Multi-select mode
- [ ] Closes on select/outside tap

### 1.4 Textarea (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/textarea.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Textarea.tsx`

**Requirements:**
- Multi-line TextInput
- Auto-growing height (optional)
- Character count (optional)
- Error state

```tsx
<Textarea
  label="Description"
  rows={4}
  maxLength={500}
  showCount
/>
```

**Checklist:**
- [ ] Multi-line works
- [ ] Auto-grow option
- [ ] Character count displays
- [ ] Error state styling

### 1.5 Checkbox (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Checkbox.tsx`

**Requirements:**
- Match web styling exactly
- Label support
- Disabled state
- Indeterminate state (for "select all")

**Checklist:**
- [ ] Check/uncheck animation
- [ ] Label displays correctly
- [ ] Disabled styling
- [ ] Indeterminate state

### 1.6 RadioGroup (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/radio-group.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/RadioGroup.tsx`

**Requirements:**
- Radio button group
- Horizontal or vertical layout
- Disabled state

```tsx
<RadioGroup
  value={selected}
  onValueChange={setSelected}
  options={[
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ]}
/>
```

**Checklist:**
- [ ] Single selection enforced
- [ ] Visual selection indicator
- [ ] Both layouts work
- [ ] Disabled state

### 1.7 Switch (Create/Enhance)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/switch.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Switch.tsx`

**Requirements:**
- Toggle switch
- Label support
- Disabled state
- Match theme colors

**Checklist:**
- [ ] Toggle works
- [ ] Animation smooth
- [ ] Theme colors applied
- [ ] Disabled state

### 1.8 Label (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/label.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Label.tsx`

**Requirements:**
- Text wrapper for form labels
- Required indicator (*)
- Error state (red text)

```tsx
<Label required error>Email Address</Label>
```

**Checklist:**
- [ ] Text displays correctly
- [ ] Required asterisk shows
- [ ] Error color applies

### 1.9 Form (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/form.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Form.tsx`

**Requirements:**
- React Hook Form integration
- FormField, FormItem, FormLabel, FormControl, FormMessage components
- Error handling

```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

**Checklist:**
- [ ] Works with react-hook-form
- [ ] Error messages display
- [ ] All sub-components work
- [ ] Validation triggers correctly

---

## Phase 2: Layout Components

### 2.1 Dialog/Modal (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/dialog.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Dialog.tsx`

**Requirements:**
- Modal overlay
- DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Close on outside tap (optional)
- Animation

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onPress={close}>Cancel</Button>
      <Button variant="destructive" onPress={confirm}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Checklist:**
- [ ] Opens/closes correctly
- [ ] Overlay darkens background
- [ ] All sub-components render
- [ ] Closes on outside tap
- [ ] Animation works
- [ ] Works on all platforms

### 2.2 Sheet/BottomSheet (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/sheet.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Sheet.tsx`

**Requirements:**
- Slides up from bottom
- Draggable handle
- Snap points (optional)
- SheetHeader, SheetContent, SheetFooter

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
    </SheetHeader>
    {/* Filter options */}
  </SheetContent>
</Sheet>
```

**Checklist:**
- [ ] Slides from bottom
- [ ] Drag handle works
- [ ] Closes on drag down
- [ ] Content scrollable
- [ ] Works on all platforms

### 2.3 AlertDialog (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/alert-dialog.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/AlertDialog.tsx`

**Requirements:**
- Confirmation dialog
- Cannot close by outside tap (must choose action)
- AlertDialogAction, AlertDialogCancel buttons

**Checklist:**
- [ ] Blocks outside tap dismiss
- [ ] Action buttons work
- [ ] Styled correctly

### 2.4 Card (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Card.tsx`

**Requirements:**
- CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- All variants from web

**Checklist:**
- [ ] All sub-components work
- [ ] Matches web styling
- [ ] Shadow/elevation correct

### 2.5 Accordion (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/accordion.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Accordion.tsx`

**Requirements:**
- Collapsible sections
- Animated expand/collapse
- AccordionItem, AccordionTrigger, AccordionContent

**Checklist:**
- [ ] Opens/closes with animation
- [ ] Multiple items support
- [ ] Single-open mode (optional)

### 2.6 Collapsible (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/collapsible.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Collapsible.tsx`

**Requirements:**
- Simple expand/collapse container
- Animated

**Checklist:**
- [ ] Toggle works
- [ ] Animation smooth

### 2.7 Tabs (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Tabs.tsx`

**Requirements:**
- TabsList, TabsTrigger, TabsContent
- Active indicator
- Scrollable tabs (for many items)

**Checklist:**
- [ ] Tab switching works
- [ ] Active indicator shows
- [ ] Content changes
- [ ] Scrollable mode works

### 2.8 Separator (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/separator.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Separator.tsx`

**Requirements:**
- Horizontal and vertical orientations
- Matches theme colors

**Checklist:**
- [ ] Both orientations work
- [ ] Styling matches theme

### 2.9 ScrollArea (Create)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/ScrollArea.tsx`

**Requirements:**
- Wrapper for ScrollView
- Optional custom scrollbar styling (web only)

**Checklist:**
- [ ] Scrolling works
- [ ] Content overflows correctly

---

## Phase 3: Feedback Components

### 3.1 Toast (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Toast.tsx`

**Requirements:**
- Success, error, warning, info variants
- Auto-dismiss timer
- Manual dismiss
- Position options (top/bottom)

```tsx
// Usage via hook or function
toast.success('Saved successfully');
toast.error('Something went wrong');
```

**Checklist:**
- [ ] All 4 variants styled
- [ ] Auto-dismiss works
- [ ] Manual dismiss works
- [ ] Position configurable

### 3.2 Alert (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Alert.tsx`

**Requirements:**
- Success, error, warning, info variants
- Icon support
- AlertTitle, AlertDescription

**Checklist:**
- [ ] All variants styled
- [ ] Icons display
- [ ] Sub-components work

### 3.3 Skeleton (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Skeleton.tsx`

**Requirements:**
- Animated shimmer effect
- Circle, rect variants
- Configurable dimensions

**Checklist:**
- [ ] Shimmer animation
- [ ] Both shapes work
- [ ] Custom sizes work

### 3.4 LoadingSpinner (Create)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/LoadingSpinner.tsx`

**Requirements:**
- Spinning indicator
- Size options
- Color options

**Checklist:**
- [ ] Spinner animates
- [ ] Sizes work
- [ ] Colors work

### 3.5 EmptyState (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/EmptyState.tsx`

**Requirements:**
- Icon + title + description + action button
- Centered layout

**Checklist:**
- [ ] All parts render
- [ ] Action button works
- [ ] Centered correctly

---

## Phase 4: Navigation Components

### 4.1 DropdownMenu (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/dropdown-menu.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/DropdownMenu.tsx`

**Requirements:**
- Menu items with icons
- Separator support
- Keyboard shortcut labels (web only)
- DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem

**Checklist:**
- [ ] Opens on trigger press
- [ ] Items selectable
- [ ] Icons render
- [ ] Separators work

### 4.2 Popover (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/popover.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Popover.tsx`

**Requirements:**
- Floating content near trigger
- Positioning (top, bottom, left, right)
- Arrow pointing to trigger (optional)

**Checklist:**
- [ ] Positions correctly
- [ ] Closes on outside tap
- [ ] Content renders

### 4.3 Breadcrumb (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/breadcrumb.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Breadcrumb.tsx`

**Requirements:**
- Navigation breadcrumbs
- Separator between items
- Current page highlighted

**Checklist:**
- [ ] Items render with separators
- [ ] Navigation works
- [ ] Current page styled

### 4.4 Pagination (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/pagination.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Pagination.tsx`

**Requirements:**
- Page numbers
- Previous/Next buttons
- Current page indicator

**Checklist:**
- [ ] Page navigation works
- [ ] Current page highlighted
- [ ] Disabled states work

---

## Phase 5: Data Display Components

### 5.1 Table (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/table.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Table.tsx`

**Requirements:**
- FlatList-based table
- TableHeader, TableBody, TableRow, TableCell
- Sticky header
- Sortable columns (optional)

**Note:** Tables on mobile often become cards or lists. Create a flexible implementation.

**Checklist:**
- [ ] Header row sticky
- [ ] Data rows render
- [ ] Cells align correctly
- [ ] Horizontal scroll if needed

### 5.2 Avatar (Enhance)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Avatar.tsx`

**Requirements:**
- Image with fallback to initials
- AvatarImage, AvatarFallback
- Size options

**Checklist:**
- [ ] Image loads
- [ ] Fallback shows initials
- [ ] Sizes work

### 5.3 Tooltip (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/tooltip.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Tooltip.tsx`

**Requirements:**
- Shows on long press (mobile) or hover (web)
- Positioning
- Arrow (optional)

**Checklist:**
- [ ] Shows on interaction
- [ ] Positions correctly
- [ ] Dismisses properly

### 5.4 Calendar (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/calendar.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Calendar.tsx`

**Requirements:**
- Month view calendar
- Date selection
- Date range selection (optional)
- Use `react-native-calendars` or custom

**Checklist:**
- [ ] Month displays correctly
- [ ] Date selection works
- [ ] Navigation between months

### 5.5 DatePicker (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/date-picker.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/DatePicker.tsx`

**Requirements:**
- Input that opens date picker
- Uses native pickers on mobile
- Formatted display

**Checklist:**
- [ ] Opens picker on press
- [ ] Date selection works
- [ ] Display formatted correctly

### 5.6 Carousel (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/carousel.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/Carousel.tsx`

**Requirements:**
- Horizontal swipeable list
- Dots indicator
- Auto-play (optional)

**Checklist:**
- [ ] Swipe navigation works
- [ ] Dots show current position
- [ ] Auto-play option

---

## Phase 6: Specialized Components

### 6.1 FileUpload (Create)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/FileUpload.tsx`

**Requirements:**
- Uses expo-document-picker
- Progress indicator
- File type restrictions

**Checklist:**
- [ ] File picker opens
- [ ] Progress shows
- [ ] File type filtering

### 6.2 ImagePicker (Create)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/ImagePicker.tsx`

**Requirements:**
- Uses expo-image-picker
- Camera and gallery options
- Preview of selected image
- Multiple selection (optional)

**Checklist:**
- [ ] Camera option works
- [ ] Gallery option works
- [ ] Preview shows
- [ ] Multi-select mode

### 6.3 AddressAutocomplete (Create)

**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/AddressAutocomplete.tsx`

**Requirements:**
- Google Places API integration
- Autocomplete suggestions
- Returns structured address data

**Checklist:**
- [ ] Suggestions appear
- [ ] Selection works
- [ ] Address data returned

### 6.4 OTPInput (Create)

**Source:** `/Users/dinosaur/Documents/doughy-ai/src/components/ui/input-otp.tsx`
**Target:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/OTPInput.tsx`

**Requirements:**
- Fixed-length code input
- Auto-focus next field
- Paste support

**Checklist:**
- [ ] Individual boxes render
- [ ] Auto-focus works
- [ ] Paste fills all boxes

---

## Phase 7: Theme System

### 7.1 Theme Configuration

**File:** `/Users/dinosaur/Documents/doughy-ai-mobile/tailwind.config.js`

**Requirements:**
- Match all colors from web app
- Dark mode support
- CSS variable equivalents

**Web Colors to Match:**
```css
--color-primary: 159, 75%, 41%    /* Sage green */
--color-secondary: #FFE5A4         /* Butter yellow */
--color-background: #FAFAFA        /* Light mode bg */
--color-foreground: #1a1a1a        /* Dark text */
/* ... all other colors */
```

**Checklist:**
- [ ] All colors match web
- [ ] Dark mode colors defined
- [ ] Tailwind config updated

### 7.2 Theme Provider

**File:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/context/ThemeContext.tsx`

**Requirements:**
- Light/dark/system modes
- Persists preference
- Provides theme to components

**Checklist:**
- [ ] Mode switching works
- [ ] Persists to storage
- [ ] Components respond

### 7.3 Dark Mode

**Requirements:**
- All components support dark mode
- Automatic based on system
- Manual toggle

**Checklist:**
- [ ] Components have dark variants
- [ ] System mode works
- [ ] Toggle works

---

## Dependencies to Install

```bash
# If not already installed
npx expo install @gorhom/bottom-sheet
npx expo install react-native-calendars
npx expo install @react-native-community/datetimepicker
npx expo install react-native-toast-message
```

---

## Export Index

After completing components, update the export index:

**File:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/index.ts`

```tsx
// Form Components
export { Button } from './Button';
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { RadioGroup } from './RadioGroup';
export { Switch } from './Switch';
export { Label } from './Label';
export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from './Form';

// Layout Components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from './Sheet';
export { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from './AlertDialog';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './Collapsible';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { Separator } from './Separator';
export { ScrollArea } from './ScrollArea';

// Feedback Components
export { Toast, toast } from './Toast';
export { Alert, AlertTitle, AlertDescription } from './Alert';
export { Badge } from './Badge';
export { Progress } from './Progress';
export { Skeleton } from './Skeleton';
export { LoadingSpinner } from './LoadingSpinner';
export { EmptyState } from './EmptyState';

// Navigation Components
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './DropdownMenu';
export { Popover, PopoverTrigger, PopoverContent } from './Popover';
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from './Breadcrumb';
export { Pagination } from './Pagination';

// Data Display Components
export { Table, TableHeader, TableBody, TableRow, TableCell } from './Table';
export { Avatar, AvatarImage, AvatarFallback } from './Avatar';
export { Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';
export { Calendar } from './Calendar';
export { DatePicker } from './DatePicker';
export { Carousel } from './Carousel';

// Specialized Components
export { FileUpload } from './FileUpload';
export { ImagePicker } from './ImagePicker';
export { AddressAutocomplete } from './AddressAutocomplete';
export { OTPInput } from './OTPInput';
```

---

## Progress Tracking

### Phase 1: Core Form Components
| Component | Status | Notes |
|-----------|--------|-------|
| Button (enhance) | [ ] | |
| Input (enhance) | [ ] | |
| Select | [ ] | |
| Textarea | [ ] | |
| Checkbox (enhance) | [ ] | |
| RadioGroup | [ ] | |
| Switch | [ ] | |
| Label | [ ] | |
| Form | [ ] | |

### Phase 2: Layout Components
| Component | Status | Notes |
|-----------|--------|-------|
| Dialog | [ ] | |
| Sheet | [ ] | |
| AlertDialog | [ ] | |
| Card (enhance) | [ ] | |
| Accordion | [ ] | |
| Collapsible | [ ] | |
| Tabs (enhance) | [ ] | |
| Separator | [ ] | |
| ScrollArea | [ ] | |

### Phase 3: Feedback Components
| Component | Status | Notes |
|-----------|--------|-------|
| Toast (enhance) | [ ] | |
| Alert (enhance) | [ ] | |
| Skeleton (enhance) | [ ] | |
| LoadingSpinner | [ ] | |
| EmptyState (enhance) | [ ] | |

### Phase 4: Navigation Components
| Component | Status | Notes |
|-----------|--------|-------|
| DropdownMenu | [ ] | |
| Popover | [ ] | |
| Breadcrumb | [ ] | |
| Pagination | [ ] | |

### Phase 5: Data Display Components
| Component | Status | Notes |
|-----------|--------|-------|
| Table | [ ] | |
| Avatar (enhance) | [ ] | |
| Tooltip | [ ] | |
| Calendar | [ ] | |
| DatePicker | [ ] | |
| Carousel | [ ] | |

### Phase 6: Specialized Components
| Component | Status | Notes |
|-----------|--------|-------|
| FileUpload | [ ] | |
| ImagePicker | [ ] | |
| AddressAutocomplete | [ ] | |
| OTPInput | [ ] | |

### Phase 7: Theme System
| Task | Status | Notes |
|------|--------|-------|
| Color configuration | [ ] | |
| ThemeProvider | [ ] | |
| Dark mode support | [ ] | |

---

## Testing Checklist

For each component, verify:
- [ ] Renders on iOS simulator
- [ ] Renders on Android emulator
- [ ] Renders on Web browser
- [ ] Matches web app styling
- [ ] Dark mode works (if applicable)
- [ ] Accessibility labels present
- [ ] TypeScript types exported

---

## Blockers & Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| (Add issues here) | | |

---

## Notes for Other Zones

When Zone A components are ready, other zones can import:

```tsx
// Other zones import from the index
import {
  Button,
  Card,
  Input,
  Dialog,
  Select,
  Toast
} from '@/components/ui';
```

**Notify other zones when Phase 1 is complete** - they are blocked on core form components.

---

*Last Updated: [Update this when you make progress]*
*Status: IN PROGRESS*
