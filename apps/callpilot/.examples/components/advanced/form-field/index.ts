/**
 * FormField Component
 *
 * Complex form field with validation, icons, and multiple input types
 *
 * @example
 * ```tsx
 * import { FormField, FormFieldProps } from './form-field'
 *
 * <FormField
 *   name="email"
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   rules={{ required: 'Email is required' }}
 *   leftIcon="📧"
 * />
 * ```
 */

// Main component
export { FormField } from './FormField'

// Types
export type {
  FormFieldProps,
  ValidationRules,
  FieldIconProps,
  PasswordToggleProps,
} from './types'

// Sub-components (for customization)
export { FieldIcon } from './components/FieldIcon'
export { PasswordToggle } from './components/PasswordToggle'

// Styles (for extension)
export { styles } from './styles'
