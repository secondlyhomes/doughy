/**
 * BiometricSetupScreen.tsx
 *
 * Screen component for biometric enrollment setup
 */

import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BiometricSetupScreenProps, BiometricType } from '../types';
import { useBiometricAuth } from '../hooks';
import { getBiometricName } from '../utils';

/**
 * Biometric setup screen
 * Guides user through enabling biometric authentication
 */
export function BiometricSetupScreen({
  onComplete,
  onSkip,
}: BiometricSetupScreenProps) {
  const { isAvailable, isEnrolled, biometricType, authenticate } =
    useBiometricAuth();

  const handleEnable = async () => {
    if (!isEnrolled) {
      Alert.alert(
        'Setup Required',
        `Please set up ${getBiometricName(biometricType)} in your device settings first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await authenticate({
      promptMessage: `Verify your ${getBiometricName(biometricType)}`,
    });

    if (result.success) {
      onComplete();
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Biometric Authentication</Text>
        <Text style={styles.message}>
          Your device doesn't support biometric authentication or it hasn't been
          set up yet.
        </Text>
        <Text onPress={onSkip} style={styles.skipButton}>
          Continue
        </Text>
      </View>
    );
  }

  const biometricName = getBiometricName(biometricType);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enable {biometricName}</Text>

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {biometricType === BiometricType.FaceID ? '🔐' : '👆'}
        </Text>
      </View>

      <Text style={styles.message}>
        Use {biometricName} to quickly and securely access your account.
      </Text>

      <Text onPress={handleEnable} style={styles.enableButton}>
        Enable {biometricName}
      </Text>

      <Text onPress={onSkip} style={styles.skipButton}>
        Skip for Now
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  icon: {
    fontSize: 48,
  },
  message: {
    fontSize: 17,
    lineHeight: 24,
    color: '#6C6C70',
    textAlign: 'center',
    marginBottom: 32,
  },
  enableButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  skipButton: {
    fontSize: 17,
    color: '#007AFF',
    padding: 12,
  },
});
