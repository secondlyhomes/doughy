/**
 * Signup Form Component
 */

import React from 'react'
import { View } from 'react-native'
import { Button, Input, Text } from '@/components'
import { useTheme } from '@/theme'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import type { SignupFormData, SignupFormErrors, PasswordStrength } from '../types'
import { styles } from '../styles'

interface SignupFormProps {
  formData: SignupFormData
  errors: SignupFormErrors
  loading: boolean
  error: string
  isFormValid: boolean
  passwordStrength: PasswordStrength | null
  onFieldChange: <K extends keyof SignupFormData>(field: K, value: string) => void
  onFieldBlur: (field: keyof SignupFormData) => void
  onSubmit: () => void
}

export function SignupForm({
  formData,
  errors,
  loading,
  error,
  isFormValid,
  passwordStrength,
  onFieldChange,
  onFieldBlur,
  onSubmit,
}: SignupFormProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.form}>
      <Input
        label="Name"
        placeholder="Enter your name"
        value={formData.name}
        onChangeText={value => onFieldChange('name', value)}
        onBlur={() => onFieldBlur('name')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        error={errors.name}
        state={errors.name ? 'error' : formData.name ? 'success' : 'default'}
      />

      <Input
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChangeText={value => onFieldChange('email', value)}
        onBlur={() => onFieldBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={errors.email}
        state={errors.email ? 'error' : formData.email ? 'success' : 'default'}
      />

      <View>
        <Input
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChangeText={value => onFieldChange('password', value)}
          onBlur={() => onFieldBlur('password')}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          error={errors.password}
          state={errors.password ? 'error' : formData.password ? 'success' : 'default'}
          helperText="Minimum 8 characters"
        />

        {passwordStrength && !errors.password && (
          <PasswordStrengthIndicator strength={passwordStrength} />
        )}
      </View>

      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChangeText={value => onFieldChange('confirmPassword', value)}
        onBlur={() => onFieldBlur('confirmPassword')}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        textContentType="newPassword"
        error={errors.confirmPassword}
        state={errors.confirmPassword ? 'error' : formData.confirmPassword ? 'success' : 'default'}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text variant="body" color={theme.colors.error[500]}>
            {error}
          </Text>
        </View>
      )}

      <Button
        title="Sign Up"
        variant="primary"
        size="lg"
        onPress={onSubmit}
        loading={loading}
        disabled={!isFormValid || loading}
        style={styles.signupButton}
      />

      <Text variant="caption" align="center" color={theme.colors.text.secondary}>
        By signing up, you agree to our{' '}
        <Text variant="caption" color={theme.colors.primary[500]}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text variant="caption" color={theme.colors.primary[500]}>
          Privacy Policy
        </Text>
      </Text>
    </View>
  )
}
