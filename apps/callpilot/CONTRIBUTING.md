# Contributing Guide

Thank you for contributing to the mobile-app-blueprint! This guide will help you get started with our development workflow.

## Table of Contents

- [Getting Started](#getting-started)
- [Git Workflow](#git-workflow)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Development Standards](#development-standards)
- [Testing Guidelines](#testing-guidelines)

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js 20+ and npm 10+
- Git
- Expo CLI (`npm install -g expo-cli`)
- Code editor with TypeScript support (VS Code recommended)

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mobile-app-blueprint.git
   cd mobile-app-blueprint
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Verify Setup**
   ```bash
   npm run validate
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```

## Git Workflow

We use a **Git Flow** inspired workflow with the following branch structure:

### Branch Types

| Branch | Purpose | Naming | Example |
|--------|---------|--------|---------|
| `master` | Production-ready code | `master` | `master` |
| `develop` | Integration branch for features | `develop` | `develop` |
| `feature/*` | New features or enhancements | `feature/short-description` | `feature/dark-mode-toggle` |
| `fix/*` | Bug fixes | `fix/short-description` | `fix/login-timeout` |
| `hotfix/*` | Urgent production fixes | `hotfix/short-description` | `hotfix/critical-crash` |
| `docs/*` | Documentation updates | `docs/short-description` | `docs/contributing-guide` |
| `test/*` | Test additions or fixes | `test/short-description` | `test/auth-integration` |
| `refactor/*` | Code refactoring (no feature change) | `refactor/short-description` | `refactor/auth-context` |

### Creating a Branch

**For features:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

**For bug fixes:**
```bash
git checkout develop
git pull origin develop
git checkout -b fix/bug-description
```

**For hotfixes (urgent production issues):**
```bash
git checkout master
git pull origin master
git checkout -b hotfix/critical-issue
```

### Branch Lifecycle

```
develop → feature/new-feature → develop → master
           ↓
         Work on feature
           ↓
         Commits
           ↓
         Pull Request
           ↓
         Code Review
           ↓
         Squash Merge to develop
```

## Commit Messages

We follow the **Conventional Commits** specification for clear, structured commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add biometric login` |
| `fix` | Bug fix | `fix(tasks): resolve duplicate entries` |
| `docs` | Documentation changes | `docs(readme): update installation steps` |
| `style` | Code style (formatting, no logic change) | `style(button): fix indentation` |
| `refactor` | Code refactoring (no feature/fix) | `refactor(api): extract http client` |
| `test` | Add or update tests | `test(auth): add login flow tests` |
| `chore` | Maintenance tasks | `chore(deps): update expo to 54.1.0` |
| `perf` | Performance improvements | `perf(list): implement virtualization` |
| `ci` | CI/CD changes | `ci(github): add build workflow` |
| `build` | Build system changes | `build(webpack): update config` |
| `revert` | Revert previous commit | `revert: feat(auth): add biometric login` |

### Scopes

Use component or feature names as scopes:

- `auth` - Authentication
- `tasks` - Task management
- `profile` - User profile
- `theme` - Theme system
- `api` - API integration
- `ui` - UI components
- `db` - Database
- `docs` - Documentation

### Examples

**Good commit messages:**

```bash
# Feature
feat(auth): implement JWT token refresh

Add automatic token refresh using Supabase session management.
Tokens are refreshed 5 minutes before expiry.

Closes #42

# Bug fix
fix(tasks): prevent duplicate task creation

Added debouncing to task creation button to prevent
double-taps from creating duplicate entries.

Fixes #38

# Documentation
docs(setup): add Windows installation guide

Added step-by-step guide for Windows users including
Node.js installation and path configuration.

# Refactor
refactor(api): extract supabase client to service

Moved Supabase client initialization from components
to centralized service for better testability.

# Breaking change
feat(auth)!: migrate to Supabase Auth v3

BREAKING CHANGE: Auth API updated to v3.
Users must re-authenticate after update.

Migration guide: docs/AUTH-MIGRATION.md
```

**Bad commit messages:**

```bash
❌ "fixed stuff"
❌ "wip"
❌ "updates"
❌ "asdfasdf"
❌ "Fix bug"  # Too vague, missing scope
```

### Commit Message Rules

1. **Subject line:**
   - Max 72 characters
   - Lowercase type and scope
   - No period at the end
   - Use imperative mood ("add" not "added")

2. **Body (optional but recommended):**
   - Explain what and why (not how)
   - Wrap at 72 characters
   - Separate from subject with blank line

3. **Footer (optional):**
   - Reference issues: `Closes #123`, `Fixes #456`
   - Breaking changes: `BREAKING CHANGE: description`

## Pull Request Process

### 1. Prepare Your Branch

Before creating a PR:

```bash
# Ensure all tests pass
npm test

# Ensure TypeScript compiles
npm run type-check

# Ensure linting passes
npm run lint

# Run all checks
npm run validate
```

### 2. Create Pull Request

**PR Title Format:**
```
<type>(<scope>): <description>
```

Examples:
- `feat(auth): add OAuth login support`
- `fix(tasks): resolve crash on empty list`
- `docs(setup): improve quickstart guide`

**PR Description Template:**

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test addition/update

## Related Issues
Closes #123
Fixes #456

## Changes Made
- Added OAuth login flow
- Updated auth context to handle OAuth tokens
- Added OAuth provider configuration

## Testing
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Added/updated unit tests
- [ ] Added/updated integration tests

## Screenshots (if applicable)
[Add screenshots of UI changes]

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] TypeScript compiles without errors
- [ ] No secrets or credentials in code

## Additional Notes
Any additional information reviewers should know.
```

### 3. Wait for Review

- **Automated checks** run on every PR (tests, linting, type-checking)
- **Code review** from at least one maintainer required
- **Address feedback** by pushing new commits to your branch
- **Squash merge** after approval (keeps history clean)

### 4. After Merge

```bash
# Switch back to develop
git checkout develop

# Pull latest changes
git pull origin develop

# Delete feature branch (local)
git branch -d feature/your-feature

# Delete feature branch (remote)
git push origin --delete feature/your-feature
```

## Code Review Checklist

### For Authors (Before Submitting PR)

- [ ] **Tests pass:** `npm test`
- [ ] **TypeScript compiles:** `npm run type-check`
- [ ] **Linting passes:** `npm run lint`
- [ ] **Tested on physical device** (iOS or Android)
- [ ] **No secrets in code** (API keys, passwords, tokens)
- [ ] **Components <200 lines** (target <150, split if larger)
- [ ] **RLS enabled** on all Supabase tables (if using database)
- [ ] **Service role key not in client code** (server-side only)
- [ ] **Theme tokens used** (no hardcoded colors/spacing)
- [ ] **Documentation updated** (if changing public APIs)
- [ ] **Screenshots added** (if UI changes)
- [ ] **Breaking changes documented** (if applicable)

### For Reviewers

#### Functionality
- [ ] Changes work as described
- [ ] No regressions in existing features
- [ ] Edge cases handled appropriately
- [ ] Error states handled gracefully

#### Code Quality
- [ ] Code is readable and well-structured
- [ ] No duplicate code (DRY principle)
- [ ] Functions are focused (single responsibility)
- [ ] Components <200 lines
- [ ] Appropriate abstractions (not over-engineered)

#### TypeScript
- [ ] No `any` types (use proper types)
- [ ] Interfaces/types defined for all props
- [ ] Type safety maintained throughout

#### Security
- [ ] No secrets hardcoded in code
- [ ] Service role key not exposed to client
- [ ] RLS policies enabled on tables
- [ ] User input validated
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (sanitized outputs)

#### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists virtualized
- [ ] Images optimized
- [ ] API calls batched/debounced where appropriate

#### Testing
- [ ] Tests cover new functionality
- [ ] Tests cover edge cases
- [ ] Tests are readable and maintainable
- [ ] Test coverage >80% for new code

#### Documentation
- [ ] Code comments where logic is complex
- [ ] Public APIs documented
- [ ] README updated if needed
- [ ] Migration guide if breaking changes

## Pre-commit Hooks

We use **Husky** to enforce code quality before commits.

### Installation

Pre-commit hooks are installed automatically when you run `npm install`.

If you need to reinstall:

```bash
npm run prepare
```

### What Gets Checked

**On every commit:**

1. **Secret scanning** - Blocks commits with API keys, tokens, passwords
2. **Component size check** - Warns if components >200 lines
3. **TypeScript check** - Ensures code compiles
4. **Linting** - Checks code style

**On commit message:**

1. **Conventional commit format** - Validates commit message structure

### Bypassing Hooks (Use Sparingly)

```bash
# Skip pre-commit hooks (use only when absolutely necessary)
git commit --no-verify -m "feat(temp): temporary commit"
```

**⚠️ Warning:** Bypassing hooks can introduce issues. Use only for:
- Work-in-progress commits on feature branches
- Emergency hotfixes (still must pass CI before merge)

### Hook Configuration

Pre-commit hook location: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Secret scanning
echo "🔍 Scanning for secrets..."
./scripts/check-secrets.sh || exit 1

# Component size check
echo "📏 Checking component sizes..."
./scripts/check-component-sizes.sh || exit 1

# TypeScript check
echo "🔷 Type checking..."
npm run type-check || exit 1

# Linting
echo "🧹 Linting..."
npm run lint || exit 1

echo "✅ Pre-commit checks passed!"
```

## Development Standards

### File Organization

```
src/
├── components/       # Shared UI components
│   ├── Button.tsx
│   └── Button.test.tsx
├── contexts/         # React Context providers
├── hooks/            # Custom hooks (useXxx.ts)
├── screens/          # Screen components
├── services/         # Business logic & API calls
├── types/            # TypeScript types
└── utils/            # Pure utility functions
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | `use` prefix | `useTaskOperations.ts` |
| Screens | kebab-case + suffix | `tasks-screen.tsx` |
| Services | camelCase | `aiClient.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Task`, `User` |
| Interfaces | PascalCase | `ITaskRepository` |

### Component Guidelines

1. **Size limit:** <200 lines, target <150 (split into smaller components if larger)

> **Platform Exception:** Components requiring platform-specific rendering (Platform.OS conditionals, gesture handlers, Animated setup) may exceed 150 lines but must stay under 200. If approaching 200, extract platform logic into hooks or sub-components.
2. **Named exports only:** No default exports
3. **Props interface:** Define TypeScript interface for all props
4. **Theme tokens:** Use theme system, never hardcode styles
5. **Accessibility:** Include accessibility props (role, label, etc.)

Example:

```tsx
// ✅ Good
import { Text, TouchableOpacity } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: variant === 'primary' ? theme.colors.primary[500] : theme.colors.neutral[200],
        padding: theme.spacing[4],
        borderRadius: theme.borderRadius.md,
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={{ color: theme.colors.white }}>{title}</Text>
    </TouchableOpacity>
  )
}
```

### Service Layer Guidelines

1. **Separation of concerns:** Keep business logic out of components
2. **Error handling:** Always handle errors gracefully
3. **Type safety:** Define return types explicitly
4. **Async/await:** Prefer over promises

Example:

```typescript
// src/services/taskService.ts
import { supabase } from './supabase'
import type { Task } from '@/types'

