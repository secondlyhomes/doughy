/**
 * Platform Detection Utilities
 *
 * Comprehensive utilities for detecting platform capabilities, versions,
 * and device characteristics in React Native + Expo apps.
 *
 * @example
 * ```typescript
 * import { PlatformUtils } from './platformDetection'
 *
 * if (PlatformUtils.supportsHaptics()) {
 *   await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
 * }
 *
 * if (PlatformUtils.supportsLiveActivities()) {
 *   await startLiveActivity()
 * }
 * ```
 */

import { Platform, Dimensions, NativeModules } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'

/**
 * Platform detection and feature availability utilities
 */
export const PlatformUtils = {
  /**
   * Basic Platform Detection
   */
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',

  /**
   * Version Detection
   */
  iOSVersion: Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : null,
  androidVersion: Platform.OS === 'android' ? Platform.Version as number : null,

  /**
   * Device Type Detection
   */
  isTablet: Device.deviceType === Device.DeviceType.TABLET,
  isPhone: Device.deviceType === Device.DeviceType.PHONE,
  isDesktop: Device.deviceType === Device.DeviceType.DESKTOP,

  /**
   * Device Model Information
   */
  deviceName: Device.deviceName,
  modelName: Device.modelName,
  modelId: Device.modelId,

  /**
   * Check if device supports haptic feedback
   *
   * iOS: All devices with Taptic Engine (iPhone 6s+)
   * Android: Android 8.0+ (API 26)
   */
  supportsHaptics(): boolean {
    if (Platform.OS === 'ios') {
      // All modern iOS devices support haptics
      return this.iOSVersion! >= 10
    }
    if (Platform.OS === 'android') {
      return this.androidVersion! >= 26
    }
    return false
  },

  /**
   * Check if device supports biometric authentication
   *
   * iOS: Touch ID (iPhone 5s+) or Face ID (iPhone X+)
   * Android: Fingerprint (Android 6+) or Face Unlock
   */
  supportsBiometrics(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android'
  },

  /**
   * Check if platform supports home screen widgets
   *
   * iOS: iOS 14+
   * Android: Android 8.0+ (API 26)
   */
  supportsWidgets(): boolean {
    if (Platform.OS === 'ios') {
      return this.iOSVersion! >= 14
    }
    if (Platform.OS === 'android') {
      return this.androidVersion! >= 26
    }
    return false
  },

  /**
   * Check if device supports Live Activities
   *
   * iOS: iOS 16.1+ only
   * Android: Not available (use ongoing notifications instead)
   */
  supportsLiveActivities(): boolean {
    return Platform.OS === 'ios' && this.iOSVersion! >= 16.1
  },

  /**
   * Check if device supports Dynamic Island
   *
   * iOS: iPhone 14 Pro and later with iOS 16+
   * Android: Not available
   *
   * Note: This checks iOS version, not specific device model.
   * Use device detection for model-specific checks.
   */
  supportsDynamicIsland(): boolean {
    return Platform.OS === 'ios' && this.iOSVersion! >= 16
  },

  /**
   * Check if device supports Material You / Material Design 3
   *
   * iOS: Not available
   * Android: Android 12+ (API 31)
   */
  supportsMaterialYou(): boolean {
    return Platform.OS === 'android' && this.androidVersion! >= 31
  },

  /**
   * Check if device supports Predictive Back gesture
   *
   * iOS: Not available (has swipe back by default)
   * Android: Android 13+ (API 33)
   */
  supportsPredictiveBack(): boolean {
    return Platform.OS === 'android' && this.androidVersion! >= 33
  },

  /**
   * Check if device supports Picture-in-Picture mode
   *
   * iOS: iOS 14+ (iPad: iOS 9+)
   * Android: Android 8.0+ (API 26)
   */
  supportsPictureInPicture(): boolean {
    if (Platform.OS === 'ios') {
      return this.isTablet ? this.iOSVersion! >= 9 : this.iOSVersion! >= 14
    }
    if (Platform.OS === 'android') {
      return this.androidVersion! >= 26
    }
    return false
  },

  /**
   * Check if device supports App Clips (iOS) or Instant Apps (Android)
   *
   * iOS: iOS 14+ (App Clips)
   * Android: Android 6.0+ (Instant Apps, deprecated)
   */
  supportsAppClips(): boolean {
    if (Platform.OS === 'ios') {
      return this.iOSVersion! >= 14
    }
    // Android Instant Apps are deprecated, return false
    return false
  },

  /**
   * Check if device supports Siri Shortcuts
   *
   * iOS: iOS 12+
   * Android: Not available (use Google Assistant Actions instead)
   */
  supportsSiriShortcuts(): boolean {
    return Platform.OS === 'ios' && this.iOSVersion! >= 12
  },

  /**
   * Check if device supports Focus Filters
   *
   * iOS: iOS 16+
   * Android: Not available
   */
  supportsFocusFilters(): boolean {
    return Platform.OS === 'ios' && this.iOSVersion! >= 16
  },

  /**
   * Check if device supports Handoff
   *
   * iOS: iOS 8+
   * Android: Not available
   */
  supportsHandoff(): boolean {
    return Platform.OS === 'ios' && this.iOSVersion! >= 8
  },

  /**
   * Check if device supports Quick Settings Tiles
   *
   * iOS: Not available
   * Android: Android 7.0+ (API 24)
   */
  supportsQuickSettingsTiles(): boolean {
    return Platform.OS === 'android' && this.androidVersion! >= 24
  },

  /**
   * Check if device supports Bubbles
   *
   * iOS: Not available
   * Android: Android 11+ (API 30)
   */
  supportsBubbles(): boolean {
    return Platform.OS === 'android' && this.androidVersion! >= 30
  },

  /**
   * Check if device supports Direct Share
   *
   * iOS: Not available (use Share Extensions)
   * Android: Android 10+ (API 29)
   */
  supportsDirectShare(): boolean {
    return Platform.OS === 'android' && this.androidVersion! >= 29
  },

  /**
   * Check if device supports background app refresh
   *
   * iOS: iOS 7+ (with restrictions)
   * Android: More flexible background tasks
   */
  supportsBackgroundRefresh(): boolean {
    if (Platform.OS === 'ios') {
      return this.iOSVersion! >= 7
    }
    return Platform.OS === 'android'
  },

  /**
   * Check if device supports background location tracking
   *
   * iOS: iOS 8+ (requires specific permissions)
   * Android: All versions (requires specific permissions)
   *
   * Note: Both platforms have strict requirements. Check permissions separately.
   */
  supportsBackgroundLocation(): boolean {
    if (Platform.OS === 'ios') {
      return this.iOSVersion! >= 8
    }
    return Platform.OS === 'android'
  },

  /**
   * Check if device supports Universal Links (iOS) or App Links (Android)
   *
   * iOS: iOS 9+
   * Android: Android 6.0+ (API 23)
   */
  supportsDeepLinking(): boolean {
    if (Platform.OS === 'ios') {
      return this.iOSVersion! >= 9
    }
    if (Platform.OS === 'android') {
      return this.androidVersion! >= 23
    }
    return false
  },

  /**
   * Get screen size category
   *
   * @returns 'small' | 'medium' | 'large' | 'xlarge'
   *
   * Categories:
   * - small: < 360dp (older phones)
   * - medium: 360-599dp (modern phones)
   * - large: 600-899dp (phablets, small tablets)
   * - xlarge: 900dp+ (tablets, foldables)
   */
  getScreenCategory(): 'small' | 'medium' | 'large' | 'xlarge' {
    const { width, height } = Dimensions.get('window')
    const smallerDimension = Math.min(width, height)

    if (smallerDimension < 360) return 'small'
    if (smallerDimension < 600) return 'medium'
    if (smallerDimension < 900) return 'large'
    return 'xlarge'
  },

  /**
   * Get safe area insets information
   *
   * @returns Object indicating if device has notch, home indicator, etc.
   */
  getSafeAreaInfo() {
    const { width, height } = Dimensions.get('window')
    const isIPhoneX = Platform.OS === 'ios' && (height >= 812 || width >= 812)

    return {
      hasNotch: isIPhoneX,
      hasHomeIndicator: isIPhoneX,
      requiresSafeArea: isIPhoneX || Platform.OS === 'android',
    }
  },

  /**
   * Check if device is in landscape orientation
   */
  isLandscape(): boolean {
    const { width, height } = Dimensions.get('window')
    return width > height
  },

  /**
   * Check if device is in portrait orientation
   */
  isPortrait(): boolean {
    const { width, height } = Dimensions.get('window')
    return height >= width
  },

  /**
   * Get device pixel density category
   *
   * @returns 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi'
   */
  getPixelDensityCategory(): 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi' {
    const scale = Dimensions.get('window').scale

    if (scale <= 1) return 'mdpi'
    if (scale <= 1.5) return 'hdpi'
    if (scale <= 2) return 'xhdpi'
    if (scale <= 3) return 'xxhdpi'
    return 'xxxhdpi'
  },

  /**
   * Check if app is running in development mode
   */
  isDevelopment: __DEV__,

  /**
   * Check if app is running in production mode
   */
  isProduction: !__DEV__,

  /**
   * Get app version information
   */
  getAppVersion() {
    return {
      version: Constants.expoConfig?.version,
      buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
      nativeVersion: Constants.nativeAppVersion,
      nativeBuildVersion: Constants.nativeBuildVersion,
    }
  },

  /**
   * Get Expo SDK version
   */
  getExpoVersion(): string | null {
    return Constants.expoConfig?.sdkVersion || null
  },

  /**
   * Check if running in Expo Go
   */
  isExpoGo(): boolean {
    return Constants.appOwnership === 'expo'
  },

  /**
   * Check if running in standalone app
   */
  isStandalone(): boolean {
    return Constants.appOwnership === 'standalone'
  },

  /**
   * Get platform-specific constants
   */
  getPlatformConstants() {
    if (Platform.OS === 'ios') {
      return {
        platform: 'ios' as const,
        version: this.iOSVersion,
        isPad: this.isTablet,
        isTVOS: Platform.isTV,
        forceTouchAvailable: (Platform as any).isTVOS ? false : true,
      }
    }

    if (Platform.OS === 'android') {
      return {
        platform: 'android' as const,
        version: this.androidVersion,
        isTablet: this.isTablet,
        isTV: Platform.isTV,
        brandName: Device.brand,
        manufacturerName: Device.manufacturer,
      }
    }

    return {
      platform: 'web' as const,
      version: null,
      isTablet: false,
      isTV: false,
    }
  },
}

