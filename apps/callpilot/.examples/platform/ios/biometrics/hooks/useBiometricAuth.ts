/**
 * useBiometricAuth.ts
 *
 * Hook for biometric authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  BiometricType,
  AuthenticationResult,
  AuthenticateOptions,
} from '../types';
import {
  mapAuthenticationTypes,
  getPrimaryBiometricType,
  getBiometricName,
  getBiometricSettingsPath,
} from '../utils';

/**
 * Hook for biometric authentication
 */
export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(
    BiometricType.None
  );
  const [supportedTypes, setSupportedTypes] = useState<BiometricType[]>([]);

  /**
   * Check if biometric authentication is available
   */
  const checkBiometricSupport = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        console.log('[Biometric] No biometric hardware available');
        setIsAvailable(false);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const mappedTypes = mapAuthenticationTypes(types);
      setSupportedTypes(mappedTypes);

      const primaryType = getPrimaryBiometricType(mappedTypes);
      setBiometricType(primaryType);

      setIsAvailable(compatible && enrolled);

      console.log('[Biometric] Support checked:', {
        compatible,
        enrolled,
        types: mappedTypes,
        primary: primaryType,
      });
    } catch (error) {
      console.error('[Biometric] Failed to check support:', error);
      setIsAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  /**
   * Authenticate with biometrics
   */
  const authenticate = useCallback(
    async (options?: AuthenticateOptions): Promise<AuthenticationResult> => {
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:
            options?.promptMessage ||
            `Authenticate with ${getBiometricName(biometricType)}`,
          cancelLabel: options?.cancelLabel || 'Cancel',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: options?.disableDeviceFallback || false,
        });

        if (result.success) {
          console.log('[Biometric] Authentication successful');
          return { success: true, biometricType };
        } else {
          console.log('[Biometric] Authentication failed:', result.error);
          return {
            success: false,
            error: result.error || 'Authentication failed',
          };
        }
      } catch (error) {
        console.error('[Biometric] Authentication error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        };
      }
    },
    [isAvailable, biometricType]
  );

  /**
   * Prompt user to enable biometrics in settings
   */
  const promptEnrollment = useCallback(() => {
    const biometricName = getBiometricName(biometricType);

    Alert.alert(
      `Enable ${biometricName}`,
      `Would you like to use ${biometricName} to quickly and securely access your account?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Alert.alert(
                'Enable in Settings',
                `Please go to Settings > ${getBiometricSettingsPath(biometricType)} & Passcode to set up ${biometricName}.`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [biometricType]);

  return {
    isAvailable,
    isEnrolled,
    biometricType,
    supportedTypes,
    authenticate,
    checkBiometricSupport,
    promptEnrollment,
  };
}
