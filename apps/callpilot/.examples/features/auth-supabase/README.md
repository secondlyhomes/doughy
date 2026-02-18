# Supabase Auth Feature

Production-ready authentication using Supabase Auth with full OAuth support, email verification, and password reset flows.

## Overview

**Perfect for:**
- Production apps with real user accounts
- Apps requiring OAuth (Google, Apple, GitHub)
- Apps needing email verification
- Multi-device sync
- Apps with password reset flows

**Features:**
- Email/password authentication
- OAuth providers (Google, Apple, GitHub, etc.)
- Email verification
- Password reset flow
- Secure token storage (expo-secure-store)
- Auto token refresh
- Session management
- Type-safe with TypeScript

## Prerequisites

### 1. Supabase Project

Create a project at [supabase.com](https://supabase.com)

### 2. Environment Variables

Add to your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js expo-secure-store react-native-url-polyfill
```

## Quick Start

### 1. Copy Files to Your Project

```bash
# Copy Supabase client
cp .examples/database/supabase-client.ts src/services/

# Copy auth context
cp .examples/features/auth-supabase/AuthContext.tsx src/contexts/
cp .examples/features/auth-supabase/types.ts src/contexts/
```

### 2. Wrap Your App

```tsx
// app/_layout.tsx
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack />
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### 3. Use in Components

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyScreen() {
  const { user, signIn, signOut, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <View>
      <Text>Welcome, {user.email}!</Text>
      <Button title="Logout" onPress={() => signOut()} />
    </View>
  )
}
```

## API Reference

### `AuthProvider`

Provides authentication state to your app.

```tsx
<AuthProvider>
  {children}
</AuthProvider>
```

### `useAuth()`

Hook to access authentication.

**Returns:**
```typescript
{
  user: User | null
  session: AuthSession | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (credentials) => Promise<{ user, error }>
  signIn: (credentials) => Promise<{ user, error }>
  signInWithOAuth: (provider) => Promise<{ error }>
  signOut: () => Promise<{ error }>
  resetPassword: (credentials) => Promise<{ error }>
  updatePassword: (credentials) => Promise<{ error }>
  refreshSession: () => Promise<{ session, error }>
  resendVerificationEmail: () => Promise<{ error }>
}
```

### Types

```typescript
// Sign up
interface SignUpCredentials {
  email: string
  password: string
  metadata?: {
    name?: string
    [key: string]: any
  }
}

// Sign in
interface SignInCredentials {
  email: string
  password: string
}

// Password reset
interface PasswordResetCredentials {
  email: string
}

// Update password
interface UpdatePasswordCredentials {
  newPassword: string
}

// OAuth providers
type OAuthProvider =
  | 'google'
  | 'apple'
  | 'github'
  | 'facebook'
  | 'twitter'
  | 'discord'
```

## Usage Examples

### Sign Up Screen

```tsx
function SignUpScreen() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignUp() {
    try {
      setError('')
      const { error } = await signUp({
        email,
        password,
        metadata: { name },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Show "Check your email for verification link"
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <View>
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text color="error">{error}</Text>}
      {success && (
        <Text color="success">
          Check your email for verification link!
        </Text>
      )}
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  )
}
```

### Login Screen

```tsx
function LoginScreen() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    try {
      setLoading(true)
      setError('')
      const { error } = await signIn({ email, password })

      if (error) {
        setError(error.message)
      } else {
        router.replace('/home')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text color="error">{error}</Text>}
      <Button
        title="Login"
        onPress={handleLogin}
        loading={loading}
      />
      <TextButton
        title="Forgot password?"
        onPress={() => router.push('/reset-password')}
      />
    </View>
  )
}
```

### OAuth Login

```tsx
function SocialLoginButtons() {
  const { signInWithOAuth } = useAuth()
  const [error, setError] = useState('')

  async function handleOAuthLogin(provider: OAuthProvider) {
    try {
      setError('')
      const { error } = await signInWithOAuth(provider)

      if (error) {
        setError(error.message)
      }
      // User will be redirected to OAuth provider
    } catch (err) {
      setError('OAuth login failed')
    }
  }

  return (
    <View>
      {error && <Text color="error">{error}</Text>}
      <Button
        title="Continue with Google"
        onPress={() => handleOAuthLogin('google')}
      />
      <Button
        title="Continue with Apple"
        onPress={() => handleOAuthLogin('apple')}
      />
      <Button
        title="Continue with GitHub"
        onPress={() => handleOAuthLogin('github')}
      />
    </View>
  )
}
```

### Password Reset Flow

**Step 1: Request Reset**

```tsx
function ForgotPasswordScreen() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleResetRequest() {
    try {
      setError('')
      const { error } = await resetPassword({ email })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Failed to send reset email')
    }
  }

  return (
    <View>
      <Text variant="h2">Reset Password</Text>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {error && <Text color="error">{error}</Text>}
      {success && (
        <Text color="success">
          Check your email for reset link!
        </Text>
      )}
      <Button title="Send Reset Link" onPress={handleResetRequest} />
    </View>
  )
}
```

**Step 2: Update Password**

```tsx
function UpdatePasswordScreen() {
  const { updatePassword } = useAuth()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  async function handleUpdatePassword() {
    try {
      setError('')

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }

      const { error } = await updatePassword({ newPassword })

      if (error) {
        setError(error.message)
      } else {
        router.replace('/home')
      }
    } catch (err) {
      setError('Failed to update password')
    }
  }

  return (
    <View>
      <Text variant="h2">Set New Password</Text>
      <Input
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {error && <Text color="error">{error}</Text>}
      <Button title="Update Password" onPress={handleUpdatePassword} />
    </View>
  )
}
```

### Protected Route

```tsx
function ProtectedScreen() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  return <YourContent />
}
```

### Profile Screen

```tsx
function ProfileScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    const { error } = await signOut()
    if (!error) {
      router.replace('/login')
    }
  }

  return (
    <View>
      <Text variant="h2">Profile</Text>
      <Text>Email: {user?.email}</Text>
      <Text>
        Email verified: {user?.email_confirmed_at ? 'Yes' : 'No'}
      </Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  )
}
```

### Email Verification

```tsx
function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth()
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function handleResend() {
    try {
      setSending(true)
      setMessage('')
      const { error } = await resendVerificationEmail()

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Verification email sent!')
      }
    } catch (err) {
      setMessage('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (user?.email_confirmed_at) {
    return null
  }

  return (
    <View style={{ backgroundColor: 'yellow', padding: 16 }}>
      <Text>Please verify your email address</Text>
      {message && <Text>{message}</Text>}
      <Button
        title="Resend Verification Email"
        onPress={handleResend}
        loading={sending}
      />
    </View>
  )
}
```

## OAuth Setup

### 1. Enable OAuth in Supabase Dashboard

1. Go to **Authentication > Providers**
2. Enable desired providers (Google, Apple, GitHub, etc.)
3. Configure each provider with client ID and secret

### 2. Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

**Site URL:**
```
your-app-scheme://
```

**Redirect URLs:**
```
your-app-scheme://auth-callback
your-app-scheme://reset-password
```

### 3. Configure Deep Linking

**For Expo:**

```json
// app.json
{
  "expo": {
    "scheme": "your-app-scheme",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "your-app-scheme"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.app",
      "associatedDomains": ["applinks:your-project.supabase.co"]
    }
  }
}
```

### 4. Handle OAuth Callback

```tsx
// app/auth-callback.tsx
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Session is automatically handled by AuthProvider
    // Just redirect to home
    router.replace('/home')
  }, [])

  return <LoadingState />
}
```

### Google OAuth Setup

1. **Create OAuth credentials** at [Google Cloud Console](https://console.cloud.google.com)
2. **Add to Supabase:**
   - Go to Authentication > Providers > Google
   - Enter Client ID and Secret
3. **Add redirect URL:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### Apple OAuth Setup

1. **Register App ID** at [Apple Developer](https://developer.apple.com)
2. **Enable Sign in with Apple** capability
3. **Add to Supabase:**
   - Go to Authentication > Providers > Apple
   - Enter Service ID and Key ID
4. **Configure redirect:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### GitHub OAuth Setup

1. **Create OAuth app** at [GitHub Settings](https://github.com/settings/developers)
2. **Add to Supabase:**
   - Go to Authentication > Providers > GitHub
   - Enter Client ID and Secret
3. **Set callback URL:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

## Email Configuration

### 1. Email Templates

Go to **Authentication > Email Templates** in Supabase Dashboard.

**Customize templates:**
- Confirm signup
- Magic link
- Reset password
- Change email address

### 2. SMTP Settings (Production)

For production, configure custom SMTP:

1. Go to **Settings > Auth > SMTP Settings**
2. Add your SMTP provider (SendGrid, AWS SES, etc.)
3. Configure sender email and credentials

### 3. Email Verification Flow

**Require email verification:**

```sql
-- In Supabase SQL Editor
ALTER TABLE auth.users
SET CONSTRAINT users_email_check
CHECK (email_confirmed_at IS NOT NULL);
```

**Check verification in app:**

```tsx
const { user } = useAuth()