export const taskService = {
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
    return data as Task[]
  },

  async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw new Error(`Failed to create task: ${error.message}`)
    return data as Task
  },
}
```

## Testing Guidelines

### Test Requirements

- **Unit tests:** For utilities, services, hooks
- **Component tests:** For UI components
- **Integration tests:** For feature flows (auth, CRUD)
- **Coverage target:** 80% unit/integration (platform-appropriate E2E)

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:ci
```

### Test Structure

```typescript
// Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />)
    expect(getByText('Click Me')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn()
    const { getByText } = render(<Button title="Click Me" onPress={onPressMock} />)

    fireEvent.press(getByText('Click Me'))
    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    const { getByRole } = render(<Button title="Click Me" onPress={() => {}} disabled />)
    expect(getByRole('button')).toBeDisabled()
  })
})
```

### Testing Best Practices

1. **Arrange-Act-Assert:** Structure tests clearly
2. **Test behavior, not implementation:** Focus on what users see/do
3. **Mock external dependencies:** Database, APIs, etc.
4. **Use descriptive test names:** Clearly state what's being tested
5. **Keep tests focused:** One assertion per test (when possible)

## Getting Help

- **Documentation:** Check [docs/](docs/) for detailed guides
- **GitHub Issues:** [github.com/your-org/your-repo/issues](https://github.com/your-org/your-repo/issues)
- **Patterns:** Review [docs/patterns/](docs/patterns/) for implementation examples

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing! 🚀

---

## Advanced Contribution Workflows

### Feature Development Workflow

#### 1. Planning Phase

Before writing code:

1. **Check existing patterns:**
```bash
# Search for similar features
grep -r "similar-feature" docs/patterns/
```

2. **Review relevant docs:**
   - `docs/patterns/NEW-FEATURE.md` - Feature structure
   - `docs/patterns/NEW-SCREEN.md` - Screen patterns
   - `docs/patterns/SUPABASE-TABLE.md` - Database patterns

3. **Create feature proposal (for large features):**
   - Create GitHub issue with `feature` label
   - Describe problem and proposed solution
   - Get feedback before implementation

#### 2. Implementation Phase

**Step-by-step process:**

1. **Create feature branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/task-management
```

2. **Set up feature structure:**
```bash
# Create feature folder (if large feature)
mkdir -p src/features/tasks/{components,screens,services,hooks}
```

3. **Implement incrementally:**
   - Start with data layer (database, types)
   - Build service layer (API calls)
   - Create UI components
   - Implement screens
   - Add tests

4. **Test as you go:**
```bash
# Run tests after each component
npm test -- TaskCard

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

5. **Commit frequently with conventional commits:**
```bash
git add src/features/tasks/components/TaskCard.tsx
git commit -m "feat(tasks): add TaskCard component

- Display task title and description
- Show completion status
- Handle edit and delete actions"
```

#### 3. Code Review Phase

**Before requesting review:**

1. **Self-review checklist:**
   - [ ] Read through your own code
   - [ ] Remove console.logs
   - [ ] Remove commented code
   - [ ] Check for TODOs
   - [ ] Verify no secrets in code
   - [ ] Test on physical device
   - [ ] Update documentation

2. **Run all validations:**
```bash
npm run validate
```

3. **Create comprehensive PR:**
   - Use PR template
   - Add screenshots for UI changes
   - Explain complex decisions
   - Link related issues

**Responding to feedback:**

1. **Address all comments:**
   - Fix issues
   - Explain decisions
   - Ask for clarification if needed

2. **Update PR:**
```bash
# Make changes
git add .
git commit -m "fix(tasks): address review feedback

- Extract complex logic to hook
- Add error boundary
- Improve accessibility labels"

git push origin feature/task-management
```

3. **Re-request review** after addressing feedback

---

### Release Process

#### Versioning Strategy

We follow **Semantic Versioning**:
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backwards compatible)
- **PATCH** (0.0.1): Bug fixes

