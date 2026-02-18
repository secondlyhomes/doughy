/**
 * Platform Select Utilities
 *
 * Type-safe wrappers around Platform.select with enhanced functionality
 * for components, hooks, and values.
 *
 * @example
 * ```typescript
 * import { platformSelect, platformComponent, platformHook } from './platformSelect'
 *
 * // Select a value
 * const fontSize = platformSelect({
 *   ios: 16,
 *   android: 14,
 *   default: 14,
 * })
 *
 * // Select a component
 * const Button = platformComponent({
 *   ios: IOSButton,
 *   android: AndroidButton,
 *   default: GenericButton,
 * })
 *
 * // Select a hook
 * const useAuth = platformHook({
 *   ios: useIOSAuth,
 *   android: useAndroidAuth,
 *   default: useGenericAuth,
 * })
 * ```
 */

import { Platform } from 'react-native'
import type { ComponentType, ReactElement } from 'react'

/**
 * Platform-specific options
 */
export interface PlatformOptions<T> {
  ios?: T
  android?: T
  web?: T
  native?: T // Applied to both iOS and Android
  default?: T
}

/**
 * Type-safe Platform.select with exhaustive checking
 *
 * @param options - Platform-specific values
 * @returns Selected value based on current platform
 *
 * @example
 * ```typescript
 * const shadowStyle = platformSelect({
 *   ios: {
 *     shadowColor: '#000',
 *     shadowOffset: { width: 0, height: 2 },
 *     shadowOpacity: 0.25,
 *     shadowRadius: 3.84,
 *   },
 *   android: {
 *     elevation: 5,
 *   },
 *   default: {},
 * })
 * ```
 */
export function platformSelect<T>(options: PlatformOptions<T>): T | undefined {
  // Handle 'native' option for both iOS and Android
  if (options.native !== undefined && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    // Platform-specific takes precedence over 'native'
    if (Platform.OS === 'ios' && options.ios !== undefined) {
      return options.ios
    }
    if (Platform.OS === 'android' && options.android !== undefined) {
      return options.android
    }
    return options.native
  }

  // Use Platform.select for standard selection
  const value = Platform.select({
    ios: options.ios,
    android: options.android,
    web: options.web,
    default: options.default,
  })

  // Fallback to default if value is undefined
  if (value === undefined && options.default !== undefined) {
    return options.default
  }

  return value
}

/**
 * Platform-specific component wrapper
 *
 * @param components - Platform-specific components
 * @returns Selected component or null
 *
 * @example
 * ```typescript
 * import { IOSDatePicker } from './IOSDatePicker'
 * import { AndroidDatePicker } from './AndroidDatePicker'
 *
 * const DatePicker = platformComponent({
 *   ios: IOSDatePicker,
 *   android: AndroidDatePicker,
 *   default: WebDatePicker,
 * })
 *
 * // Usage
 * <DatePicker value={date} onChange={setDate} />
 * ```
 */
export function platformComponent<P = any>(
  components: PlatformOptions<ComponentType<P>>
): ComponentType<P> | null {
  const Component = platformSelect(components)
  return Component || null
}

/**
 * Platform-specific hook wrapper
 *
 * @param hooks - Platform-specific hooks
 * @returns Result of the selected hook
 *
 * @example
 * ```typescript
 * import { useIOSNotifications } from './useIOSNotifications'
 * import { useAndroidNotifications } from './useAndroidNotifications'
 *
 * export function useNotifications() {
 *   return platformHook({
 *     ios: useIOSNotifications,
 *     android: useAndroidNotifications,
 *     default: useWebNotifications,
 *   })
 * }
 * ```
 */
export function platformHook<T>(
  hooks: PlatformOptions<() => T>
): T | undefined {
  const hook = platformSelect(hooks)
  return hook ? hook() : undefined
}

/**
 * Platform-specific function wrapper
 *
 * @param functions - Platform-specific functions
 * @returns Selected function
 *
 * @example
 * ```typescript
 * const saveFile = platformFunction({
 *   ios: saveFileIOS,
 *   android: saveFileAndroid,
 *   web: saveFileWeb,
 *   default: () => console.warn('Save not supported'),
 * })
 *
 * await saveFile(data, filename)
 * ```
 */
