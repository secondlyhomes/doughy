/**
 * SecureStorage.ts
 *
 * Secure storage with biometric protection
 *
 * Features:
 * - Keychain integration
 * - Biometric-protected data
 * - Secure credential storage
 * - Automatic fallback to passcode
 *
 * Requirements:
 * - expo-secure-store
 * - iOS Keychain Services
 *
 * Related docs:
 * - .examples/platform/ios/biometrics/README.md
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

// Storage options
export interface SecureStorageOptions {
  requireBiometric?: boolean;
  accessibleMode?: SecureStore.SecureStoreOptions['keychainAccessible'];
  authenticationPrompt?: string;
}

// Default options
const DEFAULT_OPTIONS: SecureStorageOptions = {
  requireBiometric: false,
  accessibleMode: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  authenticationPrompt: 'Authenticate to access secure data',
};

/**
 * Secure Storage Manager
 */
export class SecureStorage {
  /**
   * Store data securely
   */
  static async setItem(
    key: string,
    value: string,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      throw new Error('SecureStore is only available on iOS and Android');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Require biometric authentication before storing
      if (opts.requireBiometric) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage:
            opts.authenticationPrompt || 'Authenticate to store data',
          fallbackLabel: 'Use Passcode',
        });

        if (!authResult.success) {
          throw new Error('Biometric authentication failed');
        }
      }

      // Store in keychain
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: opts.accessibleMode,
      });

      console.log('[SecureStorage] Item stored:', key);
    } catch (error) {
      console.error('[SecureStorage] Failed to store item:', error);
      throw error;
    }
  }

  /**
   * Retrieve data securely
   */
  static async getItem(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<string | null> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return null;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Require biometric authentication before retrieving
      if (opts.requireBiometric) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage:
            opts.authenticationPrompt || 'Authenticate to access data',
          fallbackLabel: 'Use Passcode',
        });

        if (!authResult.success) {
          throw new Error('Biometric authentication failed');
        }
      }

      // Retrieve from keychain
      const value = await SecureStore.getItemAsync(key);

      if (value) {
        console.log('[SecureStorage] Item retrieved:', key);
      }

      return value;
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve item:', error);
      throw error;
    }
  }

  /**
   * Remove data
   */
  static async removeItem(key: string): Promise<void> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
      console.log('[SecureStorage] Item removed:', key);
    } catch (error) {
      console.error('[SecureStorage] Failed to remove item:', error);
      throw error;
    }
  }

  /**
   * Store credentials with biometric protection
   */
  static async storeCredentials(
    username: string,
    password: string,
    requireBiometric = true
  ): Promise<void> {
    const credentials = JSON.stringify({ username, password });

    await this.setItem('user_credentials', credentials, {
      requireBiometric,
      accessibleMode: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: 'Authenticate to save credentials',
    });
  }

  /**
   * Retrieve credentials with biometric protection
   */
  static async getCredentials(
    requireBiometric = true
  ): Promise<{ username: string; password: string } | null> {
    const credentials = await this.getItem('user_credentials', {
      requireBiometric,
      authenticationPrompt: 'Authenticate to access credentials',
    });

    if (!credentials) {
      return null;
    }

    try {
      return JSON.parse(credentials);
    } catch (error) {
      console.error('[SecureStorage] Failed to parse credentials');
      return null;
    }
  }

  /**
   * Store authentication token
   */
  static async storeAuthToken(token: string): Promise<void> {
    await this.setItem('auth_token', token, {
      accessibleMode: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  /**
   * Retrieve authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    return await this.getItem('auth_token');
  }

  /**
   * Clear all secure data
   */
  static async clearAll(): Promise<void> {
    const keys = [
      'user_credentials',
      'auth_token',
      'biometric_enabled',
      'secure_data',
    ];

    for (const key of keys) {
      await this.removeItem(key);
    }

    console.log('[SecureStorage] All data cleared');
  }

  /**
   * Check if biometric is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    const value = await this.getItem('biometric_enabled');
    return value === 'true';
  }

  /**
   * Set biometric enabled state
   */
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setItem('biometric_enabled', enabled.toString());
  }
}

/**
 * Hook for secure storage operations
 */
export function useSecureStorage(key: string) {
  const setSecureValue = async (
    value: string,
    options?: SecureStorageOptions
  ) => {
    await SecureStorage.setItem(key, value, options);
  };

  const getSecureValue = async (options?: SecureStorageOptions) => {
    return await SecureStorage.getItem(key, options);
  };

  const removeSecureValue = async () => {
    await SecureStorage.removeItem(key);
  };

  return {
    setSecureValue,
    getSecureValue,
    removeSecureValue,
  };
}