#### Creating a Release

**For Maintainers:**

1. **Prepare release branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b release/1.2.0
```

2. **Update version numbers:**

**package.json:**
```json
{
  "version": "1.2.0"
}
```

**app.json:**
```json
{
  "expo": {
    "version": "1.2.0",
    "ios": {
      "buildNumber": "12"
    },
    "android": {
      "versionCode": 12
    }
  }
}
```

3. **Update CHANGELOG.md:**
```markdown
## [1.2.0] - 2024-02-07

### Added
- Task management feature
- Dark mode support
- Biometric authentication

### Fixed
- Memory leak in task list
- Navigation crash on Android

### Changed
- Improved performance of FlatList rendering
- Updated Supabase to 2.38.0
```

4. **Run final tests:**
```bash
npm test
npx tsc --noEmit
npm run lint
```

5. **Merge to master:**
```bash
git checkout master
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin master --tags
```

6. **Merge back to develop:**
```bash
git checkout develop
git merge --no-ff release/1.2.0
git push origin develop
```

7. **Build and deploy:**
```bash
# Build for production
eas build --platform all --profile production

# Or trigger via GitHub Actions
git push origin v1.2.0
```

---

### Hotfix Process

**For critical production bugs:**

1. **Create hotfix branch from master:**
```bash
git checkout master
git pull origin master
git checkout -b hotfix/critical-crash
```

2. **Fix the issue:**
   - Minimal changes only
   - Focus on the specific bug
   - Add test to prevent regression

3. **Update version (patch):**
```json
{
  "version": "1.2.1"
}
```

4. **Test thoroughly:**
```bash
npm test
npm run validate
```

5. **Merge to both master and develop:**
```bash
# To master
git checkout master
git merge --no-ff hotfix/critical-crash
git tag -a v1.2.1 -m "Hotfix: Critical crash on startup"
git push origin master --tags

