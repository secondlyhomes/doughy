/**
 * Login Screen (Reference Example)
 *
 * Complete login screen with email/password authentication
 * Works with any auth context that provides useAuth() hook
 * This is a reference implementation - copy to app/(auth)/ and customize
 */

import React from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useLoginForm } from './hooks/useLoginForm'
import { LoginHeader, LoginForm, LoginFooter } from './components'
import { styles } from './styles'
import type { LoginScreenProps } from './types'

/**
 * Login Screen Component
 *
 * @example
 * ```tsx
 * // In app/(auth)/login.tsx
 * import { LoginScreen } from '@/screens/auth/login'
 *
 * export default function Login() {
 *   return <LoginScreen />
 * }
 * ```
 */
export function LoginScreen({ useAuthHook }: LoginScreenProps = {}) {
  const router = useRouter()

  // Get auth hook if provided
  const authHook = useAuthHook?.()

  // Form state and handlers
  const {
    formData,
    setFormData,
    touched,
    setTouched,
    loading,
    error,
    emailError,
    passwordError,
    isFormValid,
    handleLogin,
  } = useLoginForm({ authHook })

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <LoginHeader />

          <LoginForm
            formData={formData}
            setFormData={setFormData}
            touched={touched}
            setTouched={setTouched}
            emailError={emailError}
            passwordError={passwordError}
            error={error}
            loading={loading}
            isFormValid={isFormValid}
            onSubmit={handleLogin}
          />

          <LoginFooter onSignUpPress={() => router.push('/signup')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
