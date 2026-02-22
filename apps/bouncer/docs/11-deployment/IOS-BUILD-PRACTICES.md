# iOS Build Best Practices

> Code signing, TestFlight, App Store submission, and iOS-specific configuration.

## Overview

iOS deployment pipeline:

```
Development → TestFlight (Internal) → TestFlight (External) → App Store
```

## Prerequisites

### Apple Developer Account

| Account Type | Cost | Use Case |
|--------------|------|----------|
| Personal | $99/year | Individual apps |
| Organization | $99/year | Company apps (requires D-U-N-S) |
| Enterprise | $299/year | Internal distribution only |

### Required Setup

1. **Apple Developer Program membership** (developer.apple.com)
2. **Xcode installed** (for local builds)
3. **EAS CLI** (`npm install -g eas-cli`)
4. **Expo account** linked to Apple Developer

## Code Signing

### Understanding Certificates

| Certificate | Purpose | Location |
|-------------|---------|----------|
| Development | Local testing on device | Your Mac |
| Distribution | App Store / TestFlight | Apple servers |
| Push | Push notifications | Supabase/your server |

### EAS Managed Signing (Recommended)

EAS Build handles all signing automatically:

```bash
# First time setup - EAS creates certificates for you
eas build --platform ios

# EAS will prompt:
# ? Generate a new Apple Distribution Certificate? Yes
# ? Generate a new Apple Provisioning Profile? Yes
```

### Manual Signing (If Required)

```json
// eas.json
{
  "build": {
    "production": {
      "ios": {
        "credentialsSource": "local",
        "buildConfiguration": "Release"
      }
    }
  }
}
```

```bash
# Export certificates from Keychain Access
# Place in ./credentials/ios/

# credentials.json
{
  "ios": {
    "provisioningProfilePath": "./credentials/ios/profile.mobileprovision",
    "distributionCertificate": {
      "path": "./credentials/ios/dist-cert.p12",
      "password": "your-password"
    }
  }
}
```

## app.json Configuration

### Required iOS Fields

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Used to scan QR codes",
        "NSPhotoLibraryUsageDescription": "Used to upload profile photos",
        "NSFaceIDUsageDescription": "Used for quick login",
        "UIBackgroundModes": ["remote-notification"]
      },
      "config": {
        "usesNonExemptEncryption": false
      },
      "associatedDomains": [
        "applinks:yourapp.com",
        "webcredentials:yourapp.com"
      ]
    }
  }
}
```

### Bundle Identifier Rules

- Use reverse domain: `com.company.appname`
- Lowercase only
- No spaces or special characters
- Cannot be changed after first submission

### Build Number Strategy

```json
// eas.json - Auto-increment
{
  "build": {
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  }
}
```

Or semantic versioning:
- **version**: User-facing (`1.0.0`, `1.1.0`, `2.0.0`)
- **buildNumber**: Internal, always incrementing (`1`, `2`, `3`...)

## TestFlight Distribution

### Internal Testing (Up to 100 testers)

```bash
# Build and submit to TestFlight
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Internal testers:
- Must be added to App Store Connect team
- Receive builds immediately (no review)
- Limited to 100 testers

### External Testing (Up to 10,000 testers)

1. Create a test group in App Store Connect
2. Submit build for Beta App Review
3. After approval (~24-48 hours), testers get access

```bash
# Submit specific build
eas submit --platform ios --id build-id
```

### TestFlight Best Practices

| Practice | Reason |
|----------|--------|
| Use internal testing first | Faster iteration |
| Add release notes | Testers know what to test |
| Set build expiration | Auto-expire old builds |
| Segment test groups | Different features for different groups |

## App Store Submission

### Pre-Submission Checklist

```markdown
## App Store Readiness

### Required Assets
- [ ] App icon (1024x1024, no alpha)
- [ ] Screenshots for all device sizes
- [ ] App preview video (optional)

### Metadata
- [ ] App name (30 chars max)
- [ ] Subtitle (30 chars max)
- [ ] Description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] Marketing URL (optional)

### Technical
- [ ] Bundle ID matches production
- [ ] Version number incremented
- [ ] Build number incremented
- [ ] No TestFlight-only features
- [ ] Crash-free rate > 99%

### Compliance
- [ ] Export compliance (encryption)
- [ ] Content rights
- [ ] IDFA usage declared
- [ ] Age rating set correctly
```

### Screenshot Requirements

| Device | Size (Portrait) |
|--------|-----------------|
| iPhone 6.9" | 1320 x 2868 |
| iPhone 6.5" | 1242 x 2688 |
| iPhone 5.5" | 1242 x 2208 |
| iPad Pro 12.9" | 2048 x 2732 |

