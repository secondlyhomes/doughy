# App Clips Guide

Complete guide for implementing iOS App Clips - lightweight app experiences that launch instantly.

## Overview

App Clips are lightweight versions of your app (<15MB) that load instantly from:
- **NFC tags**: Tap to launch
- **QR codes**: Scan to open
- **Safari App Banners**: Tap banner to open
- **Messages**: Tap shared link
- **Maps**: Tap location marker

### Perfect For

- **Quick purchases**: Coffee, parking, scooter rental
- **Event check-in**: Concerts, conferences, museums
- **Product info**: Scan product for details
- **Restaurant orders**: Menu, order, pay
- **Trial experiences**: Try before downloading full app

## Requirements

- **iOS 14+**
- **Size limit**: Under 15MB (uncompressed)
- **Duration**: Active for up to 8 hours
- **Features**: Limited API access (no background modes, some permissions)

## Setup

### 1. Create App Clip Target

In Xcode:
1. File → New → Target
2. Select "App Clip"
3. Name it "Clip"
4. Choose language and options

### 2. Configure Bundle Identifier

```
Main app:     com.yourcompany.yourapp
App Clip:     com.yourcompany.yourapp.Clip
```

### 3. Add Associated Domains

Both main app and App Clip need:

```xml
<!-- In Entitlements -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>appclips:yourapp.com</string>
</array>
```

### 4. Configure Apple App Site Association

Create `apple-app-site-association` file on your server:

```json
{
  "appclips": {
    "apps": ["TEAM_ID.com.yourcompany.yourapp.Clip"]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.com.yourcompany.yourapp"]
  }
}
```

Host at: `https://yourapp.com/.well-known/apple-app-site-association`

## Implementation

### App Clip Entry Point

```swift
// AppClipApp.swift
import SwiftUI

@main
struct AppClipApp: App {
    var body: some Scene {
        WindowGroup {
            AppClipView()
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { userActivity in
                    guard let incomingURL = userActivity.webpageURL else { return }
                    handleIncomingURL(incomingURL)
                }
        }
    }

    func handleIncomingURL(_ url: URL) {
        // Parse URL parameters
        // Example: https://yourapp.com/tasks/123?action=view
        if let taskId = url.pathComponents.last {
            // Load task
            loadTask(taskId)
        }
    }
}

struct AppClipView: View {
    @State private var task: Task?
    @State private var isLoading = true

    var body: some View {
        VStack {
            if isLoading {
                ProgressView("Loading...")
            } else if let task = task {
                TaskQuickView(task: task)
                    .padding()

                Button("Get Full App") {
                    showFullAppStoreOverlay()
                }
                .buttonStyle(.borderedProminent)
            } else {
                Text("Task not found")
            }
        }
    }

    func showFullAppStoreOverlay() {
        // Show App Store overlay for full app
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return
        }

        let config = SKOverlay.AppClipConfiguration(position: .bottom)
        let overlay = SKOverlay(configuration: config)
        overlay.present(in: scene)
    }
}
```

### React Native Integration

```typescript
import { AppClipManager } from './platform/ios/app-clips/AppClipConfig';

function App() {
  const { isAppClip, config } = useAppClip();

  useEffect(() => {
    if (isAppClip && config) {
      // Handle App Clip launch
      console.log('Launched as App Clip:', config.url);

      // Navigate to specific screen based on URL
      if (config.metadata?.taskId) {
        navigation.navigate('TaskDetail', {
          taskId: config.metadata.taskId,
          isAppClip: true,
        });
      }
    }
  }, [isAppClip, config]);

  if (isAppClip) {
    return <AppClipExperience config={config} />;
  }

  return <FullAppExperience />;
}
```

## Size Optimization

App Clips must be < 15MB. Optimize size:

### 1. Remove Unused Code

```typescript
// ✅ Good: Lazy load features
const FullFeature = isAppClip
  ? null
  : require('./FullFeature').default;

// ❌ Bad: Include everything
import FullFeature from './FullFeature';
```

### 2. Optimize Assets

```bash
# Compress images
pngquant --quality=65-80 *.png

# Use WebP format
cwebp input.png -o output.webp

# Remove unused images from App Clip target
```

### 3. Use App Thinning

```swift
// App Clip target settings in Xcode:
// Build Settings → Asset Catalog Compiler
// - Enable App Icon and Launch Image Asset Catalog Compiler: YES
// - Strip Swift Symbols: YES
// - Strip Debug Symbols: YES
```

### 4. Exclude Dependencies

```typescript
// package.json - separate dependencies
{
  "dependencies": {
    "react-native": "...",
    "essential-lib": "..."
  },
  "devDependencies": {
    "full-app-only-lib": "..."
  }
}
```

## Invocation Types

### 1. NFC Tags

```swift
// No special code needed, just ensure:
// 1. App Clip URL is encoded in NFC tag
// 2. Tag format: NDEF with URL record

// Example NFC URL:
// https://yourapp.com/tasks/123?source=nfc&location=entrance
```

### 2. QR Codes

```swift
// Generate QR code with App Clip URL
// Use Camera app to scan
// App Clip launches automatically

// Example QR URL:
// https://yourapp.com/tasks/123?source=qr
```

### 3. Safari App Banner

```html
<!-- On your website -->
<meta name="apple-itunes-app" content="app-clip-bundle-id=com.yourcompany.yourapp.Clip">

<!-- Add App Clip Card -->
<meta name="apple-mobile-web-app-capable" content="yes">
```

