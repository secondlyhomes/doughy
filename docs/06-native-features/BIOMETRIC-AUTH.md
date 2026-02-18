# Biometric Authentication Guide

> Face ID, Touch ID, and fingerprint authentication for quick unlock.

## Overview

Biometrics provide a **convenience layer**, not a replacement for password authentication:

```
First login: Email + Password → Store credentials encrypted → Enable biometrics
Subsequent: Biometric → Decrypt credentials → Auto-login
```

## Setup

### Install Dependencies

```bash
npx expo install expo-local-authentication expo-secure-store
```

### Configure app.json

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID to quickly unlock the app"
      }
    }
  }
}
```

## Implementation

### Check Biometric Support

```typescript
// src/services/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricSupport {
  isSupported: boolean;
  biometryType: 'fingerprint' | 'facial' | 'iris' | null;
  isEnrolled: boolean;
}

export async function checkBiometricSupport(): Promise<BiometricSupport> {
  // Check hardware support
  const isSupported = await LocalAuthentication.hasHardwareAsync();

  if (!isSupported) {
    return { isSupported: false, biometryType: null, isEnrolled: false };
  }

  // Check enrollment
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  // Get biometry type
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  let biometryType: BiometricSupport['biometryType'] = null;
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    biometryType = 'facial';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    biometryType = 'fingerprint';
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    biometryType = 'iris';
  }

  return { isSupported, biometryType, isEnrolled };
}

export function getBiometricName(type: BiometricSupport['biometryType']): string {
  switch (type) {
    case 'facial':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scan';
    default:
      return 'Biometric';
  }
}
```

### Authenticate with Biometrics

```typescript
// src/services/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthResult {
  success: boolean;
  error?: string;
}

export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<AuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to continue',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow passcode fallback
    });

    if (result.success) {
      return { success: true };
    }

    // Handle specific errors
    switch (result.error) {
      case 'user_cancel':
        return { success: false, error: 'Authentication cancelled' };
      case 'user_fallback':
        return { success: false, error: 'User chose passcode' };
      case 'system_cancel':
        return { success: false, error: 'System cancelled authentication' };
      case 'not_enrolled':
        return { success: false, error: 'No biometrics enrolled' };
      case 'lockout':
        return { success: false, error: 'Too many attempts. Try again later.' };
      default:
        return { success: false, error: result.error || 'Authentication failed' };
    }
  } catch (error) {
    return { success: false, error: 'Authentication error' };
  }
}
```

### Secure Credential Storage

```typescript
// src/services/secure-credentials.ts
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const CREDENTIALS_KEY = 'user_credentials';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

interface StoredCredentials {
  email: string;
  password: string;
}

export async function storeCredentials(
  email: string,
  password: string
): Promise<void> {
  const credentials: StoredCredentials = { email, password };

  await SecureStore.setItemAsync(
    CREDENTIALS_KEY,
    JSON.stringify(credentials),
    {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );
}

export async function getCredentials(): Promise<StoredCredentials | null> {
  const data = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as StoredCredentials;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}
```

### Biometric Login Flow

```typescript
// src/hooks/useBiometricLogin.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkBiometricSupport,
  authenticateWithBiometrics,
  getBiometricName,
} from '@/services/biometrics';
import {
  getCredentials,
  isBiometricEnabled,
} from '@/services/secure-credentials';

