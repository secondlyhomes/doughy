# Blueprint Feature System

Welcome to the mobile-app-blueprint interactive feature system! 🚀

This directory contains **pre-configured feature templates** that you can enable/disable based on your project needs.

## Philosophy

**You choose what you want. No bloat.**

Instead of forcing everyone to use the same setup, we provide templates for common features. Enable what you need, skip what you don't.

## Available Features

### Essential Features (Recommended)

| Feature | What It Does | Enable If... |
|---------|--------------|--------------|
| **Pre-commit Hooks** | Auto-lint, format, type-check before commits | Working on a team or want quality guardrails |
| **Database Seeding** | Populate local DB with test data | Need reproducible dev environment |
| **AGENTS.md** | Universal AI context file (all tools) | Using any AI coding assistant |
| **VS Code Config** | Code snippets + editor settings | Team uses VS Code |
| **Mobile Dev Setup** | Guide for running on iOS/Android | Need to test on physical devices or simulators |
| **Push Notifications** | Native push for iOS/Android | App needs to send notifications to users |

### Optional Features

| Feature | What It Does | Enable If... |
|---------|--------------|--------------|
| **Component Docs** (Ladle) | Isolate component development | Component library > 10 components |
| **Visual Regression** (BackstopJS) | Catch UI bugs automatically | UI bugs > 5/month |
| **Web/PWA** | Deploy as Progressive Web App | Targeting web users |

## Quick Start

### Option 1: Interactive Setup (Coming Soon)

```bash
npm run setup
```

Interactive menu to select features.

### Option 2: Manual Setup (Current)

Enable features individually:

```bash
# Pre-commit hooks
node .blueprint/features/pre-commit-hooks/enable.js

# Database seeding
node .blueprint/features/database-seeding/enable.js

# AGENTS.md
node .blueprint/features/agents-md/enable.js

# VS Code config
node .blueprint/features/vscode-config/enable.js

# Mobile dev setup
node .blueprint/features/mobile-dev-setup/enable.js

# Push notifications
node .blueprint/features/push-notifications/enable.js
```

## Feature Structure

Each feature follows the same structure:

```
.blueprint/features/feature-name/
├── README.md              # What it does, when to use it
├── enable.js              # Script to enable the feature
├── disable.js             # Script to disable the feature
└── *.template             # Template files to copy
```

## How It Works

**When you enable a feature:**
1. Script copies template files to your project
2. Updates configuration files (package.json, etc.)
3. Installs necessary dependencies
4. Provides next steps

**When you disable a feature:**
1. Script removes added files
2. Cleans up configuration
3. Optionally uninstalls dependencies

## Feature Details

### Pre-commit Hooks

**Files added:**
- `.husky/pre-commit` - Runs lint/format/type-check
- `.husky/commit-msg` - Enforces conventional commits
- `.commitlintrc.js` - Commit message rules

**Dependencies:** `husky`, `lint-staged`, `@commitlint/cli`

**Time to enable:** 1-2 minutes

[Full documentation →](./features/pre-commit-hooks/README.md)

---

### Database Seeding

**Files added:**
- `supabase/seed.sql` - Main orchestrator
- `supabase/seeds/01-users.sql` - Test users
- `supabase/seeds/02-profiles.sql` - User profiles template
- `supabase/seeds/03-example-data.sql` - Your data template

**Dependencies:** None (uses Supabase CLI)

**Time to enable:** 1-2 minutes

**Test users:**
- test@example.com / Test1234!
- test2@example.com / Test1234!
- test3@example.com / Test1234!

[Full documentation →](./features/database-seeding/README.md)

---

### AGENTS.md

**Files added:**
- `AGENTS.md` - Universal AI context
- `.cursorrules` → symlink to AGENTS.md
- `.windsurfrules` → symlink to AGENTS.md
- `.clinerules` → symlink to AGENTS.md
- `.github/copilot-instructions.md` → symlink to AGENTS.md

**Updates:** `CLAUDE.md` (adds reference to AGENTS.md)

**Dependencies:** None

**Time to enable:** 30 seconds

[Full documentation →](./features/agents-md/README.md)

---

### VS Code Config

**Files added:**
- `.vscode/mobile-blueprint.code-snippets` - Component templates
- `.vscode/settings.json` - Editor settings
- `.vscode/extensions.json` - Recommended extensions

**Dependencies:** None

**Time to enable:** 15 seconds

**Snippets:** `rnscreen`, `rnhook`, `rnsvc`, `rnsupabase`, `rntest`, `rncontext`

