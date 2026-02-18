# Face ID / Touch ID Authentication Guide

Complete guide for implementing biometric authentication in your React Native + Expo app.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Setup](#setup)
- [Implementation](#implementation)
- [Keychain Integration](#keychain-integration)
- [Security Best Practices](#security-best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

iOS biometric authentication provides secure, convenient user verification using:

- **Face ID**: Facial recognition (iPhone X+, iPad Pro 2018+)
- **Touch ID**: Fingerprint recognition (iPhone 5s+, iPad Air 2+)

### Benefits

- **Security**: Biometric data never leaves device
- **Convenience**: Fast authentication (< 1 second)
- **Privacy**: Secure Enclave encryption
- **Fallback**: Automatic passcode option
- **Accessibility**: Works with VoiceOver

## Requirements

### iOS Version Support

- **iOS 8.0+**: Touch ID
- **iOS 11.0+**: Face ID
- **iOS 13.0+**: Enhanced security features
- **iOS 15.0+**: Improved authentication policies

### Hardware Requirements

- **Face ID**: iPhone X or later, iPad Pro (3rd gen+)
- **Touch ID**: iPhone 5s - 8/SE, iPad Air 2+, MacBook Pro with Touch Bar

### Installation

```bash
# Install Expo package
npx expo install expo-local-authentication expo-secure-store

# Or using npm
npm install expo-local-authentication expo-secure-store
```

### Xcode Configuration

Add to `Info.plist`:

```xml
<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>We use Face ID to quickly and securely verify your identity</string>
```

**Note**: Missing this string will cause instant app rejection!

## Setup

### Step 1: Check Biometric Availability

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function checkBiometricSupport() {
  // Check if device has biometric hardware
  const hasHardware = await LocalAuthentication.hasHardwareAsync();

  // Check if biometrics are enrolled
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  // Get supported types
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  console.log('Hardware:', hasHardware);
  console.log('Enrolled:', isEnrolled);
  console.log('Types:', types);

  // types can include:
  // - LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION (Face ID)
  // - LocalAuthentication.AuthenticationType.FINGERPRINT (Touch ID)
  // - LocalAuthentication.AuthenticationType.IRIS (not on iOS)

  return {
    isAvailable: hasHardware && isEnrolled,
    types,
  };
}
```

### Step 2: Request Authentication

```typescript
async function authenticate() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your account',
    fallbackLabel: 'Use Passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false, // Allow passcode fallback
  });

  if (result.success) {
    console.log('Authentication successful!');
    return true;
  } else {
    console.log('Authentication failed:', result.error);
    return false;
  }
}
```

## Implementation

### Basic Authentication

```typescript
import { useBiometricAuth } from './platform/ios/biometrics/BiometricAuth';

function LoginScreen() {
  const {
    isAvailable,
    biometricType,
    authenticate,
  } = useBiometricAuth();

  const handleBiometricLogin = async () => {
    const result = await authenticate({
      promptMessage: 'Log in to your account',
    });

    if (result.success) {
      // User authenticated successfully
      await loadUserData();
      navigation.navigate('Home');
    } else {
      // Authentication failed
      Alert.alert('Authentication Failed', result.error);
    }
  };

  if (!isAvailable) {
    // Show password login only
    return <PasswordLoginForm />;
  }

  return (
    <View>
      <BiometricButton onPress={handleBiometricLogin}>
        Login with {biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}
      </BiometricButton>

      <OrDivider />

      <PasswordLoginForm />
    </View>
  );
}
```

### Biometric Setup Flow

```typescript
import { BiometricSetupScreen } from './platform/ios/biometrics/BiometricAuth';

function OnboardingFlow() {
  const [step, setStep] = useState('welcome');

  if (step === 'biometric-setup') {
    return (
      <BiometricSetupScreen
        onComplete={() => {
          // User enabled biometrics
          savePreference('biometric_enabled', true);
          setStep('complete');
        }}
        onSkip={() => {
          // User skipped biometric setup
          setStep('complete');
        }}
      />
    );
  }

  // Other onboarding steps...
}
```

### Protected Content

```typescript
import { BiometricGuard } from './platform/ios/biometrics/BiometricAuth';

function SettingsScreen() {
  return (
    <View>
      <SettingsSection title="General">
        <SettingsItem title="Notifications" />
        <SettingsItem title="Appearance" />
      </SettingsSection>

      <BiometricGuard
        promptMessage="Authenticate to access security settings"
        fallback={
          <SettingsSection title="Security">
            <LockedView message="Authenticate to view" />
          </SettingsSection>
        }
      >
        <SettingsSection title="Security">
          <SettingsItem title="Change Password" />
          <SettingsItem title="Two-Factor Authentication" />
          <SettingsItem title="Login History" />
        </SettingsSection>
      </BiometricGuard>
    </View>
  );
}
```

### Biometric Toggle Setting

```typescript
function SecuritySettingsScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { isAvailable, biometricType } = useBiometricAuth();

  useEffect(() => {
    loadBiometricPreference();
  }, []);

  const loadBiometricPreference = async () => {
    const enabled = await SecureStorage.isBiometricEnabled();
    setBiometricEnabled(enabled);
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      // Verify biometric first
      const result = await authenticate({
        promptMessage: `Verify your ${getBiometricName(biometricType)}`,
      });

      if (result.success) {
        await SecureStorage.setBiometricEnabled(true);
        setBiometricEnabled(true);
      }
    } else {
      // Disable biometric
      await SecureStorage.setBiometricEnabled(false);
      setBiometricEnabled(false);
    }
  };

  if (!isAvailable) {
    return (
      <View>
        <Text>Biometric authentication is not available on this device</Text>
      </View>
    );
  }

  return (
    <View>
      <SettingToggle
        title={`Enable ${getBiometricName(biometricType)}`}
        description="Use biometrics to quickly access your account"
        value={biometricEnabled}
        onValueChange={handleToggleBiometric}
      />
    </View>
  );
}
```

## Keychain Integration

### Store Credentials Securely

```typescript
import { SecureStorage } from './platform/ios/biometrics/SecureStorage';