export function useBiometricLogin() {
  const { signIn } = useAuth();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  async function checkAvailability() {
    const support = await checkBiometricSupport();
    const enabled = await isBiometricEnabled();
    const hasCredentials = await getCredentials();

    setCanUseBiometric(
      support.isSupported &&
      support.isEnrolled &&
      enabled &&
      hasCredentials !== null
    );

    if (support.biometryType) {
      setBiometricType(getBiometricName(support.biometryType));
    }
  }

  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!canUseBiometric) return false;

    setIsAuthenticating(true);

    try {
      // Authenticate
      const authResult = await authenticateWithBiometrics(
        `Use ${biometricType} to sign in`
      );

      if (!authResult.success) {
        return false;
      }

      // Get stored credentials
      const credentials = await getCredentials();
      if (!credentials) {
        return false;
      }

      // Sign in
      await signIn(credentials.email, credentials.password);
      return true;
    } catch (error) {
      console.error('Biometric login failed:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [canUseBiometric, biometricType, signIn]);

  return {
    biometricType,
    canUseBiometric,
    isAuthenticating,
    loginWithBiometric,
  };
}
```

### Login Screen with Biometrics

```typescript
// src/screens/login-screen.tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useBiometricLogin } from '@/hooks/useBiometricLogin';
import { useAuth } from '@/contexts/AuthContext';
import { storeCredentials, setBiometricEnabled } from '@/services/secure-credentials';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const {
    biometricType,
    canUseBiometric,
    isAuthenticating,
    loginWithBiometric,
  } = useBiometricLogin();

  // Auto-prompt biometric on mount
  useEffect(() => {
    if (canUseBiometric) {
      loginWithBiometric();
    }
  }, [canUseBiometric]);

  async function handleLogin() {
    setIsLoading(true);
    try {
      await signIn(email, password);

      // Offer to enable biometrics after successful login
      const support = await checkBiometricSupport();
      if (support.isSupported && support.isEnrolled) {
        Alert.alert(
          `Enable ${biometricType}?`,
          `Would you like to use ${biometricType} for faster sign-in next time?`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                await storeCredentials(email, password);
                await setBiometricEnabled(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={styles.loginButton}
      >
        <Text>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      {canUseBiometric && (
        <TouchableOpacity
          onPress={loginWithBiometric}
          disabled={isAuthenticating}
          style={styles.biometricButton}
        >
          <Ionicons
            name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
            size={32}
          />
          <Text>Sign in with {biometricType}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Settings Toggle

```typescript
// src/screens/settings/biometric-setting.tsx
import { useState, useEffect } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import {
  checkBiometricSupport,
  authenticateWithBiometrics,
  getBiometricName,
} from '@/services/biometrics';
import {
  isBiometricEnabled,
  setBiometricEnabled,
  storeCredentials,
  clearCredentials,
} from '@/services/secure-credentials';

export function BiometricSetting() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const support = await checkBiometricSupport();
    setIsSupported(support.isSupported && support.isEnrolled);
    setBiometricName(getBiometricName(support.biometryType));

    const enabled = await isBiometricEnabled();
    setIsEnabled(enabled);
  }

  async function handleToggle(value: boolean) {
    if (value) {
      // Enable: require authentication first
      const result = await authenticateWithBiometrics(
        `Authenticate to enable ${biometricName}`
      );

      if (result.success) {
        // Get current credentials from user
        // In a real app, you might prompt for password re-entry
        Alert.prompt(
          'Confirm Password',
          'Enter your password to enable biometric login',
          async (password) => {
            if (password) {
              await storeCredentials(currentUserEmail, password);
              await setBiometricEnabled(true);
              setIsEnabled(true);
            }
          },
          'secure-text'
        );
      }
    } else {
      // Disable: just clear credentials
      await clearCredentials();
      setIsEnabled(false);
    }
  }

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <View style={styles.row}>
      <Text>{biometricName} Login</Text>
      <Switch value={isEnabled} onValueChange={handleToggle} />
    </View>
  );
}
```

## Security Considerations

### Do's

- ✅ Use biometrics as **convenience**, not primary auth
- ✅ Always have password fallback
- ✅ Store credentials encrypted in SecureStore
- ✅ Re-authenticate before enabling biometrics
- ✅ Clear credentials on logout

### Don'ts

- ❌ Store passwords in plain text
- ❌ Skip password fallback
- ❌ Auto-enable biometrics without consent
- ❌ Store sensitive data in AsyncStorage

## Checklist

- [ ] expo-local-authentication installed
- [ ] expo-secure-store installed
- [ ] NSFaceIDUsageDescription in Info.plist (iOS)
- [ ] Hardware support check implemented
- [ ] Enrollment check implemented
- [ ] Credentials stored securely
- [ ] Biometric toggle in settings
- [ ] Password fallback available
- [ ] Credentials cleared on logout
- [ ] Auto-prompt on login screen
- [ ] Tested on physical devices

## Related Docs

- [Auth Setup](../04-authentication/AUTH-SETUP.md) - Primary authentication
- [Permissions Handling](./PERMISSIONS-HANDLING.md) - Permission patterns
