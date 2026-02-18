# Quickstart Guide

Get your mobile app running in under 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** and **npm 10+** ([Download](https://nodejs.org/))
- **Expo CLI**: `npm install -g expo-cli`
- **Git** ([Download](https://git-scm.com/))
- **iOS/Android device** or emulator for testing
- (Optional) **Supabase account** if using database features ([Sign up](https://supabase.com/))

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/your-repo.git
cd mobile-app-blueprint
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including Expo, React Native, TypeScript, and development tools.

### 3. Configure Environment (Optional)

If you plan to use Supabase or other backend services:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_ENV=development
```

**Note:** The app works without a database by default (uses local state). See [ENVIRONMENT-VARIABLES.md](ENVIRONMENT-VARIABLES.md) for multi-environment setup.

### 4. Start the Development Server

```bash
npm start
```

This launches Expo Dev Tools. You'll see a QR code in your terminal.

### 5. Run on Your Device

**On iOS:**
- Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store
- Scan the QR code with your Camera app
- App opens in Expo Go

**On Android:**
- Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Google Play
- Scan the QR code within Expo Go app
- App launches

**On Simulator:**
- Press `i` (iOS) or `a` (Android) in the terminal
- Simulator launches automatically (if installed)

## Project Structure

```
mobile-app-blueprint/
├── src/                 # Your app code (customize these)
│   ├── components/      # Shared UI components
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom hooks
│   ├── services/        # Business logic & API calls
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
│
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab navigation screens
│   └── _layout.tsx      # Root layout
│
├── .examples/           # Reference implementations (don't modify)
│   ├── components/      # Advanced component examples
│   ├── screens/         # Complete screen examples
│   ├── features/        # Full features (auth, CRUD, etc.)
│   └── patterns/        # Implementation patterns
│
├── docs/                # Comprehensive documentation
└── scripts/             # Automation scripts
```

## Development Workflow

### Running Tests

```bash
npm test              # Run Jest tests
npm run test:watch    # Watch mode
npm run test:ci       # CI mode with coverage
```

### Type Checking

```bash
npm run type-check    # TypeScript type checking
```

### Linting

```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix issues
```

### Validate Before Commit

```bash
npm run validate      # Runs lint + type-check + tests
```

### Generate Supabase Types (If Using Database)

After schema changes:

```bash
npm run gen:types
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run android` | Launch on Android device/emulator |
| `npm run ios` | Launch on iOS simulator |
| `npm test` | Run tests |
| `npm run validate` | Lint + type-check + test |
| `npm run setup` | Interactive setup wizard |
| `npm run features` | Manage blueprint features |

## Next Steps

### For New Developers

1. **Read the Documentation**
   - [CLAUDE.md](CLAUDE.md) - Project rules and commands
   - [docs/00-getting-started/](docs/00-getting-started/) - Getting started guides
   - [docs/05-ui-ux/DESIGN-PHILOSOPHY.md](docs/05-ui-ux/DESIGN-PHILOSOPHY.md) - UX principles

2. **Explore Examples**
   - Browse `.examples/` directory for reference implementations
   - See complete auth flows, CRUD operations, navigation patterns
   - Copy examples to `src/` and customize for your needs

3. **Run Interactive Setup**
   ```bash
   npm run setup
   ```
   Wizard walks you through configuring theme, components, and features.

### For Contributors

1. **Read Contributing Guide**
   - [CONTRIBUTING.md](CONTRIBUTING.md) - Git workflow, PR process, code standards

2. **Set Up Environment Variables**
   - [ENVIRONMENT-VARIABLES.md](ENVIRONMENT-VARIABLES.md) - Multi-environment configuration

3. **Review Security Checklist**
   - [docs/09-security/SECURITY-CHECKLIST.md](docs/09-security/SECURITY-CHECKLIST.md) - Security best practices

## Database Setup (Optional)

If you want to use Supabase:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait 2-3 minutes for provisioning

2. **Get API Credentials**
   - Project Settings → API
   - Copy `URL` and `anon public` key

3. **Configure Environment**
   - Add credentials to `.env` file (see step 3 above)

4. **Run Migrations (Optional)**
   ```bash
   supabase db push
   ```

5. **Generate Types**
   ```bash
   npm run gen:types
   ```

**Full guide:** [docs/03-database/SUPABASE-SETUP.md](docs/03-database/SUPABASE-SETUP.md)

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8081 (Expo default)
npx kill-port 8081
npm start
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### TypeScript Errors

```bash
# Regenerate TypeScript config
npx tsc --init
npm run type-check
```

### Expo Go App Not Connecting

- Ensure your phone and computer are on the **same Wi-Fi network**
- Disable VPN or firewall temporarily
- Try `npm start --tunnel` for remote testing

### Tests Failing

```bash
# Clear Jest cache
npx jest --clearCache
npm test
```

## Additional Resources

- **Documentation:** [docs/](docs/) - Complete documentation suite
- **Patterns:** [docs/patterns/](docs/patterns/) - Implementation patterns
- **Examples:** [.examples/](/.examples/) - Reference code
- **Expo Docs:** [docs.expo.dev](https://docs.expo.dev)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **React Native Docs:** [reactnative.dev](https://reactnative.dev)

## Getting Help

- **GitHub Issues:** [github.com/your-org/your-repo/issues](https://github.com/your-org/your-repo/issues)
- **Documentation:** Check [docs/](docs/) for detailed guides
- **Examples:** Review [.examples/](/.examples/) for reference implementations

---

**Ready to build?** Start with `npm start` and explore the app! 🚀
