/**
 * Login Screen Module
 *
 * @example
 * ```tsx
 * import { LoginScreen } from '@/screens/auth/login'
 *
 * export default function Login() {
 *   return <LoginScreen />
 * }
 * ```
 */

// Main component
export { LoginScreen } from './LoginScreen'

// Types (for consumers who need to extend)
export type {
  LoginScreenProps,
  LoginFormData,
  LoginFormTouched,
  LoginFormErrors,
  AuthHook,
} from './types'

// Sub-components (for custom compositions)
export { LoginForm, LoginHeader, LoginFooter } from './components'

// Hooks (for custom implementations)
export { useLoginForm } from './hooks'
