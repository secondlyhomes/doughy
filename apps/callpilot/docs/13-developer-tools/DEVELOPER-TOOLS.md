# Developer Tools & CLI

Comprehensive developer tools for enhanced productivity.

## Overview

This blueprint includes production-ready developer tools for:

1. **Code Generation** - Generate components, screens, features, and more
2. **Database Tools** - Manage migrations and seed data
3. **Testing Utilities** - Enhanced test setup and runners
4. **Development Scripts** - Clean, check, and diagnose
5. **VS Code Integration** - Settings, extensions, snippets, and tasks

## Quick Start

```bash
# First-time setup
npm run dev:setup

# Check environment
npm run doctor

# Generate code
npm run generate

# Run checks
npm run check

# Clean build artifacts
npm run clean
```

## Code Generation

### Interactive Generator

```bash
npm run generate
```

**Prompts:**
```
? What would you like to generate?
  Component - UI component
  Screen - Screen component
  Context - React Context provider
  Hook - Custom React hook
  Service - Business logic service
  Feature - Complete feature module
  Utility - Pure utility function
  Type - TypeScript type definitions
```

### Direct Generation

```bash
npm run gen:component Button
npm run gen:screen UserProfile
npm run gen:hook useAuth
npm run gen:service auth
npm run gen:feature Tasks
```

### Generated Files

**Component:**
```
src/components/
├── Button.tsx
└── __tests__/
    └── Button.test.tsx
```

**Feature:**
```
src/features/tasks/
├── components/
│   └── TasksList.tsx
├── screens/
│   └── tasks-screen.tsx
├── hooks/
│   └── useTasks.ts
├── TasksContext.tsx
├── tasksService.ts
├── types.ts
├── index.ts
└── README.md
```

### Templates

All templates follow project conventions:
- Named exports only
- Theme integration
- TypeScript types
- Comprehensive tests
- JSDoc comments

See: [Code Generation README](../../scripts/generators/README.md)

## Database Tools

### Migrations

```bash
# Run migrations
npm run db:migrate

# Check status
npm run db:migrate:status

# Create migration
npm run db:migrate:create add_users_table

# Rollback
npm run db:migrate:rollback

# Reset (dev only)
npm run db:migrate:reset
```

### Seeding

```bash
# Seed all tables
npm run db:seed

# Seed specific table
npm run db:seed users

# Clear data
npm run db:seed:clear

# Generate seed file
npm run db:seed:generate
```

### Workflow

```bash
# 1. Create migration
npm run db:migrate:create add_tasks_table

# 2. Edit migration
vim supabase/migrations/TIMESTAMP_add_tasks_table.sql

# 3. Run migration
npm run db:migrate

# 4. Generate types
npm run gen:types

# 5. Seed test data
npm run db:seed
```

See: [Database Tools README](../../scripts/db/README.md)

## Testing Utilities

### Test Setup

Enhanced test setup with:
- Expo module mocks
- Supabase mocks
- AsyncStorage mocks
- Test data factories
- Custom matchers

**Import in tests:**
```tsx
import { factories, mocks, helpers } from '../../scripts/test/setup-tests'

// Use factories
const user = factories.user({ email: 'test@example.com' })
const task = factories.task({ title: 'Test Task' })

// Use mocks
const mockSupabase = mocks.supabase()
const mockNavigation = mocks.navigation()

// Use helpers
await helpers.wait(100)
await helpers.waitFor(() => condition())
```

### Test Runner

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# CI mode
npm run test:ci

# Debug tests
npm run test:debug
```

### Custom Matchers

```tsx
// UUID matcher
expect(value).toBeValidUUID()

// ISO date matcher
expect(date).toBeValidISODate()

// Object matcher
expect(array).toContainObjectMatching({ id: '123' })
```

## Development Scripts

### Clean

Remove build artifacts and caches:

```bash
# Interactive clean
npm run clean

# Clean cache only
npm run clean:cache

# Clean build files
npm run clean:build

# Deep clean (including node_modules)
npm run clean:deep
```

### Check

Run quality checks:

```bash
# Run all checks
npm run check

# Individual checks
npm run check:lint
npm run check:types
npm run check:tests
```

**Checks:**
- ESLint (code quality)
- TypeScript (type errors)
- Tests (test suite)
- Prettier (formatting)
- Secrets (hardcoded secrets)
- Component Size (file sizes)

### Doctor

Diagnose development environment:

```bash
npm run doctor
```

**Output:**
```
🔍 Environment Diagnostics

Checking Node.js...
  ✓ Node.js v20.10.0

Checking npm...
  ✓ npm 10.2.3

Checking Expo CLI...
  ✓ Expo CLI 0.18.0

