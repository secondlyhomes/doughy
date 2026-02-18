/**
 * Login Screen Types
 */

/**
 * Auth hook interface for dependency injection
 */
export interface AuthHook {
  signIn: (email: string, password: string) => Promise<void>
  loading?: boolean
}

/**
 * Props for the LoginScreen component
 */
export interface LoginScreenProps {
  /**
   * Custom auth hook (optional)
   * If not provided, uses default useAuth() from context
   */
  useAuthHook?: () => AuthHook
}

/**
 * Form data state
 */
export interface LoginFormData {
  email: string
  password: string
}

/**
 * Touched state for form fields
 */
export interface LoginFormTouched {
  email: boolean
  password: boolean
}

/**
 * Form validation errors
 */
export interface LoginFormErrors {
  email: string
  password: string
}

/**
 * Return type for useLoginForm hook
 */
export interface UseLoginFormReturn {
  formData: LoginFormData
  setFormData: React.Dispatch<React.SetStateAction<LoginFormData>>
  touched: LoginFormTouched
  setTouched: React.Dispatch<React.SetStateAction<LoginFormTouched>>
  loading: boolean
  error: string
  emailError: string
  passwordError: string
  isFormValid: boolean
  handleLogin: () => Promise<void>
}

/**
 * Props for LoginForm component
 */
export interface LoginFormProps {
  formData: LoginFormData
  setFormData: React.Dispatch<React.SetStateAction<LoginFormData>>
  touched: LoginFormTouched
  setTouched: React.Dispatch<React.SetStateAction<LoginFormTouched>>
  emailError: string
  passwordError: string
  error: string
  loading: boolean
  isFormValid: boolean
  onSubmit: () => Promise<void>
}

/**
 * Props for LoginHeader component
 */
export interface LoginHeaderProps {
  title?: string
  subtitle?: string
}

/**
 * Props for LoginFooter component
 */
export interface LoginFooterProps {
  onSignUpPress: () => void
}
