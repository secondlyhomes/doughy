/**
 * BrandedInput Component
 *
 * A themed text input field.
 *
 * @example
 * ```tsx
 * <BrandedInput
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Enter email"
 * />
 * ```
 */

import React from 'react'
import { View, TextInput } from 'react-native'
import { useTheme } from '../ThemeCustomization'
import { BrandedInputProps } from './types'
import { styles } from './styles'

export function BrandedInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  style,
}: BrandedInputProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.input,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        },
        style,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry={secureTextEntry}
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.md,
          color: theme.colors.text,
        }}
      />
    </View>
  )
}
