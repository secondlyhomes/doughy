# Android Build Best Practices

> Signing, Play Store submission, testing tracks, and Android-specific configuration.

## Overview

Android deployment pipeline:

```
Development → Internal Testing → Closed Testing → Open Testing → Production
```

## Prerequisites

### Google Play Console Account

| Account Type | Cost | Setup Time |
|--------------|------|------------|
| Individual | $25 one-time | Instant |
| Organization | $25 one-time | 2-5 days (verification) |

### Required Setup

1. **Google Play Console account** (play.google.com/console)
2. **Google Cloud project** (for API access)
3. **Service account** (for automated uploads)
4. **EAS CLI** (`npm install -g eas-cli`)

## App Signing

### Google Play App Signing (Recommended)

Let Google manage your signing key:

```bash
# First time setup
eas build --platform android

# EAS will prompt:
# ? Would you like Google to manage your app signing key? Yes
```

Benefits:
- Google protects your key
- Smaller APK sizes
- Can recover if key lost

### Manual Signing (Upload Key)

You manage both keys:

```bash
# Generate upload keystore
keytool -genkey -v -keystore upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000

# Store password securely!
```

```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local",
        "buildType": "apk"
      }
    }
  }
}
```

```json
// credentials.json
{
  "android": {
    "keystore": {
      "keystorePath": "./credentials/android/upload.keystore",
      "keystorePassword": "your-keystore-password",
      "keyAlias": "upload",
      "keyPassword": "your-key-password"
    }
  }
}
```

## app.json Configuration

### Required Android Fields

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "yourapp.com",
              "pathPrefix": "/app"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ],
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### Package Name Rules

- Use reverse domain: `com.company.appname`
- Lowercase only
- No hyphens (use underscores if needed)
- Cannot be changed after first upload

### Version Code Strategy

```json
// eas.json - Auto-increment (recommended)
{
  "build": {
    "production": {
      "android": {
        "autoIncrement": true
      }
    }
  }
}
```

Manual versioning:
- **version**: User-facing (`1.0.0`)
- **versionCode**: Internal, always incrementing (`1`, `2`, `3`...)

Version code must always increase for Play Store updates.

## Build Types

### APK vs AAB

| Format | Use Case | Size |
|--------|----------|------|
| APK | Direct install, testing | Larger |
| AAB (Android App Bundle) | Play Store (required) | Smaller, optimized |

```json
// eas.json
{
  "build": {
    "development": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

## Service Account Setup

### For Automated Uploads

1. Go to Google Cloud Console
2. Create/select project linked to Play Console
3. Enable Google Play Android Developer API
4. Create Service Account with appropriate role
5. Download JSON key file

```bash
# In Play Console:
# Settings → API access → Link to Google Cloud project
# Grant service account access to your app

# Store key file securely
# Never commit to git!
```

```json
// eas.json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Testing Tracks

### Track Overview

| Track | Purpose | Users | Review |
|-------|---------|-------|--------|
| Internal | Team testing | 100 max | No |
| Closed | Beta testers | Unlimited | No |
| Open | Public beta | Unlimited | No |
| Production | Full release | Everyone | Yes (first time) |

### Internal Testing (Fastest)

```bash
# Build and submit to internal track
eas build --platform android --profile production
eas submit --platform android --latest

# In eas.json
{
  "submit": {
    "production": {
      "android": {
        "track": "internal"
      }
    }
  }
}
```

- Up to 100 internal testers
- Instant availability (no review)
- Best for development team

### Closed Testing (Alpha/Beta)

```bash
# Submit to closed track
eas submit --platform android --latest --track closed
```

- Create test groups in Play Console
- Invite specific testers via email
- Good for focused beta testing

### Open Testing (Public Beta)

```bash
# Submit to open track
eas submit --platform android --latest --track open
```

- Anyone can join via opt-in link
- Limited public visibility
- Good for wider testing before launch

### Production

```bash
# Submit to production
eas submit --platform android --latest --track production
```

- Full Play Store visibility
- First release requires review (~1-3 days)
- Updates typically faster

## Play Store Submission

### Pre-Submission Checklist

```markdown
## Play Store Readiness

### Required Assets
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet if supporting)
- [ ] Hi-res icon (512x512)

### Store Listing
- [ ] App title (50 chars max)
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App category selected
- [ ] Content rating questionnaire completed

### Privacy & Compliance
- [ ] Privacy policy URL
- [ ] Data safety form completed
- [ ] Target audience set
- [ ] Ads declaration
- [ ] Government apps declaration

### Technical
- [ ] Package name finalized
- [ ] Version code incremented
- [ ] AAB format used
- [ ] 64-bit support included
- [ ] Target SDK meets requirements (currently API 34+)
```

