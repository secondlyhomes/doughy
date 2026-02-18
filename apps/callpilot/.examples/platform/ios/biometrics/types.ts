/**
 * types.ts
 *
 * Type definitions for biometric authentication
 */

/**
 * Biometric types supported by the device
 */
export enum BiometricType {
  FaceID = 'faceId',
  TouchID = 'touchId',
  Fingerprint = 'fingerprint',
  Iris = 'iris',
  None = 'none',
}

/**
 * Result of an authentication attempt
 */
export interface AuthenticationResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

/**
 * Biometric availability information
 */
export interface BiometricAvailability {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  supportedTypes: BiometricType[];
}

/**
 * Options for authentication prompt
 */
export interface AuthenticateOptions {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
}

/**
 * Props for BiometricAuthButton component
 */
export interface BiometricAuthButtonProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
  promptMessage?: string;
  children?: React.ReactNode;
}

/**
 * Props for BiometricSetupScreen component
 */
export interface BiometricSetupScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Props for BiometricGuard component
 */
export interface BiometricGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  promptMessage?: string;
}