/**
 * Feature availability checker
 *
 * @example
 * ```typescript
 * const features = new FeatureChecker()
 *
 * if (features.check('liveActivities')) {
 *   await startLiveActivity()
 * } else {
 *   console.log('Live Activities not supported:', features.getReason('liveActivities'))
 * }
 * ```
 */
export class FeatureChecker {
  private reasons: Map<string, string> = new Map()

  /**
   * Check if a feature is available
   */
  check(feature: FeatureName): boolean {
    const result = this.checkWithReason(feature)
    return result.available
  }

  /**
   * Check if a feature is available and get reason if not
   */
  checkWithReason(feature: FeatureName): { available: boolean; reason?: string } {
    switch (feature) {
      case 'haptics':
        return this.checkHaptics()
      case 'biometrics':
        return this.checkBiometrics()
      case 'widgets':
        return this.checkWidgets()
      case 'liveActivities':
        return this.checkLiveActivities()
      case 'materialYou':
        return this.checkMaterialYou()
      case 'predictiveBack':
        return this.checkPredictiveBack()
      case 'pictureInPicture':
        return this.checkPictureInPicture()
      case 'appClips':
        return this.checkAppClips()
      case 'siriShortcuts':
        return this.checkSiriShortcuts()
      case 'backgroundLocation':
        return this.checkBackgroundLocation()
      default:
        return { available: false, reason: 'Unknown feature' }
    }
  }