### Screenshot Requirements

| Type | Dimensions | Quantity |
|------|------------|----------|
| Phone | 1080x1920 minimum | 2-8 |
| 7" Tablet | 1200x1920 | 2-8 (if supporting) |
| 10" Tablet | 1600x2560 | 2-8 (if supporting) |

### Data Safety Form

Required information:
- What data you collect
- How data is used
- Whether data is shared
- Security practices
- Data deletion options

```
Example declarations:
- Email: Collected for account functionality
- Device ID: Collected for analytics (anonymized)
- Crash logs: Collected for app stability
```

## Common Rejection Reasons

### 1. Policy Violation - Metadata

**Issue:** Misleading description or screenshots

**Fix:**
- Screenshots must show actual app
- Description must be accurate
- No keyword stuffing

### 2. Policy Violation - Permissions

**Issue:** Requesting unnecessary permissions

**Fix:**
- Only request permissions you need
- Explain why in permission rationale
- Remove unused permissions from manifest

### 3. Functionality - Crashes

**Issue:** App crashes during review

**Fix:**
- Test on multiple devices/API levels
- Include test account instructions
- Check crashlytics for issues

### 4. Deceptive Behavior - Ads

**Issue:** Ads not declared or misleading

**Fix:**
- Declare ads in Play Console
- Don't show ads that look like content
- Follow ad placement guidelines

## ProGuard/R8 Configuration

### Enable Code Shrinking

```groovy
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Keep Rules for React Native

```proguard
# proguard-rules.pro

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Expo modules
-keep class expo.modules.** { *; }

# Supabase/Networking
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# Your models (if using reflection)
-keep class com.yourapp.models.** { *; }
```

## Performance Optimization

### App Size

```bash
# Analyze AAB size
bundletool build-apks --bundle=app.aab --output=app.apks
bundletool get-size total --apks=app.apks

# Optimize
- Use AAB format (automatic optimization)
- Enable ProGuard/R8
- Use WebP for images
- Remove unused assets
```

### Startup Time

```typescript
// Measure cold start
console.time('AppStart');
// In your root component
useEffect(() => {
  console.timeEnd('AppStart');
}, []);

// Target: < 500ms for interactive
```

### Battery Optimization

```typescript
// Avoid
- Constant location tracking
- Frequent wake locks
- Excessive background work

// Instead
- Use WorkManager for background tasks
- Batch network requests
- Respect Doze mode
```

## Push Notification Setup

### Firebase Cloud Messaging

```bash
# 1. Create Firebase project
# 2. Add Android app in Firebase Console
# 3. Download google-services.json
# 4. Place in project root
```

```json
// app.json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### EAS Push Setup

```bash
# Configure FCM credentials
eas credentials --platform android

# Select: Push Notifications
# Upload FCM server key
```

## Debugging

### Crash Reports

1. Play Console → Quality → Crashes and ANRs
2. Filter by version, device, Android version
3. View stack traces and device info

### Logcat (Local)

```bash
# Connect device, enable USB debugging
adb logcat | grep "YourAppPackage"

# Filter by tag
adb logcat -s ReactNative:V ReactNativeJS:V
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "App not installed" | Check package name matches, uninstall old version |
| "64-bit required" | Ensure hermes enabled, AAB format |
| Build takes too long | Check gradle caching, clean build |
| Version code conflict | Always increment versionCode |

## Target SDK Requirements

Google requires apps to target recent SDK:

| Year | Minimum Target SDK |
|------|--------------------|
| 2024 | API 34 (Android 14) |
| 2025 | API 35 (Android 15) |

```json
// app.json
{
  "expo": {
    "android": {
      "targetSdkVersion": 34
    }
  }
}
```

## Checklist

### Before First Build

- [ ] Google Play Console account created
- [ ] App created in Play Console
- [ ] Package name registered
- [ ] app.json Android fields configured
- [ ] EAS credentials configured

### Before Internal Testing

- [ ] Build completes without errors
- [ ] Tested on physical device
- [ ] Version code incremented
- [ ] Service account configured

### Before Production

- [ ] All store listing assets uploaded
- [ ] Data safety form completed
- [ ] Content rating set
- [ ] Target SDK meets requirements
- [ ] Tested on multiple API levels
- [ ] 64-bit support verified

## Related Docs

- [CI/CD](./CI-CD.md) - Automated pipelines
- [iOS Build Practices](./IOS-BUILD-PRACTICES.md) - iOS deployment
- [Push Notifications](../06-native-features/PUSH-NOTIFICATIONS.md) - Push setup
