/**
 * Placeholder Components
 *
 * Demo components used in pattern examples
 */

import React from 'react'
import { Text } from 'react-native'
import type { DatePickerProps } from './types'

/**
 * Widget placeholders for version-specific features
 */
export function LiveActivityWidget() {
  return <Text>Live Activity Widget (iOS 16.1+)</Text>
}

export function MaterialYouWidget() {
  return <Text>Material You Widget (Android 12+)</Text>
}

export function StandardWidget() {
  return <Text>Standard Widget</Text>
}

/**
 * Date picker placeholders for platform-specific implementations
 */
export function IOSDatePicker({ value, onChange }: DatePickerProps) {
  return <Text>iOS Date Picker</Text>
}

export function AndroidDatePicker({ value, onChange }: DatePickerProps) {
  return <Text>Android Date Picker</Text>
}

export function WebDatePicker({ value, onChange }: DatePickerProps) {
  return <Text>Web Date Picker</Text>
}

/**
 * Feature placeholders for platform-specific features
 */
export function IOSSpecificFeature() {
  return <Text>iOS Feature</Text>
}

export function AndroidSpecificFeature() {
  return <Text>Android Feature</Text>
}

export function GenericFeature() {
  return <Text>Generic Feature</Text>
}
