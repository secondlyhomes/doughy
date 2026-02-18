/**
 * Onboarding Layout
 *
 * Stack navigator for the onboarding flow with no headers
 */

import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
