/**
 * Signup Screen Types
 */

export interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface SignupTouchedFields {
  name: boolean
  email: boolean
  password: boolean
  confirmPassword: boolean
}

export interface SignupFormErrors {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type PasswordStrength = 'weak' | 'medium' | 'strong'

export interface SignupScreenProps {
  /**
   * Custom auth hook (optional)
   * If not provided, uses default useAuth() from context
   */
  useAuthHook?: () => {
    signUp: (email: string, password: string, name?: string) => Promise<void>
    loading?: boolean
  }
}
