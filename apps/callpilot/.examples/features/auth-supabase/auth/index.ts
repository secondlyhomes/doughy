/**
 * Supabase Auth Module
 *
 * Complete authentication solution with Supabase Auth.
 * Supports email/password, OAuth, email verification, password reset.
 *
 * @example
 * ```tsx
 * // 1. Wrap your app with AuthProvider
 * import { AuthProvider } from '@/features/auth-supabase/auth'
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Navigation />
 *     </AuthProvider>
 *   )
 * }
 *
 * // 2. Use auth in components
 * import { useAuth } from '@/features/auth-supabase/auth'
 *
 * function ProfileScreen() {
 *   const { user, signOut, isAuthenticated } = useAuth()
 *
 *   if (!isAuthenticated) {
 *     return <LoginScreen />
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Welcome, {user?.email}</Text>
 *       <Button title="Sign Out" onPress={signOut} />
 *     </View>
 *   )
 * }
 * ```
 */

// Provider
export { AuthProvider } from './AuthProvider'

// Consumer hook
export { useAuth } from './useAuth'

// Types
export type {
  User,
  AuthSession,
  AuthContextValue,
  AuthSessionState,
  AuthActions,
  SignUpCredentials,
  SignInCredentials,
  PasswordResetCredentials,
  UpdatePasswordCredentials,
  OAuthProvider,
  AuthEvent,
  AuthStateChangeCallback,
} from './types'

// Internal hooks (for advanced use cases)
export { useAuthSession } from './hooks/useAuthSession'
export { useAuthActions } from './hooks/useAuthActions'
