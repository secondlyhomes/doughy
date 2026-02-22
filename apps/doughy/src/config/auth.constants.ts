// src/config/auth.constants.ts
// Authentication Constants for React Native

// Environment detection for React Native
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

// Timing configurations (in milliseconds)
export const AUTH_TIMING = {
  // How quickly to detect rapid auth checks
  RAPID_CHECK_THRESHOLD: isProduction ? 500 : 1000,

  // Maximum backoff time for exponential backoff
  MAX_BACKOFF_TIME: isProduction ? 60000 : 30000, // 60s prod, 30s dev

  // How long to wait before clearing auth tracking
  TRACKING_CLEAR_DELAY: isProduction ? 300000 : 10000, // 5min prod, 10s dev

  // Delay to prevent race conditions between guards
  GUARD_COORDINATION_DELAY: 100,

  // Session refresh interval
  SESSION_REFRESH_INTERVAL: isProduction ? 3300000 : 1800000, // 55min prod, 30min dev

  // Global lock duration when loop detected
  GLOBAL_LOCK_DURATION: 2000,
} as const;

// Threshold configurations
export const AUTH_THRESHOLDS = {
  // Maximum rapid checks before triggering backoff
  MAX_RAPID_CHECKS: isProduction ? 3 : 5,

  // Maximum redirect attempts before circuit breaker
  MAX_REDIRECT_ATTEMPTS: isProduction ? 3 : 5,

  // Maximum navigation history to track
  MAX_NAVIGATION_HISTORY: 10,

  // Number of auth indicators required for emergency override
  MIN_AUTH_INDICATORS: 2,
} as const;

// Storage keys for AsyncStorage/SecureStore
export const AUTH_STORAGE_KEYS = {
  // AsyncStorage keys
  GUARD_STATE: '@auth:guard_state',
  REDIRECT_STATE: '@auth:redirect_state',
  VISIT_TRACKING: '@auth:visit_tracking',
  NAVIGATION_HISTORY: '@auth:navigation_history',

  // SecureStore keys (for sensitive data)
  AUTHENTICATED_SESSION: '@auth:session',
  ACCESS_TOKEN: '@auth:access_token',
  REFRESH_TOKEN: '@auth:refresh_token',
  USER_ID: '@auth:user_id',

  // Role keys
  USER_ROLE_PREFIX: '@auth:role_',
  ADMIN_LOGIN_IN_PROGRESS: '@auth:admin_login_progress',
  ADMIN_LOGIN_TIMESTAMP: '@auth:admin_login_timestamp',
} as const;

// Debug configuration
export const AUTH_DEBUG = {
  // Enable verbose logging in development
  ENABLED: isDevelopment,

  // Log levels to include
  LOG_LEVELS: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug'],

  // Components to log
  LOG_COMPONENTS: isProduction ? ['auth:error'] : ['auth', 'app'],
} as const;

// Error messages
export const AUTH_ERRORS = {
  LOOP_DETECTED: 'Authentication redirect loop detected',
  RAPID_CHECKS: 'Too many rapid authentication checks',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  PROFILE_LOAD_FAILED: 'Failed to load user profile',
  UNKNOWN_ERROR: 'An unexpected error occurred during authentication',
  NETWORK_ERROR: 'Network connection failed. Please check your internet.',
  BIOMETRIC_FAILED: 'Biometric authentication failed',
} as const;

// Screen names (for React Navigation)
export const AUTH_SCREENS = {
  SIGN_IN: 'SignIn',
  SIGN_UP: 'SignUp',
  FORGOT_PASSWORD: 'ForgotPassword',
  VERIFY_EMAIL: 'VerifyEmail',
  ONBOARDING_SURVEY: 'OnboardingSurvey',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings',
} as const;