### 4. Messages

```swift
// Share URL in Messages
// iOS shows App Clip card automatically

let url = URL(string: "https://yourapp.com/tasks/123")!
let activityController = UIActivityViewController(
    activityItems: [url],
    applicationActivities: nil
)
```

### 5. Maps

```swift
// Register place card in Apple Maps Connect
// Users can tap location to launch App Clip

// Configure in Maps Connect:
// 1. Add business location
// 2. Link App Clip URL
// 3. Verify ownership
```

## App Clip Card

Customize how your App Clip appears:

### App Store Connect Configuration

1. **App Clip Header Image**: 3000 x 2000 px
2. **Title**: 30 characters max
3. **Subtitle**: 43 characters max
4. **Action Button**: "Open", "View", "Play"

### Design Guidelines

```
┌─────────────────────────────┐
│     [Header Image]          │
│                             │
│  📱 Your App Name           │
│  Quick action description   │
│                             │
│      [  Open  ]             │
└─────────────────────────────┘
```

## Permissions

App Clips have limited permissions:

### ✅ Allowed

- Location (when in use only)
- Camera
- Microphone (with prompt)
- Apple Pay
- Keychain (shared with main app)
- Network requests

### ❌ Not Allowed

- Background location
- Background audio
- Background fetch
- Push notifications (until upgrade)
- HealthKit
- HomeKit

## Upgrade to Full App

### Show App Store Overlay

```swift
import StoreKit

func showAppStoreOverlay() {
    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
        return
    }

    let config = SKOverlay.AppClipConfiguration(position: .bottom)
    let overlay = SKOverlay(configuration: config)
    overlay.present(in: scene)
}
```

### Transfer Data

```swift
// App Clip saves data to shared container
let sharedContainer = FileManager.default.containerURL(
    forSecurityApplicationGroupIdentifier: "group.com.yourapp.shared"
)

// Save user progress
let data = ["taskId": taskId, "progress": 75]
let dataPath = sharedContainer!.appendingPathComponent("clip_data.json")
try? JSONEncoder().encode(data).write(to: dataPath)

// Main app reads data on launch
if let clipData = try? Data(contentsOf: dataPath) {
    let progress = try? JSONDecoder().decode(ClipData.self, from: clipData)
    // Continue where user left off
}
```

## Testing

### 1. Local Testing

```bash
# Run App Clip scheme in Xcode
# Product → Scheme → Your App Clip
# Run on simulator or device
```

### 2. Test Invocation

```bash
# Test URL handling
xcrun simctl openurl booted "https://yourapp.com/tasks/123"

# Or use _XCAppClipURL environment variable in Xcode
# Edit Scheme → Run → Arguments → Environment Variables
# _XCAppClipURL = https://yourapp.com/tasks/123
```

### 3. TestFlight Testing

```bash
# Upload App Clip with main app
# Archive → Distribute → App Store Connect
# Add testers in TestFlight
# Test on physical devices
```

### 4. Test NFC/QR Codes

```bash
# Create test NFC tag with URL
# Use NFC Tools app
# Write URL: https://yourapp.com/tasks/123

# Create test QR code
# Use qr-code generator
# Encode URL
```

## Best Practices

### 1. Fast Loading

```swift
// ✅ Good: Show content immediately
struct AppClipView: View {
    var body: some View {
        VStack {
            // Static content first
            Header()

            // Load dynamic content async
            DynamicContent()
        }
    }
}

// ❌ Bad: Block on network request
let data = await fetchData() // Blocks UI
```

### 2. Clear Value Proposition

```swift
// ✅ Good: Clear action
"Order Coffee - Pay with Apple Pay"

// ❌ Bad: Vague
"Welcome to our app!"
```

### 3. Seamless Upgrade

```swift
// ✅ Good: Preserve state during upgrade
saveUserProgress()
showUpgradePrompt()

// ❌ Bad: Lose user data
showUpgradePrompt() // User starts over in full app
```

### 4. Respect 8-Hour Limit

```swift
// ✅ Good: Quick action (< 10 minutes)
// Order coffee, check in, make payment

// ❌ Bad: Long session
// Multi-hour game, extended editing
```

## Analytics

Track App Clip usage:

```swift
import FirebaseAnalytics

// Log App Clip launch
Analytics.logEvent("app_clip_launched", parameters: [
    "source": source, // nfc, qr, safari, messages
    "task_id": taskId,
])

// Log conversion to full app
Analytics.logEvent("app_clip_converted", parameters: [
    "duration": sessionDuration,
])
```

## Resources

- [App Clips Documentation](https://developer.apple.com/documentation/app_clips)
- [Creating an App Clip](https://developer.apple.com/documentation/app_clips/creating_an_app_clip_with_xcode)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-clips)
- [App Clip Size Optimization](https://developer.apple.com/documentation/app_clips/reducing_your_app_clip_s_launch_time)

## Next Steps

1. [ ] Create App Clip target in Xcode
2. [ ] Design lightweight entry point
3. [ ] Optimize size to < 15MB
4. [ ] Configure Associated Domains
5. [ ] Test with NFC/QR codes
6. [ ] Implement upgrade flow
7. [ ] Test data transfer to full app
8. [ ] Submit for review
9. [ ] Monitor adoption and conversion
