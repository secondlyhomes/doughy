# Platform Parity Guide

Comprehensive guide for building cross-platform React Native + Expo apps with proper iOS and Android support.

## Overview

This guide provides complete documentation for understanding, implementing, and maintaining platform-specific code in React Native applications. Whether you're building a new cross-platform app, migrating from a single platform, or adding platform-specific features, this guide has you covered.

## What's Included

### 📖 Documentation

- **[Feature Parity Matrix](./FEATURE-PARITY.md)** (2,500+ lines)
  - Complete iOS vs Android feature comparison
  - Implementation strategies for each feature
  - Decision trees for platform choices
  - Testing checklist

- **[Best Practices](./BEST-PRACTICES.md)** (2,000+ lines)
  - Design principles for cross-platform apps
  - Platform conventions (iOS HIG, Material Design)
  - Performance optimization
  - Testing strategies
  - Accessibility guidelines

- **[Compatibility Matrix](./COMPATIBILITY-MATRIX.md)** (1,500+ lines)
  - iOS version compatibility (13-17)
  - Android version compatibility (8-14)
  - Expo SDK feature support
  - Third-party library compatibility
  - Minimum version recommendations

- **[Migration Guide](./MIGRATION-GUIDE.md)** (1,000+ lines)
  - iOS-only to cross-platform migration
  - Android-only to cross-platform migration
  - Adding platform-specific features
  - Step-by-step migration process

### 🛠 Utilities

- **[Platform Detection](./utils/platformDetection.ts)** (600+ lines)
  - Platform and version detection
  - Feature availability checking
  - Device capability detection
  - Comprehensive utility functions

- **[Platform Selection](./utils/platformSelect.ts)** (400+ lines)
  - Type-safe platform selection
  - Component selection helpers
  - Hook selection helpers
  - Function selection helpers

### 💡 Patterns

- **[Conditional Components](./patterns/ConditionalComponents.tsx)** (700+ lines)
  - 14 different conditional rendering patterns
  - HOC patterns
  - Custom hooks for platform logic
  - Context providers

- **[Platform-Specific Navigation](./patterns/PlatformSpecificNavigation.tsx)** (500+ lines)
  - Navigation configuration per platform
  - Tab bar patterns
  - Header styles
  - Modal presentations

### 📁 Organization

- **[File Structure](./organization/FileStructure.md)** (1,000+ lines)
  - Organization strategies
  - File naming conventions
  - Directory structures by project size
  - Code sharing patterns

## Quick Start

### 1. Understand Platform Differences

Start with the **Feature Parity Matrix** to understand what features are available on each platform:

```typescript
import { PlatformUtils } from './.examples/platform/utils/platformDetection'

// Check if feature is available
if (PlatformUtils.supportsLiveActivities()) {
  await startLiveActivity()
} else if (Platform.OS === 'android') {
  await showOngoingNotification()
} else {
  await sendNotification()
}
```

### 2. Use Platform Detection Utilities

Use the provided utilities for type-safe platform detection:

```typescript
import { platformSelect } from './.examples/platform/utils/platformSelect'

// Select values based on platform
const headerHeight = platformSelect({
  ios: 44,
  android: 56,
  default: 48,
})

// Select components
const DatePicker = platformComponent({
  ios: IOSDatePicker,
  android: AndroidDatePicker,
  default: WebDatePicker,
})
```

### 3. Follow Best Practices

Review the **Best Practices Guide** before implementing platform-specific code:

- Respect platform conventions
- Test on both platforms
- Provide fallbacks
- Document platform differences

### 4. Organize Code Properly

Use appropriate organization strategy based on complexity:

```typescript
// Simple: Platform.select in single file
const styles = Platform.select({
  ios: iosStyles,
  android: androidStyles,
})

// Medium: Platform extensions
// Button.tsx, Button.ios.tsx, Button.android.tsx

// Complex: Platform directories
// features/widgets/ios/, features/widgets/android/
```

## Common Scenarios

### Scenario 1: Building New Cross-Platform App

1. Read **Feature Parity Matrix** to understand what's available
2. Review **Best Practices** for design principles
3. Check **Compatibility Matrix** for version requirements
4. Use provided **utilities** for platform detection
5. Follow **organization patterns** for code structure

### Scenario 2: Migrating iOS App to Android

