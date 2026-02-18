/**
 * LoginForm Component
 *
 * Renders the login form with email/password inputs and submit button
 */

import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Input, Text } from '@/components'
import { useTheme } from '@/theme'
import { styles } from '../styles'
import type { LoginFormProps } from '../types'

/**
 * Login form with email and password fields
 */
export function LoginForm({
  formData,
  setFormData,
  touched,
  setTouched,
  emailError,
  passwordError,
  error,
  loading,
  isFormValid,
  onSubmit,
}: LoginFormProps) {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <View style={styles.form}>
      <Input
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChangeText={email => setFormData(prev => ({ ...prev, email }))}
        onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={emailError}
        state={emailError ? 'error' : formData.email ? 'success' : 'default'}
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={formData.password}
        onChangeText={password => setFormData(prev => ({ ...prev, password }))}
        onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        error={passwordError}
        state={passwordError ? 'error' : formData.password ? 'success' : 'default'}
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text variant="body" color={theme.colors.error[500]}>
            {error}
          </Text>
        </View>
      )}

      {/* Login Button */}
      <Button
        title="Sign In"
        variant="primary"
        size="lg"
        onPress={onSubmit}
        loading={loading}
        disabled={!isFormValid || loading}
        style={styles.loginButton}
      />

      {/* Forgot Password */}
      <TouchableOpacity
        onPress={() => router.push('/forgot-password')}
        style={styles.forgotPassword}
      >
        <Text variant="body" color={theme.colors.primary[500]}>
          Forgot password?
        </Text>
      </TouchableOpacity>
    </View>
  )
}
