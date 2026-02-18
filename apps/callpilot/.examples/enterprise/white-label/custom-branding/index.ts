/**
 * CUSTOM BRANDING COMPONENTS
 *
 * Ready-to-use components that adapt to white-label configuration.
 * Includes logos, splash screens, themed buttons, etc.
 *
 * @example
 * ```tsx
 * import {
 *   BrandedLogo,
 *   BrandedButton,
 *   BrandedCard,
 * } from './custom-branding'
 *
 * <BrandedLogo size="large" />
 * <BrandedButton onPress={handlePress}>Click me</BrandedButton>
 * <BrandedCard>Content here</BrandedCard>
 * ```
 */

// Components
export { BrandedLogo } from './BrandedLogo'
export { BrandedIcon } from './BrandedIcon'
export { BrandedButton } from './BrandedButton'
export { BrandedSplashScreen } from './BrandedSplashScreen'
export { BrandedHeader } from './BrandedHeader'
export { BrandedBackground } from './BrandedBackground'
export { BrandedCard } from './BrandedCard'
export { BrandedInput } from './BrandedInput'

// Types
export type {
  BrandedLogoProps,
  BrandedIconProps,
  BrandedButtonProps,
  BrandedHeaderProps,
  BrandedBackgroundProps,
  BrandedCardProps,
  BrandedInputProps,
  LogoSize,
  ButtonSize,
  ButtonVariant,
  LogoDimensions,
} from './types'

// Constants
export { LOGO_DIMENSIONS } from './types'
