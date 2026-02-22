# Tutorial 3: Adding Authentication

Learn how to implement complete user authentication using Supabase Auth, including email/password signup, social OAuth providers, session management, and protected routes.

## Table of Contents

1. [What You'll Build](#what-youll-build)
2. [Authentication Concepts](#authentication-concepts)
3. [Supabase Auth Setup](#supabase-auth-setup)
4. [Auth Service Layer](#auth-service-layer)
5. [Auth Context](#auth-context)
6. [Login Screen](#login-screen)
7. [Signup Screen](#signup-screen)
8. [Protected Routes](#protected-routes)
9. [Session Management](#session-management)
10. [Social OAuth](#social-oauth)
11. [Testing](#testing)
12. [Next Steps](#next-steps)

---

## What You'll Build

A complete authentication system with:

- **Email/Password Signup** - Create new accounts
- **Email/Password Login** - Sign in existing users
- **Social Login** - Google, Apple, GitHub OAuth
- **Email Verification** - Confirm user emails
- **Password Reset** - Forgot password flow
- **Session Management** - Automatic token refresh
- **Protected Routes** - Require authentication
- **Profile Management** - Update user data

**User Flow:**
```
New User:
Landing → Signup → Verify Email → Complete Profile → Dashboard

Existing User:
Landing → Login → Dashboard

Forgot Password:
Login → Reset Password → Email → New Password → Login
```

---

## Authentication Concepts

### How Supabase Auth Works

**JWT Tokens:**
- Access token (short-lived, ~1 hour)
- Refresh token (long-lived, ~7 days)
- Automatically refreshed by Supabase client

**Session Storage:**
- Tokens stored securely in device storage
- Retrieved automatically on app launch
- Persists across app restarts

**Row Level Security (RLS):**
- Uses `auth.uid()` to identify current user
- Enforces data isolation at database level
- Works seamlessly with Supabase Auth

### Security Best Practices

**DO:**
- ✅ Use Supabase Auth (don't roll your own)
- ✅ Enable email verification
- ✅ Implement password strength requirements
- ✅ Use OAuth for social login
- ✅ Store tokens securely (Supabase handles this)
- ✅ Refresh tokens automatically
- ✅ Validate on server with RLS

**DON'T:**
- ❌ Store passwords in plain text
- ❌ Use weak password requirements
- ❌ Expose service_role key to client
- ❌ Trust client-side validation alone
- ❌ Skip email verification
- ❌ Hardcode API keys

---

## Supabase Auth Setup

### Step 1: Configure Email Templates

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Customize templates:

**Confirm Signup:**
```html
<h2>Confirm your signup</h2>
<p>Welcome to {{ .SiteURL }}!</p>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Reset Password:**
```html
<h2>Reset your password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### Step 2: Configure URL Configuration

In Supabase Dashboard → **Authentication** → **URL Configuration**:

```
Site URL: exp://localhost:8081
Redirect URLs:
  - exp://localhost:8081/*/*
  - myapp:///*/*
  - https://yourapp.com/*/*
```

### Step 3: Enable Providers

In **Authentication** → **Providers**:

**Email (enabled by default):**
- Email confirmation: Enabled
- Secure email change: Enabled
- Double confirm email: Enabled

**Google OAuth:**
1. Enable Google provider
2. Add Client ID and Secret from Google Cloud Console
3. Add Authorized redirect URIs

**Apple OAuth:**
1. Enable Apple provider
2. Add Service ID and Key from Apple Developer
3. Configure Sign in with Apple

### Step 4: Create Profiles Table

Create migration for user profiles:

```bash
npx supabase migration new create_profiles_table
```

```sql
-- supabase/migrations/..._create_profiles_table.sql

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

Apply migration:
```bash
npx supabase db push
npx supabase gen types typescript --linked > src/types/supabase.ts
```

---

## Auth Service Layer

Create `src/services/authService.ts`:

```typescript
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface SignUpData {
  email: string
  password: string
  fullName: string
}

export interface SignInData {
  email: string
  password: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp({ email, password, fullName }: SignUpData): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error
    if (!data.user) throw new Error('Signup failed')

    return data.user
  },

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInData): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session) throw new Error('Login failed')

    return data.session
  },

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'google' | 'apple' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'myapp://auth/callback',
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://auth/reset-password',
    })

    if (error) throw error
  },

  /**
   * Update password (after reset)
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as Profile
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
```

---

## Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, type Profile } from '@/services/authService'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    authService.getSession().then(session => {
      setSession(session)
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const profileData = await authService.getProfile(userId)
      setProfile(profileData)
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    await authService.signUp({ email, password, fullName })
  }

  const signIn = async (email: string, password: string) => {
    await authService.signIn({ email, password })
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email)
  }

  const updatePassword = async (newPassword: string) => {
    await authService.updatePassword(newPassword)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')
    const updatedProfile = await authService.updateProfile(user.id, updates)
    setProfile(updatedProfile)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

Wrap your app:

```typescript
// App.tsx
import { AuthProvider } from '@/contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      {/* Rest of your app */}
    </AuthProvider>
  )
}
```

---

## Login Screen

Create `src/screens/auth/login-screen.tsx`:

```typescript
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigation } from '@react-navigation/native'

export function LoginScreen() {
  const { theme } = useTheme()
  const { signIn } = useAuth()
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      // Navigation handled by auth state change
    } catch (error: any) {
      Alert.alert('Login Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={{ flex: 1, padding: theme.spacing[6], justifyContent: 'center' }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[2],
          }}
        >
          Welcome Back
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[8],
          }}
        >
          Sign in to continue
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[3],
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[2],
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-end', marginBottom: theme.spacing[6] }}
        >
          <Text style={{ color: theme.colors.primary[500], fontSize: 14 }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary[500],
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            alignItems: 'center',
            marginBottom: theme.spacing[4],
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: theme.colors.white, fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing[4] }}>
          <Text style={{ color: theme.colors.text.secondary }}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
