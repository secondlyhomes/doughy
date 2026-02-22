# Form Patterns

> React Native form handling patterns: keyboard avoidance, validation, multi-step flows, and platform-specific considerations.

## Overview

Forms in React Native require additional considerations beyond web forms:
- Keyboard avoidance to prevent inputs from being hidden
- Platform-specific keyboard types and behaviors
- ScrollView management for long forms
- Accessibility for screen readers

## Basic Form Structure

### Controlled Form with Keyboard Avoidance

```tsx
import { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

export function LoginForm() {
  const { theme } = useTheme()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      // Submit form
      await submitLogin(formData)
    } catch (error) {
      setErrors({ email: 'Login failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: theme.spacing[4] }}>
          <Text style={{ marginBottom: theme.spacing[1], color: theme.colors.text }}>
            Email
          </Text>
          <TextInput
            value={formData.email}
            onChangeText={handleChange('email')}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email input"
            accessibilityHint="Enter your email address"
            style={{
              borderWidth: 1,
              borderColor: errors.email ? theme.colors.error : theme.colors.border,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[3],
              color: theme.colors.text,
            }}
          />
          {errors.email && (
            <Text
              style={{ color: theme.colors.error, marginTop: theme.spacing[1] }}
              accessibilityRole="alert"
            >
              {errors.email}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: theme.spacing[4] }}>
          <Text style={{ marginBottom: theme.spacing[1], color: theme.colors.text }}>
            Password
          </Text>
          <TextInput
            value={formData.password}
            onChangeText={handleChange('password')}
            placeholder="Enter your password"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            accessibilityLabel="Password input"
            accessibilityHint="Enter your password"
            style={{
              borderWidth: 1,
              borderColor: errors.password ? theme.colors.error : theme.colors.border,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[3],
              color: theme.colors.text,
            }}
          />
          {errors.password && (
            <Text
              style={{ color: theme.colors.error, marginTop: theme.spacing[1] }}
              accessibilityRole="alert"
            >
              {errors.password}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={isSubmitting ? 'Signing in' : 'Sign in'}
          style={{
            backgroundColor: isSubmitting
              ? theme.colors.disabled
              : theme.colors.primary[500],
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.colors.white, fontWeight: '600' }}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

## Form Hook Pattern

Extract form logic into a reusable hook:

```tsx
// src/hooks/useForm.ts
import { useState, useCallback } from 'react'

interface UseFormOptions<T> {
  initialValues: T
  validate: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (field: keyof T) => (value: T[keyof T]) => {
      setValues(prev => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
    },
    [errors]
  )

  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const fieldErrors = validate(values)
    if (fieldErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
    }
  }, [values, validate])

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate(values)
    setErrors(validationErrors)
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      )
    )

    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  }
}
```

## Validation with Zod

```tsx
// src/utils/validation.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>

// Helper to convert Zod errors to form errors
export function zodToFormErrors<T>(
  result: z.SafeParseReturnType<T, T>
): Partial<Record<keyof T, string>> {
  if (result.success) return {}

  const errors: Record<string, string> = {}
  result.error.errors.forEach(error => {
    const path = error.path[0] as string
    if (!errors[path]) {
      errors[path] = error.message
    }
  })
  return errors as Partial<Record<keyof T, string>>
}
```

## Multi-Step Forms

```tsx
// src/components/MultiStepForm.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

interface Step {
  id: string
  title: string
  component: React.ComponentType<StepProps>
}

interface StepProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
  onNext: () => void
  onBack: () => void
  isFirst: boolean
  isLast: boolean
}

interface MultiStepFormProps {
  steps: Step[]
  onComplete: (data: Record<string, unknown>) => Promise<void>
}

