# Auth Screens

Complete login and signup screens ready to use with any authentication system.

## Overview

These screens work with:
- **Local Auth:** [.examples/features/auth-local/](../../features/auth-local/)
- **Supabase Auth:** [.examples/features/auth-supabase/](../../features/auth-supabase/) (coming soon)
- **Any auth context** that provides `useAuth()` hook with `signIn()` and `signUp()` methods

## Components

### LoginScreen

Full-featured login screen with:
- Email validation
- Password field with secure entry
- Form validation
- Loading states
- Error handling
- "Forgot password" link
- Link to signup

### SignupScreen

Full-featured signup screen with:
- Name, email, and password fields
- Password strength indicator (weak/medium/strong)
- Password confirmation with matching validation
- Form validation
- Loading states
- Error handling
- Terms of service links
- Link to login

## Usage

### 1. Copy to Your Project

```bash
# Copy screens
cp .examples/screens/auth/LoginScreen.tsx app/(auth)/login.tsx
cp .examples/screens/auth/SignupScreen.tsx app/(auth)/signup.tsx
```

### 2. Set Up Auth Context

Choose your auth backend:

**Option A: Local Auth (No Database)**
```bash
cp .examples/features/auth-local/AuthContext.tsx src/contexts/
```

**Option B: Supabase Auth**
```bash
cp .examples/features/auth-supabase/AuthContext.tsx src/contexts/
```

### 3. Wrap Your App

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

### 4. Use in Your App

```tsx
// app/(auth)/login.tsx
import { LoginScreen } from '@/screens/auth/LoginScreen'

export default function Login() {
  return <LoginScreen />
}
```

```tsx
// app/(auth)/signup.tsx
import { SignupScreen } from '@/screens/auth/SignupScreen'

export default function Signup() {
  return <SignupScreen />
}
```

### 5. Uncomment Auth Hook

In both `LoginScreen.tsx` and `SignupScreen.tsx`, uncomment the auth hook:

```tsx
// Before:
// import { useAuth } from '@/contexts/AuthContext'
// const { signIn } = useAuthHook?.() ?? useAuth()

// After:
import { useAuth } from '@/contexts/AuthContext'
const { signIn } = useAuthHook?.() ?? useAuth()
```

## Navigation Setup

### Using Expo Router

```
app/
├── _layout.tsx          # Root layout with providers
├── (tabs)/              # Authenticated screens
│   ├── _layout.tsx
│   ├── index.tsx        # Home
│   └── profile.tsx      # Profile
└── (auth)/              # Auth screens
    ├── login.tsx
    └── signup.tsx
```

### Auth Guard in Root Layout

```tsx
// app/_layout.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Redirect } from 'expo-router'

export default function RootLayout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

## Customization

### Change Colors

Both screens use theme tokens - customize in your theme:

```tsx
// src/theme/tokens.ts
export const colors = {
  primary: {
    // Change primary color for buttons and links
    500: '#your-color',
  },
  // ...
}
```

### Add OAuth Providers

Add social login buttons:

```tsx
// In LoginScreen.tsx, after password input:
<View style={styles.divider}>
  <View style={styles.line} />
  <Text variant="caption" color={theme.colors.text.secondary}>
    OR
  </Text>
  <View style={styles.line} />
</View>

<Button
  title="Continue with Google"
  variant="secondary"
  onPress={handleGoogleLogin}
  // Add Google icon
/>

<Button
  title="Continue with Apple"
  variant="secondary"
  onPress={handleAppleLogin}
  // Add Apple icon
/>
```

### Add Biometric Auth

```tsx
import * as LocalAuthentication from 'expo-local-authentication'

async function handleBiometricLogin() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()

  if (!hasHardware || !isEnrolled) {
    setError('Biometric authentication not available')
    return
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Login with biometrics',
  })

  if (result.success) {
    // Login with saved credentials
  }
}
```

### Email Verification

Add email verification step:

```tsx
// After signup success:
async function handleSignup() {
  await signUp(formData.email, formData.password, formData.name)

  // Navigate to verification screen
  router.push({
    pathname: '/verify-email',
    params: { email: formData.email }
  })
}
```

## Validation Rules

### Email Validation

```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

### Password Strength

```typescript
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak'

  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  const strength = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (strength <= 2) return 'weak'
  if (strength === 3) return 'medium'
  return 'strong'
}
```

## Accessibility

Both screens include:
- Proper keyboard types (`email-address`, `password`)
- Auto-capitalization settings
- Auto-complete hints
- Text content types for autofill
- Keyboard avoiding behavior
- Touch-friendly button sizes (44px minimum)

## Error Handling

### Common Error Messages

```tsx
const errorMessages = {
  'auth/invalid-email': 'Invalid email address',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'Email already registered',
  'auth/weak-password': 'Password must be at least 8 characters',
  'auth/network-request-failed': 'Network error. Please try again',
}

function getErrorMessage(error: any): string {
  return errorMessages[error.code] ?? error.message ?? 'An error occurred'
}
```

## Testing

### Unit Tests

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from './LoginScreen'

test('validates email format', async () => {
  const { getByPlaceholderText, getByText } = render(<LoginScreen />)

  const emailInput = getByPlaceholderText('Enter your email')
  fireEvent.changeText(emailInput, 'invalid-email')
  fireEvent.blur(emailInput)

  await waitFor(() => {
    expect(getByText('Invalid email format')).toBeTruthy()
  })
})

test('requires password', async () => {
  const { getByPlaceholderText, getByText } = render(<LoginScreen />)

  const passwordInput = getByPlaceholderText('Enter your password')
  fireEvent.blur(passwordInput)

  await waitFor(() => {
    expect(getByText('Password is required')).toBeTruthy()
  })
})
```

### E2E Tests

```tsx
// e2e/auth.test.ts
describe('Authentication', () => {
  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com')
    await element(by.id('password-input')).typeText('password123')
    await element(by.id('login-button')).tap()

    await expect(element(by.id('home-screen'))).toBeVisible()
  })

  it('should signup successfully', async () => {
    await element(by.id('signup-link')).tap()
    await element(by.id('name-input')).typeText('Test User')
    await element(by.id('email-input')).typeText('new@example.com')
    await element(by.id('password-input')).typeText('password123')
    await element(by.id('confirm-password-input')).typeText('password123')
    await element(by.id('signup-button')).tap()

    await expect(element(by.id('home-screen'))).toBeVisible()
  })
})
```

## Security Best Practices

✅ **DO:**
- Use secure text entry for passwords
- Validate input on both client and server
- Show clear error messages (but don't reveal if email exists)
- Implement rate limiting on server
- Use HTTPS for all auth requests
- Store tokens securely (expo-secure-store)
- Implement session timeout
- Add CAPTCHA for production

❌ **DON'T:**
- Don't store passwords in plain text
- Don't show different errors for "user not found" vs "wrong password" (security risk)
- Don't allow weak passwords
- Don't log sensitive data
- Don't use AsyncStorage for tokens (use expo-secure-store)

## Related

- **Auth Context (Local):** [.examples/features/auth-local/](../../features/auth-local/)
- **Auth Context (Supabase):** [.examples/features/auth-supabase/](../../features/auth-supabase/) (coming soon)
- **Components:** [.examples/components/advanced/](../../components/advanced/)
- **Navigation:** [.examples/navigation/](../../navigation/) (coming soon)
- **Patterns:** [docs/patterns/NEW-SCREEN.md](../../../docs/patterns/NEW-SCREEN.md)
