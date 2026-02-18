/**
 * Signup Screen (Reference Example)
 *
 * Complete signup screen with email/password/name authentication
 * Works with any auth context that provides useAuth() hook
 * This is a reference implementation - copy to app/(auth)/ and customize
 */

import React from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components'
import { useTheme } from '@/theme'
import { SignupForm } from './components'
import { useSignupForm } from './hooks/useSignupForm'
import { styles } from './styles'
import type { SignupScreenProps } from './types'

/**
 * Signup Screen Component
 *
 * @example
 * ```tsx
 * // In app/(auth)/signup.tsx
 * import { SignupScreen } from '@/screens/auth/SignupScreen'
 *
 * export default function Signup() {
 *   return <SignupScreen />
 * }
 * ```
 */
export function SignupScreen(_props: SignupScreenProps = {}) {
  const { theme } = useTheme()
  const router = useRouter()
  const {
    formData,
    errors,
    loading,
    error,
    isFormValid,
    passwordStrength,
    updateField,
    touchField,
    handleSignup,
  } = useSignupForm()

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
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" align="center" style={styles.title}>
              Create Account
            </Text>
            <Text
              variant="body"
              align="center"
              color={theme.colors.text.secondary}
              style={styles.subtitle}
            >
              Sign up to get started
            </Text>
          </View>

          {/* Form */}
          <SignupForm
            formData={formData}
            errors={errors}
            loading={loading}
            error={error}
            isFormValid={isFormValid}
            passwordStrength={passwordStrength}
            onFieldChange={updateField}
            onFieldBlur={touchField}
            onSubmit={handleSignup}
          />

          {/* Login Link */}
          <View style={styles.footer}>
            <Text variant="body" color={theme.colors.text.secondary}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text variant="body" weight="semibold" color={theme.colors.primary[500]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
