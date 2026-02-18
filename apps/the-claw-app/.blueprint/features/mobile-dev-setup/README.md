# Mobile Development Setup Guide

**Last Updated:** 2026-02-05
**Expo SDK:** 55+ (React Native 0.83+)
**Priority:** iOS First, then Android

---

## Overview

This guide helps you get the mobile app running on your devices for development and testing. Follow the iOS setup first (fastest path), then Android if needed.

**2026 Best Practices:**
- Start with Expo Go for quick prototyping (zero setup)
- Transition to development builds when you need custom native modules
- Use EAS Build for cloud compilation (no Xcode/Android Studio required)
- Test on physical devices when possible (more accurate than simulators)

---

## Quick Start (5 Minutes)

### iOS - Physical Device (Fastest!)

1. **Install Expo Go on your iPhone:**
   - Open App Store
   - Search for "Expo Go"
   - Install the app

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Scan the QR code:**
   - Open Camera app on iPhone
   - Point at the QR code in terminal
   - Tap the notification to open in Expo Go
   - App will load and open automatically!

That's it! You're now running the app on your iPhone.

---

## Metro Bundler Commands

When the development server is running, you can use these keyboard shortcuts:

| Command | Action |
|---------|--------|
| **r** | Reload app |
| **i** | Open iOS Simulator (Mac only) |
| **a** | Open Android Emulator |
| **d** | Open DevTools |
| **m** | Toggle menu |
| **j** | Open debugger |
| **?** | Show all commands |

**Fast Refresh:** Your app automatically updates when you save files (React Fast Refresh). No manual reload needed!

---

## iOS Setup (Detailed)

### Option 1: Physical iPhone (Recommended)

**Requirements:**
- iPhone running iOS 13.4+
- Expo Go app (free)
- Same Wi-Fi network as your computer

**Steps:**
1. Install Expo Go from App Store
2. Run `npm start` in project directory
3. Scan QR code with Camera app
4. App opens in Expo Go automatically

