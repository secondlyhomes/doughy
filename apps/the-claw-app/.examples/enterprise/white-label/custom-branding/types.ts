/**
 * TypeScript types for Custom Branding components
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native'

export interface BrandedLogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'color' | 'white'
  style?: ImageStyle
}

export interface BrandedIconProps {
  size?: number
  style?: ImageStyle
}

export interface BrandedButtonProps {
  onPress: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export interface BrandedHeaderProps {
  title?: string
  showLogo?: boolean
  style?: ViewStyle
}

export interface BrandedBackgroundProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface BrandedCardProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface BrandedInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  style?: ViewStyle
}

export type LogoSize = 'small' | 'medium' | 'large'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonVariant = 'primary' | 'secondary' | 'outline'

export interface LogoDimensions {
  width: number
  height: number
}

export const LOGO_DIMENSIONS: Record<LogoSize, LogoDimensions> = {
  small: { width: 100, height: 30 },
  medium: { width: 150, height: 45 },
  large: { width: 200, height: 60 },
}
