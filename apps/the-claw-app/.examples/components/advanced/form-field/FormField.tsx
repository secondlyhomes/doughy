/**
 * FormField Component (Advanced Example)
 *
 * Complex form field with validation, icons, and multiple input types
 * This is a reference implementation - copy to src/components/ and customize
 */

import React, { useState } from 'react'
import { View } from 'react-native'
import { Input } from '@/components'
import { FormFieldProps, ValidationRules } from './types'
import { styles } from './styles'
import { FieldIcon } from './components/FieldIcon'
import { PasswordToggle } from './components/PasswordToggle'

/**
 * Validates a field value against the provided rules
 */
function validateField(value: string, rules?: ValidationRules): string | undefined {
  if (!rules) return undefined

  // Required validation
  if (rules.required && !value) {
    return typeof rules.required === 'string' ? rules.required : 'This field is required'
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength.value) {
    return rules.minLength.message
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength.value) {
    return rules.maxLength.message
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.value.test(value)) {
    return rules.pattern.message
  }

  // Custom validation
  if (rules.validate) {
    const result = rules.validate(value)
    return result === true ? undefined : (result as string)
  }

  return undefined
}

/**
 * FormField Component
 *
 * @example
 * ```tsx
 * // Basic with validation
 * <FormField
 *   name="email"
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={formData.email}
 *   onChangeText={(text) => setFormData({ ...formData, email: text })}
 *   rules={{
 *     required: 'Email is required',
 *     pattern: {
 *       value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *       message: 'Invalid email format'
 *     }
 *   }}
 *   leftIcon="📧"
 * />
 *
 * // Password field
 * <FormField
 *   name="password"
 *   label="Password"
 *   placeholder="Enter your password"
 *   value={formData.password}
 *   onChangeText={(text) => setFormData({ ...formData, password: text })}
 *   secureTextEntry
 *   showPasswordToggle
 *   rules={{
 *     required: true,
 *     minLength: { value: 8, message: 'Password must be at least 8 characters' }
 *   }}
 * />
 * ```
 */
export function FormField({
  name,
  rules,
  value,
  onChangeText,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  secureTextEntry,
  ...inputProps
}: FormFieldProps) {
  const [touched, setTouched] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  // Validate field only after user has interacted
  const error = touched ? validateField(value, rules) : undefined

  // Determine input state based on validation
  const inputState = error ? 'error' : value && !error ? 'success' : 'default'

  // Determine if password should be hidden
  const shouldHidePassword = showPasswordToggle ? !isPasswordVisible : secureTextEntry

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Left Icon */}
        {leftIcon && <FieldIcon icon={leftIcon} position="left" />}

        {/* Input */}
        <Input
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => setTouched(true)}
          error={error}
          state={inputState}
          secureTextEntry={shouldHidePassword}
          style={{ flex: 1 }}
        />

        {/* Right Icon or Password Toggle */}
        {showPasswordToggle ? (
          <PasswordToggle
            isVisible={isPasswordVisible}
            onToggle={() => setIsPasswordVisible(!isPasswordVisible)}
          />
        ) : rightIcon ? (
          <FieldIcon icon={rightIcon} position="right" />
        ) : null}
      </View>
    </View>
  )
}
