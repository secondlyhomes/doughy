/**
 * FormField Types
 *
 * TypeScript interfaces for the FormField component and its sub-components
 */

import React from 'react'
import { InputProps } from '@/components'

/**
 * Validation rules for form fields
 */
export interface ValidationRules {
  required?: boolean | string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  validate?: (value: string) => boolean | string
}

/**
 * Props for the main FormField component
 */
export interface FormFieldProps extends Omit<InputProps, 'error' | 'state'> {
  /**
   * Field name (for form state management)
   */
  name: string

  /**
   * Validation rules
   */
  rules?: ValidationRules

  /**
   * Current field value
   */
  value: string

  /**
   * Change handler
   */
  onChangeText: (text: string) => void

  /**
   * Whether to show password visibility toggle (for password fields)
   * @default false
   */
  showPasswordToggle?: boolean

  /**
   * Left icon (emoji or component)
   */
  leftIcon?: string | React.ReactNode

  /**
   * Right icon (emoji or component)
   */
  rightIcon?: string | React.ReactNode
}

/**
 * Props for the FieldIcon sub-component
 */
export interface FieldIconProps {
  /**
   * Icon content (emoji string or React node)
   */
  icon: string | React.ReactNode

  /**
   * Position of the icon
   */
  position: 'left' | 'right'
}

/**
 * Props for the PasswordToggle sub-component
 */
export interface PasswordToggleProps {
  /**
   * Whether the password is currently visible
   */
  isVisible: boolean

  /**
   * Callback to toggle visibility
   */
  onToggle: () => void
}