[Full documentation →](./features/vscode-config/README.md)

---

### Mobile Dev Setup

**What it provides:**
- Comprehensive guide for running on iOS (physical + simulator)
- Android setup (physical + emulator)
- Metro bundler commands
- EAS Build for cloud compilation
- TestFlight + Internal Testing setup
- Troubleshooting common issues

**Dependencies:** None (documentation-only)

**Time to enable:** 15 seconds

**Covers:**
- Expo Go (fastest path - 5 minutes)
- iOS Simulator (Mac only, Xcode required)
- Android Emulator (Android Studio required)
- Development builds (custom native modules)
- EAS Build (no Mac needed for iOS!)

[Full documentation →](./features/mobile-dev-setup/README.md)

---

### Push Notifications

**What it provides:**
- Native push notifications for iOS (APNS) and Android (FCM)
- Code templates: `useNotifications` hook + notification service
- Complete setup guides for iOS and Android
- Background notification handling
- Background processing & tasks guide
- Deep linking from notifications

**Files added:**
- `src/hooks/useNotifications.ts` - React hook for permissions & handling
- `src/services/notificationService.ts` - Server-side sending logic

**Dependencies:** `expo-notifications`, `expo-server-sdk` (optional)

**Time to enable:** 2-3 minutes (setup), 30-60 min (full iOS/Android config)

**Requirements:**
- **iOS:** Apple Developer account ($99/year), physical iPhone, EAS Build
- **Android:** Firebase project (free), `google-services.json`, physical device

**2026 Updates:**
- FCM V1 API required (V0 deprecated)
- Physical devices required (simulators don't support push)
- Development builds required (not Expo Go)
- Background processing guide included

[Full documentation →](./features/push-notifications/README.md)

---

### Component Docs (Ladle)

**Status:** Manual setup (template coming soon)

Isolate and develop components using Ladle (10x faster than Storybook).

[Full documentation →](./features/component-docs/README.md)

---

### Visual Regression (BackstopJS)

**Status:** Manual setup (template coming soon)

Automatically detect visual changes with screenshot comparison.

[Full documentation →](./features/visual-regression/README.md)

---

### Web/PWA

**What it provides:**
- Run React Native app on web browsers
- PWA support (installable, offline)
- Platform-specific code patterns
- Responsive design utilities
- Deployment configs (EAS Hosting, Vercel, Netlify)

**Files added:**
- `vercel.json` - Vercel deployment config
- `netlify.toml` - Netlify deployment config
- `public/manifest.json` - PWA manifest
- `src/hooks/useBreakpoint.ts` - Responsive design hook

**Dependencies:** None (Expo handles web automatically)

**Time to enable:** 1-2 minutes

**2026 Updates:**
- EAS Hosting recommended (best for Expo Router)
- Vercel has Deployment Protection (security)
- Service workers for offline support
- React Native Web handles styling automatically

**Deployment Options:**
- **EAS Hosting:** Best for Expo Router apps
- **Vercel:** Deployment protection, auto HTTPS
- **Netlify:** Simple static hosting
- **GitHub Pages/S3:** Any static host

[Full documentation →](./features/web-pwa/README.md)

## FAQ

### Can I enable multiple features at once?

Yes! Enable as many or as few as you want.

### What if I don't want a feature anymore?

Run the `disable.js` script for that feature.

### Are these features tested?

Yes, all essential features (pre-commit hooks, database seeding, AGENTS.md, VS Code config) are production-tested.

Optional features are lightweight placeholders with links to official docs.

### Do I need to commit `.blueprint/` to git?

**Yes!** Other developers cloning your repo will get the same feature templates and can enable them easily.

### Can I customize the templates?

Absolutely! Edit files in `.blueprint/features/` to match your team's preferences.

### What's next?

Coming soon:
- Interactive setup CLI (`npm run setup`)
- Feature manager CLI (`npm run features`)
- Smart reminders (suggests features based on project activity)
- GitHub issues integration (project lifecycle tracking)

## Support

Found an issue or have a suggestion?

1. Check feature-specific README in `.blueprint/features/[feature-name]/README.md`
2. Review main project docs in `docs/`
3. Open an issue on GitHub

## Philosophy & Design

This feature system follows these principles:

1. **User Choice** - You decide what features to enable
2. **No Bloat** - Only install what you need
3. **Reversible** - Can disable features anytime
4. **Documented** - Each feature explains when/why to use it
5. **Consistent** - All features follow same structure

Happy coding! 🚀