// Store credentials with biometric protection
async function saveCredentials(username: string, password: string) {
  await SecureStorage.storeCredentials(username, password, true);
}

// Retrieve credentials (requires biometric)
async function loadCredentials() {
  const credentials = await SecureStorage.getCredentials(true);

  if (credentials) {
    const { username, password } = credentials;
    // Use credentials for login
    await loginWithCredentials(username, password);
  }
}
```

### Store Authentication Token

```typescript
// Store auth token securely
async function saveAuthToken(token: string) {
  await SecureStorage.storeAuthToken(token);
}

// Retrieve auth token
async function getAuthToken() {
  return await SecureStorage.getAuthToken();
}
```

### Biometric-Protected Data

```typescript
// Store any sensitive data with biometric protection
async function saveSensitiveData(data: any) {
  await SecureStorage.setItem(
    'sensitive_data',
    JSON.stringify(data),
    {
      requireBiometric: true,
      accessibleMode: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: 'Authenticate to save data',
    }
  );
}

// Retrieve requires biometric
async function loadSensitiveData() {
  const data = await SecureStorage.getItem('sensitive_data', {
    requireBiometric: true,
    authenticationPrompt: 'Authenticate to access data',
  });

  return data ? JSON.parse(data) : null;
}
```

## Security Best Practices

### 1. Always Provide Fallback

```typescript
// ✅ Good: Allow passcode fallback
await LocalAuthentication.authenticateAsync({
  disableDeviceFallback: false, // User can use passcode
});

// ❌ Bad: Force biometric only
await LocalAuthentication.authenticateAsync({
  disableDeviceFallback: true, // User stuck if Face ID fails
});
```

### 2. Handle All Error Cases

```typescript
// ✅ Good: Handle specific errors
const result = await authenticate();

if (!result.success) {
  switch (result.error) {
    case 'user_cancel':
      // User tapped cancel, show alternative
      break;

    case 'user_fallback':
      // User chose passcode
      showPasswordLogin();
      break;

    case 'system_cancel':
      // System cancelled (app backgrounded)
      break;

    case 'lockout':
      // Too many failed attempts
      Alert.alert('Locked Out', 'Too many attempts. Please try again later.');
      break;

    default:
      // Other error
      Alert.alert('Authentication Failed', result.error);
  }
}
```

### 3. Don't Store Biometric Data

```typescript
// ✅ Good: Let iOS handle biometrics
await authenticate(); // iOS manages Face ID/Touch ID data

// ❌ Bad: Never try to access biometric data
// You cannot and should not access Face ID/Touch ID data directly
// It stays in Secure Enclave and never leaves device
```

### 4. Validate on Server

```typescript
// ✅ Good: Use biometric for local auth, validate token on server
const result = await authenticate();

if (result.success) {
  const token = await getAuthToken();
  // Validate token on server
  const isValid = await api.validateToken(token);

  if (isValid) {
    // Grant access
  }
}

// ❌ Bad: Trust biometric alone
const result = await authenticate();
if (result.success) {
  // Grant access without server validation
  // Attacker could bypass biometric check
}
```

### 5. Clear Sensitive Data on Logout

```typescript
// ✅ Good: Clear keychain on logout
async function logout() {
  await SecureStorage.clearAll();
  await api.logout();
  navigation.navigate('Login');
}
```

### 6. Handle Biometric Changes

```typescript
// ✅ Good: Detect when biometrics change
import * as LocalAuthentication from 'expo-local-authentication';