if (!user?.email_confirmed_at) {
  return <PleaseVerifyEmail />
}
```

## Migration from auth-local

If migrating from local auth:

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js expo-secure-store react-native-url-polyfill
```

### 2. Replace AuthContext

```bash
# Backup old context
mv src/contexts/AuthContext.tsx src/contexts/AuthContext.local.tsx

# Copy new context
cp .examples/features/auth-supabase/AuthContext.tsx src/contexts/
cp .examples/features/auth-supabase/types.ts src/contexts/
```

### 3. Update Environment

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### 4. No UI Changes Needed

The API is designed to be compatible:

```tsx
// This works with both auth-local and auth-supabase
const { user, signIn, signOut } = useAuth()
```

**Small adjustments needed:**

```tsx
// Before (auth-local)
await signIn(email, password)

// After (auth-supabase)
await signIn({ email, password })
```

### 5. Migrate User Data

If you stored users in AsyncStorage, you'll need to:

1. Create accounts in Supabase for existing users
2. Send password reset emails for them to set passwords
3. Migrate their data to Supabase database with RLS

## Security Best Practices

### 1. Token Storage

- Tokens automatically stored in **expo-secure-store** (Keychain/Keystore)
- Never stored in AsyncStorage
- Automatically encrypted by device

### 2. Password Requirements

