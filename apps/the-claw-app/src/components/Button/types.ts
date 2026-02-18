/**
 * Button Component Types
 */

import { ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /**
   * Button text
   */
  title: string;

  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Button size
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Whether the button is in loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Callback when button is pressed
   */
  onPress?: () => void;

  /**
   * Custom style for button container
   */
  style?: ViewStyle;

  /**
   * Custom style for button text
   */
  textStyle?: TextStyle;

  /**
   * Whether to enable haptic feedback
   * @default true
   */
  hapticFeedback?: boolean;
}