Checking Supabase CLI...
  ⚠️  Supabase CLI not found (optional)

Checking Git...
  ✓ git version 2.42.0

Checking TypeScript...
  ✓ TypeScript 5.7.2

Checking dependencies...
  ✓ 50 dependencies installed

Checking environment variables...
  ✓ .env.local exists (4 variables)

Checking ports...
  · Port 19000 (Expo DevTools) available
  · Port 19001 (Expo Metro) available
  · Port 54321 (Supabase API) available

Checking file structure...
  ✓ All required files present

📊 Summary:

  ✓ Node.js         v20.10.0
  ✓ npm             10.2.3
  ✓ Expo CLI        0.18.0
  ⚠ Supabase CLI    Not found (optional)
  ✓ Git             git version 2.42.0
  ✓ TypeScript      TypeScript 5.7.2
  ✓ Dependencies    50 installed
  ✓ Environment     4 variables
  ✓ Ports           All available
  ✓ File Structure  Complete

  ✓ Passed: 9
  ⚠ Warnings: 1

✅ Environment is ready!
```

### First-Time Setup

Interactive setup wizard:

```bash
npm run dev:setup
```

**Steps:**
1. Check prerequisites (Node.js, npm, Git)
2. Install dependencies
3. Setup environment variables
4. Setup Git hooks
5. Optional: Setup local Supabase
6. Run environment diagnostics

## VS Code Integration

### Settings

Pre-configured workspace settings in `.vscode/settings.json`:

**Features:**
- Format on save
- Auto-fix ESLint
- Organize imports
- TypeScript IntelliSense
- Path aliases support
- Recommended file exclusions

### Extensions

Recommended extensions in `.vscode/extensions.json`:

**Essential:**
- ESLint
- Prettier
- TypeScript

**React Native:**
- React Native Tools
- ES7 React/Redux snippets

**Testing:**
- Jest

**Utilities:**
- GitLens
- Error Lens
- Path IntelliSense

**Install all:**
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
# ... etc
```

### Snippets

Custom code snippets in `.vscode/snippets/`:

**React Native:**
- `rnc` - React Native Component
- `rns` - React Native Screen
- `ush` - Custom Hook
- `ctx` - React Context
- `sv` - Styled View
- `ss` - StyleSheet
- `uth` - useTheme

**TypeScript:**
- `int` - Interface
- `typ` - Type
- `enum` - Enum
- `props` - Props Interface
- `dbt` - Database Type

**Testing:**
- `desc` - Test Suite
- `it` - Test Case
- `ait` - Async Test
- `rct` - Component Test
- `hkt` - Hook Test
- `exp` - Expect Assertion

**Usage:**
Type snippet prefix and press Tab.

### Tasks

Pre-configured tasks in `.vscode/tasks.json`:

**Run tasks:**
- Cmd/Ctrl + Shift + P
- Type "Run Task"
- Select task

**Available tasks:**
- Start Expo
- Run Tests
- Run Tests (Watch)
- Type Check
- Lint
- Lint Fix
- Clean
- Generate Component
- Generate Screen
- Database Migration
- Database Seed
- Generate Types
- Environment Check

### Debug Configurations

Launch configurations in `.vscode/launch.json`:

**Available:**
- Debug iOS
- Debug Android
- Debug Expo
- Attach to packager
- Debug Jest Tests
- Debug Current Jest Test

**Usage:**
1. Open Debug panel (Cmd/Ctrl + Shift + D)
2. Select configuration
3. Press F5 or click "Start Debugging"

## Package.json Scripts

All available npm scripts:

### Development
```bash
npm start              # Start Expo
npm run android        # Start on Android
npm run ios            # Start on iOS
npm run web            # Start on web
```

### Code Generation
```bash
npm run generate       # Interactive generator
npm run gen            # Alias for generate
npm run gen:component  # Generate component
npm run gen:screen     # Generate screen
npm run gen:hook       # Generate hook
npm run gen:service    # Generate service
npm run gen:feature    # Generate feature
```

### Database
```bash
npm run db:migrate              # Run migrations
npm run db:migrate:status       # Migration status
npm run db:migrate:create       # Create migration
npm run db:migrate:rollback     # Rollback
npm run db:migrate:reset        # Reset (dev only)
npm run db:migrate:list         # List migrations
npm run db:seed                 # Seed database
npm run db:seed:clear           # Clear data
npm run db:seed:generate        # Generate seed file
npm run db:reset                # Reset + seed
```

### Testing
```bash
npm test                        # Run all tests
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage
npm run test:unit               # Unit tests only
npm run test:integration        # Integration tests
npm run test:ci                 # CI mode
npm run test:debug              # Debug mode
npm run test:update-snapshots   # Update snapshots
```