Enforce strong passwords in Supabase Dashboard:

1. Go to **Authentication > Policies**
2. Set minimum password length (8+ characters)
3. Optionally require special characters

### 3. Rate Limiting

Supabase automatically rate limits:
- Sign up: 30 per hour per IP
- Sign in: 30 per hour per IP
- Password reset: 5 per hour per email

### 4. Email Verification

**Require email verification** for sensitive apps:

```tsx
const { user } = useAuth()

if (!user?.email_confirmed_at) {
  return <MustVerifyEmailScreen />
}
```

### 5. Session Timeout

Configure session lifetime in Supabase Dashboard:

1. Go to **Authentication > Settings**
2. Set JWT expiry (default: 1 hour)
3. Set refresh token lifetime (default: 30 days)

### 6. RLS Policies

Always use Row Level Security for user data:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### 7. Never Use Service Role Key in Client

```tsx
// ❌ NEVER DO THIS
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ Always use anon key in client
const supabase = createClient(url, ANON_KEY)
```

Service role key bypasses RLS - only use on server (Edge Functions).

## Troubleshooting

### "Email not confirmed"

**Cause:** User hasn't clicked verification link

**Fix:**
```tsx
const { resendVerificationEmail } = useAuth()
await resendVerificationEmail()
```

### "Invalid login credentials"

**Cause:** Wrong email/password or user doesn't exist

**Fix:**
- Verify email and password are correct
- Check if user account exists in Supabase Dashboard
- Ensure user has verified email (if required)

### "OAuth redirect failed"

**Cause:** Incorrect redirect URL configuration

**Fix:**
1. Check redirect URL in Supabase Dashboard matches `app.json` scheme
2. Verify deep linking is configured correctly
3. Test deep link with: `npx uri-scheme open your-app-scheme://test --ios`

### "Session expired"

**Cause:** JWT token expired and refresh failed

**Fix:**
```tsx
const { refreshSession } = useAuth()
const { error } = await refreshSession()

if (error) {
  // Sign in again
  router.replace('/login')
}
```

### "No user returned from signUp"

**Cause:** Email confirmation required before user is created

**Fix:** This is expected behavior. User must verify email first.

```tsx
const { error } = await signUp({ email, password })
if (!error) {
  // Show "Check your email" message
  // Don't expect user object immediately
}
```

### Testing Email Verification Locally

1. Check Supabase Dashboard logs for verification link
2. Or disable email verification during development:
   - Go to Authentication > Settings
   - Toggle off "Enable email confirmations"

## Testing

### Unit Tests

```tsx
import { renderHook, act } from '@testing-library/react-hooks'
import { AuthProvider, useAuth } from './AuthContext'

test('signs in user', async () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
  const { result } = renderHook(() => useAuth(), { wrapper })

  await act(async () => {
    const { error } = await result.current.signIn({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(error).toBeNull()
  })

  expect(result.current.isAuthenticated).toBe(true)
  expect(result.current.user?.email).toBe('test@example.com')
})
```

### Integration Tests

```tsx
import { supabase } from '@/services/supabase'

beforeEach(async () => {
  // Create test user
  await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'password123',
  })
})

afterEach(async () => {
  // Clean up
  await supabase.auth.signOut()
})

test('user can sign in and access protected data', async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123',
  })
  expect(error).toBeNull()

  // Test RLS works
  const { data, error: queryError } = await supabase
    .from('tasks')
    .select('*')

  expect(queryError).toBeNull()
  expect(data).toBeDefined()
})
```

## Related

- **Supabase Client:** [.examples/database/supabase-client.ts](../../database/supabase-client.ts)
- **Database Setup:** [.examples/database/README.md](../../database/README.md)
- **RLS Examples:** [.examples/database/rls-examples.sql](../../database/rls-examples.sql)
- **Security Checklist:** [docs/09-security/SECURITY-CHECKLIST.md](../../../docs/09-security/SECURITY-CHECKLIST.md)
- **Official Docs:** [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
