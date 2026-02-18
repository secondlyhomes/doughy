/**
 * Biometric Authentication Module
 *
 * Face ID / Touch ID Authentication for iOS
 *
 * This module provides:
 * - Biometric authentication (Face ID, Touch ID)
 * - Fallback to device passcode
 * - Secure credential storage
 * - Authentication state management
 *
 * Requirements:
 * - expo-local-authentication
 * - iOS 11+ for Face ID
 * - iOS 8+ for Touch ID
 * - Privacy strings in Info.plist
 *
 * Usage:
 * ```tsx
 * import { useBiometricAuth, BiometricAuthButton } from './biometrics';
 *
 * function MyScreen() {
 *   const { isAvailable, authenticate } = useBiometricAuth();
 *
 *   return (
 *     <BiometricAuthButton
 *       onSuccess={() => console.log('Authenticated!')}
 *       onError={(error) => console.error(error)}
 *     />
 *   );
 * }
 * ```
 *
 * Related docs:
 * - .examples/platform/ios/biometrics/README.md
 * - .examples/platform/ios/biometrics/SecureStorage.ts
 */

// Types
export {
  BiometricType,
  AuthenticationResult,
  BiometricAvailability,
  AuthenticateOptions,
  BiometricAuthButtonProps,
  BiometricSetupScreenProps,
  BiometricGuardProps,
} from './types';

// Hooks
export { useBiometricAuth } from './hooks';

// Components
export {
  BiometricAuthButton,
  BiometricSetupScreen,
  BiometricGuard,
} from './components';

// Utilities
export {
  getBiometricName,
  getPrimaryBiometricType,
  mapAuthenticationTypes,
} from './utils';
