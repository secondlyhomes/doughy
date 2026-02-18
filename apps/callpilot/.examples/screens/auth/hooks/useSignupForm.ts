/**
 * Signup Form Hook
 *
 * Handles form state, validation, and submission logic
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import type { SignupFormData, SignupTouchedFields, PasswordStrength } from '../types'

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getPasswordStrength(password: string): PasswordStrength {
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

const initialFormData: SignupFormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const initialTouched: SignupTouchedFields = {
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
}

export function useSignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignupFormData>(initialFormData)
  const [touched, setTouched] = useState<SignupTouchedFields>(initialTouched)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Validation errors
  const errors = useMemo(() => ({
    name: touched.name && !formData.name ? 'Name is required' : '',
    email: touched.email && !formData.email
      ? 'Email is required'
      : touched.email && !isValidEmail(formData.email)
        ? 'Invalid email format'
        : '',
    password: touched.password && !formData.password
      ? 'Password is required'
      : touched.password && formData.password.length < 8
        ? 'Password must be at least 8 characters'
        : '',
    confirmPassword: touched.confirmPassword && !formData.confirmPassword
      ? 'Please confirm your password'
      : touched.confirmPassword && formData.password !== formData.confirmPassword
        ? 'Passwords do not match'
        : '',
  }), [formData, touched])

  const isFormValid = useMemo(() => (
    formData.name &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    !errors.name &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword
  ), [formData, errors])

  const passwordStrength = useMemo(() => (
    formData.password ? getPasswordStrength(formData.password) : null
  ), [formData.password])

  const updateField = useCallback(<K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const touchField = useCallback((field: keyof SignupTouchedFields) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const touchAllFields = useCallback(() => {
    setTouched({ name: true, email: true, password: true, confirmPassword: true })
  }, [])

  const handleSignup = useCallback(async () => {
    touchAllFields()

    if (!isFormValid) return

    try {
      setLoading(true)
      setError('')

      // Uncomment when using your auth context:
      // await signUp(formData.email, formData.password, formData.name)

      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000))

      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }, [isFormValid, formData, router, touchAllFields])

  return {
    formData,
    touched,
    errors,
    loading,
    error,
    isFormValid,
    passwordStrength,
    updateField,
    touchField,
    handleSignup,
  }
}
