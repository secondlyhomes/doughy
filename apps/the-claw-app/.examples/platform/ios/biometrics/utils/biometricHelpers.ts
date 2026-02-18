/**
 * biometricHelpers.ts
 *
 * Utility functions for biometric authentication
 */

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricType } from '../types';

/**
 * Map expo-local-authentication types to BiometricType enum
 */
export function mapAuthenticationTypes(
  types: LocalAuthentication.AuthenticationType[]
): BiometricType[] {
  const mapped: BiometricType[] = [];

  types.forEach((type) => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        mapped.push(BiometricType.FaceID);
        break;
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        if (Platform.OS === 'ios') {
          mapped.push(BiometricType.TouchID);
        } else {
          mapped.push(BiometricType.Fingerprint);
        }
        break;
      case LocalAuthentication.AuthenticationType.IRIS:
        mapped.push(BiometricType.Iris);
        break;
    }
  });

  return mapped;
}

/**
 * Get the primary biometric type from available types
 * Priority: FaceID > TouchID > Fingerprint > Iris
 */
export function getPrimaryBiometricType(types: BiometricType[]): BiometricType {
  if (types.includes(BiometricType.FaceID)) {
    return BiometricType.FaceID;
  }
  if (types.includes(BiometricType.TouchID)) {
    return BiometricType.TouchID;
  }
  if (types.includes(BiometricType.Fingerprint)) {
    return BiometricType.Fingerprint;
  }
  if (types.includes(BiometricType.Iris)) {
    return BiometricType.Iris;
  }
  return BiometricType.None;
}

/**
 * Get user-friendly display name for biometric type
 */
export function getBiometricName(type: BiometricType): string {
  switch (type) {
    case BiometricType.FaceID:
      return 'Face ID';
    case BiometricType.TouchID:
      return 'Touch ID';
    case BiometricType.Fingerprint:
      return 'Fingerprint';
    case BiometricType.Iris:
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Get the iOS settings path for the biometric type
 */
export function getBiometricSettingsPath(type: BiometricType): string {
  if (type === BiometricType.FaceID) {
    return 'Face ID';
  }
  return 'Touch ID';
}