**Testing Multiple Devices:**
- iPhone SE (small screen, 4.7")
- iPhone 15 Pro (standard, 6.1")
- iPad (tablet, 10.9"+ )

Scan the same QR code on each device to test different screen sizes.

**Troubleshooting:**
- **Can't scan QR?** → Open Expo Go, tap "Scan QR Code", scan manually
- **Connection issues?** → Ensure both devices on same Wi-Fi
- **App won't load?** → Try `npm start --tunnel` (slower but works with firewall)
- **Port already in use?** → Kill Metro: `killall -9 node`, then restart

### Option 2: iOS Simulator (Mac Only)

**Requirements:**
- macOS (M1/M2 or Intel)
- Xcode 14+ (free from App Store)
- ~15GB disk space

**Setup:**
1. **Install Xcode:**
   ```bash
   xcode-select --install
   ```

2. **Install iOS Simulator:**
   - Open Xcode
   - Go to Preferences → Components
   - Download iOS 16+ Simulator

3. **Start simulator:**
   ```bash
   npm start
   # Press 'i' to launch iOS Simulator
   ```

4. **Or launch specific device:**
   ```bash
   npx expo run:ios --device "iPhone 15 Pro"
   ```

**Simulator Shortcuts:**
- **Cmd + K** - Toggle keyboard
- **Cmd + Shift + H** - Home button
- **Cmd + R** - Reload app
- **Cmd + D** - Open debug menu

**Limitations:**
- Push notifications don't work (need physical device)
- Camera/microphone simulated only
- Performance not representative of real device
- Haptics don't work

---

## Android Setup

### Option 1: Physical Android Device (Recommended)

**Requirements:**
- Android 5.0+ (API 21+)
- Expo Go app (free)
- USB cable or same Wi-Fi network

**Steps:**

1. **Enable Developer Mode:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - "You are now a developer!" appears

2. **Enable USB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
   - Connect via USB, approve debugging prompt

3. **Install Expo Go:**
   - Open Google Play Store
   - Search for "Expo Go"
   - Install the app

4. **Run the app:**
   ```bash
   npm start
   # Scan QR code in Expo Go app
   ```

**USB Connection (Faster):**
```bash
# Check device connected
adb devices

# Run via USB
npm start --android
```

**Troubleshooting:**
- **Device not detected?** → `adb kill-server && adb start-server`
- **Port conflict?** → `adb reverse tcp:8081 tcp:8081`
- **Connection timeout?** → Use `--tunnel` flag

### Option 2: Android Emulator (Android Studio)

**Requirements:**
- Windows/Mac/Linux
- Android Studio (free)
- ~8GB RAM, ~10GB disk space

**Setup:**

1. **Install Android Studio:**
   - Download: https://developer.android.com/studio
   - Install with default settings

2. **Create Virtual Device:**
   - Open Android Studio
   - Tools → Device Manager
   - Click "Create Device"
   - Select Pixel 5 (recommended)
   - Download Android 13+ system image
   - Click Finish

3. **Start emulator:**
   ```bash
   # Start emulator from command line
   emulator -avd Pixel_5_API_33

   # Or press 'a' in Metro bundler
   npm start
   # Press 'a' to launch Android emulator
   ```

**Emulator Shortcuts:**
- **Cmd/Ctrl + M** - Open menu
- **Cmd/Ctrl + R** - Reload
- **Cmd/Ctrl + Backspace** - Back button
- **Cmd/Ctrl + H** - Home button

---

## Development Builds (Advanced)

### When to Use Development Builds

Use development builds when you need:
- Custom native modules (not in Expo Go)
- Production-like testing environment
- Specific native configuration
- Push notifications testing (not supported in Expo Go)

**Expo Go Limitations:**
- Limited native modules
- No custom native code
- Push notifications work differently
- Some APIs unavailable

### Creating a Development Build

**Requirements:**
- EAS CLI installed: `npm install -g eas-cli`
- Expo account (free): https://expo.dev/signup

**Build for iOS (Cloud-Based, No Mac Required!):**

```bash
# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS device
eas build --profile development --platform ios

# Install on iPhone via QR code
# Scan QR when build completes
```

**Build for Android:**

```bash
# Build for Android device/emulator
eas build --profile development --platform android

# Install .apk on device
adb install path/to/app.apk
```

**Development vs Production Builds:**

| Build Type | Purpose | Features |
|------------|---------|----------|
| **Development** | Testing, debugging | Fast reload, debug menu, dev tools |
| **Preview** | Share with testers | Optimized, but not production config |
| **Production** | App Store/Play Store | Fully optimized, release keys, no debug tools |

---

## EAS Build Setup (Cloud Builds)

**Why EAS Build?**
- No Xcode or Android Studio required
- Build from any OS (Windows can build iOS!)
- Consistent build environment
- Automated build pipeline
- Free tier available

**Initial Setup:**

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Initialize EAS:**
   ```bash
   cd your-project
   eas build:configure
   ```

3. **Build Commands:**
   ```bash
   # Development build (for testing)
   eas build --profile development --platform ios
   eas build --profile development --platform android

   # Production build (for App Store/Play Store)
   eas build --profile production --platform ios
   eas build --profile production --platform android

   # Build both platforms
   eas build --profile production --platform all
   ```

### TestFlight (iOS)

**Distribute iOS builds to testers:**

1. **Build for TestFlight:**
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios
   ```

3. **Share with testers:**
   - Testers install TestFlight app from App Store
   - Send them invite link from App Store Connect
   - Up to 10,000 testers (external)

### Internal Testing (Android)

**Distribute Android builds to testers:**

1. **Build APK:**
   ```bash
   eas build --profile preview --platform android
   ```

2. **Download and share APK:**
   - Get download link from build output
   - Share link with testers
   - Testers enable "Install from unknown sources"

3. **Or use Google Play Internal Testing:**
   ```bash
   eas submit --platform android --track internal
   ```

---

## Device Testing Best Practices

### Physical Devices vs Simulators

**Always test on physical devices before release:**

| Feature | Simulator/Emulator | Physical Device |
|---------|-------------------|-----------------|
| Performance | Faster (uses Mac/PC CPU) | Accurate |
| Touch gestures | Mouse clicks | Real touch input |
| Network | Simulated | Real cellular/Wi-Fi |
| Push notifications | ❌ Not supported | ✅ Works |
| Camera/Microphone | Simulated | Real hardware |
| Battery impact | N/A | Real power usage |
| Haptics | ❌ Not supported | ✅ Works |

**Testing Strategy:**
1. ✅ Daily dev: Expo Go on physical device (fast iteration)
2. ✅ Weekly testing: Development build on device (accurate)
3. ✅ Before release: TestFlight with real testers

### Multiple Device Testing

**iOS:**
- iPhone SE (small, 4.7")
- iPhone 15 Pro (standard, 6.1")
- iPad (tablet, 10.9"+)

**Android:**
- Small phone (< 5")
- Standard phone (5-6")
- Tablet (7"+)

**Test safe areas, notches, and different aspect ratios.**

---

## Common Issues & Solutions

### iOS Issues

**Problem:** "Unable to connect to Metro bundler"
```bash
# Solution 1: Restart Metro with explicit host
npm start -- --host 192.168.1.XXX

# Solution 2: Use tunnel (slower but reliable)
npm start --tunnel
```

**Problem:** "This app is not available for your device"
- Solution: Check minimum iOS version in app.json (should be 13.4+)

**Problem:** Xcode not found
```bash
# Install Command Line Tools
sudo xcode-select --install

# Set Xcode path
sudo xcode-select --switch /Applications/Xcode.app
```

### Android Issues

**Problem:** Device not detected
```bash
# Kill and restart ADB
adb kill-server
adb start-server
adb devices  # Should show your device
```

**Problem:** "INSTALL_FAILED_INSUFFICIENT_STORAGE"
- Solution: Clear space on device (need ~500MB free)

**Problem:** Emulator slow/laggy
- Solution: Increase RAM allocation in AVD settings (8GB recommended)
- Solution: Enable hardware acceleration (HAXM on Intel, Hypervisor on M1)

### Metro Bundler Issues

**Problem:** Port 8081 already in use
```bash
# Kill existing Metro
killall -9 node

# Or use different port
npm start -- --port 8082
```

**Problem:** Changes not reflecting
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or delete cache manually
rm -rf node_modules/.cache
```

---

## Next Steps

Once you have the app running on your device:

1. **Read the development patterns:**
   - `docs/patterns/NEW-FEATURE.md` - Adding features
   - `docs/patterns/NEW-SCREEN.md` - Creating screens
   - `docs/02-coding-standards/` - Code style guide

2. **Set up additional features:**
   ```bash
   npm run setup  # Interactive feature selection
   npm run features  # Manage features after setup
   ```

3. **Start building:**
   - Modify `App.tsx` and see instant updates (Fast Refresh)
   - Add new screens to `src/screens/`
   - Create components in `src/components/`

---

## Resources

### Official Documentation
- [Expo Getting Started](https://docs.expo.dev/get-started/introduction/)
- [Expo Go](https://docs.expo.dev/get-started/expo-go/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

### Community
- [Expo Discord](https://chat.expo.dev/)
- [Reddit r/expo](https://reddit.com/r/expo)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Tools
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)
- [EAS CLI](https://docs.expo.dev/eas/)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)

---

## Summary

**Fastest path to development:**
1. Install Expo Go on iPhone (2 minutes)
2. Run `npm start` (1 minute)
3. Scan QR code (30 seconds)
4. Start coding! 🚀

**When you need more:**
- Custom native modules → Development builds
- App Store testing → TestFlight + EAS Build
- Production release → EAS Build + Submit

**Remember:** Start simple (Expo Go), upgrade as needed (development builds, EAS).
