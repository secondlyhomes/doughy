/**
 * useLoginForm Hook
 *
 * Manages form state, validation, and submission logic for the login screen
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import type { LoginFormData, LoginFormTouched, UseLoginFormReturn, AuthHook } from '../types'

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface UseLoginFormOptions {
  /**
   * Optional auth hook for dependency injection
   */
  authHook?: AuthHook
}

/**
 * Custom hook for login form state management and validation
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   setFormData,
 *   touched,
 *   setTouched,
 *   loading,
 *   error,
 *   emailError,
 *   passwordError,
 *   isFormValid,
 *   handleLogin,
 * } = useLoginForm()
 * ```
 */
export function useLoginForm(options?: UseLoginFormOptions): UseLoginFormReturn {
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  const [touched, setTouched] = useState<LoginFormTouched>({
    email: false,
    password: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Validation
  const emailError =
    touched.email && !formData.email
      ? 'Email is required'
      : touched.email && !isValidEmail(formData.email)
        ? 'Invalid email format'
        : ''

  const passwordError =
    touched.password && !formData.password ? 'Password is required' : ''

  const isFormValid =
    formData.email.length > 0 &&
    formData.password.length > 0 &&
    !emailError &&
    !passwordError

  // Submit handler
  const handleLogin = useCallback(async () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true })

    if (!isFormValid) {
      return
    }

    try {
      setLoading(true)
      setError('')

      // Use provided auth hook or simulate API call
      if (options?.authHook) {
        await options.authHook.signIn(formData.email, formData.password)
      } else {
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Navigate to home on success
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }, [formData, isFormValid, options?.authHook, router])

  return {
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
  }
}