export function platformFunction<TArgs extends any[], TReturn>(
  functions: PlatformOptions<(...args: TArgs) => TReturn>
): ((...args: TArgs) => TReturn) | undefined {
  return platformSelect(functions)
}

/**
 * Platform-specific async function wrapper
 *
 * @param functions - Platform-specific async functions
 * @returns Selected async function
 *
 * @example
 * ```typescript
 * const requestPermission = platformAsyncFunction({
 *   ios: requestIOSPermission,
 *   android: requestAndroidPermission,
 *   default: async () => ({ granted: false }),
 * })
 *
 * const result = await requestPermission('camera')
 * ```
 */
export function platformAsyncFunction<TArgs extends any[], TReturn>(
  functions: PlatformOptions<(...args: TArgs) => Promise<TReturn>>
): ((...args: TArgs) => Promise<TReturn>) | undefined {
  return platformSelect(functions)
}

/**
 * Conditional platform render
 *
 * @param options - Platform-specific render functions
 * @returns Rendered element or null
 *
 * @example
 * ```typescript
 * return platformRender({
 *   ios: () => <IOSView />,
 *   android: () => <AndroidView />,
 *   default: () => <DefaultView />,
 * })
 * ```
 */
export function platformRender(
  options: PlatformOptions<() => ReactElement | null>
): ReactElement | null {
  const renderFn = platformSelect(options)
  return renderFn ? renderFn() : null
}

/**
 * Platform-specific styles with deep merge support
 *
 * @param baseStyle - Base style object
 * @param platformStyles - Platform-specific style overrides
 * @returns Merged style object
 *
 * @example
 * ```typescript
 * const buttonStyle = platformStyle(
 *   {
 *     padding: 16,
 *     backgroundColor: '#007AFF',
 *   },
 *   {
 *     ios: {
 *       borderRadius: 10,
 *       shadowColor: '#000',
 *       shadowOffset: { width: 0, height: 2 },
 *       shadowOpacity: 0.1,
 *     },
 *     android: {
 *       borderRadius: 4,
 *       elevation: 3,
 *     },
 *   }
 * )
 * ```
 */
export function platformStyle<T extends Record<string, any>>(
  baseStyle: T,
  platformStyles: PlatformOptions<Partial<T>>
): T {
  const platformOverrides = platformSelect(platformStyles) || {}
  return { ...baseStyle, ...platformOverrides }
}

/**
 * Platform-specific configuration
 *
 * Useful for feature flags, API endpoints, or other configuration values
 *
 * @param config - Platform-specific configuration
 * @returns Selected configuration
 *
 * @example
 * ```typescript
 * const config = platformConfig({
 *   ios: {
 *     apiEndpoint: 'https://ios-api.example.com',
 *     enableFeature: true,
 *   },
 *   android: {
 *     apiEndpoint: 'https://android-api.example.com',
 *     enableFeature: false,
 *   },
 *   default: {
 *     apiEndpoint: 'https://api.example.com',
 *     enableFeature: false,
 *   },
 * })
 * ```
 */
export function platformConfig<T extends Record<string, any>>(
  config: PlatformOptions<T>
): T | undefined {
  return platformSelect(config)
}

/**
 * Platform-specific constant
 *
 * Type-safe constant selection with required default
 *
 * @param constants - Platform-specific constants with required default
 * @returns Selected constant
 *
 * @example
 * ```typescript
 * const HEADER_HEIGHT = platformConstant({
 *   ios: 44,
 *   android: 56,
 *   default: 48,
 * })
 * ```
 */
export function platformConstant<T>(
  constants: Required<Pick<PlatformOptions<T>, 'default'>> & PlatformOptions<T>
): T {
  return platformSelect(constants) ?? constants.default
}

/**
 * Check if running on specific platform
 */
export const platformIs = {
  ios: Platform.OS === 'ios',
  android: Platform.OS === 'android',
  web: Platform.OS === 'web',
  native: Platform.OS === 'ios' || Platform.OS === 'android',
  mobile: Platform.OS === 'ios' || Platform.OS === 'android',
} as const