export function MultiStepForm({ steps, onComplete }: MultiStepFormProps) {
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = (stepData: Record<string, unknown>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <View style={{ flex: 1 }}>
      {/* Progress indicator */}
      <View
        style={{
          flexDirection: 'row',
          padding: theme.spacing[4],
          gap: theme.spacing[2],
        }}
      >
        {steps.map((step, index) => (
          <View
            key={step.id}
            style={{
              flex: 1,
              height: 4,
              backgroundColor:
                index <= currentStep
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[200],
              borderRadius: 2,
            }}
            accessibilityLabel={`Step ${index + 1} of ${steps.length}: ${step.title}`}
            accessibilityValue={{
              now: index <= currentStep ? 100 : 0,
              min: 0,
              max: 100,
            }}
          />
        ))}
      </View>

      {/* Step title */}
      <Text
        style={{
          fontSize: theme.fontSize.xl,
          fontWeight: '600',
          color: theme.colors.text,
          paddingHorizontal: theme.spacing[4],
          marginBottom: theme.spacing[4],
        }}
      >
        {steps[currentStep].title}
      </Text>

      {/* Step content */}
      <CurrentStepComponent
        data={formData}
        onUpdate={handleUpdate}
        onNext={currentStep === steps.length - 1 ? handleComplete : handleNext}
        onBack={handleBack}
        isFirst={currentStep === 0}
        isLast={currentStep === steps.length - 1}
      />
    </View>
  )
}
```

## Keyboard Types Reference

| Data Type | keyboardType | textContentType (iOS) | autoComplete (Android) |
|-----------|--------------|----------------------|----------------------|
| Email | `email-address` | `emailAddress` | `email` |
| Password | `default` | `password` | `password` |
| New Password | `default` | `newPassword` | `password-new` |
| Phone | `phone-pad` | `telephoneNumber` | `tel` |
| Number | `numeric` | `none` | `off` |
| Decimal | `decimal-pad` | `none` | `off` |
| URL | `url` | `URL` | `off` |
| Name | `default` | `name` | `name` |
| Username | `default` | `username` | `username` |
| Credit Card | `numeric` | `creditCardNumber` | `cc-number` |
| Postal Code | `default` | `postalCode` | `postal-code` |

## File/Image Picker Integration

```tsx
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { View, Image, TouchableOpacity, Text, Alert } from 'react-native'

export function ImageUploadField() {
  const [image, setImage] = useState<string | null>(null)

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to upload an image.'
      )
      return false
    }
    return true
  }

  const pickImage = async () => {
    const hasPermission = await requestPermission()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take a photo.'
      )
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri)
    }
  }

  return (
    <View>
      {image ? (
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={{ uri: image }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
            accessibilityLabel="Selected profile image"
          />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={pickImage} accessibilityRole="button">
            <Text>Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto} accessibilityRole="button">
            <Text>Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
```

## Accessibility Checklist

- [ ] All inputs have `accessibilityLabel` and `accessibilityHint`
- [ ] Error messages use `accessibilityRole="alert"`
- [ ] Submit button label changes during submission ("Submitting...")
- [ ] Form progress is announced for multi-step forms
- [ ] Required fields are indicated (visual + accessibility)
- [ ] Focus management on error (focus first error field)

## Platform-Specific Considerations

### iOS
- Use `textContentType` for password autofill support
- Handle keyboard avoidance with `KeyboardAvoidingView` behavior="padding"
- Consider `inputAccessoryView` for custom keyboard toolbars

### Android
- Use `autoComplete` for autofill hints
- Handle keyboard avoidance with behavior="height"
- Test on different Android versions for input behavior

## Common Issues

| Issue | Solution |
|-------|----------|
| Keyboard covers input | Wrap in `KeyboardAvoidingView` with proper behavior |
| Input not scrolling into view | Use `ScrollView` with `keyboardShouldPersistTaps="handled"` |
| Keyboard dismissing on scroll | Set `keyboardDismissMode="none"` on ScrollView |
| Autofill not working | Set correct `textContentType`/`autoComplete` props |
| Submit on keyboard return | Add `onSubmitEditing` and `returnKeyType="done"` |

## Checklist

- [ ] Form uses controlled components
- [ ] Keyboard avoidance implemented (KeyboardAvoidingView)
- [ ] Validation runs on blur and submit
- [ ] Error messages are accessible
- [ ] Loading state shown during submission
- [ ] Platform-specific keyboard types set
- [ ] Autofill hints configured
- [ ] Multi-step forms have progress indicator
