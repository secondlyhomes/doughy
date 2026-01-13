// src/features/auth/index.ts
// Main auth feature exports

// Context & Provider
export { AuthProvider, AuthContext } from './context';

// Hooks
export {
  useAuth,
  useIsAuthenticated,
  useCurrentUser,
  useHasRole,
} from './hooks';
export {
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  type Permissions,
} from './hooks/usePermissions';

// Guards
export {
  AuthGuard,
  AdminGuard,
  EmailVerifiedGuard,
  OnboardingGuard,
} from './guards';

// Screens
export {
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  VerifyEmailScreen,
  OnboardingScreen,
  ResetPasswordScreen,
  MFASetupScreen,
  MFAVerifyScreen,
} from './screens';

// Components
export {
  OnboardingProgress,
  SurveyOption,
  PasswordStrengthIndicator,
  MFACodeInput,
} from './components';

// Services
export {
  // Email verification
  checkEmailVerification,
  resendVerificationEmail,
  verifyEmailWithToken,
  pollEmailVerification,
  type EmailVerificationResult,
  // Onboarding
  SURVEY_QUESTIONS,
  saveOnboardingResponses,
  skipOnboarding,
  checkOnboardingStatus,
  type OnboardingResponse,
  type OnboardingResult,
  type SurveyStep,
  // Password reset
  updatePassword,
  verifyResetToken,
  calculatePasswordStrength,
  validatePassword,
  type PasswordResetResult,
  type PasswordStrength,
  // MFA
  enrollMFA,
  verifyMFAEnrollment,
  verifyMFAChallenge,
  createMFAChallenge,
  listMFAFactors,
  unenrollMFA,
  isMFAEnabled,
  getAAL,
  type MFAEnrollResult,
  type MFAVerifyResult,
  type MFAFactor,
} from './services';

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
