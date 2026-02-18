/**
 * DEFAULT VALUES FOR WHITE-LABEL CONFIGURATION
 *
 * Default branding, features, URLs, and theme settings
 */

import { Platform } from 'react-native'
import type {
  WhiteLabelBranding,
  WhiteLabelFeatures,
  WhiteLabelUrls,
  WhiteLabelTheme,
} from './types'

export const DEFAULT_BRANDING: WhiteLabelBranding = {
  appName: 'My App',
  primaryColor: '#007AFF',
  secondaryColor: '#5856D6',
  accentColor: '#FF2D55',
  logo: 'https://via.placeholder.com/200x60?text=Logo',
  icon: 'https://via.placeholder.com/512x512?text=Icon',
}

export const DEFAULT_FEATURES: WhiteLabelFeatures = {
  socialLogin: true,
  emailLogin: true,
  phoneLogin: false,
  biometricLogin: true,
  aiAssistant: true,
  analytics: true,
  notifications: true,
  darkMode: true,
  multiLanguage: false,
  exportData: true,
  importData: true,
  stripePayments: true,
  googleCalendar: false,
  slackIntegration: false,
  zapierIntegration: false,
  customFields: false,
  webhooks: false,
  apiAccess: false,
  whiteLabeling: false,
}

export const DEFAULT_URLS: WhiteLabelUrls = {
  website: 'https://example.com',
  privacyPolicy: 'https://example.com/privacy',
  termsOfService: 'https://example.com/terms',
  support: 'https://example.com/support',
}

export const DEFAULT_THEME: WhiteLabelTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF2D55',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    info: '#5AC8FA',
  },
  typography: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
  },
}