```bash
# Generate with Fastlane Snapshot or manually
# Use simulator + Cmd+S to capture
```

### Submission via EAS

```bash
# Submit latest build
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id BUILD_ID

# With ASC API key (faster)
eas submit --platform ios --latest --asc-api-key-path ./asc-api-key.json
```

### App Store Connect API Key

Create for CI/CD automation:

1. Go to App Store Connect → Users and Access → Keys
2. Generate API key with "App Manager" role
3. Download and store securely

```json
// asc-api-key.json
{
  "keyId": "ABC123",
  "issuerId": "12345678-1234-1234-1234-123456789012",
  "keyPath": "./AuthKey_ABC123.p8"
}
```

## Common Rejection Reasons

### 1. Guideline 4.3 - Spam/Design

**Issue:** App is too similar to others or lacks functionality

**Fix:**
- Add unique features
- Improve design quality
- Ensure app provides real value

### 2. Guideline 2.1 - Crashes/Bugs

**Issue:** App crashes during review

**Fix:**
- Test on physical devices
- Include demo account in review notes
- Check crash logs in App Store Connect

### 3. Guideline 5.1.1 - Data Collection

**Issue:** Collecting data without explanation

**Fix:**
- Add privacy manifests
- Explain all data collection in privacy policy
- Only collect necessary data

### 4. Guideline 3.1.1 - In-App Purchase

**Issue:** External payment links or incorrect IAP usage

**Fix:**
- Use Apple's IAP for digital goods
- Remove external payment links
- Follow RevenueCat guidelines

### Review Notes Template

```
Demo Account:
Email: demo@example.com
Password: DemoPass123!

Testing Instructions:
1. Log in with demo account
2. Navigate to Tasks tab
3. Create a new task
4. Mark task as complete

Notes:
- Push notifications require physical device
- Premium features require subscription (sandbox account works)
- App requires network connection
```

## Privacy Manifest (iOS 17+)

### Required for App Store

```xml
<!-- ios/PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

## Push Notification Setup

### APNs Key (Recommended)

```bash
# 1. Create APNs key in Apple Developer portal
# 2. Download .p8 file
# 3. Configure in Supabase/your backend

# In Supabase Edge Function
const apnsKey = Deno.env.get('APNS_KEY');
const keyId = Deno.env.get('APNS_KEY_ID');
const teamId = Deno.env.get('APPLE_TEAM_ID');
```

### EAS Push Setup

```bash
# Configure push credentials
eas credentials --platform ios

# Select: Push Notifications
# Choose: Let EAS handle it (recommended)
```

## Performance Optimization

### App Launch Time

```typescript
// Measure cold start
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// After app is ready
await SplashScreen.hideAsync();

// Target: < 400ms for interactive
```

### App Size

```bash
# Check bundle size
npx expo export --platform ios
# Look at output size

# Optimize images
npx expo-optimize

# Tree shake unused code
# Check imports are specific
import { format } from 'date-fns/format'; // Not 'date-fns'
```

## Debugging

### TestFlight Crashes

1. Go to App Store Connect → App → TestFlight → Crashes
2. Download crash logs
3. Symbolicate with dSYM files (EAS provides these)

### Console Logs

```bash
# View device logs (requires Xcode)
# Connect device and open Console.app
# Filter by your app's bundle ID
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "No matching profile" | Run `eas credentials` to regenerate |
| Build stuck in queue | Check developer.apple.com status |
| TestFlight not updating | Pull down to refresh in TestFlight app |
| Review taking too long | Submit appeal if > 48 hours |

## Checklist

### Before First Build

- [ ] Apple Developer Program membership active
- [ ] Bundle identifier registered
- [ ] app.json iOS fields configured
- [ ] EAS credentials configured

### Before TestFlight

- [ ] Build completes without errors
- [ ] Tested on physical device
- [ ] Version/build numbers updated
- [ ] Release notes added

### Before App Store

- [ ] All screenshots uploaded
- [ ] All metadata complete
- [ ] Privacy policy URL valid
- [ ] Export compliance answered
- [ ] Review notes with demo account
- [ ] Privacy manifest included (iOS 17+)

## Related Docs

- [CI/CD](./CI-CD.md) - Automated pipelines
- [Android Build Practices](./ANDROID-BUILD-PRACTICES.md) - Android deployment
- [Push Notifications](../06-native-features/PUSH-NOTIFICATIONS.md) - Push setup