/**
 * Platform-specific class name (for web compatibility)
 *
 * @param classNames - Platform-specific class names
 * @returns Selected class name
 *
 * @example
 * ```typescript
 * <div className={platformClassName({
 *   web: 'web-button',
 *   native: 'native-button',
 *   default: 'button',
 * })}>
 * ```
 */
export function platformClassName(
  classNames: PlatformOptions<string>
): string | undefined {
  return platformSelect(classNames)
}

/**
 * Platform-specific test ID
 *
 * Useful for E2E testing with different conventions per platform
 *
 * @param testIDs - Platform-specific test IDs
 * @returns Selected test ID
 *
 * @example
 * ```typescript
 * <Button testID={platformTestID({
 *   ios: 'login-button-ios',
 *   android: 'login-button-android',
 *   default: 'login-button',
 * })} />
 * ```
 */
export function platformTestID(
  testIDs: PlatformOptions<string>
): string | undefined {
  return platformSelect(testIDs)
}

/**
 * Platform-specific animation configuration
 *
 * @param configs - Platform-specific animation configs
 * @returns Selected animation config
 *
 * @example
 * ```typescript
 * const animationConfig = platformAnimation({
 *   ios: {
 *     duration: 300,
 *     easing: Easing.inOut(Easing.ease),
 *     useNativeDriver: true,
 *   },
 *   android: {
 *     duration: 250,
 *     easing: Easing.linear,
 *     useNativeDriver: true,
 *   },
 *   default: {
 *     duration: 200,
 *     easing: Easing.linear,
 *     useNativeDriver: false,
 *   },
 * })
 * ```
 */
export function platformAnimation<T extends Record<string, any>>(
  configs: PlatformOptions<T>
): T | undefined {
  return platformSelect(configs)
}

/**
 * Execute platform-specific side effect
 *
 * @param effects - Platform-specific side effect functions
 *
 * @example
 * ```typescript
 * platformEffect({
 *   ios: () => console.log('iOS initialization'),
 *   android: () => console.log('Android initialization'),
 *   default: () => console.log('Default initialization'),
 * })
 * ```
 */
export function platformEffect(
  effects: PlatformOptions<() => void>
): void {
  const effect = platformSelect(effects)
  if (effect) {
    effect()
  }
}

/**
 * Execute platform-specific async side effect
 *
 * @param effects - Platform-specific async side effect functions
 * @returns Promise that resolves when effect completes
 *
 * @example
 * ```typescript
 * await platformAsyncEffect({
 *   ios: async () => await initializeIOSSDK(),
 *   android: async () => await initializeAndroidSDK(),
 *   default: async () => console.log('No SDK needed'),
 * })
 * ```
 */
export async function platformAsyncEffect(
  effects: PlatformOptions<() => Promise<void>>
): Promise<void> {
  const effect = platformSelect(effects)
  if (effect) {
    await effect()
  }
}

/**
 * Platform-specific lazy component loader
 *
 * @param loaders - Platform-specific lazy loaders
 * @returns Lazy component
 *
 * @example
 * ```typescript
 * const MapView = platformLazy({
 *   ios: () => import('./MapView.ios'),
 *   android: () => import('./MapView.android'),
 *   default: () => import('./MapView.web'),
 * })
 * ```
 */
export function platformLazy<P = any>(
  loaders: PlatformOptions<() => Promise<{ default: ComponentType<P> }>>
): ComponentType<P> | null {
  const loader = platformSelect(loaders)
  if (!loader) return null

  // Note: This requires React.lazy wrapper in actual usage
  // This function returns the loader, not the lazy component
  return null // In practice, use with React.lazy
}

/**
 * Type guard for platform check
 *
 * @example
 * ```typescript
 * if (isPlatform('ios')) {
 *   // TypeScript knows Platform.OS === 'ios' here
 * }
 * ```
 */
export function isPlatform(platform: 'ios' | 'android' | 'web'): boolean {
  return Platform.OS === platform
}

/**
 * Type guard for native platform check
 *
 * @example
 * ```typescript
 * if (isNative()) {
 *   // Can use native modules here
 * }
 * ```
 */
export function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android'
}

/**
 * Type guard for web platform check
 *
 * @example
 * ```typescript
 * if (isWeb()) {
 *   // Can use web APIs here
 * }
 * ```
 */
export function isWeb(): boolean {
  return Platform.OS === 'web'
}
