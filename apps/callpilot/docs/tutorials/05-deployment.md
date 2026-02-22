# Tutorial 5: Deployment

Learn how to build, deploy, and publish your React Native app to production. This tutorial covers iOS App Store, Google Play Store, OTA updates, and CI/CD automation.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [App Configuration](#app-configuration)
3. [Building for iOS](#building-for-ios)
4. [Building for Android](#building-for-android)
5. [App Store Submission](#app-store-submission)
6. [Play Store Submission](#play-store-submission)
7. [OTA Updates](#ota-updates)
8. [CI/CD Setup](#cicd-setup)
9. [Production Monitoring](#production-monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Performance tested
- [ ] Accessibility tested

### Security

- [ ] No hardcoded secrets
- [ ] RLS enabled on all tables
- [ ] Service role key not exposed
- [ ] API keys in environment variables
- [ ] HTTPS only for API calls
- [ ] Input validation implemented

### App Configuration

- [ ] App name finalized
- [ ] Bundle ID/Package name set
- [ ] Version number updated
- [ ] App icons created (all sizes)
- [ ] Splash screen designed
- [ ] Privacy policy created
- [ ] Terms of service created

### Legal

- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App Store/Play Store guidelines reviewed
- [ ] Third-party licenses documented

---

## App Configuration

### Update app.json

```json
{
  "expo": {
    "name": "YourApp",
    "slug": "your-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to...",
        "NSPhotoLibraryUsageDescription": "This app uses photos to...",
        "NSLocationWhenInUseUsageDescription": "This app uses location to..."
      }
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

### Create App Icons

**Requirements:**
- iOS: 1024x1024 PNG (no transparency)
- Android: 1024x1024 PNG

**Generate all sizes:**
```bash
# Install icon generator
npm install -g app-icon

# Generate icons
app-icon generate -i ./icon.png
```

### Create Splash Screen

**Requirements:**
- 1284x2778 PNG (iPhone 14 Pro Max)
- Logo centered on solid color background

---

## Building for iOS

### Prerequisites

- Mac with macOS 11+
- Xcode 14+
- Apple Developer account ($99/year)
- EAS CLI installed

### Step 1: Configure EAS Build

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEFGHIJ"
      }
    }
  }
}
```

### Step 2: Build for Production

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# This will:
# - Upload your code
# - Install dependencies
# - Run native build on EAS servers
# - Generate .ipa file
```

**Build time:** 15-30 minutes

**Output:** Download link for .ipa file

### Step 3: Test Build

```bash
# Install on physical device (requires Apple Developer account)
# Download .ipa from EAS dashboard
# Use Apple Configurator or TestFlight
```

---

## Building for Android

### Prerequisites

- EAS CLI installed
- Google Play Console account ($25 one-time)

### Step 1: Generate Keystore

```bash
# EAS handles this automatically
eas build --platform android --profile production

# Or create manually:
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure Credentials

**Option 1: Let EAS manage (recommended)**
```bash
eas build --platform android --profile production
# Follow prompts to generate keystore
```

**Option 2: Use existing keystore**
```bash
eas credentials

# Select Android > Production > Keystore
# Upload your existing keystore
```

### Step 3: Build for Production

```bash
eas build --platform android --profile production

# This generates an .aab file (Android App Bundle)
```

**Build time:** 10-20 minutes

---

## App Store Submission

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+"
3. Fill in:
   - App Name
   - Primary Language
   - Bundle ID (must match app.json)
   - SKU (unique identifier)

### Step 2: Fill App Information

**Required:**
- App Name (30 chars max)
- Subtitle (30 chars max)
- Description (4000 chars max)
- Keywords (100 chars, comma-separated)
- Support URL
- Marketing URL (optional)
- Privacy Policy URL

**Screenshots:**
- iPhone 6.7" (1290 x 2796) - Required
- iPhone 6.5" (1242 x 2688) - Required
- iPhone 5.5" (1242 x 2208) - Optional
- iPad Pro (2048 x 2732) - If supporting iPad

**App Preview Video (optional but recommended)**
- 15-30 seconds
- Show key features
- No more than 500 MB

### Step 3: Submit for Review

```bash
# Upload to App Store Connect
eas submit --platform ios --profile production

# Or manually:
# 1. Download .ipa from EAS
# 2. Upload via Transporter app
# 3. Select build in App Store Connect
# 4. Submit for review
```

**Review process:**
- Average: 1-3 days
- Can take up to 7 days
- Check status in App Store Connect

### Step 4: Handle Rejections

**Common rejection reasons:**
- Missing privacy policy
- Incomplete app information
- Crashes during review
- Violates guidelines
- Missing required features

**How to respond:**
1. Read rejection reason carefully
2. Fix issues
3. Submit new build or respond to reviewer
4. Resubmit

---

## Play Store Submission

### Step 1: Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - App name
   - Default language
   - App or game
   - Free or paid
   - Accept declarations

### Step 2: Set Up App Content

**Store listing:**
- App name (50 chars)
- Short description (80 chars)
- Full description (4000 chars)
- App icon (512x512 PNG)
- Feature graphic (1024x500 JPG/PNG)
- Screenshots:
  - Phone: 2-8 screenshots
  - 7" tablet: 1-8 screenshots (optional)
  - 10" tablet: 1-8 screenshots (optional)

**Content rating:**
1. Fill out questionnaire
2. Get rating (E, T, M, etc.)

**Target audience:**
- Age groups
- If directed at children, comply with COPPA

**Privacy policy:**
- URL required if app handles personal data

**App category:**
- Choose primary category
- Add tags (optional)

### Step 3: Upload Build

```bash
# Upload to Play Console
eas submit --platform android --profile production
```

**Or manually:**
1. Go to Play Console → Production
2. Click "Create new release"
3. Upload .aab file
4. Add release notes
5. Review and rollout

### Step 4: Roll Out

**Options:**
- **Internal testing** - Up to 100 testers, instant availability
- **Closed testing** - Up to 1000+ testers, instant availability
- **Open testing** - Anyone can join, instant availability
- **Production** - Public release, review required

**Recommended flow:**
```
Internal testing (dev team)
  ↓
Closed testing (beta users)
  ↓
Open testing (public beta)
  ↓
Production (full release)
```

---

## OTA Updates

Over-The-Air updates let you push updates without app store review.

### When to Use OTA

**✅ Good for:**
- Bug fixes
- Content changes
- UI tweaks
- Feature flags
- A/B tests

**❌ Not for:**
- Native code changes
- New permissions
- New native dependencies

### Configure EAS Update

Install EAS Update:
```bash
npm install expo-updates
```

Update `app.json`:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### Publish Update

```bash
# Publish to production
eas update --branch production --message "Fix critical bug"

# Publish to staging
eas update --branch staging --message "Test new feature"
```

### Runtime Version Strategy

**Option 1: SDK Version (simple)**
```json
{
  "runtimeVersion": {
    "policy": "sdkVersion"
  }
}
```
Updates work for apps built with same Expo SDK version.

**Option 2: App Version (granular)**
```json
{
  "runtimeVersion": "1.0.0"
}
```
Updates work for apps with matching runtime version.

### Check for Updates

```typescript
import * as Updates from 'expo-updates'

async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync()

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    }
  } catch (error) {
    console.error('Update check failed:', error)
  }
}

// Check on app start
useEffect(() => {
  checkForUpdates()
}, [])
```

---

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npx tsc --noEmit
      - run: npm run lint

  build-ios:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform ios --non-interactive --profile production

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --non-interactive --profile production

  deploy-update:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

### Set Up Secrets

In GitHub repo settings → Secrets:
```
EXPO_TOKEN=your-expo-token
```

Get token:
```bash
eas login
eas whoami
# Copy token from ~/.expo/state.json
```

---

## Production Monitoring

### Crash Reporting with Sentry

Install:
```bash
npm install @sentry/react-native
```

Configure:
```typescript
// App.tsx
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV,
  enableInExpoDevelopment: false,
  debug: __DEV__,
})

export default Sentry.wrap(App)
```

### Analytics

**Expo Analytics:**
```bash
npm install expo-analytics
```

**PostHog:**
```bash
npm install posthog-react-native
```

### Performance Monitoring

```typescript
import * as Sentry from '@sentry/react-native'

// Track screen performance
const transaction = Sentry.startTransaction({
  name: 'TasksScreen',
  op: 'navigation'
})

// Later
transaction.finish()
```

---

## Troubleshooting

### Build Fails

**iOS build errors:**
```bash
# Clear cache
eas build:cancel
eas build --platform ios --clear-cache

# Check logs
eas build:list
eas build:view <build-id>
```

**Android build errors:**
```bash
# Clear cache
eas build --platform android --clear-cache

# Verify credentials
eas credentials
```

### Submission Rejected

**iOS:**
- Check rejection email
- Common issues:
  - Missing privacy policy
  - Incomplete metadata
  - Crashes during review
  - Guideline violations

**Android:**
- Check Play Console → Policy status
- Common issues:
  - Privacy policy missing
  - Content rating incomplete
  - Screenshots don't match app
  - Misleading store listing

### OTA Update Not Working

**Check:**
```typescript
import * as Updates from 'expo-updates'

// Log update info
console.log('Updates enabled:', Updates.isEnabled)
console.log('Update ID:', Updates.updateId)
console.log('Runtime version:', Updates.runtimeVersion)
```

**Common issues:**
- Runtime version mismatch
- Update channel mismatch
- App not checking for updates

---

## Next Steps

Congratulations! Your app is now in production.

### Post-Launch

- Monitor crash reports
- Track user analytics
- Respond to reviews
- Plan next features
- Gather user feedback

### Continuous Improvement

- A/B test features
- Optimize performance
- Fix bugs quickly
- Update regularly
- Engage with users

---

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Policies](https://support.google.com/googleplay/android-developer/answer/9888077)
- [Deployment Checklist](../../11-deployment/CI-CD.md)
