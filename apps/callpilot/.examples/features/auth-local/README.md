# Local Auth Feature (No Database)

Simple authentication using AsyncStorage only - no backend required.

## Overview

Perfect for:
- Prototypes and demos
- Offline-first apps
- Apps without user accounts
- Learning authentication patterns

**Not suitable for:**
- Production apps with real user accounts
- Apps requiring password security
- Multi-device sync

## Usage

### 1. Copy to Your Project

```bash
cp .examples/features/auth-local/AuthContext.tsx src/contexts/
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
      <Text>Welcome, {user.name}!</Text>
      <Button title="Logout" onPress={signOut} />
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
  loading: boolean
  signIn: (email, password) => Promise<void>
  signUp: (email, password, name?) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}
```

### User Type

```typescript
interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}
```

## Examples

### Login Screen

```tsx
function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin() {
    try {
      setError('')
      await signIn(email, password)
      // Navigate to home
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <View>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text color="error">{error}</Text>}
      <Button title="Login" onPress={handleLogin} />
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

  return (
    <View>
      <Text variant="h2">{user.name}</Text>
      <Text>{user.email}</Text>
      <Text>Member since: {new Date(user.createdAt).toLocaleDateString()}</Text>
      <Button title="Logout" onPress={signOut} />
    </View>
  )
}
```

## Security Notes

⚠️ **This is NOT secure for production:**
- Passwords are not validated
- No encryption
- No session management
- No password hashing
- Anyone with device access can read stored data

For production apps, use:
- [Supabase Auth](./../auth-supabase/) (recommended)
- Firebase Auth
- AWS Cognito
- Custom backend with proper security

## Upgrading to Real Auth

When ready for production:

1. **Install Supabase:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Replace AuthContext:**
   ```bash
   cp .examples/features/auth-supabase/AuthContext.tsx src/contexts/
   ```

3. **Update environment:**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

4. **No UI changes needed** - Same API!

## Testing

```tsx
import { renderHook, act } from '@testing-library/react-hooks'
import { AuthProvider, useAuth } from './AuthContext'

test('signs in user', async () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
  const { result } = renderHook(() => useAuth(), { wrapper })

  await act(async () => {
    await result.current.signIn('test@example.com', 'password123')
  })

  expect(result.current.isAuthenticated).toBe(true)
  expect(result.current.user?.email).toBe('test@example.com')
})
```

## Related

- **Supabase Auth:** [.examples/features/auth-supabase/](../auth-supabase/)
- **Auth Screens:** [.examples/screens/auth/](../../screens/auth/)
- **Navigation:** [.examples/navigation/](../../navigation/)
