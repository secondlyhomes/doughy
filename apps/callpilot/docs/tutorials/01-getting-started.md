# Tutorial 1: Getting Started with Mobile App Blueprint

Welcome to the Mobile App Blueprint! This interactive tutorial will guide you through setting up your development environment and running your first React Native + Expo + Supabase application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Installation](#project-installation)
4. [Supabase Configuration](#supabase-configuration)
5. [Running the App](#running-the-app)
6. [Understanding the Structure](#understanding-the-structure)
7. [Making Your First Change](#making-your-first-change)
8. [Testing Your Changes](#testing-your-changes)
9. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine.

### Required Software

| Software | Minimum Version | Check Command | Install Link |
|----------|----------------|---------------|--------------|
| Node.js | 20.0.0+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| npm | 10.0.0+ | `npm --version` | Comes with Node.js |
| Git | 2.0.0+ | `git --version` | [git-scm.com](https://git-scm.com/) |
| Code Editor | - | - | [VS Code](https://code.visualstudio.com/) recommended |

### Optional but Recommended

| Software | Purpose | Install Link |
|----------|---------|--------------|
| Watchman | File watching (macOS/Linux) | [facebook.github.io/watchman](https://facebook.github.io/watchman/) |
| Xcode | iOS development (macOS only) | Mac App Store |
| Android Studio | Android development | [developer.android.com/studio](https://developer.android.com/studio) |

### Verify Your Installation

Run these commands to verify everything is installed correctly:

```bash
# Check Node.js version
node --version
# Expected: v20.0.0 or higher

# Check npm version
npm --version
# Expected: 10.0.0 or higher

# Check Git version
git --version
# Expected: 2.0.0 or higher
```

---

## Environment Setup

### 1. Install Expo CLI

While Expo no longer requires a global CLI installation, it's still useful for certain operations:

```bash
# Install Expo CLI globally (optional)
npm install -g expo-cli

# Verify installation
expo --version
```

### 2. Create Expo Account

You'll need an Expo account for building and publishing:

1. Go to [expo.dev](https://expo.dev)
2. Click "Sign Up"
3. Complete registration
4. Verify your email

### 3. Install EAS CLI

EAS (Expo Application Services) is used for building and submitting apps:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Verify login
eas whoami
```

### 4. Set Up Mobile Development Environment

Choose your target platform(s):

#### iOS Development (macOS only)

```bash
# Install Xcode from Mac App Store
# Then install Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

#### Android Development (All platforms)

1. Download and install [Android Studio](https://developer.android.com/studio)
2. During installation, ensure these are selected:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
3. Open Android Studio and complete the setup wizard
4. Configure environment variables:

**macOS/Linux:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows:**
```bash
# Add to Environment Variables (System Properties)
ANDROID_HOME=C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools
```

Verify:
```bash
# Check Android SDK
adb --version
```

---

## Project Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/your-repo.git

# Navigate to project directory
cd mobile-app-blueprint

# Verify you're in the right place
ls -la
# You should see package.json, app.json, etc.
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# This will:
# - Install all JavaScript dependencies
# - Set up pre-commit hooks (Husky)
# - Run any post-install scripts
```

**Expected output:**
```
added 1247 packages, and audited 1248 packages in 45s
```

### 3. Install iOS Dependencies (macOS only)

```bash
# Navigate to iOS directory
cd ios

# Install CocoaPods dependencies
pod install

# Return to root directory
cd ..
```

**Expected output:**
```
Pod installation complete! There are 42 dependencies from the Podfile.
```

### 4. Verify Installation

Run the validation script to ensure everything is set up correctly:

```bash
npm run validate
```

**Expected output:**
```
✅ TypeScript compilation successful
✅ Linting passed
✅ Tests passed
✅ All checks completed successfully
```

If you see any errors, refer to the [Troubleshooting](#troubleshooting) section at the end of this tutorial.

---

## Supabase Configuration

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended)
4. Click "New Project"
5. Fill in the details:
   - **Name:** `mobile-app-blueprint-dev`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is fine for development
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

### 2. Get Your API Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the Supabase dashboard
2. You'll need these values:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (long JWT token)

### 3. Configure Environment Variables

Create a `.env` file in the root of your project:

```bash
# Copy the example file
cp .env.example .env

# Open in your editor
code .env
```

Add your Supabase credentials:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: AI Integration (for later)
EXPO_PUBLIC_OPENAI_API_KEY=

# Optional: Analytics (for later)
EXPO_PUBLIC_POSTHOG_API_KEY=
```

**Important Security Notes:**
- Never commit `.env` file to Git (it's in `.gitignore`)
- The `anon` key is safe to use in client code
- Never use the `service_role` key in client code
- See `docs/09-security/API-KEY-MANAGEMENT.md` for details

### 4. Set Up Database Schema

The blueprint includes a starter schema. Let's apply it:

```bash
# Initialize Supabase CLI (if not already done)
npx supabase init

# Link to your project
npx supabase link --project-ref xxxxxxxxxxxxx
# Use the password you created earlier

# Push the schema to your database
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --linked > src/types/supabase.ts
```

**Expected output:**
```
✅ Schema pushed successfully
✅ Types generated at src/types/supabase.ts
```

### 5. Verify Database Connection

Create a simple test script:

```bash
# Create test file
touch test-supabase.js
```

Add this content:

```javascript
// test-supabase.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  const { data, error } = await supabase.from('profiles').select('count')

  if (error) {
    console.error('❌ Connection failed:', error.message)
  } else {
    console.log('✅ Successfully connected to Supabase!')
  }
}

testConnection()
```

Run the test:

```bash
node test-supabase.js
```

---

## Running the App

### Option 1: Expo Go (Quickest - Recommended for Beginners)

**Expo Go** is the fastest way to get started. It's a pre-built app that can load your JavaScript code.

**Limitations:**
- Cannot use custom native modules
- Limited to Expo SDK modules only
- Good for learning and prototyping

**Steps:**

1. Install Expo Go on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:

```bash
npm start
```

3. Scan the QR code:
   - **iOS:** Open Camera app and scan the QR code
   - **Android:** Open Expo Go app and scan the QR code

**Expected output:**
```
Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

### Option 2: iOS Simulator (macOS only)

**Requirements:**
- macOS
- Xcode installed
- iOS Simulator installed

**Steps:**

```bash
# Start development server
npm start

# In another terminal, or press 'i' in the Expo terminal
npm run ios

# Or specify a device
npm run ios -- --simulator="iPhone 15 Pro"
```

**Expected behavior:**
- iOS Simulator opens automatically
- App builds and installs
- App launches with splash screen
- You see the home screen

### Option 3: Android Emulator

**Requirements:**
- Android Studio installed
- AVD (Android Virtual Device) created

**Steps:**

1. Create AVD (first time only):

```bash
# Open Android Studio
# Tools → AVD Manager → Create Virtual Device
# Choose: Pixel 6, Android 13 (API 33), Download and finish
```

2. Start the emulator:

```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd Pixel_6_API_33 &

# Or start from Android Studio AVD Manager
```

3. Run the app:

```bash
# Start development server
npm start

# In another terminal, or press 'a' in the Expo terminal
npm run android
```

### Option 4: Physical Device (Development Build)

For full native module support, you need a development build:

```bash
# Build for iOS (macOS only)
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android

# Install the build on your device when complete
```

See `docs/11-deployment/` for detailed build instructions.

---

## Understanding the Structure

Now that your app is running, let's understand the project structure:

```
mobile-app-blueprint/
├── .blueprint/           # Feature blueprints (optional features)
├── .claude/              # Claude AI configuration
├── .examples/            # Code examples and patterns
├── .husky/               # Git hooks
├── docs/                 # Documentation (you are here!)
├── scripts/              # Utility scripts
├── src/                  # Source code
│   ├── components/       # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── contexts/         # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── ...
│   ├── screens/          # Screen components
│   │   ├── auth/
│   │   │   ├── login-screen.tsx
│   │   │   └── signup-screen.tsx
│   │   └── ...
│   ├── services/         # Business logic & API calls
│   │   ├── supabase.ts
│   │   ├── authService.ts
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   │   ├── supabase.ts   # Auto-generated from DB
│   │   └── index.ts
│   └── utils/            # Utility functions
│       ├── formatDate.ts
│       └── ...
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
├── .env                  # Environment variables (local)
├── .env.example          # Environment variables template
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── CLAUDE.md             # Claude AI instructions
├── CONTRIBUTING.md       # Contribution guidelines
└── README.md             # Project overview
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `app.json` | Expo app configuration (name, version, icons, etc.) |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript compiler settings |
| `.env` | Environment variables (never commit!) |
| `CLAUDE.md` | Instructions for Claude AI assistant |

### Source Code Organization

The `src/` directory follows a feature-based architecture:

1. **components/** - Reusable UI components
   - Should be presentational (not much logic)
   - Should accept props for customization
   - Should use theme tokens, not hardcoded styles

2. **contexts/** - React Context providers
   - Manage global state (auth, theme, etc.)
   - Provide hooks for accessing state
   - Keep focused (one concern per context)

3. **hooks/** - Custom React hooks
   - Encapsulate reusable logic
   - Follow naming convention: `useXxx`
   - Can use other hooks

4. **screens/** - Full-page components
   - Compose smaller components
   - Connect to services and contexts
   - Handle navigation

5. **services/** - Business logic and API calls
   - Interact with Supabase, APIs, etc.
   - Should be pure functions or objects
   - Separate from UI components

6. **types/** - TypeScript type definitions
   - Auto-generated types from Supabase
   - Custom types for your app
   - Shared interfaces

7. **utils/** - Pure utility functions
   - No side effects
   - Easily testable
   - Single responsibility

---

## Making Your First Change

Let's make a simple change to verify your setup and understand the development workflow.

### Step 1: Open a Component

Open the welcome screen:

```bash
code src/screens/home-screen.tsx
```

You should see something like:

```typescript
import { View, Text } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

export function HomeScreen() {
  const { theme } = useTheme()

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, color: theme.colors.text.primary }}>
        Welcome to Mobile App Blueprint
      </Text>
    </View>
  )
}
```

### Step 2: Make a Change

Change the welcome text:

```typescript
export function HomeScreen() {
  const { theme } = useTheme()

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, color: theme.colors.text.primary }}>
        Hello, [Your Name]! 👋
      </Text>
      <Text style={{ fontSize: 16, color: theme.colors.text.secondary, marginTop: 8 }}>
        You just made your first change!
      </Text>
    </View>
  )
}
```

### Step 3: See the Change

**With Metro running:**
- Save the file (`Cmd+S` or `Ctrl+S`)
- The app should reload automatically (Fast Refresh)
- You should see your new text

**If it doesn't reload:**
- Press `r` in the Metro terminal to manually reload
- Or shake your device and select "Reload"

### Step 4: Understanding Fast Refresh

**Fast Refresh** is React Native's hot reloading feature:
- Most changes appear instantly without losing state
- Component changes reload just that component
- Syntax errors show a helpful overlay
- State is preserved across reloads

**When Fast Refresh doesn't work:**
- New files added (restart Metro)
- Native module changes (rebuild app)
- Environment variable changes (restart Metro)

---

## Testing Your Changes

Now let's ensure your change doesn't break anything.

### Step 1: Run Type Check

TypeScript ensures type safety:

```bash
npm run type-check
```

**Expected output:**
```
✅ No TypeScript errors found
```

**If you see errors:**
```
src/screens/home-screen.tsx:10:12 - error TS2339: Property 'text' does not exist on type 'Theme'.
```
- Read the error message carefully
- Fix the issue (usually a typo or missing import)
- Run again

### Step 2: Run Linter

ESLint ensures code style consistency:

```bash
npm run lint
```

**Expected output:**
```
✅ No linting errors found
```

**If you see warnings:**
- Fix any errors (linter won't pass with errors)
- Warnings are okay for now (but should be fixed eventually)

### Step 3: Run Tests

Jest runs unit tests:

```bash
npm test
```

**Expected output:**
```
PASS  src/components/Button.test.tsx
PASS  src/utils/formatDate.test.ts
Test Suites: 12 passed, 12 total
Tests:       48 passed, 48 total
```

### Step 4: Run All Checks

Run everything at once:

```bash
npm run validate
```

This runs:
1. TypeScript type checking
2. ESLint
3. Jest tests

**Expected output:**
```
✅ TypeScript compilation successful
✅ Linting passed
✅ Tests passed
✅ All checks completed successfully
```

---

## Next Steps

Congratulations! You've successfully:
- ✅ Set up your development environment
- ✅ Installed the mobile app blueprint
- ✅ Configured Supabase
- ✅ Run the app on a device/simulator
- ✅ Made your first code change
- ✅ Tested your changes

### Continue Learning

Move on to the next tutorials:

1. **[Tutorial 2: Building Your First Feature](./02-first-feature.md)**
   - Create a simple task list
   - Learn component patterns
   - Understand state management

2. **[Tutorial 3: Adding Authentication](./03-adding-authentication.md)**
   - Implement user signup/login
   - Understand Supabase Auth
   - Protect routes

3. **[Tutorial 4: Database Integration](./04-database-integration.md)**
   - Create database tables
   - Set up RLS policies
   - Implement CRUD operations

4. **[Tutorial 5: Deployment](./05-deployment.md)**
   - Build for production
   - Submit to App Store and Play Store
   - Set up CI/CD

### Explore Documentation

- **[Architecture Overview](../01-architecture/FOLDER-STRUCTURE.md)** - Understand the codebase
- **[Component Guidelines](../02-coding-standards/COMPONENT-GUIDELINES.md)** - Write better components
- **[Design Philosophy](../05-ui-ux/DESIGN-PHILOSOPHY.md)** - Understand UX principles
- **[Security Checklist](../09-security/SECURITY-CHECKLIST.md)** - Build secure apps

### Join the Community

- **GitHub:** [Report issues or contribute](https://github.com/your-org/your-repo)
- **Expo Forums:** [forums.expo.dev](https://forums.expo.dev)
- **Supabase Discord:** [discord.supabase.com](https://discord.supabase.com)

---

## Troubleshooting

### Common Issues

#### "Cannot find module '@/components/...'"

**Problem:** Path alias not resolved

**Solution:**
```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or restart Metro
npm start -- --clear
```

#### "Metro bundler failed to start"

**Problem:** Port 8081 already in use

**Solution:**
```bash
# Find and kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npm start -- --port 8082
```

#### "Supabase connection failed"

**Problem:** Wrong credentials or network issue

**Solution:**
1. Verify `.env` file exists and has correct values
2. Check URL format: `https://xxxxx.supabase.co` (no trailing slash)
3. Check anon key is copied correctly (it's very long)
4. Restart Metro after changing `.env`

#### "Pod install failed" (iOS)

**Problem:** CocoaPods issue

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

#### "Android build failed"

**Problem:** Gradle cache or dependency issue

**Solution:**
```bash
cd android
./gradlew clean
cd ..
rm -rf android/.gradle
npm start -- --clear
```

### Getting Help

If you're still stuck:

1. **Check existing documentation:**
   - [Troubleshooting Guide](../12-maintenance/TROUBLESHOOTING.md)
   - [Common Issues](../12-maintenance/COMMON-ISSUES.md)

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/your-org/your-repo/issues)

3. **Ask for help:**
   - Create a new GitHub issue with:
     - Your OS and versions (Node, npm, Expo)
     - Full error message
     - Steps to reproduce

---

## Summary

You've completed the Getting Started tutorial! Here's what you learned:

### Key Concepts

- **React Native**: JavaScript framework for building native mobile apps
- **Expo**: Toolchain for React Native development
- **Supabase**: Backend-as-a-Service (database, auth, storage)
- **TypeScript**: Type-safe JavaScript
- **Fast Refresh**: Instant feedback during development

### Development Workflow

```
1. Make changes in your editor
2. Save file (Fast Refresh applies changes)
3. Test in app
4. Run validation (type-check, lint, test)
5. Commit changes
6. Push to GitHub
7. Repeat
```

### Essential Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Metro bundler |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm test` | Run tests |
| `npm run type-check` | Check TypeScript |
| `npm run lint` | Check code style |
| `npm run validate` | Run all checks |

### Project Rules

Remember these core principles:

1. **Use theme tokens** - Never hardcode colors/spacing
2. **Enable RLS** - Always enable Row Level Security on Supabase tables
3. **Named exports only** - No default exports
4. **Components <200 lines (target 150)** - Split if larger
5. **Service role key: server only** - Never in client code

---

**Ready for more? Continue to [Tutorial 2: Building Your First Feature →](./02-first-feature.md)**