1. Read **Migration Guide** iOS-to-Android section
2. Audit iOS-specific code using provided checklist
3. Create platform-specific implementations
4. Test on Android devices
5. Add Android-specific features

### Scenario 3: Adding Platform-Specific Feature

1. Check **Feature Parity Matrix** for feature availability
2. Review implementation examples
3. Implement with fallbacks
4. Test on both platforms
5. Document platform requirements

### Scenario 4: Optimizing Performance

1. Read **Best Practices** performance section
2. Review platform-specific optimizations
3. Use provided testing strategies
4. Monitor with platform-specific tools

## File Structure

```
.examples/platform/
├── README.md                          # This file
├── FEATURE-PARITY.md                  # Complete feature comparison (2,500+ lines)
├── BEST-PRACTICES.md                  # Best practices guide (2,000+ lines)
├── COMPATIBILITY-MATRIX.md            # Version compatibility (1,500+ lines)
├── MIGRATION-GUIDE.md                 # Migration guide (1,000+ lines)
├── utils/
│   ├── platformDetection.ts           # Platform detection utilities (600+ lines)
│   ├── platformSelect.ts              # Platform selection helpers (400+ lines)
│   └── README.md                      # Utilities documentation (1,000+ lines)
├── patterns/
│   ├── ConditionalComponents.tsx      # Conditional rendering patterns (700+ lines)
│   ├── PlatformSpecificNavigation.tsx # Navigation patterns (500+ lines)
│   └── README.md                      # Patterns documentation (1,200+ lines)
└── organization/
    ├── FileStructure.md               # File organization guide (1,000+ lines)
    └── README.md                      # Organization overview (800+ lines)
```

## Documentation Index

### By Topic

**Getting Started:**
- [Feature Parity Matrix](./FEATURE-PARITY.md) - Start here to understand platform differences
- [Best Practices](./BEST-PRACTICES.md) - Design principles and guidelines

**Implementation:**
- [Utilities](./utils/README.md) - Platform detection and selection
- [Patterns](./patterns/README.md) - Conditional rendering patterns
- [Organization](./organization/README.md) - Code structure

**Migration:**
- [Migration Guide](./MIGRATION-GUIDE.md) - Step-by-step migration process
- [Compatibility Matrix](./COMPATIBILITY-MATRIX.md) - Version requirements

### By Experience Level

**Beginners:**
1. Start with [Best Practices](./BEST-PRACTICES.md)
2. Review [Platform Detection Utils](./utils/README.md)
3. Study [Conditional Components](./patterns/ConditionalComponents.tsx)
4. Check [Feature Parity](./FEATURE-PARITY.md) when needed

**Intermediate:**
1. Deep dive into [Feature Parity Matrix](./FEATURE-PARITY.md)
2. Master [Organization Patterns](./organization/README.md)
3. Review [Navigation Patterns](./patterns/PlatformSpecificNavigation.tsx)
4. Understand [Compatibility Matrix](./COMPATIBILITY-MATRIX.md)

