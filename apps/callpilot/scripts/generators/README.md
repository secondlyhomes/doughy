# Code Generators

Automated code generation CLI for creating components, screens, features, and more with production-ready templates.

## Quick Start

```bash
# Interactive mode
npm run generate

# Direct generation
npm run generate component Button
npm run generate screen UserProfile
npm run generate feature Tasks
npm run generate hook useAuth
```

## Available Generators

### Component

Generate a reusable UI component with tests.

```bash
npm run generate component Button
```

**Creates:**
- `src/components/Button.tsx`
- `src/components/__tests__/Button.test.tsx`

**Features:**
- TypeScript interfaces
- Theme integration
- Accessibility props
- StyleSheet
- JSDoc comments

### Screen

Generate a screen component with navigation setup.

```bash
npm run generate screen UserProfile
```

**Creates:**
- `src/screens/user-profile-screen.tsx`
- `src/screens/__tests__/user-profile-screen.test.tsx`

**Features:**
- Naming convention (kebab-case with `-screen` suffix)
- ScrollView layout
- Theme-aware styling
- Navigation-ready

### Context

Generate a React Context provider with hook.

```bash
npm run generate context Auth
```

**Creates:**
- `src/contexts/AuthContext.tsx`

**Features:**
- State management
- Custom hook (`useAuth`)
- Loading/error states
- TypeScript types

### Hook

Generate a custom React hook.

```bash
npm run generate hook useAuth
```

**Creates:**
- `src/hooks/useAuth.ts`
- `src/hooks/__tests__/useAuth.test.ts`

**Features:**
- Naming convention (`use` prefix)
- Options interface
- Return type interface
- Loading/error handling
- Tests with `@testing-library/react-native`

### Service

Generate a business logic service.

```bash
npm run generate service auth
```

**Creates:**
- `src/services/authService.ts`
- `src/services/__tests__/authService.test.ts`

**Features:**
- CRUD operations
- Error handling
- TypeScript interfaces
- Integration tests

### Feature

Generate a complete feature module with all components.

```bash
npm run generate feature Tasks
```

**Interactive prompts:**
- ✓ Components
- ✓ Screens
- ✓ Context
- ✓ Hooks
- ✓ Services
- ✓ Types
- ✓ Tests
- ? Include Supabase integration?

**Creates:**
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

**With Supabase:**
- Database-backed service
- RLS policies (documented)
- Type-safe queries
- Migration guide in README

**With AsyncStorage:**
- Local storage service
- CRUD operations
- No backend required

### Utility

Generate a pure utility function.

```bash
npm run generate util formatCurrency
```

**Creates:**
- `src/utils/formatCurrency.ts`
- `src/utils/__tests__/formatCurrency.test.ts`

**Features:**
- Pure functions
- Validation helpers
- Formatting helpers
- Comprehensive tests

### Type

Generate TypeScript type definitions.

```bash
npm run generate type User
```

**Creates:**
- `src/types/user.ts`

**Features:**
- Base interface
- Create/Update inputs
- Filter options
- List result types

## Usage Examples

### 1. Generate Component

```bash
npm run generate component Card
```

**Output:**
```
✅ Created: src/components/Card.tsx
✅ Created: src/components/__tests__/Card.test.tsx

📋 Next Steps:

1. Import: import { Card } from '@/components'
2. Add to src/components/index.ts if not auto-exported
3. Write tests in __tests__/
```

### 2. Generate Screen

```bash
npm run generate screen Settings
```

**Output:**
```
✅ Created: src/screens/settings-screen.tsx
✅ Created: src/screens/__tests__/settings-screen.test.tsx

📋 Next Steps:

1. Add to app/ routing
2. Import: import { SettingsScreen } from '@/screens'
3. Test on device
```

### 3. Generate Feature (Interactive)

```bash
npm run generate feature Tasks
```

**Prompts:**
```
? Include in feature: (Press <space> to select)
❯◉ Components
 ◉ Screens
 ◉ Context
 ◉ Hooks
 ◉ Services
 ◉ Types
 ◉ Tests

? Include Supabase integration? (Y/n)
```