# To develop
git checkout develop
git merge --no-ff hotfix/critical-crash
git push origin develop
```

6. **Deploy immediately:**
```bash
# Build
eas build --platform all --profile production

# Submit to stores
eas submit --platform all

# Push OTA update for immediate fix
eas update --branch production --message "Critical crash fix"
```

---

### Documentation Maintenance

#### When to Update Docs

**Always update documentation when:**
- Adding new features
- Changing public APIs
- Modifying configuration
- Discovering common issues
- Creating new patterns

#### Documentation Types

1. **Pattern Docs** (`docs/patterns/`)
   - How to implement common features
   - Reusable code examples
   - Decision guidelines

2. **Architecture Docs** (`docs/01-architecture/`)
   - High-level design decisions
   - System architecture
   - Data flow

3. **How-To Guides** (`docs/tutorials/`)
   - Step-by-step instructions
   - Beginner-friendly
   - Complete examples

4. **Reference Docs** (`docs/02-coding-standards/`, etc.)
   - Technical specifications
   - Configuration options
   - API documentation

#### Documentation Standards

**Writing style:**
- Clear and concise
- Use examples liberally
- Include code snippets
- Add troubleshooting sections
- Keep up to date

**Format:**
```markdown
# Title

Brief description of what this document covers.

## Table of Contents

