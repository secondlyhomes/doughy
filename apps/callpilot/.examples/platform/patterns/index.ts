/**
 * Conditional Rendering Patterns
 *
 * Examples of different patterns for platform-specific component rendering
 * in React Native + Expo apps.
 */

// Types
export type {
  ButtonProps,
  PlatformRenderProps,
  ErrorBoundaryState,
  PlatformContextValue,
  PlatformFeatures,
  AnimationConfig,
  PlatformStyleOptions,
  DatePickerProps,
} from './types'

// Basic Patterns (1-4)
export {
  ButtonWithPlatformStyles,
  HeaderWithPlatformTitle,
  PlatformFeatureComponent,
  IOSButton,
  AndroidButton,
} from './basic-patterns'

// HOC and Wrapper Patterns (5-6)
export {
  withPlatformBehavior,
  DatePicker,
  DateSelector,
} from './hoc-patterns'

// Hooks and Render Props Patterns (7-8)
export {
  PlatformRender,
  PlatformRenderExample,
  usePlatformFeatures,
  InteractiveComponent,
} from './hooks-patterns'

// Advanced Patterns (9-12)
export {
  ThemedButton,
  BiometricAuth,
  AnimatedComponent,
  LazyPlatformComponent,
} from './advanced-patterns'

// Provider and Error Boundary Patterns (13-14)
export {
  PlatformErrorBoundary,
  PlatformProvider,
  usePlatform,
} from './provider-patterns'

// Placeholder Components
export {
  LiveActivityWidget,
  MaterialYouWidget,
  StandardWidget,
  IOSDatePicker,
  AndroidDatePicker,
  WebDatePicker,
  IOSSpecificFeature,
  AndroidSpecificFeature,
  GenericFeature,
} from './placeholder-components'

// Styles
export { styles } from './styles'

// Utils
export {
  getAnimationConfig,
  getPlatformButtonStyles,
  getPlatformShadowStyles,
  isIOSVersionAtLeast,
  isAndroidAPIAtLeast,
  getPlatformErrorMessage,
  getBiometricLabel,
} from './utils/platform-utils'