// On app startup
async function checkBiometricIntegrity() {
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!isEnrolled && biometricWasEnabled) {
    // User removed biometrics, clear sensitive data
    await SecureStorage.clearAll();
    await SecureStorage.setBiometricEnabled(false);

    Alert.alert(
      'Biometric Changed',
      'Please log in again to continue using biometric authentication.'
    );

    navigation.navigate('Login');
  }
}
```

## Testing

### 1. Simulator Testing

Face ID can be simulated in iOS Simulator:

```
# In Simulator menu bar:
Features → Face ID → Enrolled

# Then:
Features → Face ID → Matching Face (success)
Features → Face ID → Non-matching Face (failure)
```

Touch ID simulation:
```
Features → Touch ID → Enrolled
Features → Touch ID → Matching Touch (success)
```

### 2. Physical Device Testing

**Required for**:
- Actual Face ID/Touch ID sensors
- Real-world speed and accuracy
- Different lighting conditions (Face ID)
- Wearing glasses/masks (Face ID)
- Wet/dry fingers (Touch ID)

### 3. Edge Cases to Test

- [ ] First launch (no biometric setup)
- [ ] Biometric enrolled but disabled in app
- [ ] Too many failed attempts (lockout)
- [ ] User cancels authentication
- [ ] User chooses passcode fallback
- [ ] App backgrounded during auth
- [ ] Biometric changed/removed
- [ ] Device without biometric hardware
- [ ] Dark mode appearance
- [ ] VoiceOver accessibility

### 4. Testing Checklist

```typescript
// Test availability
const { isAvailable, biometricType } = useBiometricAuth();
console.log('Available:', isAvailable, 'Type:', biometricType);

// Test authentication
const result = await authenticate();
console.log('Result:', result);

// Test keychain
await SecureStorage.setItem('test', 'data');
const data = await SecureStorage.getItem('test');
console.log('Keychain:', data);

// Test error handling
try {
  await SecureStorage.getItem('nonexistent', { requireBiometric: true });
} catch (error) {
  console.log('Error handled:', error);
}
```

## Troubleshooting

### Face ID Not Working

**Problem**: Face ID prompt doesn't appear

**Solutions**:
1. Add `NSFaceIDUsageDescription` to Info.plist
2. Check device is iPhone X or later
3. Verify Face ID is enrolled: Settings → Face ID & Passcode
4. Check permission: Settings → Your App → Face ID
5. Use physical device (simulator may not work reliably)

### Touch ID Not Working

**Problem**: Touch ID prompt doesn't appear

**Solutions**:
1. Check device has Touch ID sensor
2. Verify Touch ID is enrolled: Settings → Touch ID & Passcode
3. Clean Home button (if device has physical button)
4. Check permission granted

### Keychain Access Fails

**Problem**: Cannot read/write to keychain

**Solutions**:
1. Check `expo-secure-store` is installed
2. Verify app has keychain entitlements
3. Clean and rebuild project
4. Check keychain access group configuration

### Authentication Always Fails

**Problem**: Biometric authentication never succeeds

**Solutions**:
1. Check device is unlocked
2. Verify biometrics are enrolled
3. Test with simulator controls
4. Check for App Transport Security issues
5. Review error messages carefully

### "Biometric Not Available" on Device

**Problem**: Shows not available despite device support

**Solutions**:
1. Check iOS version (11+ for Face ID, 8+ for Touch ID)
2. Verify biometrics enrolled in Settings
3. Restart device
4. Check device restrictions (Screen Time, MDM)
5. Update iOS to latest version

## Resources

### Apple Documentation

- [Local Authentication Framework](https://developer.apple.com/documentation/localauthentication)
- [Face ID and Touch ID](https://developer.apple.com/design/human-interface-guidelines/face-id-and-touch-id)
- [Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Secure Enclave](https://support.apple.com/guide/security/secure-enclave-sec59b0b31ff/web)

### Expo Documentation

- [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)

### Security Guidelines

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [iOS App Security Best Practices](https://developer.apple.com/security/)

## Next Steps

1. [ ] Implement basic biometric authentication
2. [ ] Add biometric toggle in settings
3. [ ] Store credentials securely in keychain
4. [ ] Test on multiple devices
5. [ ] Add onboarding flow
6. [ ] Implement biometric guard for sensitive screens
7. [ ] Test all error cases
8. [ ] Monitor authentication success rate
9. [ ] Gather user feedback
10. [ ] Consider adding biometric reauthentication for critical actions