```

---

## Signup Screen

Create `src/screens/auth/signup-screen.tsx`:

```typescript
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigation } from '@react-navigation/native'

export function SignupScreen() {
  const { theme } = useTheme()
  const { signUp } = useAuth()
  const navigation = useNavigation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name')
      return false
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email')
      return false
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email')
      return false
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return false
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return false
    }

    return true
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      await signUp(email, password, fullName)
      Alert.alert(
        'Check Your Email',
        'We sent you a confirmation link. Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      )
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        Alert.alert('Error', 'This email is already registered')
      } else {
        Alert.alert('Signup Failed', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing[6], paddingTop: theme.spacing[12] }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[2],
          }}
        >
          Create Account
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[8],
          }}
        >
          Sign up to get started
        </Text>

        <TextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[3],
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[3],
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[3],
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[6],
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary[500],
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            alignItems: 'center',
            marginBottom: theme.spacing[4],
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: theme.colors.white, fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing[4] }}>
          <Text style={{ color: theme.colors.text.secondary }}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

---

## Protected Routes

Create route protection:

```typescript
// src/navigation/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext'
import { ActivityIndicator, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const navigation = useNavigation()

  useEffect(() => {
    if (!loading && !user) {
      navigation.navigate('Login')
    }
  }, [user, loading])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

Usage:

```typescript
// In your navigation
<Stack.Screen name="Tasks">
  {() => (
    <ProtectedRoute>
      <TasksScreen />
    </ProtectedRoute>
  )}
</Stack.Screen>
```

---

## Session Management

Automatic session refresh is handled by Supabase client, but you can add manual refresh:

```typescript
// src/hooks/useSession.ts
import { useEffect } from 'react'
import { authService } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'

export function useSessionRefresh() {
  const { session } = useAuth()

  useEffect(() => {
    if (!session) return

    // Refresh session 5 minutes before expiry
    const expiresAt = session.expires_at
    if (!expiresAt) return

    const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000)

    if (refreshTime > 0) {
      const timeout = setTimeout(async () => {
        try {
          await authService.getSession() // This auto-refreshes
        } catch (error) {
          console.error('Session refresh failed:', error)
        }
      }, refreshTime)

      return () => clearTimeout(timeout)
    }
  }, [session])
}
```

---

## Social OAuth

Add OAuth buttons to login screen:

```typescript
import { authService } from '@/services/authService'

function LoginScreen() {
  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithOAuth('google')
    } catch (error) {
      Alert.alert('Error', 'Google login failed')
    }
  }

  return (
    <View>
      {/* Email/password form */}

      <View style={{ marginTop: theme.spacing[6] }}>
        <TouchableOpacity
          onPress={handleGoogleLogin}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[3],
          }}
        >
          <Text style={{ marginLeft: theme.spacing[2] }}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
```

---

## Testing

Test auth service:

```typescript
// src/services/authService.test.ts
import { authService } from './authService'
import { supabase } from './supabase'

jest.mock('./supabase')

describe('authService', () => {
  describe('signUp', () => {
    it('signs up successfully', async () => {
      const mockUser = { id: '1', email: 'test@test.com' }

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const user = await authService.signUp({
        email: 'test@test.com',
        password: 'password123',
        fullName: 'Test User',
      })

      expect(user).toEqual(mockUser)
    })
  })
})
```

---

## Next Steps

You've implemented complete authentication! Continue to:

**[Tutorial 4: Database Integration →](./04-database-integration.md)**

Learn advanced database techniques including:
- Complex queries
- Relationships
- Transactions
- Real-time subscriptions
- Performance optimization

---

**Summary:**
- ✅ Email/password authentication
- ✅ Social OAuth integration
- ✅ Session management
- ✅ Protected routes
- ✅ Profile management
- ✅ Password reset
- ✅ Email verification