**Output:**
```
✅ Created: src/features/tasks/index.ts
✅ Created: src/features/tasks/components/TasksList.tsx
✅ Created: src/features/tasks/screens/tasks-screen.tsx
✅ Created: src/features/tasks/TasksContext.tsx
✅ Created: src/features/tasks/hooks/useTasks.ts
✅ Created: src/features/tasks/tasksService.ts
✅ Created: src/features/tasks/types.ts
✅ Created: src/features/tasks/README.md

✅ Feature "Tasks" generated!

Location: src/features/tasks

📋 Next Steps:

1. Review generated files in src/features/tasks/
2. Customize types in types.ts
3. Create database migration: npm run db:migration create_tasks
4. Run migration: npm run db:migrate
5. Generate types: npm run gen:types
6. Import feature: import { TasksScreen } from '@/features/tasks'
7. Add to navigation
8. Test on device
```

### 4. Generate Hook

```bash
npm run generate hook useAuth
```

**Output:**
```
✅ Created: src/hooks/useAuth.ts
✅ Created: src/hooks/__tests__/useAuth.test.ts

📋 Next Steps:

1. Import: import { useAuth } from '@/hooks'
2. Use in components: const value = useAuth()
3. Write tests
```

## Templates

### Template Structure

Templates use placeholders that are automatically replaced:

- `{{NAME}}` - Full name (e.g., `Button`, `useAuth`, `TasksContext`)
- `{{BASE_NAME}}` - Name without prefix/suffix (e.g., `Auth` from `useAuth`)
- `{{CAMEL_NAME}}` - camelCase version (e.g., `authService`)
- `{{UPPER_NAME}}` - UPPERCASE version (e.g., `AUTH_CONTEXT`)
- `{{KEBAB_NAME}}` - kebab-case version (e.g., `user-profile`)
- `{{SNAKE_NAME}}` - snake_case version (e.g., `auth_service`)
- `{{DATE}}` - Current date (YYYY-MM-DD)

### Template Location

```
scripts/generators/templates/
├── component.template
├── component.test.template
├── screen.template
├── screen.test.template
├── context.template
├── hook.template
├── hook.test.template
├── service.template
├── service.test.template
├── util.template
├── util.test.template
└── type.template
```

### Customizing Templates

1. Edit template files in `scripts/generators/templates/`
2. Use placeholders (e.g., `{{NAME}}`)
3. Test with: `npm run generate`

**Example: Customize component template**

```tsx
// scripts/generators/templates/component.template
import React from 'react'
import { View } from 'react-native'
import { useTheme } from '@/theme'

export function {{NAME}}() {
  const { theme } = useTheme()

  return <View style={{ backgroundColor: theme.colors.surface }} />
}
```

### Adding New Templates

1. Create template file: `scripts/generators/templates/my-type.template`
2. Add to `TEMPLATE_TYPES` in `generate.js`:

```js
const TEMPLATE_TYPES = {
  // ... existing types
  myType: {
    name: 'My Type',
    description: 'Description of my type',
    path: 'src/my-folder',
    extension: '.tsx',
  },
}
```

3. Test: `npm run generate myType MyName`

## Naming Conventions

The generator automatically applies project naming conventions:

| Type | Convention | Input | Output |
|------|------------|-------|--------|
| Component | PascalCase | `button` | `Button.tsx` |
| Screen | kebab-case + suffix | `UserProfile` | `user-profile-screen.tsx` |
| Hook | camelCase + prefix | `Auth` | `useAuth.ts` |
| Service | camelCase | `Auth` | `authService.ts` |
| Context | PascalCase + suffix | `Auth` | `AuthContext.tsx` |
| Util | camelCase | `FormatDate` | `formatDate.ts` |
| Type | PascalCase | `user` | `User.ts` |

## Integration with Project

### 1. Import Paths

Generated files use absolute imports:

```tsx
import { useTheme } from '@/theme'
import { Button } from '@/components'
import { authService } from '@/services'
```

### 2. Theme Integration

All generated UI components use the theme system:

