// src/features/auth/services/index.ts
// Export all auth services

export {
  checkEmailVerification,
  resendVerificationEmail,
  verifyEmailWithToken,
  pollEmailVerification,
  type EmailVerificationResult,
} from './emailVerificationService';

export {
  SURVEY_QUESTIONS,
  saveOnboardingResponses,
  skipOnboarding,
  checkOnboardingStatus,
  type OnboardingResponse,
  type OnboardingResult,
  type SurveyStep,
} from './onboardingService';

export {
  updatePassword,
  verifyResetToken,
  calculatePasswordStrength,
  validatePassword,
  type PasswordResetResult,
  type PasswordStrength,
} from './passwordResetService';

export {
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
} from './mfaService';