**Advanced:**
1. Study [Migration Guide](./MIGRATION-GUIDE.md)
2. Optimize using [Best Practices Performance Section](./BEST-PRACTICES.md#performance-considerations)
3. Customize [Platform Utilities](./utils/platformDetection.ts)
4. Create your own patterns based on examples

## Key Concepts

### Platform Parity

**Goal:** Implement equivalent features on both platforms.

**Example:**
- iOS: Live Activities for real-time updates
- Android: Ongoing notifications with updates
- Result: Different implementations, same user experience

### Platform-Specific Excellence

**Goal:** Embrace platform differences for best UX.

**Example:**
- iOS: Use Live Activities on iOS 16.1+
- Android: Use Material You on Android 12+
- Result: Best possible experience on each platform

### Graceful Degradation

**Goal:** Always provide fallbacks.

**Example:**
- Primary: Platform-specific feature (Live Activities)
- Fallback: Cross-platform alternative (notifications)
- Result: App works on all supported versions

## Testing Checklist

Use this checklist when implementing platform-specific code:

### Before Implementation
- [ ] Check feature availability in Feature Parity Matrix
- [ ] Review best practices for the feature
- [ ] Verify version compatibility
- [ ] Plan fallback strategy

### During Implementation
- [ ] Use platform detection utilities
- [ ] Follow organization patterns
- [ ] Document platform differences
- [ ] Write tests for both platforms

### After Implementation
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test on oldest supported OS version
- [ ] Test on latest OS version
- [ ] Verify fallbacks work
- [ ] Check performance on both platforms
- [ ] Update documentation

## Decision Trees

### Should I Use Platform-Specific Code?

```
Is the feature available on both platforms?
├─ Yes
│  ├─ Are implementations similar?
│  │  ├─ Yes → Use cross-platform code with Platform.select for minor differences
│  │  └─ No → Use platform-specific implementations (.ios.tsx, .android.tsx)
│  └─ Are platform conventions different?
│     ├─ Yes → Follow platform conventions (iOS HIG vs Material Design)
│     └─ No → Use shared code
└─ No
   ├─ Is feature critical to app functionality?
   │  ├─ Yes → Implement alternative on other platform
   │  └─ No → Platform-specific feature with clear messaging
   └─ Can users live without it on other platform?
      ├─ Yes → Platform-specific feature (document clearly)
      └─ No → Reconsider feature or find alternative
```

### How Should I Organize Code?

```
How different is the code between platforms?
├─ < 20% different
│  └─ Use Platform.select in single file
├─ 20-50% different
│  └─ Use platform extensions (.ios.tsx, .android.tsx)
└─ > 50% different OR entire feature platform-specific
   └─ Use platform directories (ios/, android/, shared/)
```

## Examples

### Example 1: Simple Platform Difference

```typescript
// Single file with Platform.select
const buttonStyle = Platform.select({
  ios: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  android: {
    borderRadius: 4,
    elevation: 2,
  },
})
```

### Example 2: Significant Platform Difference

```typescript
// Platform extensions
// Button.tsx - Shared types
export interface ButtonProps {
  title: string
  onPress: () => void
}

// Button.ios.tsx - iOS implementation
export function Button({ title, onPress }: ButtonProps) {
  return <TouchableOpacity onPress={onPress}>{title}</TouchableOpacity>
}

// Button.android.tsx - Android implementation
export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {title}
    </TouchableOpacity>
  )
}
```

### Example 3: Platform-Exclusive Feature

```typescript
// Platform-specific with fallback
if (PlatformUtils.supportsLiveActivities()) {
  // iOS 16.1+ only
  await startLiveActivity()
} else if (Platform.OS === 'android') {
  // Android alternative
  await showOngoingNotification()
} else {
  // Fallback for older iOS
  await sendNotification()
}
```

## Contributing

This is a living document. As React Native, iOS, and Android evolve, this guide will be updated.

### Update Schedule

- **Quarterly:** Review for new OS features
- **After major releases:** Update compatibility matrix
- **As needed:** Add new patterns and examples

### Feedback

Found an issue or have a suggestion? See the project's CLAUDE.md for contribution guidelines.

## Resources

### Official Documentation

- **React Native:** https://reactnative.dev/docs/platform-specific-code
- **Expo:** https://docs.expo.dev/
- **iOS HIG:** https://developer.apple.com/design/human-interface-guidelines/
- **Material Design:** https://m3.material.io/

### Third-Party Libraries

- **React Navigation:** https://reactnavigation.org/
- **React Native Paper:** https://callstack.github.io/react-native-paper/
- **React Native Reanimated:** https://docs.swmansion.com/react-native-reanimated/

### Tools

- **Platform.select:** https://reactnative.dev/docs/platform#select
- **Platform-specific extensions:** https://reactnative.dev/docs/platform-specific-code#platform-specific-extensions
- **Expo EAS Build:** https://docs.expo.dev/build/introduction/

## Summary

This guide provides everything you need to build high-quality cross-platform apps:

1. **Understand** platform differences with Feature Parity Matrix
2. **Implement** using provided utilities and patterns
3. **Organize** code with recommended structures
4. **Test** on both platforms thoroughly
5. **Maintain** with best practices and guidelines

**Remember:** The goal is not to make apps look identical on both platforms, but to provide the best possible experience on each platform while maximizing code reuse.

---

**Total Documentation:** 15+ files, 13,000+ lines
**Coverage:** iOS 13-17, Android 8-14 (API 26-34)
**Last Updated:** 2026-02-06