1. [Section 1](#section-1)
2. [Section 2](#section-2)

---

## Section 1

Content with code examples.

## Section 2

More content.

---

## Related Docs

- [Other Doc](./other-doc.md)
```

---

### Code Review Guidelines

#### As a Reviewer

**What to look for:**

1. **Functionality:**
   - Does it work as described?
   - Are edge cases handled?
   - Is error handling appropriate?

2. **Code Quality:**
   - Is it readable?
   - Is it maintainable?
   - Does it follow project patterns?
   - Is it properly typed?

3. **Security:**
   - No secrets in code?
   - RLS enabled on tables?
   - Input validated?
   - XSS/injection prevented?

4. **Performance:**
   - No obvious performance issues?
   - Lists virtualized?
   - Images optimized?
   - Unnecessary re-renders avoided?

5. **Testing:**
   - Tests cover new functionality?
   - Tests are meaningful?
   - Tests pass consistently?

**How to provide feedback:**

✅ **Good feedback:**
```
This could cause a memory leak. Consider cleaning up the subscription in useEffect:

```typescript
useEffect(() => {
  const sub = subscribe()
  return () => sub.unsubscribe()
}, [])
```
```

❌ **Bad feedback:**
```
This is wrong.
```

**Approval criteria:**
- [ ] No critical issues
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Security concerns addressed
- [ ] Performance acceptable

#### As an Author

**Responding to feedback:**

1. **Be receptive:**
   - Reviews help improve code
   - Reviewers are trying to help
   - Don't take it personally

2. **Ask questions:**
   - If feedback unclear, ask for clarification
   - Discuss alternative approaches
   - Explain your reasoning

3. **Make changes promptly:**
   - Address feedback quickly
   - Explain changes in comments
   - Re-request review

---

### Dependency Management

#### Adding Dependencies

**Before adding:**

1. **Check if really needed:**
   - Can you implement it yourself?
   - Is there a lighter alternative?
   - Does Expo provide this?

2. **Evaluate package:**
   - Is it maintained?
   - When was last update?
   - How many dependencies does it have?
   - Bundle size impact?

3. **Check compatibility:**
   - Works with Expo?
   - React Native compatible?
   - TypeScript support?

**Adding a package:**

```bash
# Use expo install for Expo SDK packages
npx expo install expo-camera

# For other packages
npm install package-name

# Check for version conflicts
npx expo-doctor
```

4. **Document why:**
```json
{
  "dependencies": {
    "react-native-reanimated": "^3.0.0", // Required for fluid animations
    "zustand": "^4.0.0" // State management for complex flows
  }
}
```

#### Updating Dependencies

**Regular updates (monthly):**

1. **Check for updates:**
```bash
npm outdated
```

2. **Update patch versions (safe):**
```bash
npm update
```

3. **Update minor/major versions (test thoroughly):**
```bash
# One at a time
npm install package-name@latest

# Test after each update
npm test
npm start
```

4. **Update Expo SDK (quarterly):**
```bash
npx expo install --fix
npx expo-doctor
```

**Testing updates:**
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] App runs on iOS
- [ ] App runs on Android
- [ ] No new warnings
- [ ] Features work as expected

#### Removing Dependencies

**Before removing:**
- Search codebase for imports
- Check if dependency of dependency
- Remove from package.json
- Clean up related code

```bash
# Remove package
npm uninstall package-name

# Verify app still works
npm start
npm test
```

---

### Performance Optimization Workflow

#### Identifying Issues

1. **Profile the app:**
```bash
# React DevTools Profiler
# Flipper
# Xcode Instruments (iOS)
# Android Profiler
```

2. **Common bottlenecks:**
   - Unnecessary re-renders
   - Large lists without virtualization
   - Unoptimized images
   - Slow database queries
   - Large bundle size

#### Optimization Process

1. **Measure baseline:**
   - Record metrics before changes
   - Use consistent test environment
   - Test on low-end devices

2. **Make one change at a time:**
   - Optimize one thing
   - Measure impact
   - Verify no regressions

3. **Document improvements:**
```markdown
## Performance Optimization: Task List Rendering

### Before
- FlatList rendering 1000 items
- Scroll FPS: 45
- Initial render: 850ms

### Changes
- Implemented getItemLayout
- Added removeClippedSubviews
- Memoized renderItem

### After
- Scroll FPS: 60
- Initial render: 320ms
- Improvement: 62% faster
```

4. **Add performance test:**
```typescript
describe('TaskList performance', () => {
  it('renders 1000 items in under 500ms', () => {
    const start = Date.now()
    render(<TaskList items={generateItems(1000)} />)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(500)
  })
})
```

---

### Security Review Process

**For security-sensitive changes:**

1. **Self-audit checklist:**
   - [ ] No secrets in code
   - [ ] RLS enabled on all tables
   - [ ] Service role key not exposed
   - [ ] User input validated
   - [ ] SQL injection prevented
   - [ ] XSS prevented
   - [ ] HTTPS only for APIs
   - [ ] Authentication required for protected routes

2. **Test security:**
```typescript
// Try to access other users' data
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', 'different-user-id')

// Should fail due to RLS
expect(error).toBeDefined()
expect(data).toBeNull()
```

3. **Review RLS policies:**
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Test policies
SET request.jwt.claim.sub = 'user-id';
SELECT * FROM tasks; -- Should only return user's tasks
```

4. **Security documentation:**
   - Document security decisions
   - Explain RLS policies
   - Note any security considerations

---

### Community Guidelines

#### Being a Good Community Member

**Do:**
- Be respectful and kind
- Help others learn
- Share knowledge
- Give constructive feedback
- Report issues clearly
- Test before reporting bugs
- Search before asking

**Don't:**
- Be rude or dismissive
- Demand immediate responses
- Post off-topic content
- Spam issues or PRs
- Share credentials or secrets

#### Getting Help

**Before asking:**
1. Check documentation
2. Search existing issues
3. Try troubleshooting steps
4. Create minimal reproduction

**When asking:**
- Provide context
- Include error messages
- Share relevant code
- Describe what you've tried
- Be patient

**Good question:**
```
I'm getting "RLS policy violation" when trying to create tasks.

Environment:
- Expo SDK 54
- Supabase 2.38.0
- iOS 17.2

Error:
```
Error: new row violates row-level security policy for table "tasks"
```

What I've tried:
- Verified user is authenticated
- Checked RLS policy exists
- Confirmed user_id matches auth.uid()

Code:
```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({ user_id: user.id, title: 'Test' })
```

RLS Policy:
```sql
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
```

---

## Contribution Recognition

### Hall of Fame

Contributors who make significant impacts are recognized in:
- README.md contributors section
- Release notes
- Community Discord

### Types of Contributions

**All contributions are valued:**
- Code (features, fixes)
- Documentation
- Testing
- Design
- Community support
- Issue triage
- Code review

---

## Resources for Contributors

### Learning Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Project-Specific Guides

- [Architecture Overview](docs/01-architecture/FOLDER-STRUCTURE.md)
- [Coding Standards](docs/02-coding-standards/)
- [Pattern Library](docs/patterns/)
- [Testing Guide](docs/10-testing/TESTING-STRATEGY.md)

### Tools

- [VS Code](https://code.visualstudio.com)
- [Flipper](https://fbflipper.com)
- [React DevTools](https://react-devtools-tutorial.vercel.app)

---

**Questions? Create an issue or join the Discord!**
