# OAuth Integration (Google & Apple Sign In)

## Apple Sign In (Required for iOS)

If your app has any login, Apple requires "Sign in with Apple" option.

### 1. Enable in Supabase

1. Go to **Authentication > Providers > Apple**
2. Enable Apple provider
3. Add your Service ID and other details

### 2. Configure Expo

```json
// app.json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

### 3. Implementation

```typescript
// src/services/auth/appleSignIn.ts

import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/services/supabase';

export async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // User canceled, don't show error
      return null;
    }
    throw error;
  }
}
```

### 4. UI Component

```typescript
// src/components/AppleSignInButton.tsx

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, View } from 'react-native';
import { signInWithApple } from '@/services/auth/appleSignIn';

export function AppleSignInButton() {
  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={{ width: '100%', height: 48 }}
      onPress={async () => {
        try {
          await signInWithApple();
        } catch (error) {
          console.error('Apple sign in failed:', error);
        }
      }}
    />
  );
}
```

## Google Sign In

### 1. Enable in Supabase

1. Go to **Authentication > Providers > Google**
2. Enable Google provider
3. Add Client ID and Secret from Google Cloud Console

### 2. Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 3. Configure Expo

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

### 4. Implementation

```typescript
// src/services/auth/googleSignIn.ts

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '@/services/supabase';

// Configure once at app start
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();

    if (!idToken) {
      throw new Error('No ID token');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
}
```

### 5. UI Component

```typescript
// src/components/GoogleSignInButton.tsx

import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { signInWithGoogle } from '@/services/auth/googleSignIn';

export function GoogleSignInButton() {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={async () => {
        try {
          await signInWithGoogle();
        } catch (error) {
          console.error('Google sign in failed:', error);
        }
      }}
    >
      <Image
        source={require('@/assets/google-icon.png')}
        style={styles.icon}
      />
      <Text style={styles.text}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
```

## Combined Login Screen

```typescript
// src/screens/LoginScreen.tsx

import { View, StyleSheet } from 'react-native';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { EmailLoginForm } from '@/components/EmailLoginForm';
import { Divider } from '@/components/Divider';

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <EmailLoginForm />

      <Divider text="or continue with" />

      <View style={styles.socialButtons}>
        <AppleSignInButton />
        <GoogleSignInButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  socialButtons: {
    gap: 12,
  },
});
```

## Deep Linking for OAuth

Configure deep links for OAuth callbacks:

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "associatedDomains": ["applinks:your-project.supabase.co"]
    }
  }
}
```

```typescript
// Handle deep link in your app
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';

Linking.addEventListener('url', async ({ url }) => {
  if (url.includes('auth/callback')) {
    await supabase.auth.getSessionFromUrl({ url });
  }
});
```

## Checklist

- [ ] Apple Sign In configured (required for iOS)
- [ ] Google Sign In configured
- [ ] OAuth credentials in Supabase
- [ ] Deep linking configured
- [ ] Sign in buttons added to login screen
- [ ] Error handling for canceled flows