  /**
   * Get reason why a feature is not available
   */
  getReason(feature: FeatureName): string | null {
    const result = this.checkWithReason(feature)
    return result.reason || null
  }

  private checkHaptics() {
    if (Platform.OS === 'ios') {
      if (PlatformUtils.iOSVersion! < 10) {
        return { available: false, reason: 'Requires iOS 10 or later' }
      }
      return { available: true }
    }

    if (Platform.OS === 'android') {
      if (PlatformUtils.androidVersion! < 26) {
        return { available: false, reason: 'Requires Android 8.0 (API 26) or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Not supported on this platform' }
  }

  private checkBiometrics() {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return { available: true }
    }
    return { available: false, reason: 'Not supported on web' }
  }

  private checkWidgets() {
    if (Platform.OS === 'ios') {
      if (PlatformUtils.iOSVersion! < 14) {
        return { available: false, reason: 'Requires iOS 14 or later' }
      }
      return { available: true }
    }

    if (Platform.OS === 'android') {
      if (PlatformUtils.androidVersion! < 26) {
        return { available: false, reason: 'Requires Android 8.0 (API 26) or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Not supported on web' }
  }

  private checkLiveActivities() {
    if (Platform.OS === 'ios') {
      if (PlatformUtils.iOSVersion! < 16.1) {
        return { available: false, reason: 'Requires iOS 16.1 or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Live Activities are iOS-only. Use ongoing notifications on Android.' }
  }

  private checkMaterialYou() {
    if (Platform.OS === 'android') {
      if (PlatformUtils.androidVersion! < 31) {
        return { available: false, reason: 'Requires Android 12 (API 31) or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Material You is Android-only' }
  }

  private checkPredictiveBack() {
    if (Platform.OS === 'android') {
      if (PlatformUtils.androidVersion! < 33) {
        return { available: false, reason: 'Requires Android 13 (API 33) or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Predictive Back is Android-only. iOS has swipe back by default.' }
  }

  private checkPictureInPicture() {
    if (Platform.OS === 'ios') {
      const minVersion = PlatformUtils.isTablet ? 9 : 14
      if (PlatformUtils.iOSVersion! < minVersion) {
        return {
          available: false,
          reason: `Requires iOS ${minVersion} or later for ${PlatformUtils.isTablet ? 'iPad' : 'iPhone'}`
        }
      }
      return { available: true }
    }

    if (Platform.OS === 'android') {
      if (PlatformUtils.androidVersion! < 26) {
        return { available: false, reason: 'Requires Android 8.0 (API 26) or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Not supported on web' }
  }

  private checkAppClips() {
    if (Platform.OS === 'ios') {
      if (PlatformUtils.iOSVersion! < 14) {
        return { available: false, reason: 'Requires iOS 14 or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'App Clips are iOS-only. Android Instant Apps are deprecated.' }
  }

  private checkSiriShortcuts() {
    if (Platform.OS === 'ios') {
      if (PlatformUtils.iOSVersion! < 12) {
        return { available: false, reason: 'Requires iOS 12 or later' }
      }
      return { available: true }
    }

    return { available: false, reason: 'Siri Shortcuts are iOS-only. Use Google Assistant Actions on Android.' }
  }

  private checkBackgroundLocation() {
    if (Platform.OS === 'ios') {
      if (PlatformUtils.iOSVersion! < 8) {
        return { available: false, reason: 'Requires iOS 8 or later' }
      }
      return { available: true, reason: 'Available but requires "Always" location permission' }
    }

    if (Platform.OS === 'android') {
      return { available: true, reason: 'Available but requires background location permission' }
    }

    return { available: false, reason: 'Not supported on web' }
  }
}

/**
 * Available feature names
 */
export type FeatureName =
  | 'haptics'
  | 'biometrics'
  | 'widgets'
  | 'liveActivities'
  | 'materialYou'
  | 'predictiveBack'
  | 'pictureInPicture'
  | 'appClips'
  | 'siriShortcuts'
  | 'backgroundLocation'

/**
 * Device capability information
 */
export interface DeviceCapabilities {
  platform: 'ios' | 'android' | 'web'
  platformVersion: number | null
  deviceType: 'phone' | 'tablet' | 'desktop' | null
  screenCategory: 'small' | 'medium' | 'large' | 'xlarge'
  pixelDensity: 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi'
  hasNotch: boolean
  hasHomeIndicator: boolean
  supportsHaptics: boolean
  supportsBiometrics: boolean
  supportsWidgets: boolean
  supportsLiveActivities: boolean
  supportsMaterialYou: boolean
}

/**
 * Get comprehensive device capabilities
 *
 * @example
 * ```typescript
 * const capabilities = getDeviceCapabilities()
 * console.log(capabilities)
 * // {
 * //   platform: 'ios',
 * //   platformVersion: 17,
 * //   deviceType: 'phone',
 * //   screenCategory: 'medium',
 * //   supportsLiveActivities: true,
 * //   ...
 * // }
 * ```
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  const safeAreaInfo = PlatformUtils.getSafeAreaInfo()

  return {
    platform: Platform.OS as 'ios' | 'android' | 'web',
    platformVersion: PlatformUtils.iOSVersion || PlatformUtils.androidVersion,
    deviceType: PlatformUtils.isTablet ? 'tablet' : PlatformUtils.isPhone ? 'phone' : PlatformUtils.isDesktop ? 'desktop' : null,
    screenCategory: PlatformUtils.getScreenCategory(),
    pixelDensity: PlatformUtils.getPixelDensityCategory(),
    hasNotch: safeAreaInfo.hasNotch,
    hasHomeIndicator: safeAreaInfo.hasHomeIndicator,
    supportsHaptics: PlatformUtils.supportsHaptics(),
    supportsBiometrics: PlatformUtils.supportsBiometrics(),
    supportsWidgets: PlatformUtils.supportsWidgets(),
    supportsLiveActivities: PlatformUtils.supportsLiveActivities(),
    supportsMaterialYou: PlatformUtils.supportsMaterialYou(),
  }
}
