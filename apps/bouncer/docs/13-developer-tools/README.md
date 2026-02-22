# Developer Tools

Production-ready developer tools and CLI utilities for enhanced productivity.

## Overview

This directory contains documentation for the comprehensive developer tools suite included in this blueprint.

## Quick Links

- [Developer Tools Guide](./DEVELOPER-TOOLS.md) - Complete guide to all developer tools
- [Code Generators](../../scripts/generators/README.md) - Code generation CLI
- [Database Tools](../../scripts/db/README.md) - Migration and seeding tools
- [Project Scripts](../../scripts/README.md) - All automation scripts

## What's Included

### 1. Code Generation CLI

Generate production-ready code from templates:

```bash
npm run generate component Button
npm run generate screen UserProfile
npm run generate feature Tasks
```

**Generates:**
- Components with tests
- Screens with routing
- Complete feature modules
- Hooks, services, contexts
- Types and utilities

### 2. Database Tools

Manage Supabase migrations and seed data:

```bash
npm run db:migrate create add_users_table
npm run db:migrate
npm run db:seed
```

**Features:**
- Migration management
- Seed data generation
- Database reset
- Type generation

### 3. Testing Utilities

Enhanced testing setup and runners:

```bash
npm test
npm run test:coverage
npm run test:debug
```

**Includes:**
- Test data factories
- Mock generators
- Custom matchers
- Test runners

### 4. Development Scripts

Developer productivity scripts:

```bash
npm run clean          # Clean build artifacts
npm run check          # Run quality checks
npm run doctor         # Environment diagnostics
npm run dev:setup      # First-time setup
```

**Features:**
- Clean build artifacts
- Pre-commit checks
- Environment diagnostics
- Interactive setup

### 5. VS Code Integration

Complete VS Code configuration:

- Workspace settings
- Recommended extensions
- Code snippets
- Debug configurations
- Task runners

## File Structure

```
scripts/
├── generators/
│   ├── generate.js                     # Code generation CLI
│   ├── templates/
│   │   ├── component.template          # Component template
│   │   ├── component.test.template     # Component test
│   │   ├── screen.template             # Screen template
│   │   ├── screen.test.template        # Screen test
│   │   ├── context.template            # Context template
│   │   ├── hook.template               # Hook template
│   │   ├── hook.test.template          # Hook test
│   │   ├── service.template            # Service template
│   │   ├── service.test.template       # Service test
│   │   ├── util.template               # Utility template
│   │   ├── util.test.template          # Utility test
│   │   └── type.template               # Type template
│   └── README.md                       # Generator documentation
├── db/
│   ├── migrate.js                      # Migration tool
│   ├── seed.js                         # Seeding tool
│   └── README.md                       # Database tools docs
├── test/
│   ├── setup-tests.js                  # Test setup & utilities
│   └── run-tests.js                    # Test runner
├── dev/
│   ├── clean.js                        # Clean build artifacts
│   ├── check.js                        # Pre-commit checks
│   ├── doctor.js                       # Environment diagnostics
│   └── setup-project.js                # First-time setup
└── README.md                           # Scripts overview

.vscode/
├── settings.json                       # Workspace settings
├── extensions.json                     # Recommended extensions
├── launch.json                         # Debug configurations
├── tasks.json                          # Task runners
└── snippets/
    ├── react-native.code-snippets      # React Native snippets
    ├── typescript.code-snippets        # TypeScript snippets
    └── testing.code-snippets           # Testing snippets

docs/13-developer-tools/
├── README.md                           # This file
└── DEVELOPER-TOOLS.md                  # Complete guide
```

## Quick Start

### New Project Setup

```bash
# 1. Run first-time setup
npm run dev:setup

# 2. Check environment
npm run doctor

# 3. Start developing
npm start
```

### Generate Your First Component

```bash
# Interactive
npm run generate

# Direct
npm run gen:component Button
```

### Setup Database

```bash
# Create migration
npm run db:migrate:create add_users_table

# Edit migration file
# ...

# Run migration
npm run db:migrate

# Generate types
npm run gen:types

# Seed data
npm run db:seed
```