```tsx
const { theme } = useTheme()

<View style={{ backgroundColor: theme.colors.surface }}>
  <Text style={{ color: theme.colors.text.primary }}>Hello</Text>
</View>
```

### 3. TypeScript

All generated files are fully typed:

```tsx
export interface ButtonProps {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary'
}
```

### 4. Tests

All testable files get corresponding test files:

```
src/components/
├── Button.tsx
└── __tests__/
    └── Button.test.tsx
```

## Best Practices

### 1. Start with Templates

Always use generators for consistency:

```bash
# ✅ Good
npm run generate component Button

# ❌ Avoid
touch src/components/Button.tsx  # Manual creation
```

### 2. Review Generated Code

Generators create starting points. Always review and customize:

1. Update interfaces
2. Add business logic
3. Enhance styling
4. Write comprehensive tests

### 3. Keep Templates Updated

When patterns change:

1. Update templates in `scripts/generators/templates/`
2. Regenerate components if needed
3. Document changes

### 4. Use Features for Large Modules

For complex features, use the feature generator:

```bash
npm run generate feature Tasks
```

This ensures all parts work together.

## Troubleshooting

### File Already Exists

```
File already exists: src/components/Button.tsx
Overwrite? (y/N)
```

**Solutions:**
- Choose `n` and rename your component
- Choose `y` to overwrite (data loss!)
- Manually rename existing file first

### Invalid Name

```
❌ Name must start with a letter and contain only letters and numbers
```

**Solutions:**
- Use PascalCase: `MyComponent`
- Remove special characters: `My-Component` → `MyComponent`
- No spaces: `My Component` → `MyComponent`

### Template Not Found

```
❌ Template not found: scripts/generators/templates/my-type.template
```

**Solutions:**
- Check template file exists
- Verify file extension is `.template`
- Use correct type name

### Import Errors

If generated code has import errors:

1. Check `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. Restart TypeScript server in VS Code

## Advanced Usage

### Batch Generation

Create multiple items:

```bash
# Components
npm run generate component Button
npm run generate component Card
npm run generate component Modal

# Or use a script
for name in Button Card Modal; do
  npm run generate component $name
done
```

### Custom Templates

Create project-specific templates:

```bash
# Create custom template
cp scripts/generators/templates/component.template \
   scripts/generators/templates/page.template

# Edit page.template
# Add to TEMPLATE_TYPES in generate.js
# Generate: npm run generate page Home
```

### Programmatic Usage

Use generator in scripts:

```js
const { generate } = require('./scripts/generators/generate')

async function createComponents() {
  await generate('component', 'Button')
  await generate('component', 'Card')
}
```

## CLI Reference

### Commands

```bash
npm run generate [type] [name]
```

**Arguments:**
- `type` (optional) - Generator type (component, screen, etc.)
- `name` (optional) - Item name

**Interactive Mode:**
If arguments are omitted, CLI prompts for them.

### Examples

```bash
# Interactive (prompts for type and name)
npm run generate

# Specify type (prompts for name)
npm run generate component

# Specify both (no prompts)
npm run generate component Button
```

## Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "generate": "node scripts/generators/generate.js",
    "gen": "npm run generate",
    "gen:component": "npm run generate component",
    "gen:screen": "npm run generate screen",
    "gen:feature": "npm run generate feature"
  }
}
```

**Usage:**
```bash
npm run gen              # Interactive
npm run gen:component    # Component-specific
npm run gen:feature      # Feature-specific
```

## Related Documentation

- [New Feature Pattern](../../docs/patterns/NEW-FEATURE.md)
- [New Screen Pattern](../../docs/patterns/NEW-SCREEN.md)
- [Component Guidelines](../../docs/05-ui-ux/DESIGN-PHILOSOPHY.md)
- [TypeScript Guidelines](../../docs/01-architecture/TYPESCRIPT-GUIDELINES.md)

## Examples

See `examples/` directory for:
- Generated component examples
- Generated screen examples
- Generated feature examples
- Custom template examples

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting)
2. Review template files
3. See [New Feature Pattern](../../docs/patterns/NEW-FEATURE.md)
4. Ask in project discussions
