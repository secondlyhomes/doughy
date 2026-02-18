/**
 * Input Component
 *
 * Accessible text input with label, helper text, and validation states
 */

import { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native'
import { useTheme } from '@/theme'
import { Text } from './Text'

export type InputState = 'default' | 'error' | 'success'

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Input label
   */
  label?: string

  /**
   * Helper text below input
   */
  helperText?: string

  /**
   * Error message (sets state to error)
   */
  error?: string

  /**
   * Validation state
   * @default 'default'
   */
  state?: InputState

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Custom style for container
   */
  containerStyle?: ViewStyle

  /**
   * Custom style for input
   */
  style?: TextStyle

  /**
   * Custom style for label
   */
  labelStyle?: TextStyle

  /**
   * Custom style for helper text
   */
  helperTextStyle?: TextStyle
}

/**
 * Input Component
 *
 * @example
 * ```tsx
 * // Basic input
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 *
 * // Input with error
 * <Input
 *   label="Password"
 *   error="Password must be at least 8 characters"
 *   secureTextEntry
 * />
 *
 * // Input with helper text
 * <Input
 *   label="Username"
 *   helperText="Must be 3-20 characters"
 * />
 * ```
 */
export function Input({
  label,
  helperText,
  error,
  state = 'default',
  disabled = false,
  containerStyle,
  style,
  labelStyle,
  helperTextStyle,
  ...rest
}: InputProps) {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  // Determine actual state (error takes precedence)
  const actualState: InputState = error ? 'error' : state

  // Get border color based on state and focus
  function getBorderColor(): string {
    if (disabled) return theme.colors.border
    if (isFocused) return theme.colors.borderFocus
    if (actualState === 'error') return theme.colors.error[500]
    if (actualState === 'success') return theme.colors.success[500]
    return theme.colors.border
  }

  // Get helper text color based on state
  function getHelperTextColor(): string {
    if (actualState === 'error') return theme.colors.error[500]
    if (actualState === 'success') return theme.colors.success[500]
    return theme.colors.text.secondary
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            {
              fontSize: theme.tokens.fontSize.sm,
              fontWeight: theme.tokens.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.tokens.spacing[1],
            },
            labelStyle ?? {},
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input */}
      <TextInput
        style={[
          {
            height: theme.tokens.sizing.input,
            borderWidth: theme.tokens.borderWidth[1],
            borderColor: getBorderColor(),
            borderRadius: theme.tokens.borderRadius.md,
            paddingHorizontal: theme.tokens.spacing[3],
            fontSize: theme.tokens.fontSize.base,
            color: theme.colors.text.primary,
            backgroundColor: disabled ? theme.colors.surfaceSecondary : theme.colors.background,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        {...rest}
      />

      {/* Helper text or error message */}
      {(error || helperText) && (
        <Text
          style={[
            {
              fontSize: theme.tokens.fontSize.sm,
              color: getHelperTextColor(),
              marginTop: theme.tokens.spacing[1],
            },
            helperTextStyle ?? {},
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})
