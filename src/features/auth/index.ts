// src/features/auth/index.ts
// Main auth feature exports

// Context & Provider
export { AuthProvider, AuthContext } from './context';

// Hooks
export { useAuth, useIsAuthenticated, useCurrentUser, useHasRole } from './hooks';

// Screens
export { LoginScreen, SignupScreen, ForgotPasswordScreen } from './screens';

// Types
export type {
  AuthContextType,
  AuthState,
  Profile,
  UserRole,
  LoginFormData,
  SignUpFormData,
  ResetPasswordFormData,
} from './types';