### Run Quality Checks

```bash
# Before committing
npm run check

# Individual checks
npm run check:lint
npm run check:types
npm run check:tests
```

## Available Commands

### Code Generation
```bash
npm run generate              # Interactive generator
npm run gen:component         # Generate component
npm run gen:screen            # Generate screen
npm run gen:hook              # Generate hook
npm run gen:service           # Generate service
npm run gen:feature           # Generate feature
```

### Database
```bash
npm run db:migrate            # Run migrations
npm run db:migrate:create     # Create migration
npm run db:migrate:status     # Check status
npm run db:seed               # Seed database
npm run db:reset              # Reset + seed
```

### Testing
```bash
npm test                      # Run tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage
npm run test:debug            # Debug mode
```

### Development
```bash
npm run clean                 # Clean artifacts
npm run check                 # Quality checks
npm run doctor                # Diagnostics
npm run dev:setup             # First-time setup
```

## Documentation

### Main Guides

- [Developer Tools Guide](./DEVELOPER-TOOLS.md) - Complete guide
- [Code Generators](../../scripts/generators/README.md) - Generation CLI
- [Database Tools](../../scripts/db/README.md) - Migration & seeding

### Related Patterns

- [New Feature Pattern](../patterns/NEW-FEATURE.md)
- [New Screen Pattern](../patterns/NEW-SCREEN.md)
- [Supabase Table Pattern](../patterns/SUPABASE-TABLE.md)

### Testing

- [Testing Strategy](../06-testing/TESTING-STRATEGY.md)
- [Unit Testing](../06-testing/UNIT-TESTING.md)
- [Integration Testing](../06-testing/INTEGRATION-TESTING.md)

## VS Code Setup

### Install Recommended Extensions

1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Show Recommended Extensions"
3. Click "Install All"

### Use Snippets

Type snippet prefix and press Tab:

**React Native:**
- `rnc` → Component
- `rns` → Screen
- `ush` → Hook
- `ctx` → Context

**TypeScript:**
- `int` → Interface
- `props` → Props Interface
- `dbt` → Database Type

**Testing:**
- `desc` → Test Suite
- `rct` → Component Test
- `hkt` → Hook Test

### Run Tasks

1. Cmd/Ctrl + Shift + P
2. Type "Run Task"
3. Select task

**Available:**
- Start Expo
- Run Tests
- Type Check
- Generate Component
- Database Migration
- And more...

## Best Practices

### 1. Use Generators

Always use generators for consistency:
```bash
npm run gen:component Button
```

### 2. Run Checks

Before every commit:
```bash
npm run check
```

### 3. Keep Database Synced

After schema changes:
```bash
npm run db:migrate
npm run gen:types
```

### 4. Use VS Code Tasks

Faster than typing npm commands.

### 5. Leverage Snippets

Type snippet prefix + Tab.

### 6. Check Environment

Regularly run:
```bash
npm run doctor
```

## Troubleshooting

### Common Issues

**Generator not found:**
```bash
ls scripts/generators/templates/
```

**Supabase CLI not found:**
```bash
npm install -g supabase
```

**Tests failing:**
```bash
npm run clean:cache
npm test
```

**VS Code path aliases not working:**
1. Check `tsconfig.json`
2. Restart TS server

### Getting Help

1. Check [Developer Tools Guide](./DEVELOPER-TOOLS.md)
2. Review script README files
3. Check error messages
4. Run `npm run doctor`

## Contributing

### Adding Generators

1. Create template in `scripts/generators/templates/`
2. Add to `TEMPLATE_TYPES` in `generate.js`
3. Test
4. Document

### Adding Scripts

1. Create in `scripts/dev/`
2. Add to `package.json`
3. Test
4. Document

### Adding Snippets

1. Edit `.vscode/snippets/*.code-snippets`
2. Test
3. Document

## Next Steps

1. Run first-time setup: `npm run dev:setup`
2. Check environment: `npm run doctor`
3. Generate your first component: `npm run generate`
4. Read [Developer Tools Guide](./DEVELOPER-TOOLS.md)
5. Explore VS Code integration
6. Start building!