### Quality
```bash
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run type-check     # TypeScript check
npm run validate       # Lint + Type + Test
npm run validate:full  # With coverage
```

### Development Tools
```bash
npm run clean          # Clean artifacts
npm run clean:cache    # Clean cache only
npm run clean:build    # Clean build only
npm run clean:deep     # Deep clean
npm run check          # Run all checks
npm run check:lint     # Lint check
npm run check:types    # Type check
npm run check:tests    # Tests check
npm run doctor         # Environment diagnostics
npm run dev:setup      # First-time setup
```

### Types
```bash
npm run gen:types      # Generate Supabase types
```

### Setup & Deployment
```bash
npm run init           # Interactive setup wizard
npm run setup          # Legacy setup
npm run features       # Add features
npm run pre-launch:audit   # Pre-launch audit
npm run version:bump   # Bump version
npm run changelog:generate # Generate changelog
npm run pre-deploy:check   # Pre-deploy checks
npm run deploy         # Deploy
```

## Workflow Examples

### Daily Development

```bash
# Start day
npm run doctor          # Check environment
npm start               # Start Expo

# Generate new component
npm run gen:component Card

# Run checks before commit
npm run check

# Commit changes
git add .
git commit -m "feat: add Card component"
```

### Feature Development

```bash
# Create feature
npm run gen:feature Tasks

# Create migration
npm run db:migrate:create add_tasks_table

# Edit migration
vim supabase/migrations/TIMESTAMP_add_tasks_table.sql

# Run migration
npm run db:migrate

# Generate types
npm run gen:types

# Seed test data
npm run db:seed

# Develop feature
# ...

# Run checks
npm run check

# Commit
git add .
git commit -m "feat: add Tasks feature"
```

### Testing Workflow

```bash
# Watch mode during development
npm run test:watch

# Run specific tests
npm run test:unit

# Check coverage
npm run test:coverage

# Debug failing test
npm run test:debug
```

### Maintenance

```bash
# Clean build artifacts
npm run clean

# Update dependencies
npm update

# Check environment
npm run doctor

# Deep clean and reinstall
npm run clean:deep
npm install
```

## Best Practices

### 1. Use Generators

Always use generators for consistency:

```bash
# ✅ Good
npm run gen:component Button

# ❌ Avoid
touch src/components/Button.tsx
```

### 2. Run Checks Before Commit

```bash
npm run check
```

This runs:
- ESLint
- TypeScript check
- Tests
- Secret detection
- Component size check

### 3. Keep Database in Sync

```bash
# After schema changes
npm run db:migrate
npm run gen:types
```

### 4. Use VS Code Tasks

Cmd/Ctrl + Shift + P → "Run Task" → Select task

Faster than typing npm commands.

### 5. Leverage Snippets

Type snippet prefix + Tab for instant code generation.

### 6. Check Environment Regularly

```bash
npm run doctor
```

Especially after:
- Installing dependencies
- Changing environment variables
- Updating tools

## Troubleshooting

### Generator Issues

**Issue:** Template not found

**Solution:**
```bash
ls scripts/generators/templates/
# Verify template exists
```

### Database Issues

**Issue:** Supabase CLI not found

**Solution:**
```bash
npm install -g supabase
```

**Issue:** Migration failed

**Solution:**
1. Check SQL syntax
2. Verify table names
3. Check for missing dependencies

### Test Issues

**Issue:** Tests failing with module errors

**Solution:**
```bash
npm run clean:cache
npm test
```

**Issue:** Mock not working

**Solution:**
Check `scripts/test/setup-tests.js` for proper mocks.

### VS Code Issues

**Issue:** Path aliases not resolving

**Solution:**
1. Check `tsconfig.json` has path aliases
2. Restart TypeScript server (Cmd/Ctrl + Shift + P → "Restart TS Server")

**Issue:** Snippets not working

**Solution:**
1. Check `.vscode/snippets/` files exist
2. Reload VS Code

## Related Documentation

- [Code Generators](../../scripts/generators/README.md)
- [Database Tools](../../scripts/db/README.md)
- [Project Scripts](../../scripts/README.md)
- [New Feature Pattern](../patterns/NEW-FEATURE.md)
- [Testing Guide](../06-testing/TESTING-STRATEGY.md)

## Contributing

### Adding New Generators

1. Create template in `scripts/generators/templates/`
2. Add to `TEMPLATE_TYPES` in `generate.js`
3. Test generation
4. Update documentation

### Adding New Scripts

1. Create script in `scripts/dev/` or appropriate directory
2. Add to `package.json` scripts
3. Test script
4. Update documentation

### Adding New Snippets

1. Edit `.vscode/snippets/*.code-snippets`
2. Follow existing format
3. Test snippet
4. Update documentation
