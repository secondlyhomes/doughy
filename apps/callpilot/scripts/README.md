# Scripts

Automation scripts for project setup, deployment, and maintenance.

## Interactive Setup Wizard

### `init-project.js`

Interactive wizard that guides you through setting up your mobile app.

**Usage:**
```bash
npm run init
```

**What it does:**
1. **Theme Configuration** - Choose colors and typography
2. **Component Selection** - Include advanced components
3. **Database Setup** - Optionally configure Supabase
4. **Authentication** - Choose local or Supabase auth
5. **Feature Selection** - Include tasks CRUD example
6. **Navigation Structure** - Set up tabs and routing

**Example flow:**
```
🎨 Mobile App Blueprint - Setup Wizard

1️⃣  Theme Configuration
? Choose your primary color: Purple (Default)
? Typography style: Default (System fonts)

2️⃣  Component Selection
? Include advanced components? Yes

3️⃣  Database Backend (Optional)
? Database backend: None (Local storage only)

4️⃣  Authentication (Optional)
? Do you need authentication? Yes
  → Using local auth (AsyncStorage)

5️⃣  Features (Optional)
? Include Tasks CRUD example? Yes
  → Using local storage (AsyncStorage)

6️⃣  Navigation Structure
? Use tab navigation? Yes
? Number of tabs: 4

📋 Summary
Your configuration:
  Theme: purple, default typography
  Components: Advanced components
  Database: none
  Authentication: local
  Features: Tasks (local)
  Navigation: Tabs (4)

? Proceed with setup? Yes

🚀 Setting up your project...
✅ Directory structure created
✅ Theme configured
✅ Advanced components copied
✅ Authentication configured
✅ Tasks feature configured
✅ Navigation configured
✅ .env file created
✅ package.json updated

✅ Setup complete! Your app is ready.

📚 Next Steps:

1. Install dependencies:
   npm install

2. Start development server:
   npm start

Happy coding! 🚀
```

**What gets created:**

```
src/
├── components/
│   └── advanced/           # Card, LoadingState, etc. (if selected)
├── contexts/
│   └── AuthContext.tsx     # Auth context (if selected)
├── features/
│   └── tasks/              # Tasks feature (if selected)
├── services/
│   └── supabase.ts         # Supabase client (if selected)
└── types/
    └── database.ts         # Type definitions

app/
├── _layout.tsx             # Root layout with providers
├── (auth)/                 # Auth screens (if selected)
│   ├── login.tsx
│   └── signup.tsx
└── (tabs)/                 # Tab navigation
    ├── _layout.tsx
    ├── index.tsx
    ├── tasks.tsx           # If selected
    ├── profile.tsx
    └── settings.tsx

.env                        # Environment variables
```

**Options:**

**Theme:**
- Colors: Purple (default), Blue, Green, Orange, Red
- Typography: Default, Lexend (ADHD-friendly)

**Database:**
- None (AsyncStorage only)
- Supabase (full backend)
- Other (manual setup)

**Authentication:**
- Local (AsyncStorage, no backend)
- Supabase Auth (requires Supabase)
- None

**Features:**
- Tasks CRUD (local or Supabase)
- More coming soon

**Navigation:**
- Tab navigation (2-5 tabs)
- Customizable

**After setup:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **If using Supabase:**
   ```bash
   # Run migrations
   # See .examples/database/README.md

   # Generate types
   npm run gen:types
   ```

3. **Start dev server:**
   ```bash
   npm start
   ```

4. **Customize:**
   - Update `src/theme/tokens.ts` for colors
   - Modify components in `src/components/`
   - Add features in `src/features/`

**Re-running the wizard:**

The wizard will overwrite existing files. To avoid data loss:

```bash
# Backup your changes first
git commit -am "Backup before re-running wizard"

# Re-run wizard
npm run init
```

**Manual setup:**

Prefer manual setup? See [.examples/README.md](../.examples/README.md) for copy commands.

---

## Other Scripts

### `setup.js`

Legacy setup script (replaced by `init-project.js`).

### `features.js`

Interactive feature system for adding features to existing projects.

### `pre-launch-audit.sh`

Pre-launch security and quality audit.

**Usage:**
```bash
npm run pre-launch:audit
```

**Checks:**
- Hardcoded secrets
- npm audit
- TypeScript compilation
- Tests passing
- Linting

---

## Development Scripts

### Package.json Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Start on Android
npm run ios            # Start on iOS
npm run web            # Start on web

# Testing
npm test               # Run tests
npm run test:ci        # Run tests in CI mode
npm run test:watch     # Run tests in watch mode

# Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run type-check     # TypeScript type checking
npm run validate       # Lint + Type check + Test

# Supabase
npm run gen:types      # Generate TypeScript types

# Setup
npm run init           # Interactive setup wizard
npm run setup          # Legacy setup
npm run features       # Add features interactively

# Deployment
npm run pre-launch:audit  # Pre-launch audit
```

---

## Creating New Scripts

### Script Template

```javascript
#!/usr/bin/env node

/**
 * Script Description
 */

const fs = require('fs-extra')
const path = require('path')

async function main() {
  try {
    // Script logic
    console.log('✅ Done!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
```

### Adding to package.json

```json
{
  "scripts": {
    "my-script": "node scripts/my-script.js"
  }
}
```

### Making Executable (Unix)

```bash
chmod +x scripts/my-script.js
```

---

## Best Practices

1. **Use Node.js built-ins** - Prefer `fs-extra` over `shelljs`
2. **Error handling** - Always catch errors and exit with code 1
3. **User feedback** - Use chalk for colored output
4. **Idempotent** - Scripts should be safe to run multiple times
5. **Document** - Add clear usage examples and options
6. **Test** - Test scripts on fresh clones

---

## Related

- **Examples:** [.examples/README.md](../.examples/README.md)
- **Setup Guide:** [docs/00-getting-started/QUICKSTART.md](../docs/00-getting-started/QUICKSTART.md)
- **Deployment:** [docs/11-deployment/](../docs/11-deployment/)
