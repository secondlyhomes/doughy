# ZONE B: Auth & Admin Features

**Instance 2 Assignment**

## Your Responsibility
You are converting authentication, admin, billing, and user management features.

**Total Files: ~188 files**

---

## COMPLETION STATUS

### Phase 1: Authentication (Critical Path) - COMPLETED

| Item | Status | File Created |
|------|--------|--------------|
| Login Screen | DONE | `src/features/auth/screens/LoginScreen.tsx` |
| Signup Screen | DONE | `src/features/auth/screens/SignupScreen.tsx` |
| Password Reset | DONE | `src/features/auth/screens/ForgotPasswordScreen.tsx` |
| Auth Context/Store | DONE | `src/features/auth/context/AuthProvider.tsx` |
| Auth Hook | DONE | `src/features/auth/hooks/useAuth.ts` |
| Auth Types | DONE | `src/features/auth/types/index.ts` |

### Phase 2: User Settings - COMPLETED

| Item | Status | File Created |
|------|--------|--------------|
| Settings Screen | DONE | `src/features/settings/screens/SettingsScreen.tsx` |
| Profile Management | DONE | `src/features/settings/screens/ProfileScreen.tsx` |
| Notification Settings | DONE | `src/features/notifications/screens/NotificationSettingsScreen.tsx` |

### Phase 3: Admin & Billing - COMPLETED

| Item | Status | File Created |
|------|--------|--------------|
| Admin Dashboard | DONE | `src/features/admin/screens/AdminDashboardScreen.tsx` |
| Billing/Subscription | DONE | `src/features/billing/screens/SubscriptionScreen.tsx` |
| Team Management | DONE | `src/features/teams/screens/TeamSettingsScreen.tsx` |

### All Files Created by Zone B

```
src/features/auth/
├── context/
│   ├── AuthProvider.tsx
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   └── index.ts
├── screens/
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts

src/features/settings/
├── screens/
│   ├── SettingsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── index.ts
└── index.ts

src/features/notifications/
├── screens/
│   ├── NotificationSettingsScreen.tsx
│   └── index.ts
└── index.ts

src/features/admin/
├── screens/
│   ├── AdminDashboardScreen.tsx
│   └── index.ts
└── index.ts

src/features/billing/
├── screens/
│   ├── SubscriptionScreen.tsx
│   └── index.ts
└── index.ts

src/features/teams/
├── screens/
│   ├── TeamSettingsScreen.tsx
│   └── index.ts
└── index.ts
```

### Key Features Implemented

- **Auth Flow**: Full login, signup, password reset with Supabase integration
- **Session Management**: AuthProvider with automatic session refresh
- **Profile Editing**: Edit name, view account details
- **Notification Settings**: Push/email notification toggles
- **Admin Dashboard**: System stats, status monitoring, quick actions (role-gated)
- **Subscription Management**: View plans, credits usage, upgrade options
- **Team Management**: View members, invite users, manage roles

### Remaining TODOs for Integration

- [ ] Connect screens to main navigation stack (depends on Zone A)
- [ ] Replace mock data with actual Supabase API calls
- [ ] Implement push notification registration
- [ ] Add Stripe integration for payments
- [ ] Add avatar upload functionality

---

## Your Directories (from doughy-ai-web-backup)

| Directory | Files | Priority |
|-----------|-------|----------|
| `src/features/auth/` | 86 | HIGH - Core auth flow |
| `src/features/admin/` | 58 | MEDIUM |
| `src/features/billing/` | 20 | MEDIUM |
| `src/features/teams/` | 8 | LOW |
| `src/features/settings/` | 7 | MEDIUM |
| `src/features/pricing/` | 8 | LOW |
| `src/features/notifications/` | 1 | LOW |

## Priority Order

### Phase 1: Authentication (Critical Path)
1. **Login Screen** - Email/password login
2. **Signup Screen** - Registration flow
3. **Password Reset** - Forgot password flow
4. **Auth Context/Store** - Session management
5. **Protected Routes** - Auth guards for navigation

### Phase 2: User Settings
6. **Settings Screen** - User preferences
7. **Profile Management** - Edit profile
8. **Notification Settings** - Push notification preferences

### Phase 3: Admin & Billing
9. **Admin Dashboard** - Admin-only screens
10. **Billing/Subscription** - Payment screens
11. **Team Management** - Team settings

## Key Conversions for Your Zone

### Auth Session Storage
```tsx
// WEB: Uses localStorage
// EXPO: Use expo-secure-store for tokens

import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('auth_token', token);

// Retrieve token
const token = await SecureStore.getItemAsync('auth_token');

// Delete token
await SecureStore.deleteItemAsync('auth_token');
```

### Login Form Example
```tsx
// src/features/auth/screens/LoginScreen.tsx
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const navigation = useNavigation();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Handle error
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-foreground mb-8">
          Welcome Back
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="text-sm text-muted-foreground mb-2">Email</Text>
              <TextInput
                className="border border-input rounded-md px-4 py-3 bg-background text-foreground"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text className="text-destructive text-sm mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6">
              <Text className="text-sm text-muted-foreground mb-2">Password</Text>
              <TextInput
                className="border border-input rounded-md px-4 py-3 bg-background text-foreground"
                placeholder="Enter password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
              {errors.password && (
                <Text className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity
          className="bg-primary rounded-md py-4 items-center"
          onPress={handleSubmit(onSubmit)}
        >
          <Text className="text-primary-foreground font-semibold">Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 items-center"
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text className="text-muted-foreground">Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Auth Hook
```tsx
// src/features/auth/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, loading, signOut };
}
```

## Settings Screen Pattern
```tsx
// src/features/settings/screens/SettingsScreen.tsx
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Section Header */}
        <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
          ACCOUNT
        </Text>

        {/* Settings Items */}
        <View className="bg-card rounded-lg">
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-foreground">Profile</Text>
            <ChevronRight size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="flex-row items-center justify-between p-4">
            <Text className="text-foreground">Push Notifications</Text>
            <Switch />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
```

## Dependencies on Zone A

You will need these from Zone A:
- `Button` component
- `Input` component
- `Card` component
- `supabase` client
- Navigation types

If Zone A hasn't converted these yet, create placeholders:
```tsx
// Temporary placeholder until Zone A delivers
import { TouchableOpacity, Text } from 'react-native';
export const Button = ({ children, onPress }) => (
  <TouchableOpacity onPress={onPress} className="bg-primary p-4 rounded">
    <Text className="text-white text-center">{children}</Text>
  </TouchableOpacity>
);
```

## Files to Create First

1. `src/features/auth/screens/LoginScreen.tsx`
2. `src/features/auth/screens/SignupScreen.tsx`
3. `src/features/auth/hooks/useAuth.ts`
4. `src/features/auth/context/AuthProvider.tsx`
5. `src/features/settings/screens/SettingsScreen.tsx`
