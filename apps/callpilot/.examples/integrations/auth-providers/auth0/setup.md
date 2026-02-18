# Auth0 Integration Setup

Complete guide for integrating Auth0 authentication.

## Overview

Auth0 provides:
- Universal authentication platform
- Social and enterprise logins
- Multi-factor authentication
- Passwordless authentication
- Advanced security features

## Installation

```bash
npm install react-native-auth0
npx expo install expo-web-browser expo-crypto
```

## Environment Variables

```env
EXPO_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your_client_id
```

## Configuration

```typescript
// services/auth/auth0.ts
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN!,
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!,
});

export { auth0 };
```

## Usage

```typescript
// Login
import { auth0 } from '@/services/auth/auth0';

const login = async () => {
  try {
    const credentials = await auth0.webAuth.authorize({
      scope: 'openid profile email',
    });

    // Store credentials
    // Sync with Supabase
  } catch (error) {
    console.error(error);
  }
};

// Logout
const logout = async () => {
  await auth0.webAuth.clearSession();
};
```

## Supabase Sync

```typescript
// Sync Auth0 user with Supabase
const syncUser = async (auth0User: any) => {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
    });
};
```

## Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [React Native SDK](https://github.com/auth0/react-native-auth0)
