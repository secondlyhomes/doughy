# Examples Directory

**Reference implementations for your mobile app blueprint.**

This directory contains production-ready examples that you can copy and customize for your app. All examples are fully functional, documented, and follow best practices.

## Quick Start

1. **Browse examples** - Explore directories below
2. **Copy to your project** - Use `cp` commands in each README
3. **Customize** - Adapt to your needs
4. **Reference anytime** - Examples stay here for future reference

## Directory Structure

```
.examples/
├── components/           # UI components
│   └── advanced/         # Card, LoadingState, ErrorState, EmptyState, FormField
│
├── screens/              # Complete screen examples
│   └── auth/             # LoginScreen, SignupScreen
│
├── features/             # Full feature implementations
│   ├── auth-local/       # Local-only auth (no database)
│   ├── auth-supabase/    # Supabase auth with session management
│   ├── tasks-local/      # Tasks with AsyncStorage (no database)
│   └── tasks-supabase/   # Tasks with Supabase backend
│
├── database/             # Database setup and patterns
│   ├── supabase-client.ts
│   ├── migrations/       # Example SQL migrations
│   └── rls-examples.sql  # Row Level Security patterns
│
├── navigation/           # Navigation patterns
│   ├── TabNavigator.tsx  # Bottom tabs
│   └── AuthNavigator.tsx # Auth guards
│
└── patterns/             # Implementation patterns
    ├── supabase-vault.md # Secure API key storage
    └── (more patterns)   # Push notifications, offline sync, AI integration
```

## Core Philosophy

### Database Optional

**Every feature has TWO versions:**
- **Local version** - Uses AsyncStorage, no database required
- **Supabase version** - Full backend with sync

Start with local, upgrade when ready.

### Copy, Don't Import

Examples are **reference implementations**, not a library:
- ✅ Copy files to your `src/` directory
- ✅ Customize for your needs
- ✅ Own the code
- ❌ Don't import from `.examples/`

### Production Ready

All examples include:
- Full TypeScript types
- Error handling
- Loading states
- Accessibility
- Theme integration
- Comprehensive documentation

---

## Components

### Advanced Components

Located: [components/advanced/](components/advanced/)

**What's included:**
- **Card** - Full-featured card with variants, press handling, shadows
- **LoadingState** - Loading spinner with optional message and overlay
- **ErrorState** - Error UI with retry button
- **EmptyState** - Empty states with icon, title, description, CTA
- **FormField** - Complex form input with validation, icons, password toggle

**When to use:** Building production UIs with consistent patterns

**Quick copy:**
```bash
cp .examples/components/advanced/Card.tsx src/components/
```

[→ Full documentation](components/advanced/)

---

## Screens

### Auth Screens

Located: [screens/auth/](screens/auth/)

**What's included:**
- **LoginScreen** - Email/password login with validation
- **SignupScreen** - Signup with password strength indicator

**When to use:** Building authentication flows

**Works with:**
- Local auth (no database)
- Supabase auth
- Any auth context with `useAuth()` hook

**Quick copy:**
```bash
cp .examples/screens/auth/LoginScreen.tsx app/(auth)/login.tsx
cp .examples/screens/auth/SignupScreen.tsx app/(auth)/signup.tsx
```

[→ Full documentation](screens/auth/)

---

## Features

### Auth (Local)

Located: [features/auth-local/](features/auth-local/)

**What's included:**
- AuthContext with AsyncStorage
- Sign in, sign up, sign out
- Session persistence
- No database required

**When to use:**
- Prototypes and demos
- Offline-first apps
- Apps without user accounts

**Quick copy:**
```bash
cp .examples/features/auth-local/AuthContext.tsx src/contexts/
```

[→ Full documentation](features/auth-local/)

### Tasks (Local)

Located: [features/tasks-local/](features/tasks-local/)

**What's included:**
- Complete CRUD operations
- AsyncStorage persistence
- TasksContext provider
- Priority, due dates, stats
- No database required

**When to use:**
- Building task/todo features
- Offline-first apps
- Prototyping before adding backend

**Quick copy:**
```bash
cp -r .examples/features/tasks-local src/features/
```

[→ Full documentation](features/tasks-local/)

---

## Database

Located: [database/](database/)

**What's included:**
- Supabase client setup with secure storage
- Example migrations (tasks, categories)
- RLS policy patterns
- Type generation workflow

**When to use:**
- Adding Supabase backend
- Multi-device sync
- Cloud storage
- Real-time features

**Quick copy:**
```bash
cp .examples/database/supabase-client.ts src/services/
```

[→ Full documentation](database/)

---

## Navigation

Located: [navigation/](navigation/)

**What's included:**
- Tab navigation with Expo Router
- Auth guards and redirects
- Modal patterns
- Deep linking

**When to use:**
- Setting up app navigation
- Protecting routes with auth
- Adding tabs or modals

**Quick copy:**
```bash
# Reference implementation - adapt to your app/(tabs)/_layout.tsx
```

[→ Full documentation](navigation/)

---

## Patterns

Located: [patterns/](patterns/)

**What's included:**
- **Supabase Vault** - Secure API key storage with encryption
- **Push Notifications** - Complete setup with Expo notifications
- **Offline Sync** - Offline-first data patterns
- **AI Integration** - LLM API call patterns with cost optimization

**When to use:**
- Implementing specific features
- Following security best practices
- Learning recommended patterns

[→ Full documentation](patterns/)

---

## Usage Workflow

### 1. Choose Your Path

