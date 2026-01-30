# Clean Code Practices

**Last Updated**: 2026-01-30
**Status**: Active Standard

This document provides practical examples and patterns for writing clean, maintainable code in the doughy-ai codebase.

---

## Table of Contents

1. [Naming](#naming)
2. [Functions](#functions)
3. [Components](#components)
4. [Comments](#comments)
5. [Error Handling](#error-handling)
6. [TypeScript Best Practices](#typescript-best-practices)
7. [React Patterns](#react-patterns)
8. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Naming

Good names make code self-documenting.

### Variables

```typescript
// Bad - cryptic abbreviations
const d = new Date();
const arr = users.filter(u => u.a);
const tmp = calculateTotal();
const val = response.data;

// Good - descriptive names
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
const orderTotal = calculateTotal();
const userData = response.data;
```

### Booleans

```typescript
// Bad - unclear meaning
const open = true;
const flag = false;
const status = true;

// Good - reads like a question
const isModalOpen = true;
const hasValidSubscription = false;
const canEditDeal = true;
const shouldRefresh = true;
```

### Functions

```typescript
// Bad - vague verbs
function process(data: any) { }
function handle(event: Event) { }
function doStuff() { }
function manage(items: Item[]) { }

// Good - specific actions
function parseUserRegistration(data: RegistrationData) { }
function handleFormSubmission(event: FormEvent) { }
function calculateDealROI(deal: Deal): number { }
function sortLeadsByPriority(leads: Lead[]): Lead[] { }
```

### Collections

```typescript
// Bad - singular names for collections
const user = [user1, user2];
const lead = fetchLeads();

// Good - plural names for collections
const users = [user1, user2];
const leads = fetchLeads();

// Good - specific collection names
const activeUserIds = users.filter(u => u.isActive).map(u => u.id);
const pendingLeadCount = leads.filter(l => l.status === 'pending').length;
```

---

## Functions

### Single Responsibility

Each function should do one thing well.

```typescript
// Bad - does multiple things
function processUserAndSendEmail(userId: string) {
  const user = fetchUser(userId);
  validateUser(user);
  updateLastLogin(user);
  const template = loadEmailTemplate('welcome');
  sendEmail(user.email, template);
  logActivity('user_processed', userId);
}

// Good - single responsibility
function updateUserLastLogin(userId: string): void {
  const user = fetchUser(userId);
  validateUser(user);
  updateLastLogin(user);
}

function sendWelcomeEmail(userEmail: string): void {
  const template = loadEmailTemplate('welcome');
  sendEmail(userEmail, template);
}

function logUserActivity(userId: string, action: string): void {
  logActivity(action, userId);
}
```

### Keep Functions Short

Aim for 10-20 lines. Max 50 lines.

```typescript
// Bad - too long (abbreviated for example)
function processDeal(deal: Deal) {
  // 80 lines of validation
  // 60 lines of calculations
  // 40 lines of database operations
  // 30 lines of notifications
}

// Good - broken into focused functions
function processDeal(deal: Deal) {
  validateDeal(deal);
  const metrics = calculateDealMetrics(deal);
  await saveDeal(deal, metrics);
  await notifyStakeholders(deal);
}
```

### Limit Parameters

Max 3 parameters. Use options object for more.

```typescript
// Bad - too many parameters
function createLead(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  source: string,
  score: number,
  assignedTo: string
) { }

// Good - options object
interface CreateLeadOptions {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  source: LeadSource;
  score?: number;
  assignedTo?: string;
}

function createLead(options: CreateLeadOptions) { }
```

### Return Early

Avoid deep nesting with early returns.

```typescript
// Bad - deep nesting
function getActiveUser(id: string): User | null {
  if (id) {
    const user = findUser(id);
    if (user) {
      if (user.isActive) {
        if (!user.isDeleted) {
          return user;
        }
      }
    }
  }
  return null;
}

// Good - early returns
function getActiveUser(id: string): User | null {
  if (!id) return null;

  const user = findUser(id);
  if (!user) return null;
  if (!user.isActive) return null;
  if (user.isDeleted) return null;

  return user;
}
```

---

## Components

### One Component Per File

```typescript
// Bad - multiple components in one file
// LeadComponents.tsx
export function LeadCard() { }
export function LeadList() { }
export function LeadDetail() { }

// Good - one component per file
// LeadCard.tsx
export function LeadCard() { }

// LeadList.tsx
export function LeadList() { }

// LeadDetail.tsx
export function LeadDetail() { }
```

### Props Interface at Top

```typescript
// Good - props interface clearly defined at top
interface LeadCardProps {
  lead: Lead;
  onPress: (lead: Lead) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export function LeadCard({
  lead,
  onPress,
  isSelected = false,
  showActions = true
}: LeadCardProps) {
  // Component logic
}
```

### Extract Complex Logic to Hooks

```typescript
// Bad - complex logic in component
function DealDetailScreen() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 50 lines of data fetching logic
  }, []);

  const handleUpdate = async () => {
    // 30 lines of update logic
  };

  // More state management...
}

// Good - logic extracted to hook
function DealDetailScreen() {
  const { deal, isLoading, error, updateDeal } = useDealDetail(dealId);

  // Clean component focuses on rendering
}
```

### Avoid Inline Styles > 3 Properties

```typescript
// Bad - long inline styles
<View style={{
  padding: 16,
  marginTop: 8,
  backgroundColor: 'white',
  borderRadius: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
}}>

// Good - use StyleSheet or design system
<View style={styles.card}>

// Or with design system utilities
<Card variant="elevated" padding="md">
```

---

## Comments

### Code Should Be Self-Documenting

```typescript
// Bad - comment explains WHAT
// Loop through users and check if active
for (const user of users) {
  if (user.isActive) {
    activeUsers.push(user);
  }
}

// Good - code is self-documenting
const activeUsers = users.filter(user => user.isActive);
```

### Comments Explain WHY, Not WHAT

```typescript
// Bad - explains what
// Add 7 days to the date
const expiryDate = addDays(createdAt, 7);

// Good - explains why
// Leads expire after 7 days per business rules (see DEAL-123)
const expiryDate = addDays(createdAt, LEAD_EXPIRY_DAYS);
```

### JSDoc for Public APIs

```typescript
/**
 * Calculates the after-repair value (ARV) of a property based on comparables.
 *
 * @param property - The property to calculate ARV for
 * @param comps - Array of comparable properties (minimum 3 required)
 * @returns The calculated ARV, or null if insufficient data
 *
 * @example
 * const arv = calculateARV(myProperty, comparables);
 * if (arv) {
 *   console.log(`Estimated ARV: $${arv.toLocaleString()}`);
 * }
 */
export function calculateARV(
  property: Property,
  comps: Comparable[]
): number | null {
  // Implementation
}
```

### Update or Delete Stale Comments

```typescript
// Bad - stale comment
// TODO: Add validation (added 2024-01-15)
function saveUser(user: User) {
  // Validation was added months ago but comment remains
  validateUser(user);
  // ...
}

// Good - remove outdated comments, or update them
function saveUser(user: User) {
  validateUser(user);
  // ...
}
```

---

## Error Handling

### Handle Errors at Boundaries

```typescript
// Screen level - user-facing error handling
async function handleSaveDeal() {
  try {
    setIsSaving(true);
    await saveDeal(dealData);
    showToast({ type: 'success', message: 'Deal saved successfully' });
    navigation.goBack();
  } catch (error) {
    logError('saveDeal', error, { dealId: dealData.id });
    showToast({ type: 'error', message: 'Failed to save deal. Please try again.' });
  } finally {
    setIsSaving(false);
  }
}
```

### Log with Context

```typescript
// Bad - no context
catch (error) {
  console.error(error);
}

// Good - rich context for debugging
catch (error) {
  logError('fetchLeads', error, {
    userId: currentUser.id,
    filters: appliedFilters,
    page: currentPage,
    timestamp: new Date().toISOString(),
  });
}
```

### User-Friendly Messages

```typescript
// Bad - technical error message
showToast({ message: 'Error: ECONNREFUSED 127.0.0.1:5432' });

// Good - user-friendly message
showToast({
  type: 'error',
  message: 'Unable to connect. Please check your internet connection.',
});
```

### Never Swallow Errors Silently

```typescript
// Bad - silent failure
try {
  await riskyOperation();
} catch (e) {
  // Nothing - user has no idea something failed
}

// Bad - logs but user unaware
try {
  await riskyOperation();
} catch (e) {
  console.error(e); // Only developers see this
}

// Good - appropriate handling
try {
  await riskyOperation();
} catch (error) {
  logError('riskyOperation', error);
  // Either show user feedback OR re-throw if caller should handle
  throw new UserFacingError('Operation failed. Please try again.');
}
```

---

## TypeScript Best Practices

### Avoid `any`

```typescript
// Bad
function processData(data: any) {
  return data.items.map((item: any) => item.name);
}

// Good
interface DataResponse {
  items: Array<{ name: string; id: string }>;
}

function processData(data: DataResponse) {
  return data.items.map(item => item.name);
}
```

### Use Union Types for Finite Sets

```typescript
// Bad - too permissive
interface Lead {
  status: string;
  source: string;
}

// Good - type-safe
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
type LeadSource = 'website' | 'referral' | 'cold_call' | 'marketing';

interface Lead {
  status: LeadStatus;
  source: LeadSource;
}
```

### Prefer Type Inference

```typescript
// Bad - unnecessary type annotations
const name: string = 'John';
const count: number = 5;
const items: string[] = ['a', 'b', 'c'];

// Good - let TypeScript infer
const name = 'John';
const count = 5;
const items = ['a', 'b', 'c'];

// Do annotate when inference isn't enough
const userMap: Map<string, User> = new Map();
```

### Use `readonly` for Immutable Data

```typescript
interface DealMetrics {
  readonly id: string;
  readonly createdAt: Date;
  arv: number;  // Mutable - can be updated
  roi: number;  // Mutable - can be recalculated
}
```

---

## React Patterns

### Prefer Composition Over Props Drilling

```typescript
// Bad - props drilling through multiple levels
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Parent>
</GrandParent>

// Good - use context or composition
<UserProvider user={user}>
  <GrandParent>
    <Parent>
      <Child>
        <GrandChild /> {/* Uses useUser() hook */}
      </Child>
    </Parent>
  </GrandParent>
</UserProvider>
```

### Memoize Expensive Calculations

```typescript
// Bad - recalculates on every render
function DealsList({ deals }: { deals: Deal[] }) {
  const sortedDeals = deals.sort((a, b) => b.value - a.value);
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  // ...
}

// Good - memoized
function DealsList({ deals }: { deals: Deal[] }) {
  const sortedDeals = useMemo(
    () => [...deals].sort((a, b) => b.value - a.value),
    [deals]
  );

  const totalValue = useMemo(
    () => deals.reduce((sum, d) => sum + d.value, 0),
    [deals]
  );
  // ...
}
```

### Stable Callback References

```typescript
// Bad - new function reference each render
function LeadList() {
  return (
    <FlatList
      data={leads}
      renderItem={({ item }) => (
        <LeadCard
          lead={item}
          onPress={() => handlePress(item)} // New function each render
        />
      )}
    />
  );
}

// Good - stable reference
function LeadList() {
  const handleLeadPress = useCallback((lead: Lead) => {
    navigation.navigate('LeadDetail', { id: lead.id });
  }, [navigation]);

  return (
    <FlatList
      data={leads}
      renderItem={({ item }) => (
        <LeadCard lead={item} onPress={handleLeadPress} />
      )}
    />
  );
}
```

---

## Anti-Patterns to Avoid

### Magic Numbers

```typescript
// Bad
if (retries > 3) { }
setTimeout(fn, 5000);
if (score >= 80) { }

// Good
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const QUALIFIED_LEAD_THRESHOLD = 80;

if (retries > MAX_RETRIES) { }
setTimeout(fn, RETRY_DELAY_MS);
if (score >= QUALIFIED_LEAD_THRESHOLD) { }
```

### Boolean Parameters

```typescript
// Bad - unclear what true/false means
processLead(lead, true, false);

// Good - use named parameters
processLead(lead, {
  sendNotification: true,
  skipValidation: false
});
```

### Negative Conditionals

```typescript
// Bad - hard to read
if (!isNotActive) { }
if (!user.isDisabled) { }

// Good - positive conditionals
if (isActive) { }
if (user.isEnabled) { }
```

### God Objects

```typescript
// Bad - object does everything
class DealManager {
  fetchDeals() { }
  saveDeal() { }
  deleteDeal() { }
  calculateROI() { }
  generateReport() { }
  sendNotification() { }
  validateDeal() { }
  formatDealForDisplay() { }
  // 50 more methods...
}

// Good - separate concerns
class DealRepository { /* fetch, save, delete */ }
class DealCalculator { /* ROI, metrics */ }
class DealReporter { /* generate reports */ }
class DealNotifier { /* send notifications */ }
```

---

## Quick Reference

### Do's

- Use descriptive names
- Keep functions short (< 20 lines ideal)
- Return early to avoid nesting
- Use TypeScript strictly (no `any`)
- Handle errors with user feedback
- Memoize expensive operations

### Don'ts

- Use abbreviations in public APIs
- Have functions with > 3 parameters
- Nest more than 3 levels deep
- Use magic numbers
- Swallow errors silently
- Put multiple components in one file

---

## Related Documentation

- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - File size limits and structure
- [CODE_NAMING_CONVENTIONS.md](./CODE_NAMING_CONVENTIONS.md) - Naming conventions
- [TECH_DEBT_GUIDE.md](./TECH_DEBT_GUIDE.md) - Managing technical debt
