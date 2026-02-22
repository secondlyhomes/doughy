/**
 * Switch Component Types
 */

import { ViewStyle } from 'react-native'

export interface SwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  style?: ViewStyle
}
