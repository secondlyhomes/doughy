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

// Theme colors (matches tailwind.config.js)
export const THEME_COLORS = {
  primary: '#2563eb',
  primaryForeground: '#f8fafc',
  secondary: '#f1f5f9',
  secondaryForeground: '#1e293b',
  destructive: '#ef4444',
  destructiveForeground: '#f8fafc',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  accent: '#f1f5f9',
  accentForeground: '#1e293b',
  background: '#ffffff',
  foreground: '#0f172a',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#2563eb',
} as const;
