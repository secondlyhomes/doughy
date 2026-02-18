/**
 * BiometricAuthButton.tsx
 *
 * Button component for biometric authentication
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BiometricAuthButtonProps } from '../types';
import { useBiometricAuth } from '../hooks';
import { getBiometricName } from '../utils';

/**
 * Biometric authentication button
 * Triggers biometric auth when pressed
 */
export function BiometricAuthButton({
  onSuccess,
  onError,
  promptMessage,
  children,
}: BiometricAuthButtonProps) {
  const { isAvailable, biometricType, authenticate } = useBiometricAuth();

  const handleAuthenticate = async () => {
    const result = await authenticate({ promptMessage });

    if (result.success) {
      onSuccess();
    } else if (onError && result.error) {
      onError(result.error);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text onPress={handleAuthenticate} style={styles.button}>
        {children || `Unlock with ${getBiometricName(biometricType)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    fontSize: 16,
    color: '#007AFF',
    padding: 12,
  },
});
