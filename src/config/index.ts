// src/config/index.ts
// Export all configuration

export {
  AUTH_TIMING,
  AUTH_THRESHOLDS,
  AUTH_STORAGE_KEYS,
  AUTH_DEBUG,
  AUTH_ERRORS,
  AUTH_SCREENS,
} from './auth.constants';

export {
  DEV_MODE_CONFIG,
  isMockMode,
  simulateNetworkDelay,
  logMockOperation,
} from './devMode';

// App configuration
export const APP_CONFIG = {
  // App name
  APP_NAME: 'Doughy AI',

  // API configuration
  API_TIMEOUT: 30000, // 30 seconds

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Image configuration
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Feature flags
  FEATURES: {
    BIOMETRIC_AUTH: true,
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: false,
  },
} as const;

// Theme colors - must match ThemeContext.tsx light theme colors
// These are fallback values; prefer using useThemeColors() hook for runtime values
export const THEME_COLORS = {
  primary: '#4d7c5f',           // Sage green
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  accent: '#f1f5f9',
  accentForeground: '#0f172a',
  background: '#fafafa',
  foreground: '#0f172a',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#4d7c5f',             // Sage green
} as const;
