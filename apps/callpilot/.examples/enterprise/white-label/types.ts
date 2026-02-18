/**
 * WHITE-LABEL TYPE DEFINITIONS
 *
 * Types for white-labeling system used in multi-tenant apps
 */

export interface WhiteLabelBranding {
  appName: string
  tagline?: string
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  logo: string
  logoWhite?: string
  icon: string
  favicon?: string
  splashScreen?: string
  backgroundImage?: string
}

export interface WhiteLabelFeatures {
  // Authentication
  socialLogin: boolean
  emailLogin: boolean
  phoneLogin: boolean
  biometricLogin: boolean

  // Features
  aiAssistant: boolean
  analytics: boolean
  notifications: boolean
  darkMode: boolean
  multiLanguage: boolean
  exportData: boolean
  importData: boolean

  // Integrations
  stripePayments: boolean
  googleCalendar: boolean
  slackIntegration: boolean
  zapierIntegration: boolean

  // Advanced
  customFields: boolean
  webhooks: boolean
  apiAccess: boolean
  whiteLabeling: boolean
}

export interface WhiteLabelUrls {
  website: string
  privacyPolicy: string
  termsOfService: string
  support: string
  documentation?: string
  status?: string
  blog?: string
}

export interface WhiteLabelCustomization {
  welcomeMessage?: string
  loginMessage?: string
  fontFamily?: string
  borderRadius?: number
  spacing?: number
}

export interface WhiteLabelMetadata {
  industry?: string
  size?: string
  country?: string
}

export interface WhiteLabelConfig {
  id: string
  organization_id: string
  branding: WhiteLabelBranding
  features: WhiteLabelFeatures
  urls: WhiteLabelUrls
  customization: WhiteLabelCustomization
  metadata?: WhiteLabelMetadata
  created_at: string
  updated_at: string
}

export interface WhiteLabelThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  warning: string
  success: string
  info: string
}

export interface WhiteLabelTypography {
  fontFamily: string
  fontSize: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  fontWeight: {
    regular: string
    medium: string
    semibold: string
    bold: string
  }
}

export interface WhiteLabelSpacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

export interface WhiteLabelBorderRadius {
  sm: number
  md: number
  lg: number
  xl: number
  full: number
}

export interface WhiteLabelShadow {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export interface WhiteLabelShadows {
  sm: WhiteLabelShadow
  md: WhiteLabelShadow
  lg: WhiteLabelShadow
}

export interface WhiteLabelTheme {
  colors: WhiteLabelThemeColors
  typography: WhiteLabelTypography
  spacing: WhiteLabelSpacing
  borderRadius: WhiteLabelBorderRadius
  shadows: WhiteLabelShadows
}

export interface WhiteLabelContextValue {
  config: WhiteLabelConfig | null
  theme: WhiteLabelTheme
  loading: boolean
  updateConfig: (updates: Partial<WhiteLabelConfig>) => Promise<void>
  resetConfig: () => Promise<void>
  previewConfig: (config: WhiteLabelConfig) => void
  clearPreview: () => void
}

export interface WhiteLabelProviderProps {
  children: React.ReactNode
  organizationId?: string
  fallbackConfig?: WhiteLabelConfig
}