**Option A: No Database (Start Simple)**
```bash
# Copy local auth
cp .examples/features/auth-local/AuthContext.tsx src/contexts/

# Copy local tasks
cp -r .examples/features/tasks-local src/features/

# Copy auth screens
cp .examples/screens/auth/*.tsx app/(auth)/
```

**Option B: With Supabase (Full Backend)**
```bash
# Copy Supabase client
cp .examples/database/supabase-client.ts src/services/

# Run migrations
# (See database/README.md)

# Copy Supabase features
```

### 2. Wrap Your App

```tsx
// app/_layout.tsx
import { ThemeProvider } from '@/theme'
import { AuthProvider } from '@/contexts/AuthContext'
import { TasksProvider } from '@/features/tasks-local/TasksContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TasksProvider>
          <Stack />
        </TasksProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### 3. Use in Screens

```tsx
import { useAuth } from '@/contexts/AuthContext'
import { useTasks } from '@/features/tasks-local/TasksContext'

function MyScreen() {
  const { user } = useAuth()
  const { tasks, createTask } = useTasks()

  // Use features
}
```

### 4. Upgrade When Ready

Swap local features for Supabase features:

```bash
# Before (local)
import { AuthContext } from '@/features/auth-local/AuthContext'

# After (Supabase)
import { AuthContext } from '@/features/auth-supabase/AuthContext'
```

No UI changes needed - same API!

---

## Customization Guide

### Theme

All examples use theme tokens:

```tsx
// Customize in src/theme/tokens.ts
export const colors = {
  primary: {
    500: '#your-brand-color',  // Change primary color
  }
}
```

Examples automatically use your theme.

### Components

All components accept custom styles:

```tsx
<Card
  style={{
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  }}
>
  <Text>Custom styled</Text>
</Card>
```

### Validation

FormField supports custom validation:

```tsx
<FormField
  name="email"
  rules={{
    required: 'Email is required',
    pattern: {
      value: /custom-regex/,
      message: 'Invalid format'
    },
    validate: (value) => {
      // Custom validation logic
      return value.includes('@') || 'Must contain @'
    }
  }}
/>
```

---

## Best Practices

### 1. Read Before Copying

Each directory has a README with:
- Usage examples
- Customization tips
- Common patterns
- Troubleshooting

### 2. Copy Entire Features

```bash
# ✅ Good - Copy entire feature
cp -r .examples/features/tasks-local src/features/

# ❌ Bad - Cherry-pick files
cp .examples/features/tasks-local/TasksContext.tsx src/
```

### 3. Maintain Consistency

If you customize a pattern, apply it everywhere:

```tsx
// If you add error logging to one feature...
catch (error) {
  console.error('Task creation failed:', error)
  logToAnalytics(error)
}

// ...do it in all features
```

### 4. Test After Copying

```bash
# Always test after copying
npm test
npx tsc --noEmit
```

### 5. Keep Examples Updated

Pull latest changes:

```bash
git pull origin main
# New examples appear in .examples/
```

---

## Testing Examples

All examples are tested and ready to use:

```bash
# Test components
npm test src/components/

# Test features
npm test src/features/

# TypeScript check
npx tsc --noEmit
```

---

## Migration Paths

### Local → Supabase

**Tasks:**
```bash
# 1. Setup Supabase
cp .examples/database/supabase-client.ts src/services/

# 2. Run migrations
# (See database/README.md)

# 3. Replace context
cp .examples/features/tasks-supabase/TasksContext.tsx src/contexts/

# 4. Migrate data (optional)
# Use migration script from tasks-local/README.md
```

**Auth:**
```bash
# Replace local auth with Supabase auth
cp .examples/features/auth-supabase/AuthContext.tsx src/contexts/
```

No UI changes needed!

---

## Contributing Examples

Have a useful pattern? Add it to `.examples/`:

1. **Create directory** - Follow structure above
2. **Add implementation** - Production-ready code
3. **Write README** - Usage, examples, troubleshooting
4. **Test thoroughly** - Must work out of the box
5. **Submit PR** - Share with community

---

## FAQ

### Can I modify examples?

Yes! Copy and customize freely. Examples are starting points, not dependencies.

### Do I need a database?

No. Start with local examples (AsyncStorage). Upgrade to Supabase later if needed.

### Can I use with Firebase/AWS?

Yes. Examples use standard patterns. Adapt database layer as needed.

### Where are Supabase features?

Coming soon! Local features work now. Supabase versions in progress.

### How do I update examples?

```bash
git pull origin main
# Check .examples/ for updates
```

---

## Related Documentation

- **Design System:** [docs/05-ui-ux/DESIGN-SYSTEM.md](../docs/05-ui-ux/DESIGN-SYSTEM.md)
- **New Feature Guide:** [docs/patterns/NEW-FEATURE.md](../docs/patterns/NEW-FEATURE.md)
- **New Screen Guide:** [docs/patterns/NEW-SCREEN.md](../docs/patterns/NEW-SCREEN.md)
- **Supabase Setup:** [docs/03-database/SUPABASE-SETUP.md](../docs/03-database/SUPABASE-SETUP.md)
- **Security Checklist:** [docs/09-security/SECURITY-CHECKLIST.md](../docs/09-security/SECURITY-CHECKLIST.md)

---

## Support

**Questions?** Check individual README files for each example.

**Issues?** See [docs/12-maintenance/DOCUMENTATION-MAINTENANCE.md](../docs/12-maintenance/DOCUMENTATION-MAINTENANCE.md)

**Need help?** Review comprehensive docs in `docs/` directory.
