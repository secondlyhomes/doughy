# Clerk Integration Setup

Complete guide for integrating Clerk authentication into your React Native app.

## Overview

Clerk provides:
- User management and authentication
- Social logins (Google, Apple, GitHub, etc.)
- Multi-factor authentication
- Organization management
- Session management
- Pre-built UI components

## Prerequisites

- Clerk account (https://clerk.com)
- React Native app with Expo

## Installation

```bash
npm install @clerk/clerk-expo
npx expo install expo-secure-store expo-web-browser
```

## Environment Variables

Add to `.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

## Configuration

### 1. Set up Clerk Provider

```typescript
// App.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from './tokenCache';

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <RootNavigator />
    </ClerkProvider>
  );
}
```

### 2. Create Token Cache

```typescript
// tokenCache.ts
import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo/dist/cache';

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      // Handle error
    }
  },
};
```

## Usage

### Sign In/Sign Up

```typescript
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

function LoginScreen() {
  const { signIn } = useSignIn();

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn.create({
        identifier: email,
        password,
      });
    } catch (err) {
      // Handle error
    }
  };

  return (
    // UI
  );
}
```

### OAuth Sign In

```typescript
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

function SocialLogin() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return <button onClick={handleGoogleSignIn}>Sign in with Google</button>;
}
```

### Get Current User

```typescript
import { useUser } from '@clerk/clerk-expo';

function ProfileScreen() {
  const { user } = useUser();

  return (
    <View>
      <Text>Welcome, {user?.firstName}!</Text>
      <Text>Email: {user?.primaryEmailAddress?.emailAddress}</Text>
    </View>
  );
}
```

### Sign Out

```typescript
import { useClerk } from '@clerk/clerk-expo';

function Settings() {
  const { signOut } = useClerk();

  return <button onClick={() => signOut()}>Sign Out</button>;
}
```

## Supabase Integration

Sync Clerk users with Supabase:

```typescript
// services/auth/clerkSupabaseSync.ts
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/services/supabase';
import { useEffect } from 'react';

export function useClerkSupabaseSync() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: `${user.firstName} ${user.lastName}`,
          avatar_url: user.imageUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to sync user:', error);
      }
    };

    syncUser();
  }, [user]);
}
```

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Expo SDK](https://clerk.com/docs/references/expo/overview)
- [Authentication Flows](https://clerk.com/docs/authentication/overview)
